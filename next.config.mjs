// next.config.mjs

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // TOP-LEVEL (Next.js 14.1+)
  serverActions: {
    bodySizeLimit: '10mb',
  },

  // EXPERIMENTAL FALLBACK (Next.js 13 - 14.0)
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },

  turbopack: {
    rules: {},
  },
};

export default nextConfig;