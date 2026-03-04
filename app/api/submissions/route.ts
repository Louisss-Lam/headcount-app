import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { CATEGORIES, type Category } from '@/lib/types';
import { generateExportBuffer } from '@/lib/services/excel-exporter';
import { sendReportEmail } from '@/lib/services/email';

interface SubmissionBody {
  managerId: number;
  entries: { agentId: number; category: Category }[];
  recipientEmail?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: SubmissionBody = await request.json();
    const { managerId, entries, recipientEmail } = body;

    if (!managerId || !entries || entries.length === 0) {
      return NextResponse.json(
        { error: 'managerId and entries are required' },
        { status: 400 }
      );
    }

    const db = getDb();
    const now = new Date();
    const submissionDate = now.toISOString().split('T')[0];

    // Look up manager name
    const manager = db
      .prepare('SELECT full_name FROM managers WHERE id = ?')
      .get(managerId) as { full_name: string };

    // Look up agent names for each entry
    const getAgent = db.prepare('SELECT full_name FROM agents WHERE id = ?');

    const exportRows = entries.map((entry) => {
      const agent = getAgent.get(entry.agentId) as { full_name: string };
      return {
        'Agent Name': agent.full_name,
        Category: CATEGORIES[entry.category].label,
        'Manager Name': manager.full_name,
        Date: submissionDate,
        Time: now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
      };
    });

    const excelBuffer = generateExportBuffer(exportRows);

    // Attempt to email the report
    let emailSent = false;
    let emailError: string | undefined;
    const toAddress = recipientEmail?.trim();

    if (toAddress) {
      try {
        await sendReportEmail({
          toAddress,
          managerName: manager.full_name,
          submissionDate,
          excelBuffer,
        });
        emailSent = true;
      } catch (err) {
        emailError = err instanceof Error ? err.message : 'Email sending failed';
      }
    }

    return NextResponse.json({
      message: 'Submission completed',
      emailSent,
      emailError,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Submission failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
