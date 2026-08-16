import { fetchHtml, parseAnimeDetails, parseSearchList } from '@/lib/scraper';
import { getFileCache } from '@/lib/fileCache';
import { getOploverzDetails } from '@/lib/oploverzScraper';
import { getAlqanimeDetails } from '@/lib/alqanimeScraper';
import { getDetailsFromSource } from '@/lib/multiScraper';

const sourceKeys = [
  'donghua', 'samehadaku', 'animasu', 'zoronime', 'anoboy', 
  'nimegami', 'animeindo', 'animekuindo', 'winbu', 'kuramanime', 
  'animekompi', 'donghub', 'dramabox'
];

export async function GET(request, { params }) {
  const { slug } = await params;
  if (!slug) {
    return Response.json({ error: 'Missing slug' }, { status: 400 });
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

    // Search and auto-resolve mirror slugs from other sources in real-time based on title
    try {
      const titleQuery = data.title;
      const { searchOploverz } = require('@/lib/oploverzScraper');
      const { searchAlqanime } = require('@/lib/alqanimeScraper');
      const { searchFromSource, getSourceConfig } = require('@/lib/multiScraper');
      
      const activeSources = sourceKeys.filter(key => getSourceConfig(key).enabled);

      const searchOtakudesu = async (query) => {
        try {
          const html = await fetchHtml(`https://otakudesu.blog/?s=${encodeURIComponent(query)}&post_type=anime`);
          return parseSearchList(html);
        } catch {
          return [];
        }
      };
      
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

      const searchPromises = [];
      const searchTargets = [];

      // Add target search sources dynamically except the origin source
      if (originSource !== 'Otakudesu') {
        searchPromises.push(searchOtakudesu(titleQuery).catch(() => []));
        searchTargets.push('Otakudesu');
      }

      if (originSource !== 'Oploverz') {
        searchPromises.push(searchOploverz(titleQuery).catch(() => []));
        searchTargets.push('Oploverz');
      }

      if (originSource !== 'Alqanime') {
        searchPromises.push(searchAlqanime(titleQuery).catch(() => []));
        searchTargets.push('Alqanime');
      }

      activeSources.forEach(key => {
        const displayName = key.charAt(0).toUpperCase() + key.slice(1);
        if (originSource !== displayName) {
          searchPromises.push(searchFromSource(key, titleQuery).catch(() => []));
          searchTargets.push(displayName);
        }
      });

      const searchResults = await Promise.allSettled(searchPromises);

      searchResults.forEach((result, idx) => {
        if (result.status === 'fulfilled' && result.value) {
          const targetSource = searchTargets[idx];
          const match = result.value.find(item => isMatch(titleQuery, item.title));
          
          if (match) {
            if (targetSource === 'Otakudesu') {
              data.mirrorSlugOtakudesu = match.slug;
            } else if (targetSource === 'Oploverz') {
              data.mirrorSlug = `oploverz-${match.slug}`;
            } else if (targetSource === 'Alqanime') {
              data.mirrorSlugAlqanime = `alqanime-${match.slug}`;
            } else {
              data[`mirrorSlug${targetSource}`] = `${targetSource.toLowerCase()}-${match.slug}`;
            }
          }
        }
      });
      // Log resolved mirror slugs summary to server console
      const resolvedLog = {
        Otakudesu: data.mirrorSlugOtakudesu || 'Not Found',
        Oploverz: data.mirrorSlug || 'Not Found',
        Alqanime: data.mirrorSlugAlqanime || 'Not Found'
      };
      activeSources.forEach(key => {
        const displayName = key.charAt(0).toUpperCase() + key.slice(1);
        resolvedLog[displayName] = data[`mirrorSlug${displayName}`] || 'Not Found';
      });
      console.log(`[Multi-Scraper Anime Matcher] Resolved mirrors for "${titleQuery}" (${originSource} slug: ${slug}):`, resolvedLog);
    } catch (e) {
      console.error('Failed to auto-resolve mirror slugs in detail page:', e);
    }

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
    return Response.json(data);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
