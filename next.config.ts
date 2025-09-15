/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co", // allow all Supabase projects
      },
    ],
  },
};

module.exports = nextConfig;
