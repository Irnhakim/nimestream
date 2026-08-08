import { fetchHtml, parseAnimeDetails } from '@/lib/scraper';
import { getFileCache } from '@/lib/fileCache';
import { getOploverzDetails } from '@/lib/oploverzScraper';
import { getAlqanimeDetails } from '@/lib/alqanimeScraper';
import { getDetailsFromSource } from '@/lib/multiScraper';

export async function GET(request, { params }) {
  const { slug } = await params;
  if (!slug) {
    return Response.json({ error: 'Missing slug' }, { status: 400 });
  }

  // List of new dynamic prefix keys from multiScraper
  const sourceKeys = [
    'donghua', 'samehadaku', 'animasu', 'zoronime', 'anoboy', 
    'nimegami', 'animeindo', 'animekuindo', 'winbu', 'kuramanime', 
    'animekompi', 'donghub', 'dramabox'
  ];

  for (const key of sourceKeys) {
    if (slug.startsWith(`${key}-`)) {
      try {
        const realSlug = slug.replace(`${key}-`, '');
        const data = await getDetailsFromSource(key, realSlug);
        if (!data) {
          return Response.json({ error: `Anime not found on ${key}` }, { status: 404 });
        }
        data.slug = slug;
        return Response.json(data);
      } catch (e) {
        return Response.json({ error: e.message }, { status: 500 });
      }
    }
  }

  // Route routing for Oploverz source
  if (slug.startsWith('oploverz-')) {
    try {
      const realSlug = slug.replace('oploverz-', '');
      const data = await getOploverzDetails(realSlug);
      if (!data) {
        return Response.json({ error: 'Anime not found on Oploverz' }, { status: 404 });
      }
      data.slug = slug;
      return Response.json(data);
    } catch (e) {
      return Response.json({ error: e.message }, { status: 500 });
    }
  }

  // Route routing for Alqanime source
  if (slug.startsWith('alqanime-')) {
    try {
      const realSlug = slug.replace('alqanime-', '');
      const data = await getAlqanimeDetails(realSlug);
      if (!data) {
        return Response.json({ error: 'Anime not found on Alqanime' }, { status: 404 });
      }
      data.slug = slug;
      return Response.json(data);
    } catch (e) {
      return Response.json({ error: e.message }, { status: 500 });
    }
  }

  try {
    const html = await fetchHtml(`https://otakudesu.blog/anime/${slug}/`);
    const data = parseAnimeDetails(html, slug);
    data.slug = slug;

    // Search and auto-resolve mirror slugs from other sources in real-time
    try {
      const titleQuery = data.title;
      const { searchOploverz } = require('@/lib/oploverzScraper');
      const { searchAlqanime } = require('@/lib/alqanimeScraper');
      const { searchFromSource, getSourceConfig } = require('@/lib/multiScraper');
      
      const activeSources = sourceKeys.filter(key => getSourceConfig(key).enabled);
      
      const getSeason = (titleStr) => {
        const t = titleStr.toLowerCase();
        const ordMatch = t.match(/(\d+)(?:st|nd|rd|th)\s+season/);
        if (ordMatch) return parseInt(ordMatch[1], 10);
        const seasonMatch = t.match(/season\s+(\d+)/);
        if (seasonMatch) return parseInt(seasonMatch[1], 10);
        const sMatch = t.match(/\bs(\d+)\b/);
        if (sMatch) return parseInt(sMatch[1], 10);
        return 1;
      };

      const cleanTitle = (t) => {
        let mainPart = t.split(/[:(]/)[0];
        return mainPart.toLowerCase()
          .replace(/subtitle indonesia|sub indo/gi, '')
          .replace(/season\s*\d+|s\d+/gi, '')
          .replace(/[^a-z0-9]/g, '')
          .trim();
      };

      const isMatch = (t1, t2) => {
        if (getSeason(t1) !== getSeason(t2)) return false;
        const n1 = cleanTitle(t1);
        const n2 = cleanTitle(t2);
        return n1.includes(n2) || n2.includes(n1);
      };

      const searchPromises = [
        searchOploverz(titleQuery).catch(() => []),
        searchAlqanime(titleQuery).catch(() => []),
        ...activeSources.map(key => searchFromSource(key, titleQuery).catch(() => []))
      ];

      const searchResults = await Promise.allSettled(searchPromises);

      // Match Oploverz
      if (searchResults[0].status === 'fulfilled' && searchResults[0].value) {
        const oploMatch = searchResults[0].value.find(item => isMatch(titleQuery, item.title));
        if (oploMatch) {
          data.mirrorSlug = `oploverz-${oploMatch.slug}`;
        }
      }

      // Match Alqanime
      if (searchResults[1].status === 'fulfilled' && searchResults[1].value) {
        const alqaMatch = searchResults[1].value.find(item => isMatch(titleQuery, item.title));
        if (alqaMatch) {
          data.mirrorSlugAlqanime = `alqanime-${alqaMatch.slug}`;
        }
      }

      // Match Dynamic Sources
      activeSources.forEach((key, idx) => {
        const resIdx = 2 + idx;
        if (searchResults[resIdx].status === 'fulfilled' && searchResults[resIdx].value) {
          const dynMatch = searchResults[resIdx].value.find(item => isMatch(titleQuery, item.title));
          if (dynMatch) {
            const displayName = key.charAt(0).toUpperCase() + key.slice(1);
            data[`mirrorSlug${displayName}`] = `${key}-${dynMatch.slug}`;
          }
        }
      });
    } catch (e) {
      console.error('Failed to auto-resolve mirror slugs in detail page:', e);
    }

    // Smart Recommendation System (Genre matching)
    let recommendations = [];
    const targetGenres = data.genres || [];

    if (targetGenres.length > 0) {
      try {
        // Retrieve lists from file cache (quick & RAM-efficient)
        const ongoingList = getFileCache('ongoing_list', 24 * 60 * 60 * 1000) || [];
        // Look up completed list cache (let's check completed endpoint cache key)
        const completedList = getFileCache('completed_list', 24 * 60 * 60 * 1000) || [];
        
        // Merge list
        const pool = [...ongoingList, ...completedList];
        
        if (pool.length > 0) {
          const scored = pool
            .filter(item => item.slug !== slug) // exclude itself
            .map(item => {
              // Parse item genres if present, or search for keyword matching
              // Since ongoing list parsed items have dayOrRating and ep but not full genres,
              // we can do a fallback matching. But wait! If we cannot find genres in list items,
              // let's do title word-matching or genre matching if Kusonime/Otakudesu lists contain genres.
              // Let's calculate score by title overlap & shared tags
              let score = 0;
              
              // 1. Calculate word overlap in titles
              const cleanTargetTitle = data.title.toLowerCase().replace(/[^a-z0-9\s]/g, '');
              const cleanItemTitle = item.title.toLowerCase().replace(/[^a-z0-9\s]/g, '');
              
              const targetWords = cleanTargetTitle.split(' ').filter(w => w.length > 3);
              const itemWords = cleanItemTitle.split(' ').filter(w => w.length > 3);
              
              const commonWords = targetWords.filter(w => itemWords.includes(w));
              score += commonWords.length * 3; // high weight for same series name/sequels

              // 2. Fallback rating match
              if (item.dayOrRating && /^\d+(\.\d+)?$/.test(item.dayOrRating)) {
                score += parseFloat(item.dayOrRating) * 0.1; // slight preference for higher rated
              }

              return { ...item, score };
            })
            .filter(item => item.score > 0 || Math.random() > 0.7) // mix some randomized values if score is 0
            .sort((a, b) => b.score - a.score);

          // Get top 6 unique recommendations
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
    return Response.json(data);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
