import { getLatestKusonime } from '@/lib/kusonimeScraper';
import { getFileCache, setFileCache } from '@/lib/fileCache';

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const page = searchParams.get('page') || '1';
  const cacheKey = `kuso_latest_page_${page}`;

  const cachedData = getFileCache(cacheKey, ONE_DAY_MS);
  if (cachedData) {
    return Response.json(cachedData);
  }

  try {
    const data = await getLatestKusonime(parseInt(page, 10));
    
    // Save to disk cache
    setFileCache(cacheKey, data);

    return Response.json(data);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
