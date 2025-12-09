import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  basePath: process.env.BASE_PATH,
  output: "export",
};

export default nextConfig;
