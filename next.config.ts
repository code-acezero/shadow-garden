/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**", // Allows images from ANY domain (easiest fix for anime sites)
      },
    ],
    // Alternatively, if you want to be stricter, list specific domains:
    // domains: ['gogocdn.net', 's4.anilist.co', 'artworks.thetvdb.com'],
  },
  // This helps avoid hydration mismatches with some external libraries
  reactStrictMode: false,
};

export default nextConfig;