/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@sih/types", "@sih/validation", "@sih/config"],
};

module.exports = nextConfig;
