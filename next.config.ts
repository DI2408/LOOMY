import type { NextConfig } from "next";

const basePath = (process.env.NEXT_PUBLIC_BASE_PATH ?? "").replace(/\/$/, "") || undefined;
const assetPrefix = (process.env.NEXT_PUBLIC_ASSET_PREFIX ?? basePath ?? "").replace(
  /\/$/,
  "",
) || undefined;

const nextConfig: NextConfig = {
  basePath,
  assetPrefix: assetPrefix || undefined,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "placehold.co",
      },
    ],
  },
};

export default nextConfig;
