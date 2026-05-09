import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  transpilePackages: [],
  outputFileTracingRoot: process.cwd(),
};

export default nextConfig;
