import { fetchHtml, parseHomeList } from '@/lib/scraper';
import { getFileCache, setFileCache } from '@/lib/fileCache';
import { getLatestOploverz } from '@/lib/oploverzScraper';

import { OPLOVERZ_ENABLED } from '@/lib/oploverzScraper';

const ONE_HOUR_MS = 1 * 60 * 60 * 1000;
const CACHE_KEY = 'ongoing_list';

export async function GET() {
  const cachedData = getFileCache(CACHE_KEY, ONE_HOUR_MS);
  if (cachedData) {
    // If Oploverz is disabled, filter out Oploverz items from cached data to prevent ghost data
    if (!OPLOVERZ_ENABLED) {
      const filtered = cachedData.filter(item => item.source !== 'Oploverz');
      return Response.json(filtered);
    }
    return Response.json(cachedData);
  }

  try {
    // Fetch Otakudesu ongoing and Oploverz ongoing in parallel
    const [otakuResult, oploverzResult] = await Promise.allSettled([
      fetchHtml('https://otakudesu.blog/').then(html => parseHomeList(html, 'ongoing')),
      getLatestOploverz()
    ]);

    const otakuData = otakuResult.status === 'fulfilled' ? otakuResult.value : [];
    const oploverzData = oploverzResult.status === 'fulfilled' ? oploverzResult.value : [];

    // Add source tag and normalize slugs for Oploverz items
    const normalizedOploverz = oploverzData.map(item => ({
      ...item,
      slug: `oploverz-${item.slug}`,
      source: 'Oploverz'
    }));

    // Interleave merge to show updates from both sources evenly
    const combined = [];
    const maxLength = Math.max(otakuData.length, normalizedOploverz.length);
    for (let i = 0; i < maxLength; i++) {
      if (i < otakuData.length) combined.push(otakuData[i]);
      if (i < normalizedOploverz.length) combined.push(normalizedOploverz[i]);
    }
    
    // Save to disk cache
    setFileCache(CACHE_KEY, combined);

    return Response.json(combined);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
