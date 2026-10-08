/** @type {import('next').NextConfig} */
const isPagesExport = process.env.GH_PAGES === "true";

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // GitHub Pages serves pre-rendered files only: no server, clean URLs via
  // directory index files (/sky/ served for /sky). Local dev is unaffected.
  ...(isPagesExport
    ? {
        output: "export",
        basePath: "/kleine-sternenwelt",
        assetPrefix: "/kleine-sternenwelt/",
        trailingSlash: true,
      }
    : {}),
};

export default nextConfig;
