import { NextRequest, NextResponse } from 'next/server';
import { parseExcelBuffer } from '@/lib/services/excel-parser';
import { replaceAllData } from '@/lib/dynamodb';
import { sendNotificationEmail } from '@/lib/services/email';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const rows = parseExcelBuffer(buffer);

    const { managers, agentCount } = await replaceAllData(rows);

    // Send notification emails to managers with valid email addresses
    const appUrl = (process.env.APP_URL ?? 'https://main.d35bei23phx7yk.amplifyapp.com').replace(/\/$/, '');
    const managersWithEmail = managers.filter((m) => m.email && EMAIL_REGEX.test(m.email));

    let emailsSent = 0;
    let emailsFailed = 0;

    if (managersWithEmail.length > 0) {
      const results = await Promise.allSettled(
        managersWithEmail.map((m) =>
          sendNotificationEmail({
            toAddress: m.email!,
            managerName: m.full_name,
            headcountUrl: `${appUrl}/headcount/${m.id}`,
          })
        )
      );

      for (const result of results) {
        if (result.status === 'fulfilled') {
          emailsSent++;
        } else {
          emailsFailed++;
          console.error('Failed to send notification:', result.reason);
        }
      }
    }

    return NextResponse.json({
      managers,
      agentCount,
      emailsSent,
      emailsFailed,
      message: `Successfully imported ${agentCount} agents across ${managers.length} manager(s).`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Upload failed';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
