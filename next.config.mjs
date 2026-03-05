/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    APP_PASSWORD: process.env.APP_PASSWORD,
  },
  experimental: {
    serverComponentsExternalPackages: ['@aws-sdk/client-dynamodb', '@aws-sdk/lib-dynamodb', '@aws-sdk/client-ses'],
  },
};

export default nextConfig;
