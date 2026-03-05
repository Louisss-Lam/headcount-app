import { NextRequest, NextResponse } from 'next/server';
import { CATEGORIES, type Category } from '@/lib/types';
import { generateExportBuffer } from '@/lib/services/excel-exporter';
import { sendReportEmail } from '@/lib/services/email';
import { getManager, getAgent } from '@/lib/dynamodb';

interface SubmissionBody {
  managerId: string;
  entries: { agentId: string; category: Category }[];
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
