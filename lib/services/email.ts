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
