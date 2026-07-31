import { fetchHtml, parseAnimeList } from '@/lib/scraper';
import { getKusonimeAnimeList, KUSONIME_ENABLED } from '@/lib/kusonimeScraper';
import { getFileCache, setFileCache } from '@/lib/fileCache';

const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;
const CACHE_KEY = 'merged_animelist';

export async function GET() {
  const cachedData = getFileCache(CACHE_KEY, THREE_DAYS_MS);
  if (cachedData) {
    return Response.json(cachedData);
  }

  try {
    // 1. Fetch Otakudesu list
    const otakuHtml = await fetchHtml('https://otakudesu.blog/anime-list/');
    const otakuList = parseAnimeList(otakuHtml);

    // 2. Fetch Kusonime list if enabled
    let kusoList = {};
    if (KUSONIME_ENABLED) {
      kusoList = await getKusonimeAnimeList();
    }

    // 3. Merge lists with deduplication
    const mergedList = { ...otakuList };

    // We build a quick lowercase lookup map of existing Otakudesu title entries
    const otakuTitlesLookup = new Set();
    Object.values(otakuList).forEach(items => {
      items.forEach(item => {
        if (item.title) {
          // Normalize titles by lowercase and stripping punctuation/spacing
          const norm = item.title.toLowerCase().replace(/[^a-z0-9]/g, '');
          otakuTitlesLookup.add(norm);
        }
      });
    });

    // Merge Kusonime items
    Object.entries(kusoList).forEach(([letter, items]) => {
      if (!mergedList[letter]) {
        mergedList[letter] = [];
      }

      items.forEach(kusoItem => {
        const normKuso = kusoItem.title.toLowerCase().replace(/[^a-z0-9]/g, '');
        // Only insert if title doesn't exist on Otakudesu
        if (!otakuTitlesLookup.has(normKuso)) {
          mergedList[letter].push(kusoItem);
        }
      });
    });

    // 4. Sort each alphabetical block
    Object.keys(mergedList).forEach(letter => {
      mergedList[letter].sort((a, b) => a.title.localeCompare(b.title));
      
      // If a block becomes empty, delete the key
      if (mergedList[letter].length === 0) {
        delete mergedList[letter];
      }
    });

    // Cache the merged list to disk
    setFileCache(CACHE_KEY, mergedList);

    return Response.json(mergedList);
  } catch (error) {
    console.error('Anime list API error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
