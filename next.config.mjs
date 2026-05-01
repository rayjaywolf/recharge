/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  server: {
    url: "http://192.168.29.29:3000",
    cleartext: true,
  },
}

export default nextConfig
