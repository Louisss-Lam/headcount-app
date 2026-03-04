import { SESClient, SendRawEmailCommand } from '@aws-sdk/client-ses';

const ses = new SESClient({
  region: process.env.AWS_REGION ?? 'eu-west-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? '',
  },
});

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
  // Skip sending when AWS credentials aren't configured
  if (
    !process.env.AWS_ACCESS_KEY_ID ||
    process.env.AWS_ACCESS_KEY_ID === '<your-key>'
  ) {
    console.log(
      `[EMAIL SKIP] Would send report to ${toAddress} for ${managerName} (${submissionDate}). Configure AWS credentials to enable.`
    );
    return;
  }

  const fromAddress = process.env.SES_FROM_EMAIL ?? 'noreply@example.com';
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
