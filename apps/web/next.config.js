/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@repo/ui", "@repo/llm", "@repo/db", "@repo/types"],
  // The cards route reads the Card Template SVGs from src/assets at runtime;
  // force them into the route's serverless bundle so production reads don't 404.
  outputFileTracingIncludes: {
    "/dashboard/cards": ["./src/assets/*.svg"],
  },
};

module.exports = nextConfig;
