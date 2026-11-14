import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Oculta el logo "N" de Next.js en desarrollo (los errores se siguen viendo).
  devIndicators: false,
};

export default nextConfig;
