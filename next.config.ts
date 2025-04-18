/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === 'production';

const nextConfig = {
  reactStrictMode: true,
  output: 'export', // Static HTML export for GitHub Pages
  trailingSlash: true,
  basePath: isProd ? '/error-signature-finder' : '',
  assetPrefix: isProd ? '/error-signature-finder/' : '',
  images: {
    unoptimized: true, // Required for static export
  },
  // Ensure browser-only packages don't run on the server
  webpack: (config: any, { isServer }: { isServer: boolean }) => {
    if (isServer) {
      config.externals = [...(config.externals || []), '@solidity-parser/parser'];
    }
    return config;
  },
};

export default nextConfig;
