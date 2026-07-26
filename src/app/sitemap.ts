import { MetadataRoute } from 'next';
import { AnimeService } from '@/lib/api';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://shadow-garden.site';

  const defaultRoutes: MetadataRoute.Sitemap = [
    { url: `${baseUrl}`, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${baseUrl}/home`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${baseUrl}/discover`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
    { url: `${baseUrl}/social`, lastModified: new Date(), changeFrequency: 'hourly', priority: 0.9 },
    { url: `${baseUrl}/anime`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
    { url: `${baseUrl}/movies`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
    { url: `${baseUrl}/drama`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
    { url: `${baseUrl}/donghua`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
  ];

  const dynamicRoutesMap = new Map<string, MetadataRoute.Sitemap[number]>();

  const addRoute = (id: string, priority = 0.6) => {
    if (id && !dynamicRoutesMap.has(id)) {
      dynamicRoutesMap.set(id, {
        url: `${baseUrl}/watch/${encodeURIComponent(id)}`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority,
      });
    }
  };

  try {
    // We crawl a few pages of each category concurrently to populate the sitemap
    // while ensuring we don't hit serverless timeout limits.
    const fetchPromises = [];

    // Fetch top/recent
    fetchPromises.push(AnimeService.getTopSearch().then(res => ({ data: res, priority: 0.8 })).catch(() => null));
    for (let i = 1; i <= 3; i++) {
        fetchPromises.push(AnimeService.getRecentlyUpdated(i).then(res => ({ data: res, priority: 0.7 })).catch(() => null));
    }

    // Fetch Movies
    for (let i = 1; i <= 3; i++) {
        fetchPromises.push(AnimeService.getByType('movie', i).then(res => ({ data: res, priority: 0.6 })).catch(() => null));
    }

    // Fetch TV/Anime
    for (let i = 1; i <= 3; i++) {
        fetchPromises.push(AnimeService.getByType('tv', i).then(res => ({ data: res, priority: 0.6 })).catch(() => null));
    }

    // Fetch Drama (often mapped to genre or specific categories)
    for (let i = 1; i <= 2; i++) {
        fetchPromises.push(AnimeService.getByGenre('drama', i).then(res => ({ data: res, priority: 0.6 })).catch(() => null));
    }

    // Fetch Donghua / Chinese Anime (often mapped as donghua or martial arts or via type)
    for (let i = 1; i <= 2; i++) {
        fetchPromises.push(AnimeService.getByGenre('martial-arts', i).then(res => ({ data: res, priority: 0.6 })).catch(() => null));
    }

    // AZ List for broad crawling
    for (let i = 1; i <= 5; i++) {
        fetchPromises.push(AnimeService.getFilteredAnime('az-list', i).then(res => ({ data: res.results, priority: 0.5 })).catch(() => null));
    }

    const results = await Promise.all(fetchPromises);

    for (const result of results) {
        if (result && Array.isArray(result.data)) {
            result.data.forEach((item: any) => {
                if (item && item.id) {
                    addRoute(item.id, result.priority);
                }
            });
        }
    }

    const dynamicRoutes = Array.from(dynamicRoutesMap.values());

    return [...defaultRoutes, ...dynamicRoutes];
  } catch (error) {
    console.error('Sitemap generation error:', error);
    return defaultRoutes;
  }
}
