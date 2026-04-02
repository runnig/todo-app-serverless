import type { NextConfig } from "next";

// Keep config minimal; bundler choice is controlled via scripts.
// Allow the current LAN host in development so Next serves dev-only
// assets/endpoints when the app is opened via the machine IP.
const nextConfig: NextConfig = {
  allowedDevOrigins: ["172.20.56.84"],
};

export default nextConfig;
