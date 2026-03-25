/** @type {import('next').NextConfig} */
const nextConfig = {
  skipTrailingSlashRedirect: true,
  env: {
    APP_PASSWORD: process.env.APP_PASSWORD,
    CUSTOM_AWS_ACCESS_KEY_ID: process.env.CUSTOM_AWS_ACCESS_KEY_ID,
    CUSTOM_AWS_SECRET_ACCESS_KEY: process.env.CUSTOM_AWS_SECRET_ACCESS_KEY,
    CUSTOM_AWS_REGION: process.env.CUSTOM_AWS_REGION,
    DYNAMODB_TABLE: process.env.DYNAMODB_TABLE,
    SES_FROM_EMAIL: process.env.SES_FROM_EMAIL,
    APP_URL: process.env.APP_URL,
    NOTIFICATION_BCC: process.env.NOTIFICATION_BCC,
    SUBMISSION_EMAILS: process.env.SUBMISSION_EMAILS,
    GOOGLE_SERVICE_ACCOUNT_EMAIL: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY: process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY,
    GOOGLE_SHEETS_ID: process.env.GOOGLE_SHEETS_ID,
  },
  experimental: {
    serverComponentsExternalPackages: ['@aws-sdk/client-dynamodb', '@aws-sdk/lib-dynamodb', '@aws-sdk/client-ses', 'googleapis'],
  },
};

export default nextConfig;
