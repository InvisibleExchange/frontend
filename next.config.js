/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: false,
  transpilePackages: ["@lifi/widget", "@lifi/wallet-management"],
};

module.exports = nextConfig;
