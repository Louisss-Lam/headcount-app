import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  QueryCommand,
  GetCommand,
  BatchWriteCommand,
  ScanCommand,
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

const client = new DynamoDBClient({ region: process.env.AWS_REGION ?? 'eu-west-1' });
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

async function deleteAllData(): Promise<void> {
  let lastEvaluatedKey: Record<string, unknown> | undefined;

  do {
    const scan = await docClient.send(
      new ScanCommand({
        TableName: TABLE,
        ProjectionExpression: 'PK, SK',
        ExclusiveStartKey: lastEvaluatedKey,
      })
    );

    const items = scan.Items ?? [];
    // BatchWrite supports max 25 items per call
    for (let i = 0; i < items.length; i += 25) {
      const batch = items.slice(i, i + 25);
      await docClient.send(
        new BatchWriteCommand({
          RequestItems: {
            [TABLE]: batch.map((item) => ({
              DeleteRequest: { Key: { PK: item.PK, SK: item.SK } },
            })),
          },
        })
      );
    }

    lastEvaluatedKey = scan.LastEvaluatedKey;
  } while (lastEvaluatedKey);
}

export async function replaceAllData(
  rows: { managerName: string; agentName: string }[]
): Promise<{ managers: { id: string; full_name: string }[]; agentCount: number }> {
  await deleteAllData();

  const managersMap = new Map<string, string>(); // name -> uuid
  const now = new Date().toISOString();
  const writeItems: Record<string, unknown>[] = [];

  for (const row of rows) {
    let managerId = managersMap.get(row.managerName);
    if (!managerId) {
      managerId = crypto.randomUUID();
      managersMap.set(row.managerName, managerId);
      writeItems.push({
        PK: 'MANAGERS',
        SK: managerId,
        full_name: row.managerName,
        created_at: now,
      });
    }

    const agentId = crypto.randomUUID();
    const seed = `${row.agentName}-${row.managerName}`;
    writeItems.push({
      PK: `AGENTS#${managerId}`,
      SK: agentId,
      full_name: row.agentName,
      avatar_seed: seed,
    });
  }

  // BatchWrite in chunks of 25
  for (let i = 0; i < writeItems.length; i += 25) {
    const batch = writeItems.slice(i, i + 25);
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

  const managers = Array.from(managersMap.entries()).map(([name, id]) => ({
    id,
    full_name: name,
  }));

  return { managers, agentCount: rows.length };
}
