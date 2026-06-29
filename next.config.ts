import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    // Imagens servidas pela API (.NET) — dev local e produção.
    remotePatterns: [
      { protocol: "http", hostname: "localhost", port: "5120", pathname: "/uploads/**" },
      { protocol: "https", hostname: "**", pathname: "/uploads/**" },
    ],
  },
};

export default nextConfig;
