import { fetchHtml, parseEpisodeDetails } from '@/lib/scraper';
import { getOploverzEpisode } from '@/lib/oploverzScraper';
import { getAlqanimeEpisode, getAlqanimeDetails } from '@/lib/alqanimeScraper';
import { getEpisodeFromSource, getDetailsFromSource } from '@/lib/multiScraper';

const sourceKeys = [
  'donghua', 'samehadaku', 'animasu', 'zoronime', 'anoboy', 
  'nimegami', 'animeindo', 'animekuindo', 'winbu', 'kuramanime', 
  'animekompi', 'donghub', 'dramabox'
];

const getOtakudesuEpisode = async (parentSlug, epNum) => {
  try {
    let html = null;
    try {
      html = await fetchHtml(`https://otakudesu.blog/episode/${parentSlug}-episode-${epNum}-sub-indo/`);
    } catch {
      try {
        html = await fetchHtml(`https://otakudesu.blog/episode/${parentSlug}-episode-${epNum}-subtitle-indonesia/`);
      } catch {
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

  // Extract episode number
  let epNumber = null;
  const epNumberMatch = slug.match(/-episode-(\d+)/i) 
    || slug.match(/-ep-(\d+)/i) 
    || slug.match(/(?:episode|ep)\s*(\d+)/i);
  if (epNumberMatch) {
    epNumber = epNumberMatch[1];
  }

  let cleanParentSlug = slug.split('-episode-')[0].split('-ep-')[0].replace('oploverz-', '').replace('alqanime-', '');
  for (const key of sourceKeys) {
    cleanParentSlug = cleanParentSlug.replace(`${key}-`, '');
  }

  const data = {
    mirrors: [],
    downloads: []
  };

  const getEpisodeNumberVal = (titleStr) => {
    if (!titleStr) return null;
    const match = titleStr.match(/(?:episode|ep)\s*\.?\s*(\d+(?:\.\d+)?)/i);
    if (match) return parseFloat(match[1]);
    const allNums = titleStr.match(/(\d+(?:\.\d+)?)/g);
    if (allNums && allNums.length > 0) {
      return parseFloat(allNums[allNums.length - 1]);
    }
    return null;
  };

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
      promises.push((async () => {
        const targetAlqaSlug = alqanimeSlug ? alqanimeSlug.replace('alqanime-', '') : cleanParentSlug;
        let exactAlqaEpSlug = null;
        try {
          const parentData = await getAlqanimeDetails(targetAlqaSlug);
          if (parentData && parentData.episodes) {
            const targetEpNum = parseFloat(epNumber);
            const matchedEp = parentData.episodes.find(ep => {
              const num = getEpisodeNumberVal(ep.title);
              return num !== null && num === targetEpNum;
            });
            if (matchedEp) {
              exactAlqaEpSlug = matchedEp.slug.replace('alqanime-', '');
            }
          }
        } catch {}

        if (exactAlqaEpSlug) {
          try {
            const epData = await getAlqanimeEpisode(exactAlqaEpSlug);
            if (epData) return epData;
          } catch {}
        }

        try {
          return await getAlqanimeEpisode(`${targetAlqaSlug}-episode-${epNumber}`);
        } catch {
          return null;
        }
      })().catch(() => null));
      searchTargets.push('Alqanime');
    }

    // Fetch active dynamic multi-scraper sources
    activeSources.forEach(key => {
      const displayName = key.charAt(0).toUpperCase() + key.slice(1);
      if (originSource !== displayName) {
        promises.push((async () => {
          const dynSlug = dynSlugs[key] ? dynSlugs[key].replace(`${key}-`, '') : cleanParentSlug;
          let exactEpSlug = null;
          
          try {
            const parentData = await getDetailsFromSource(key, dynSlug);
            if (parentData && parentData.episodes) {
              const targetEpNum = parseFloat(epNumber);
              const matchedEp = parentData.episodes.find(ep => {
                const num = getEpisodeNumberVal(ep.title);
                return num !== null && num === targetEpNum;
              });
              if (matchedEp) {
                exactEpSlug = matchedEp.slug.replace(`${key}-`, '');
              }
            }
          } catch (err) {}

          if (exactEpSlug) {
            try {
              const epData = await getEpisodeFromSource(key, exactEpSlug);
              if (epData) return epData;
            } catch {}
          }

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

    console.log(`[Multi-Scraper Background Episode Merger] Merged mirrors for "${slug}":`, {
      mirrorsCount: data.mirrors.length,
      downloadsCount: data.downloads.length,
      sourcesMerged: [...new Set(data.mirrors.map(m => m.source))]
    });
  }

  return Response.json(data);
}
