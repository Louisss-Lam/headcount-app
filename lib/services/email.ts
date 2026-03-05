import { SESClient, SendRawEmailCommand } from '@aws-sdk/client-ses';

const credentials = process.env.CUSTOM_AWS_ACCESS_KEY_ID
  ? {
      accessKeyId: process.env.CUSTOM_AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.CUSTOM_AWS_SECRET_ACCESS_KEY!,
    }
  : undefined;

const ses = new SESClient({
  region: process.env.CUSTOM_AWS_REGION ?? process.env.AWS_REGION ?? 'eu-west-1',
  ...(credentials && { credentials }),
});

interface SendNotificationEmailParams {
  toAddress: string;
  managerName: string;
  headcountUrl: string;
}

export async function sendNotificationEmail({
  toAddress,
  managerName,
  headcountUrl,
}: SendNotificationEmailParams): Promise<void> {
  const fromAddress = process.env.SES_FROM_EMAIL ?? 'noreply@dwmas.co.uk';
  const boundary = `boundary-${Date.now()}`;

  const htmlBody = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h2 style="color: #1a1a1a;">Good morning, ${managerName}!</h2>
  <p style="color: #333; font-size: 16px; line-height: 1.5;">
    It's time to organise your headcount! Please click the button below to review and update your team's status for today.
  </p>
  <div style="text-align: center; margin: 30px 0;">
    <a href="${headcountUrl}" style="background-color: #2563eb; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: bold; display: inline-block;">
      Open Headcount
    </a>
  </div>
  <p style="color: #666; font-size: 14px;">
    Or copy this link: <a href="${headcountUrl}">${headcountUrl}</a>
  </p>
  <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
  <p style="color: #999; font-size: 12px;">DWM Energy Services - Headcount Management</p>
</body>
</html>`.trim();

  const textBody = `Good morning, ${managerName}!\n\nIt's time to organise your headcount! Please visit the link below to review and update your team's status for today.\n\n${headcountUrl}\n\n—\nDWM Energy Services - Headcount Management`;

  const rawMessage = [
    `From: ${fromAddress}`,
    `To: ${toAddress}`,
    `Subject: Time to organise your headcount!`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    '',
    `--${boundary}`,
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: 7bit',
    '',
    textBody,
    '',
    `--${boundary}`,
    'Content-Type: text/html; charset=UTF-8',
    'Content-Transfer-Encoding: 7bit',
    '',
    htmlBody,
    '',
    `--${boundary}--`,
  ].join('\r\n');

  await ses.send(
    new SendRawEmailCommand({
      RawMessage: { Data: Buffer.from(rawMessage, 'utf-8') },
    })
  );
}

interface SendReportEmailParams {
  toAddress: string;
  managerName: string;
  submissionDate: string;
  excelBuffer: Buffer;
}

export async function sendReportEmail({
  toAddress,
  managerName,
  submissionDate,
  excelBuffer,
}: SendReportEmailParams): Promise<void> {
  const fromAddress = process.env.SES_FROM_EMAIL ?? 'noreply@dwmas.co.uk';
  const boundary = `boundary-${Date.now()}`;
  const filename = `headcount-${managerName.replace(/\s+/g, '_')}-${submissionDate}.xlsx`;

  const rawMessage = [
    `From: ${fromAddress}`,
    `To: ${toAddress}`,
    `Subject: Headcount Report - ${managerName} - ${submissionDate}`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/mixed; boundary="${boundary}"`,
    '',
    `--${boundary}`,
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: 7bit',
    '',
    `Headcount report for ${managerName} submitted on ${submissionDate}.`,
    '',
    'Please find the Excel report attached.',
    '',
    `--${boundary}`,
    `Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet; name="${filename}"`,
    'Content-Transfer-Encoding: base64',
    `Content-Disposition: attachment; filename="${filename}"`,
    '',
    excelBuffer.toString('base64'),
    '',
    `--${boundary}--`,
  ].join('\r\n');

  await ses.send(
    new SendRawEmailCommand({
      RawMessage: { Data: Buffer.from(rawMessage, 'utf-8') },
    })
  );
}
