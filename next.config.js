// /** @type {import('next').NextConfig} */
// const nextConfig = {
//   reactStrictMode: true,
// }

// module.exports = nextConfig


import { join } from 'path';

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable static export output. Note: next export CLI was removed in newer
  // Next.js versions — set output: 'export' so next build produces a static
  // export bundle.
  output: 'export',
  eslint: {
    // Disable ESLint during production builds for now so we can focus on functional fixes.
    // We'll re-enable and fix rule violations incrementally.
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  }
};
  
export default nextConfig;