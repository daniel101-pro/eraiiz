import { NextConfig } from 'next';

const config: NextConfig = {
  env: {
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'https://eraiiz-backend.onrender.com',
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  eslint: {
    ignoreDuringBuilds: true, // Consider enabling for production builds to catch errors
  },
  rewrites: async () => {
    return [
      {
        source: '/categories',
        destination: '/category',
      },
    ];
  },
};

export default config;