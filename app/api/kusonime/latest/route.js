import { getLatestKusonime } from '@/lib/kusonimeScraper';

// In-memory cache for latest Kusonime pages (TTL 1 day)
const kusoLatestCache = new Map();
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const page = searchParams.get('page') || '1';
  const pageKey = `page_${page}`;

  const now = Date.now();
  const cached = kusoLatestCache.get(pageKey);
  if (cached && (now - cached.timestamp < ONE_DAY_MS)) {
    return Response.json(cached.data);
  }

  try {
    const data = await getLatestKusonime(parseInt(page, 10));
    
    // Save to cache
    kusoLatestCache.set(pageKey, {
      timestamp: now,
      data
    });

    return Response.json(data);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
