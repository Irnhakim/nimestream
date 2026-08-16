import { fetchHtml, parseEpisodeDetails } from '@/lib/scraper';
import { getOploverzEpisode } from '@/lib/oploverzScraper';
import { getAlqanimeEpisode } from '@/lib/alqanimeScraper';
import { getEpisodeFromSource } from '@/lib/multiScraper';

const sourceKeys = [
  'donghua', 'samehadaku', 'animasu', 'zoronime', 'anoboy', 
  'nimegami', 'animeindo', 'animekuindo', 'winbu', 'kuramanime', 
  'animekompi', 'donghub', 'dramabox'
];

// Helper to fetch and parse Otakudesu episode mirrors
const getOtakudesuEpisode = async (parentSlug, epNum) => {
  try {
    let html = null;
    try {
      html = await fetchHtml(`https://otakudesu.blog/episode/${parentSlug}-episode-${epNum}-sub-indo/`);
    } catch {
      try {
        html = await fetchHtml(`https://otakudesu.blog/episode/${parentSlug}-episode-${epNum}-subtitle-indonesia/`);
      } catch {
        // Fallback: search Otakudesu for parentSlug and look for episode match if necessary
        return null;
      }
    }
    return parseEpisodeDetails(html);
  } catch {
    return null;
  }
};

export async function GET(request, { params }) {
  const { slug } = await params;
  if (!slug) {
    return Response.json({ error: 'Missing slug' }, { status: 400 });
  }

  const { searchParams } = new URL(request.url);
  const otakudesuParent = searchParams.get('otakudesu');
  const oploverzSlug = searchParams.get('oploverz');
  const alqanimeSlug = searchParams.get('alqanime');
  const dynSlugs = {};
  sourceKeys.forEach(k => {
    dynSlugs[k] = searchParams.get(k);
  });

  let data = null;
  let originSource = 'Otakudesu';
  let matchedKey = null;

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
      data = await getEpisodeFromSource(matchedKey, realSlug);
    } else if (slug.startsWith('oploverz-')) {
      originSource = 'Oploverz';
      const match = slug.match(/^oploverz-([a-z0-9-]+)-episode-([0-9.]+)$/i);
      if (!match) {
        return Response.json({ error: 'Invalid Oploverz episode slug format' }, { status: 400 });
      }
      const seriesSlug = match[1];
      const epNumber = match[2];
      data = await getOploverzEpisode(seriesSlug, epNumber);
    } else if (slug.startsWith('alqanime-')) {
      originSource = 'Alqanime';
      const realSlug = slug.replace('alqanime-', '');
      data = await getAlqanimeEpisode(realSlug);
    } else {
      // Otakudesu
      const html = await fetchHtml(`https://otakudesu.blog/episode/${slug}/`);
      data = parseEpisodeDetails(html);
    }

    if (!data) {
      return Response.json({ error: 'Episode not found' }, { status: 404 });
    }

    // Label origin mirrors
    if (data.mirrors) {
      data.mirrors = data.mirrors.map(m => ({
        ...m,
        source: originSource
      }));
    } else {
      data.mirrors = [];
    }

    // Label origin downloads
    if (data.downloads) {
      data.downloads = data.downloads.map(dl => ({
        ...dl,
        source: originSource
      }));
    } else {
      data.downloads = [];
    }

    // Extract high quality portrait cover if parent anime details are loaded (only for Otakudesu origin)
    if (originSource === 'Otakudesu' && data.animeSlug) {
      try {
        const parentHtml = await fetchHtml(`https://otakudesu.blog/anime/${data.animeSlug}/`);
        const coverMatch = parentHtml.match(/class=["']fotoanime["'][^>]*>\s*<img[^>]+src=["']([^"']+)["']/i)
          || parentHtml.match(/class=["']fotoanime["'][^>]*>\s*<img[^>]+data-src=["']([^"']+)["']/i);
        if (coverMatch && coverMatch[1]) {
          data.thumb = coverMatch[1];
        }
      } catch (err) {
        console.error('Failed to fetch parent cover for Otakudesu episode:', err);
      }
    }

    // Extract episode number
    let epNumber = null;
    const epNumberMatch = slug.match(/-episode-(\d+)/i) 
      || slug.match(/-ep-(\d+)/i) 
      || (data.title && data.title.match(/(?:episode|ep)\s*(\d+)/i));
    if (epNumberMatch) {
      epNumber = epNumberMatch[1];
    }

    // Extract clean parent slug
    let cleanParentSlug = '';
    if (data.animeSlug) {
      cleanParentSlug = data.animeSlug.replace('-sub-indo', '').replace('-subtitle-indonesia', '');
    } else {
      cleanParentSlug = slug.split('-episode-')[0].split('-ep-')[0].replace('oploverz-', '').replace('alqanime-', '');
      for (const key of sourceKeys) {
        cleanParentSlug = cleanParentSlug.replace(`${key}-`, '');
      }
    }

    if (epNumber) {
      const { getSourceConfig } = require('@/lib/multiScraper');
      const activeSources = sourceKeys.filter(k => getSourceConfig(k).enabled);

      const promises = [];
      const searchTargets = [];

      // Fetch Otakudesu mirror if not origin
      if (originSource !== 'Otakudesu') {
        const targetOtakuSlug = otakudesuParent || cleanParentSlug;
        promises.push(getOtakudesuEpisode(targetOtakuSlug, epNumber).catch(() => null));
        searchTargets.push('Otakudesu');
      }

      // Fetch Oploverz mirror if not origin
      if (originSource !== 'Oploverz') {
        const targetOploSlug = oploverzSlug ? oploverzSlug.replace('oploverz-', '') : cleanParentSlug;
        promises.push(getOploverzEpisode(targetOploSlug, epNumber).catch(() => null));
        searchTargets.push('Oploverz');
      }

      // Fetch Alqanime mirror if not origin
      if (originSource !== 'Alqanime') {
        const targetAlqaSlug = alqanimeSlug ? alqanimeSlug.replace('alqanime-', '') : cleanParentSlug;
        promises.push(getAlqanimeEpisode(`${targetAlqaSlug}-episode-${epNumber}`).catch(() => null));
        searchTargets.push('Alqanime');
      }

      // Fetch active dynamic multi-scraper sources
      activeSources.forEach(key => {
        const displayName = key.charAt(0).toUpperCase() + key.slice(1);
        if (originSource !== displayName) {
          const dynSlug = dynSlugs[key] ? dynSlugs[key].replace(`${key}-`, '') : cleanParentSlug;
          promises.push((async () => {
            try {
              return await getEpisodeFromSource(key, `${dynSlug}-episode-${epNumber}`);
            } catch {
              try {
                return await getEpisodeFromSource(key, `${dynSlug}-ep-${epNumber}`);
              } catch {
                return null;
              }
            }
          })().catch(() => null));
          searchTargets.push(displayName);
        }
      });

      const results = await Promise.allSettled(promises);

      results.forEach((result, idx) => {
        if (result.status === 'fulfilled' && result.value) {
          const targetSource = searchTargets[idx];
          const srcData = result.value;

          if (srcData.mirrors) {
            const mappedMirrors = srcData.mirrors.map(m => ({
              ...m,
              source: targetSource
            }));
            data.mirrors = [...data.mirrors, ...mappedMirrors];
          }

          if (srcData.downloads) {
            const mappedDownloads = srcData.downloads.map(dl => ({
              ...dl,
              source: targetSource
            }));
            data.downloads = [...data.downloads, ...mappedDownloads];
          }
        }
      });
    }

    return Response.json(data);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
