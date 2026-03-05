import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  QueryCommand,
  GetCommand,
  BatchWriteCommand,
} from '@aws-sdk/lib-dynamodb';
import crypto from 'crypto';
import type { Manager, Agent } from './types';

const ALLOWED_TABLES = ['HeadcountApp'];
const TABLE = process.env.DYNAMODB_TABLE ?? 'HeadcountApp';

if (!ALLOWED_TABLES.includes(TABLE)) {
  throw new Error(
    `SAFETY: DYNAMODB_TABLE "${TABLE}" is not in the allow-list. ` +
    `Only these tables are permitted: ${ALLOWED_TABLES.join(', ')}. ` +
    `This prevents accidental writes to other projects' tables.`
  );
}

const credentials = process.env.CUSTOM_AWS_ACCESS_KEY_ID
  ? {
      accessKeyId: process.env.CUSTOM_AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.CUSTOM_AWS_SECRET_ACCESS_KEY!,
    }
  : undefined;

const client = new DynamoDBClient({
  region: process.env.CUSTOM_AWS_REGION ?? process.env.AWS_REGION ?? 'eu-west-1',
  ...(credentials && { credentials }),
});
const docClient = DynamoDBDocumentClient.from(client);

export async function queryManagers(): Promise<Manager[]> {
  const result = await docClient.send(
    new QueryCommand({
      TableName: TABLE,
      KeyConditionExpression: 'PK = :pk',
      ExpressionAttributeValues: { ':pk': 'MANAGERS' },
    })
  );

  return (result.Items ?? [])
    .map((item) => ({
      id: item.SK as string,
      full_name: item.full_name as string,
      email: (item.email as string) || undefined,
      access_token: (item.access_token as string) || undefined,
      created_at: item.created_at as string,
    }))
    .sort((a, b) => a.full_name.localeCompare(b.full_name));
}

export async function queryAgents(managerId: string): Promise<Agent[]> {
  const result = await docClient.send(
    new QueryCommand({
      TableName: TABLE,
      KeyConditionExpression: 'PK = :pk',
      ExpressionAttributeValues: { ':pk': `AGENTS#${managerId}` },
    })
  );

  return (result.Items ?? [])
    .map((item) => ({
      id: item.SK as string,
      full_name: item.full_name as string,
      manager_id: managerId,
      avatar_seed: item.avatar_seed as string,
    }))
    .sort((a, b) => a.full_name.localeCompare(b.full_name));
}

export async function getManager(id: string): Promise<Manager | null> {
  const result = await docClient.send(
    new GetCommand({
      TableName: TABLE,
      Key: { PK: 'MANAGERS', SK: id },
    })
  );

  if (!result.Item) return null;
  return {
    id: result.Item.SK as string,
    full_name: result.Item.full_name as string,
    email: (result.Item.email as string) || undefined,
    access_token: (result.Item.access_token as string) || undefined,
    created_at: result.Item.created_at as string,
  };
}

export async function getAgent(managerId: string, agentId: string): Promise<Agent | null> {
  const result = await docClient.send(
    new GetCommand({
      TableName: TABLE,
      Key: { PK: `AGENTS#${managerId}`, SK: agentId },
    })
  );

  if (!result.Item) return null;
  return {
    id: result.Item.SK as string,
    full_name: result.Item.full_name as string,
    manager_id: managerId,
    avatar_seed: result.Item.avatar_seed as string,
  };
}

async function batchDelete(keys: { PK: string; SK: string }[]): Promise<void> {
  for (let i = 0; i < keys.length; i += 25) {
    const batch = keys.slice(i, i + 25);
    await docClient.send(
      new BatchWriteCommand({
        RequestItems: {
          [TABLE]: batch.map((key) => ({
            DeleteRequest: { Key: key },
          })),
        },
      })
    );
  }
}

async function batchPut(items: Record<string, unknown>[]): Promise<void> {
  for (let i = 0; i < items.length; i += 25) {
    const batch = items.slice(i, i + 25);
    await docClient.send(
      new BatchWriteCommand({
        RequestItems: {
          [TABLE]: batch.map((item) => ({
            PutRequest: { Item: item },
          })),
        },
      })
    );
  }
}

export async function validateManagerToken(managerId: string, token: string): Promise<boolean> {
  const result = await docClient.send(
    new GetCommand({
      TableName: TABLE,
      Key: { PK: 'MANAGERS', SK: managerId },
    })
  );
  if (!result.Item) return false;
  return result.Item.access_token === token;
}

