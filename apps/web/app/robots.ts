import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/api/', '/checkout/', '/receipt/', '/account', '/track'],
    },
    sitemap: 'https://stemoryblooms.com/sitemap.xml',
  };
}
