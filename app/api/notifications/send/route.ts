import { NextResponse } from 'next/server';
import { queryManagers, queryAgents } from '@/lib/dynamodb';
import { sendNotificationEmail } from '@/lib/services/email';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST() {
  try {
    const managers = await queryManagers();
    const appUrl = (process.env.APP_URL ?? 'https://main.d35bei23phx7yk.amplifyapp.com').replace(/\/$/, '');

    const managersWithEmail = managers.filter((m) => m.email && EMAIL_REGEX.test(m.email));

    // Get agent counts for response
    const results: { managerId: string; name: string; email: string; agentCount: number; status: 'sent' | 'failed' | 'no_email' }[] = [];

    // Send emails
    const sendResults = await Promise.allSettled(
      managersWithEmail.map(async (m) => {
        const agents = await queryAgents(m.id);
        await sendNotificationEmail({
          toAddress: m.email!,
          managerName: m.full_name,
          headcountUrl: `${appUrl}/headcount/${m.id}?token=${m.access_token}`,
        });
        return { managerId: m.id, name: m.full_name, email: m.email!, agentCount: agents.length };
      })
    );

    let emailsSent = 0;
    let emailsFailed = 0;

    for (const result of sendResults) {
      if (result.status === 'fulfilled') {
        emailsSent++;
        results.push({ ...result.value, status: 'sent' });
      } else {
        emailsFailed++;
        console.error('Failed to send notification:', result.reason);
        // Try to extract manager info from the error context
        results.push({ managerId: '', name: 'Unknown', email: '', agentCount: 0, status: 'failed' });
      }
    }

    // Add managers without email
    for (const m of managers) {
      if (!m.email || !EMAIL_REGEX.test(m.email)) {
        results.push({ managerId: m.id, name: m.full_name, email: '', agentCount: 0, status: 'no_email' });
      }
    }

    return NextResponse.json({ emailsSent, emailsFailed, results });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to send notifications';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
