import { fetchHtml, parseHomeList } from '@/lib/scraper';

// Daily cache for Ongoing list (TTL 1 day)
let ongoingCache = null;
let ongoingCacheTime = 0;
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export async function GET() {
  const now = Date.now();
  if (ongoingCache && (now - ongoingCacheTime < ONE_DAY_MS)) {
    return Response.json(ongoingCache);
  }

  try {
    const html = await fetchHtml('https://otakudesu.blog/');
    const data = parseHomeList(html, 'ongoing');
    
    // Save to cache
    ongoingCache = data;
    ongoingCacheTime = now;

    return Response.json(data);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
