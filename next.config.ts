import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  basePath: '/contentops',
  assetPrefix: '/contentops',
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
