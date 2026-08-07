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

    // Deduplicate logic
    const merged = [];
    const matchedOploverzSlugs = new Set();

    // Helper to normalize titles and get core keywords (first 2 words)
    const getCoreKeywords = (title) => {
      // 1. Remove season strings, brackets content, sub indo strings, and non-alphanumeric chars
      const clean = title.toLowerCase()
        .replace(/\([^)]*\)/g, '') // remove parentheses content: (Dogulwang), etc.
        .replace(/subtitle indonesia|sub indo|season|\bs\d+/gi, '')
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
      
      const words = clean.split(' ').filter(w => w.length > 1);
      // Return first 2 words as core match criteria
      return words.slice(0, 2).join(' ');
    };

    otakuData.forEach(otakuItem => {
      const otakuCore = getCoreKeywords(otakuItem.title);
      
      const match = normalizedOploverz.find(opItem => {
        if (matchedOploverzSlugs.has(opItem.slug)) return false;
        const opCore = getCoreKeywords(opItem.title);
        // Match if core keywords overlap (e.g. 'tomb raider' === 'tomb raider' or 'clevatess' === 'clevatess')
        return otakuCore.length > 0 && opCore.length > 0 && (otakuCore.includes(opCore) || opCore.includes(otakuCore));
      });

      if (match) {
        matchedOploverzSlugs.add(match.slug);
        merged.push({
          ...otakuItem,
          mirrorSlug: match.slug // Save the Oploverz episode/series slug for mirror switching
        });
      } else {
        merged.push(otakuItem);
      }
    });

    // Add remaining Oploverz items
    normalizedOploverz.forEach(opItem => {
      if (!matchedOploverzSlugs.has(opItem.slug)) {
        merged.push(opItem);
      }
    });
    
    // Save to disk cache
    setFileCache(CACHE_KEY, merged);

    return Response.json(merged);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
