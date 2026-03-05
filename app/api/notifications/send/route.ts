import { NextResponse } from 'next/server';
import { queryManagers, queryAgents } from '@/lib/dynamodb';
import { sendNotificationEmail } from '@/lib/services/email';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST() {
  try {
    const managers = await queryManagers();
    const appUrl = (process.env.APP_URL ?? 'https://main.d35bei23phx7yk.amplifyapp.com').replace(/\/$/, '');

    const managersWithEmail = managers.filter((m) => m.email && EMAIL_REGEX.test(m.email));

    const results: { managerId: string; name: string; email: string; agentCount: number; status: 'sent' | 'failed' | 'no_email' }[] = [];

    // Send emails — track manager info alongside each promise
    const sendJobs = managersWithEmail.map(async (m) => {
      const agents = await queryAgents(m.id);
      const info = { managerId: m.id, name: m.full_name, email: m.email!, agentCount: agents.length };
      try {
        await sendNotificationEmail({
          toAddress: m.email!,
          managerName: m.full_name,
          headcountUrl: `${appUrl}/headcount/${m.id}?token=${m.access_token}`,
        });
        return { ...info, status: 'sent' as const };
      } catch (err) {
        console.error(`Failed to send notification to ${m.full_name}:`, err);
        return { ...info, status: 'failed' as const };
      }
    });

    const sendResults = await Promise.all(sendJobs);

    let emailsSent = 0;
    let emailsFailed = 0;

    for (const result of sendResults) {
      if (result.status === 'sent') emailsSent++;
      else emailsFailed++;
      results.push(result);
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
