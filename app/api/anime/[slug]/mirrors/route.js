import { fetchHtml, parseSearchList } from '@/lib/scraper';

const sourceKeys = [
  'donghua', 'samehadaku', 'animasu', 'zoronime', 'anoboy', 
  'nimegami', 'animeindo', 'animekuindo', 'winbu', 'kuramanime', 
  'animekompi', 'donghub', 'dramabox'
];

export async function GET(request, { params }) {
  const { slug } = await params;
  const { searchParams } = new URL(request.url);
  const title = searchParams.get('title');

  if (!slug || !title) {
    return Response.json({ error: 'Missing slug or title' }, { status: 400 });
  }

  let originSource = 'Otakudesu';
  let matchedKey = null;

  for (const key of sourceKeys) {
    if (slug.startsWith(`${key}-`)) {
      matchedKey = key;
      break;
    }
  }

  if (matchedKey) {
    originSource = matchedKey.charAt(0).toUpperCase() + matchedKey.slice(1);
  } else if (slug.startsWith('oploverz-')) {
    originSource = 'Oploverz';
  } else if (slug.startsWith('alqanime-')) {
    originSource = 'Alqanime';
  }

  const data = {};

  try {
    const titleQuery = title;
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

    console.log(`[Multi-Scraper Background Matcher] Resolved mirrors for "${titleQuery}":`, data);
  } catch (e) {
    console.error('Failed to resolve background mirrors:', e);
  }

  return Response.json(data);
}
