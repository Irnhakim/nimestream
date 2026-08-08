import { fetchHtml, parseHomeList } from '@/lib/scraper';
import { getFileCache, setFileCache } from '@/lib/fileCache';
import { getLatestOploverz, OPLOVERZ_ENABLED } from '@/lib/oploverzScraper';
import { getLatestAlqanime, ALQANIME_ENABLED } from '@/lib/alqanimeScraper';

const ONE_HOUR_MS = 1 * 60 * 60 * 1000;
const CACHE_KEY = 'ongoing_list';

export async function GET() {
  const cachedData = getFileCache(CACHE_KEY, ONE_HOUR_MS);
  if (cachedData) {
    let filtered = cachedData;
    // Filter out disabled sources dynamically to prevent ghost data
    if (!OPLOVERZ_ENABLED) {
      filtered = filtered.filter(item => item.source !== 'Oploverz');
    }
    if (!ALQANIME_ENABLED) {
      filtered = filtered.filter(item => item.source !== 'Alqanime');
    }
    return Response.json(filtered);
  }

  try {
    // Fetch Otakudesu ongoing, Oploverz ongoing, and Alqanime ongoing in parallel
    const [otakuResult, oploverzResult, alqaResult] = await Promise.allSettled([
      fetchHtml('https://otakudesu.blog/').then(html => parseHomeList(html, 'ongoing')),
      getLatestOploverz(),
      getLatestAlqanime()
    ]);

    const otakuData = otakuResult.status === 'fulfilled' ? otakuResult.value : [];
    const oploverzData = oploverzResult.status === 'fulfilled' ? oploverzResult.value : [];
    const alqaData = alqaResult.status === 'fulfilled' ? alqaResult.value : [];

    // Add source tag and normalize slugs for Oploverz items
    const normalizedOploverz = oploverzData.map(item => ({
      ...item,
      slug: `oploverz-${item.slug}`,
      source: 'Oploverz'
    }));

    // Add source tag and normalize slugs for Alqanime items
    const normalizedAlqanime = alqaData.map(item => ({
      ...item,
      slug: `alqanime-${item.slug}`,
      source: 'Alqanime'
    }));

    // Deduplicate logic
    const merged = [];
    const matchedOploverzSlugs = new Set();
    const matchedAlqanimeSlugs = new Set();

    // Helper to normalize titles and get core keywords (first 2 words)
    const getCoreKeywords = (title) => {
      const clean = title.toLowerCase()
        .replace(/\([^)]*\)/g, '') // remove parentheses content: (Dogulwang), etc.
        .replace(/subtitle indonesia|sub indo|season|\bs\d+/gi, '')
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
      
      const words = clean.split(' ').filter(w => w.length > 1);
      return words.slice(0, 2).join(' ');
    };

    otakuData.forEach(otakuItem => {
      const otakuCore = getCoreKeywords(otakuItem.title);
      const updatedItem = { ...otakuItem };

      // Try matching Oploverz
      const opMatch = normalizedOploverz.find(opItem => {
        if (matchedOploverzSlugs.has(opItem.slug)) return false;
        const opCore = getCoreKeywords(opItem.title);
        return otakuCore.length > 0 && opCore.length > 0 && (otakuCore.includes(opCore) || opCore.includes(otakuCore));
      });

      if (opMatch) {
        matchedOploverzSlugs.add(opMatch.slug);
        updatedItem.mirrorSlug = opMatch.slug;
      }

      // Try matching Alqanime
      const alqaMatch = normalizedAlqanime.find(alqaItem => {
        if (matchedAlqanimeSlugs.has(alqaItem.slug)) return false;
        const alqaCore = getCoreKeywords(alqaItem.title);
        return otakuCore.length > 0 && alqaCore.length > 0 && (otakuCore.includes(alqaCore) || alqaCore.includes(otakuCore));
      });

      if (alqaMatch) {
        matchedAlqanimeSlugs.add(alqaMatch.slug);
        updatedItem.mirrorSlugAlqanime = alqaMatch.slug; // separate slug tracker for mirror links
      }

      merged.push(updatedItem);
    });

    // Add remaining Oploverz items
    normalizedOploverz.forEach(opItem => {
      if (!matchedOploverzSlugs.has(opItem.slug)) {
        merged.push(opItem);
      }
    });

    // Add remaining Alqanime items
    normalizedAlqanime.forEach(alqaItem => {
      if (!matchedAlqanimeSlugs.has(alqaItem.slug)) {
        merged.push(alqaItem);
      }
    });
    
    // Save to disk cache
    setFileCache(CACHE_KEY, merged);

    return Response.json(merged);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
