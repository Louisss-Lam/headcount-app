import { NextRequest, NextResponse } from 'next/server';
import { getManager } from '@/lib/dynamodb';
import { sendNotificationEmail } from '@/lib/services/email';

export async function POST(request: NextRequest) {
  try {
    const { managerId } = await request.json();

    if (!managerId) {
      return NextResponse.json({ error: 'managerId is required' }, { status: 400 });
    }

    const manager = await getManager(managerId);
    if (!manager) {
      return NextResponse.json({ error: 'Manager not found' }, { status: 404 });
    }

    if (!manager.email) {
      return NextResponse.json({ error: 'Manager has no email address' }, { status: 400 });
    }

    if (!manager.access_token) {
      return NextResponse.json({ error: 'Manager has no access token' }, { status: 400 });
    }

    const appUrl = (process.env.APP_URL ?? 'https://main.d35bei23phx7yk.amplifyapp.com').replace(/\/$/, '');

    await sendNotificationEmail({
      toAddress: manager.email,
      managerName: manager.full_name,
      headcountUrl: `${appUrl}/headcount/${manager.id}?token=${manager.access_token}`,
    });

    return NextResponse.json({ success: true, managerId: manager.id, name: manager.full_name });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to resend notification';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
