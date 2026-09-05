import type { NextConfig } from 'next';
const basePath = process.env.PAGES_BASE_PATH || '';
const nextConfig: NextConfig = {
  ...(process.env.PAGES_BASE_PATH !== undefined ? { output: 'export' as const } : {}),
  basePath,
  trailingSlash: true,
};
export default nextConfig;
