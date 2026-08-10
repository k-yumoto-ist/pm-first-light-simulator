import type { NextConfig } from "next";

const isGitHubPages = process.env.GITHUB_PAGES === "true";

const nextConfig: NextConfig = isGitHubPages
  ? {
      output: "export",
      basePath: "/pm-first-light-simulator",
      assetPrefix: "/pm-first-light-simulator",
      images: { unoptimized: true },
      trailingSlash: true,
    }
  : {};

export default nextConfig;
