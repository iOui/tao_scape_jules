/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    instrumentationHook: true,
  },
  // If you have other configurations, they would go here.
  // For example, if you were using reactStrictMode:
  // reactStrictMode: true,
};

export default nextConfig;
