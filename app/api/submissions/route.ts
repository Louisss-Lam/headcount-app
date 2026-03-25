import { NextRequest, NextResponse } from 'next/server';
import { CATEGORIES, type Category } from '@/lib/types';
import { generateExportBuffer } from '@/lib/services/excel-exporter';
import { sendReportEmail } from '@/lib/services/email';
import { appendToSheet } from '@/lib/services/google-sheets';
import { getManager, getAgent } from '@/lib/dynamodb';

interface SubmissionBody {
  managerId: string;
  entries: { agentId: string; category: Category }[];
}

export async function POST(request: NextRequest) {
  try {
    const body: SubmissionBody = await request.json();
    const { managerId, entries } = body;

    if (!managerId || !entries || entries.length === 0) {
      return NextResponse.json(
        { error: 'managerId and entries are required' },
        { status: 400 }
      );
    }

    const now = new Date();
    const submissionDate = now.toISOString().split('T')[0];

    const manager = await getManager(managerId);
    if (!manager) {
      return NextResponse.json({ error: 'Manager not found' }, { status: 404 });
    }

    const exportRows = await Promise.all(
      entries.map(async (entry) => {
        const agent = await getAgent(managerId, entry.agentId);
        return {
          'Agent Name': agent?.full_name ?? 'Unknown',
          Category: CATEGORIES[entry.category].label,
          'Manager Name': manager.full_name,
          Date: submissionDate,
          Time: now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
        };
      })
    );

    const excelBuffer = generateExportBuffer(exportRows);

    // Send report to all addresses in the distribution list
    const submissionEmails = (process.env.SUBMISSION_EMAILS ?? '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    let emailsSent = 0;
    let emailsFailed = 0;
    const emailErrors: string[] = [];

    for (const toAddress of submissionEmails) {
      try {
        await sendReportEmail({
          toAddress,
          managerName: manager.full_name,
          submissionDate,
          excelBuffer,
        });
        emailsSent++;
      } catch (err) {
        emailsFailed++;
        emailErrors.push(`${toAddress}: ${err instanceof Error ? err.message : 'failed'}`);
      }
    }

    // Append to Google Sheet if configured
    let sheetAppended = false;
    let sheetError: string | undefined;
    const sheetId = process.env.GOOGLE_SHEETS_ID;

    if (sheetId) {
      try {
        const time = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
        await appendToSheet(
          sheetId,
          exportRows.map((r) => ({
            date: r.Date,
            time,
            managerName: r['Manager Name'],
            agentName: r['Agent Name'],
            category: r.Category,
          }))
        );
        sheetAppended = true;
      } catch (err) {
        sheetError = err instanceof Error ? err.message : 'Google Sheets append failed';
        console.error('Google Sheets error:', sheetError);
      }
    }

    return NextResponse.json({
      message: 'Submission completed',
      emailsSent,
      emailsFailed,
      emailErrors: emailErrors.length > 0 ? emailErrors : undefined,
      sheetAppended,
      sheetError,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Submission failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