export async function replaceAllData(
  rows: { managerName: string; agentName: string; managerEmail: string }[]
): Promise<{ managers: { id: string; full_name: string; email?: string; access_token: string }[]; agentCount: number }> {
  const now = new Date().toISOString();

  // 1. Fetch existing managers and build name→id lookup
  const existingManagers = await queryManagers();
  const existingManagerByName = new Map(existingManagers.map((m) => [m.full_name, m.id]));

  // 2. Build name→email lookup (first non-empty email wins per manager)
  const managerEmailMap = new Map<string, string>();
  for (const row of rows) {
    if (row.managerEmail && !managerEmailMap.has(row.managerName)) {
      managerEmailMap.set(row.managerName, row.managerEmail);
    }
  }

  // 3. Determine manager IDs (reuse existing or create new)
  const newManagerNames = Array.from(new Set(rows.map((r) => r.managerName)));
  const managersMap = new Map<string, string>(); // name → id
  const managerPuts: Record<string, unknown>[] = [];

  const managerTokenMap = new Map<string, string>(); // name → access_token

  for (const name of newManagerNames) {
    const email = managerEmailMap.get(name) || undefined;
    const existingId = existingManagerByName.get(name);
    const accessToken = crypto.randomUUID();
    managerTokenMap.set(name, accessToken);

    if (existingId) {
      managersMap.set(name, existingId);
      // Always re-put to update email and rotate token
      managerPuts.push({
        PK: 'MANAGERS',
        SK: existingId,
        full_name: name,
        ...(email && { email }),
        access_token: accessToken,
        created_at: existingManagers.find((m) => m.id === existingId)!.created_at,
      });
    } else {
      const newId = crypto.randomUUID();
      managersMap.set(name, newId);
      managerPuts.push({
        PK: 'MANAGERS',
        SK: newId,
        full_name: name,
        ...(email && { email }),
        access_token: accessToken,
        created_at: now,
      });
    }
  }

  // 4. Delete managers no longer in the Excel
  const removedManagerKeys: { PK: string; SK: string }[] = [];
  for (const existing of existingManagers) {
    if (!managersMap.has(existing.full_name)) {
      removedManagerKeys.push({ PK: 'MANAGERS', SK: existing.id });
      // Also delete all their agents
      const oldAgents = await queryAgents(existing.id);
      for (const agent of oldAgents) {
        removedManagerKeys.push({ PK: `AGENTS#${existing.id}`, SK: agent.id });
      }
    }
  }

  // 5. For each manager, upsert agents (reuse by name, remove stale)
  const agentPuts: Record<string, unknown>[] = [];
  const agentDeletes: { PK: string; SK: string }[] = [];

  const managerEntries = Array.from(managersMap.entries());
  for (const [managerName, managerId] of managerEntries) {
    const newAgentNames = rows
      .filter((r) => r.managerName === managerName)
      .map((r) => r.agentName);

    // Fetch existing agents for this manager
    const existingAgents = await queryAgents(managerId);
    const existingAgentByName = new Map(existingAgents.map((a) => [a.full_name, a]));

    // Track which names we've seen
    const seenNames = new Set<string>();

    for (const agentName of newAgentNames) {
      if (seenNames.has(agentName)) continue; // skip duplicates
      seenNames.add(agentName);

      const existing = existingAgentByName.get(agentName);
      if (!existing) {
        // New agent — create
        agentPuts.push({
          PK: `AGENTS#${managerId}`,
          SK: crypto.randomUUID(),
          full_name: agentName,
          avatar_seed: `${agentName}-${managerName}`,
        });
      }
      // Existing agent — keep as-is (same ID, same avatar)
    }

    // Delete agents no longer in the Excel
    for (const existing of existingAgents) {
      if (!seenNames.has(existing.full_name)) {
        agentDeletes.push({ PK: `AGENTS#${managerId}`, SK: existing.id });
      }
    }
  }

  // 6. Execute all writes
  await batchDelete([...removedManagerKeys, ...agentDeletes]);
  await batchPut([...managerPuts, ...agentPuts]);

  const managers = managerEntries.map(([name, id]) => ({
    id,
    full_name: name,
    email: managerEmailMap.get(name) || undefined,
    access_token: managerTokenMap.get(name)!,
  }));

  return { managers, agentCount: rows.length };
}
