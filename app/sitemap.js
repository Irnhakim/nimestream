const BASE_URL = 'https://nimestream.my.id';

const STATIC_ROUTES = [
  { url: BASE_URL, changeFrequency: 'daily', priority: 1 },
  { url: `${BASE_URL}/anime-list`, changeFrequency: 'weekly', priority: 0.8 },
  { url: `${BASE_URL}/ongoing-anime`, changeFrequency: 'daily', priority: 0.9 },
  { url: `${BASE_URL}/batch-list`, changeFrequency: 'weekly', priority: 0.7 },
  { url: `${BASE_URL}/jadwal-rilis`, changeFrequency: 'daily', priority: 0.7 },
  { url: `${BASE_URL}/genre-list`, changeFrequency: 'monthly', priority: 0.5 },
];

export default async function sitemap() {
  try {
    const res = await fetch(`${BASE_URL}/api/animelist`, { next: { revalidate: 86400 } });
    if (!res.ok) return STATIC_ROUTES;

    const data = await res.json();

    // data is { A: [{slug, title},...], B: [...], ... }
    const animeUrls = Object.values(data)
      .flat()
      .filter(item => item?.slug)
      .map(item => ({
        url: `${BASE_URL}/anime/${item.slug}`,
        changeFrequency: 'weekly',
        priority: 0.6,
      }));

    return [...STATIC_ROUTES, ...animeUrls];
  } catch {
    return STATIC_ROUTES;
  }
}
