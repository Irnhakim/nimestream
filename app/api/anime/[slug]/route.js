import { fetchHtml, parseAnimeDetails, parseSearchList } from '@/lib/scraper';
import { getFileCache, setFileCache } from '@/lib/fileCache';
import { getOploverzDetails } from '@/lib/oploverzScraper';
import { getAlqanimeDetails } from '@/lib/alqanimeScraper';
import { getDetailsFromSource } from '@/lib/multiScraper';

const sourceKeys = [
  'donghua', 'samehadaku', 'animasu', 'zoronime', 'anoboy',
  'nimegami', 'animeindo', 'animekuindo', 'winbu', 'kuramanime',
  'animekompi', 'donghub', 'dramabox'
];

const ANIME_CACHE_TTL = 12 * 60 * 60 * 1000; // 12 hours

export async function GET(request, { params }) {
  const { slug } = await params;
  if (!slug) {
    return Response.json({ error: 'Missing slug' }, { status: 400 });
  }

  const cacheKey = `anime_detail_${slug}`;
  const cached = getFileCache(cacheKey, ANIME_CACHE_TTL);
  if (cached) {
    return Response.json(cached);
  }

  let data = null;
  let originSource = 'Otakudesu';
  let matchedKey = null;

  // Detect which source the slug belongs to
  for (const key of sourceKeys) {
    if (slug.startsWith(`${key}-`)) {
      matchedKey = key;
      break;
    }
  }

  try {
    if (matchedKey) {
      originSource = matchedKey.charAt(0).toUpperCase() + matchedKey.slice(1);
      const realSlug = slug.replace(`${matchedKey}-`, '');
      data = await getDetailsFromSource(matchedKey, realSlug);
    } else if (slug.startsWith('oploverz-')) {
      originSource = 'Oploverz';
      const realSlug = slug.replace('oploverz-', '');
      data = await getOploverzDetails(realSlug);
    } else if (slug.startsWith('alqanime-')) {
      originSource = 'Alqanime';
      const realSlug = slug.replace('alqanime-', '');
      data = await getAlqanimeDetails(realSlug);
    } else {
      // Otakudesu
      const html = await fetchHtml(`https://otakudesu.blog/anime/${slug}/`);
      data = parseAnimeDetails(html, slug);
    }

    if (!data) {
      return Response.json({ error: 'Anime not found' }, { status: 404 });
    }

    data.slug = slug;

    // Smart Recommendation System (Genre matching)
    let recommendations = [];
    const targetGenres = data.genres || [];

    if (targetGenres.length > 0) {
      try {
        const ongoingList = getFileCache('ongoing_list', 24 * 60 * 60 * 1000) || [];
        const completedList = getFileCache('completed_list', 24 * 60 * 60 * 1000) || [];
        const pool = [...ongoingList, ...completedList];
        
        if (pool.length > 0) {
          const scored = pool
            .filter(item => item.slug !== slug)
            .map(item => {
              let score = 0;
              const cleanTargetTitle = data.title.toLowerCase().replace(/[^a-z0-9\s]/g, '');
              const cleanItemTitle = item.title.toLowerCase().replace(/[^a-z0-9\s]/g, '');
              
              const targetWords = cleanTargetTitle.split(' ').filter(w => w.length > 3);
              const itemWords = cleanItemTitle.split(' ').filter(w => w.length > 3);
              
              const commonWords = targetWords.filter(w => itemWords.includes(w));
              score += commonWords.length * 3;

              if (item.dayOrRating && /^\d+(\.\d+)?$/.test(item.dayOrRating)) {
                score += parseFloat(item.dayOrRating) * 0.1;
              }

              return { ...item, score };
            })
            .filter(item => item.score > 0 || Math.random() > 0.7)
            .sort((a, b) => b.score - a.score);

          const uniqueSlugs = new Set();
          for (const item of scored) {
            if (!uniqueSlugs.has(item.slug)) {
              uniqueSlugs.add(item.slug);
              recommendations.push(item);
            }
            if (recommendations.length >= 6) break;
          }
        }
      } catch (err) {
        console.error('Failed to generate smart recommendations:', err);
      }
    }

    data.recommendations = recommendations;

    setFileCache(cacheKey, data);
    return Response.json(data);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
