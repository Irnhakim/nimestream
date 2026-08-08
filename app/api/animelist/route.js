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

    // 3. Fetch all active dynamic sources listing concurrently
    const { getSourceConfig, getAnimeListFromSource } = require('@/lib/multiScraper');
    const sourceKeys = [
      'donghua', 'samehadaku', 'animasu', 'zoronime', 'anoboy', 
      'nimegami', 'animeindo', 'animekuindo', 'winbu', 'kuramanime', 
      'animekompi', 'donghub', 'dramabox'
    ];
    const activeSources = sourceKeys.filter(k => getSourceConfig(k).enabled);
    const dynamicResults = await Promise.allSettled(activeSources.map(key => getAnimeListFromSource(key)));

    // Helper function to check if title is highly similar (deduplicate same title + season)
    const isTitleSimilar = (t1, t2) => {
      const clean = (t) => t.toLowerCase()
        .replace(/subtitle indonesia|sub indo/gi, '')
        .replace(/season \d+|s\d+/gi, '')
        .replace(/[^a-z0-9\s]/g, '')
        .split(/\s+/)
        .filter(w => w.length > 0);

      const words1 = clean(t1);
      const words2 = clean(t2);
      if (words1.length === 0 || words2.length === 0) return false;

      const intersection = words1.filter(w => words2.includes(w));
      const minLength = Math.min(words1.length, words2.length);
      const ratio = intersection.length / minLength;

      // Also ensure season matches (if season is mentioned in one, it should match the other)
      const getSeason = (t) => {
        const match = t.toLowerCase().match(/(?:season|s)\s*(\d+)/i);
        return match ? match[1] : '1';
      };
      if (getSeason(t1) !== getSeason(t2)) return false;

      return ratio >= 0.7; // strict similarity threshold
    };

    // 4. Merge lists with strict deduplication
    const mergedList = { ...otakuList };

    // Maintain a list of already added titles to check similarity against
    const addedTitles = [];
    Object.values(otakuList).forEach(items => {
      items.forEach(item => {
        if (item.title) addedTitles.push(item.title);
      });
    });

    // Merge Kusonime items
    Object.entries(kusoList).forEach(([letter, items]) => {
      if (!mergedList[letter]) mergedList[letter] = [];
      items.forEach(kusoItem => {
        const exists = addedTitles.some(addedTitle => isTitleSimilar(addedTitle, kusoItem.title));
        if (!exists) {
          mergedList[letter].push(kusoItem);
          addedTitles.push(kusoItem.title);
        }
      });
    });

    // Merge Dynamic Multi-scrape items
    activeSources.forEach((key, index) => {
      const res = dynamicResults[index];
      if (res.status === 'fulfilled' && res.value) {
        Object.entries(res.value).forEach(([letter, items]) => {
          const upperLetter = letter.toUpperCase();
          if (!mergedList[upperLetter]) mergedList[upperLetter] = [];

          items.forEach(dynItem => {
            const exists = addedTitles.some(addedTitle => isTitleSimilar(addedTitle, dynItem.title));
            if (!exists) {
              mergedList[upperLetter].push(dynItem);
              addedTitles.push(dynItem.title);
            }
          });
        });
      }
    });

    // 5. Sort each alphabetical block
    Object.keys(mergedList).forEach(letter => {
      mergedList[letter].sort((a, b) => (a.title || '').localeCompare(b.title || ''));
      
      // If a block becomes empty, delete the key
      if (mergedList[letter].length === 0) {
        delete mergedList[letter];
      }
    });

    // Cache the merged list to disk (short lived cache for active updates)
    setFileCache(CACHE_KEY, mergedList);

    return Response.json(mergedList);
  } catch (error) {
    console.error('Anime list API error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
