/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: { ignoreDuringBuilds: false },
  // Marca e fontes são servidas localmente (public/). Sem dependência de CDN externa.
};
export default nextConfig;
