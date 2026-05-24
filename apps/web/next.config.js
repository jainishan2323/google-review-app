/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@repo/ui", "@repo/llm", "@repo/db", "@repo/types"],
};

module.exports = nextConfig;
