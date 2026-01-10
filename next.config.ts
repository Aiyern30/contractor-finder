import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Supabase Storage
      {
        protocol: "https",
        hostname: "tcgaoxrqlwyaandybbzd.supabase.co",
        port: "",
        pathname: "/storage/v1/object/public/**",
      },
      // Google OAuth Profile Images
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        port: "",
        pathname: "/**",
      },
      // GitHub OAuth Profile Images (if you add GitHub login later)
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
        port: "",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
