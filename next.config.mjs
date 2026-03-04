/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['better-sqlite3', '@aws-sdk/client-ses'],
  },
};

export default nextConfig;
