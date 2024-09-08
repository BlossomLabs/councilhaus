/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@repo/ui"],
  distDir: "build",
  output: "export",
};

export default nextConfig;
