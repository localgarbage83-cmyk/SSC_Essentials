const security = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' }
];
export default {
  poweredByHeader: false,
  reactStrictMode: true,
  images: { unoptimized: true }, // image optimizer unused; disabling removes its DoS surface
  experimental: { serverComponentsExternalPackages: ['pg', '@electric-sql/pglite'] },
  async headers() { return [{ source: '/:path*', headers: security }]; },
  webpack(config) { config.resolve.alias = { ...config.resolve.alias, canvas: false, encoding: false }; return config; }
};
