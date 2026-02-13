/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  basePath: "/india-data-dashboard",
  trailingSlash: true,
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
};

module.exports = nextConfig;
