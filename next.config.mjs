// next.config.mjs

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Revert global compilation rules back to stable dynamic execution baselines
  cacheComponents: false,

  // Maintain standard build and dynamic server path options
  reactStrictMode: true,

  // NEXT.JS 16 FIXED TURBOPACK REFERENCE:
  // Configures compiler parameters using the correct top-level specification key
  turbopack: {
    rules: {}
  }
};

export default nextConfig;
