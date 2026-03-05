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
  },
  experimental: {
    serverComponentsExternalPackages: ['@aws-sdk/client-dynamodb', '@aws-sdk/lib-dynamodb', '@aws-sdk/client-ses'],
  },
};

export default nextConfig;
