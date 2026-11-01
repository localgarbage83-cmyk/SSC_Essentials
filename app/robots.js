export default function robots() { return { rules: { userAgent: '*', allow: '/', disallow: ['/admin', '/api/admin'] }, sitemap: (process.env.SITE_URL || 'http://localhost:3000') + '/sitemap.xml' }; }
