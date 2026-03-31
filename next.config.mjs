/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Layer 5: Evict stale dev compilations faster to reduce chunk mismatches
  onDemandEntries: {
    maxInactiveAge: 15 * 1000,
    pagesBufferLength: 2,
  },

  // Layer 6: Prevent browser from caching stale JS chunks in development
  async headers() {
    if (process.env.NODE_ENV === 'development') {
      return [
        {
          source: '/_next/static/:path*',
          headers: [
            { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate, max-age=0' },
          ],
        },
      ];
    }
    return [];
  },

  // Layer 3: Disable persistent webpack cache in development
  // This is the root-cause fix — prevents corrupted cached chunks from surviving between sessions
  webpack: (config, { dev }) => {
    if (dev) {
      config.cache = false;
    }
    return config;
  },
};

export default nextConfig;
