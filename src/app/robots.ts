import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/settings', '/messages', '/manager', '/admin'],
    },
    sitemap: 'https://shadowgarden.app/sitemap.xml',
  };
}
