import { fetchHtml, parseHomeList } from '@/lib/scraper';
import { getFileCache, setFileCache } from '@/lib/fileCache';

const ONE_HOUR_MS = 1 * 60 * 60 * 1000;
const CACHE_KEY = 'ongoing_list';

export async function GET() {
  const cachedData = getFileCache(CACHE_KEY, ONE_HOUR_MS);
  if (cachedData) {
    return Response.json(cachedData);
  }

  try {
    const html = await fetchHtml('https://otakudesu.blog/');
    const data = parseHomeList(html, 'ongoing');
    
    // Save to disk cache
    setFileCache(CACHE_KEY, data);

    return Response.json(data);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
