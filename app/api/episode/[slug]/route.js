import { fetchHtml, parseEpisodeDetails } from '@/lib/scraper';
import { getOploverzEpisode } from '@/lib/oploverzScraper';
import { getAlqanimeEpisode } from '@/lib/alqanimeScraper';
import { getEpisodeFromSource } from '@/lib/multiScraper';

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

  const { searchParams } = new URL(request.url);
  const oploverzSlug = searchParams.get('oploverz');
  const alqanimeSlug = searchParams.get('alqanime');
  const dynSlugs = {};
  sourceKeys.forEach(k => {
    dynSlugs[k] = searchParams.get(k);
  });

  // Dynamic sourceKeys routing check for multiScraper episode players
  for (const key of sourceKeys) {
    if (slug.startsWith(`${key}-`)) {
      try {
        const realSlug = slug.replace(`${key}-`, '');
        const data = await getEpisodeFromSource(key, realSlug);
        if (!data) {
          return Response.json({ error: `Episode not found on ${key}` }, { status: 404 });
        }
        return Response.json(data);
      } catch (e) {
        return Response.json({ error: e.message }, { status: 500 });
      }
    }
  }

  // Route matching for Oploverz source
  if (slug.startsWith('oploverz-')) {
    try {
      const match = slug.match(/^oploverz-([a-z0-9-]+)-episode-([0-9.]+)$/i);
      if (!match) {
        return Response.json({ error: 'Invalid Oploverz episode slug format' }, { status: 400 });
      }
      const seriesSlug = match[1];
      const epNumber = match[2];
      const data = await getOploverzEpisode(seriesSlug, epNumber);
      if (!data) {
        return Response.json({ error: 'Episode not found on Oploverz' }, { status: 404 });
      }
      return Response.json(data);
    } catch (e) {
      return Response.json({ error: e.message }, { status: 500 });
    }
  }

  // Route matching for Alqanime source
  if (slug.startsWith('alqanime-')) {
    try {
      const realSlug = slug.replace('alqanime-', '');
      const data = await getAlqanimeEpisode(realSlug);
      if (!data) {
        return Response.json({ error: 'Episode not found on Alqanime' }, { status: 404 });
      }
      return Response.json(data);
    } catch (e) {
      return Response.json({ error: e.message }, { status: 500 });
    }
  }

  try {
    const html = await fetchHtml(`https://otakudesu.blog/episode/${slug}/`);
    const data = parseEpisodeDetails(html);

    // Label Otakudesu mirrors
    if (data.mirrors) {
      data.mirrors = data.mirrors.map(m => ({
        ...m,
        server: m.server,
        source: 'Otakudesu'
      }));
    }

    // Label Otakudesu downloads
    if (data.downloads) {
      data.downloads = data.downloads.map(dl => ({
        ...dl,
        source: 'Otakudesu'
      }));
    }

    // If animeSlug is parsed, fetch parent anime detail page to get high-quality portrait cover
    if (data.animeSlug) {
      try {
        const parentHtml = await fetchHtml(`https://otakudesu.blog/anime/${data.animeSlug}/`);
        const coverMatch = parentHtml.match(/class=["']fotoanime["'][^>]*>\s*<img[^>]+src=["']([^"']+)["']/i)
          || parentHtml.match(/class=["']fotoanime["'][^>]*>\s*<img[^>]+data-src=["']([^"']+)["']/i);
        if (coverMatch && coverMatch[1]) {
          data.thumb = coverMatch[1];
        }

        const cleanParentSlug = data.animeSlug.replace('-sub-indo', '').replace('-subtitle-indonesia', '');
        const epNumberMatch = slug.match(/-episode-(\d+)/i);
        const epNumber = epNumberMatch ? epNumberMatch[1] : null;

        if (epNumber) {
          const { getSourceConfig } = require('@/lib/multiScraper');
          const activeSources = sourceKeys.filter(k => getSourceConfig(k).enabled);

          // Use parameters passed from anime detail page or fallback to predicted slug
          const targetOploSlug = oploverzSlug ? oploverzSlug.replace('oploverz-', '') : cleanParentSlug;
          const targetAlqaSlug = alqanimeSlug ? alqanimeSlug.replace('alqanime-', '') : cleanParentSlug;

          // Fetch Oploverz, Alqanime, & dynamic sources mirrors concurrently
          const promises = [
            getOploverzEpisode(targetOploSlug, epNumber).catch(() => null),
            getAlqanimeEpisode(`${targetAlqaSlug}-episode-${epNumber}`).catch(() => null),
            ...activeSources.map(async (key) => {
              const dynSlug = dynSlugs[key] ? dynSlugs[key].replace(`${key}-`, '') : cleanParentSlug;
              // Try standard themesia slug patterns
              try {
                return await getEpisodeFromSource(key, `${dynSlug}-episode-${epNumber}`);
              } catch {
                try {
                  return await getEpisodeFromSource(key, `${dynSlug}-ep-${epNumber}`);
                } catch {
                  return null;
                }
              }
            })
          ];

          const results = await Promise.allSettled(promises);

          // Merge Oploverz mirrors
          if (results[0].status === 'fulfilled' && results[0].value) {
            const oploData = results[0].value;
            const oploMirrors = oploData.mirrors.map(m => ({
              ...m,
              server: m.server,
              source: 'Oploverz'
            }));
            data.mirrors = [...(data.mirrors || []), ...oploMirrors];

            const oploDownloads = oploData.downloads.map(dl => ({
              ...dl,
              quality: dl.quality,
              source: 'Oploverz'
            }));
            data.downloads = [...(data.downloads || []), ...oploDownloads];
          }

          // Merge Alqanime mirrors
          if (results[1].status === 'fulfilled' && results[1].value) {
            const alqaData = results[1].value;
            const alqaMirrors = alqaData.mirrors.map(m => ({
              ...m,
              server: m.server,
              source: 'Alqanime'
            }));
            data.mirrors = [...(data.mirrors || []), ...alqaMirrors];

            const alqaDownloads = alqaData.downloads.map(dl => ({
              ...dl,
              quality: dl.quality,
              source: 'Alqanime'
            }));
            data.downloads = [...(data.downloads || []), ...alqaDownloads];
          }

          // Merge Dynamic Sources mirrors
          activeSources.forEach((key, idx) => {
            const resIndex = 2 + idx;
            const sourceName = key.charAt(0).toUpperCase() + key.slice(1);
            if (results[resIndex].status === 'fulfilled' && results[resIndex].value) {
              const dynData = results[resIndex].value;
              
              const dynMirrors = (dynData.mirrors || []).map(m => ({
                ...m,
                server: m.server,
                source: sourceName
              }));
              data.mirrors = [...(data.mirrors || []), ...dynMirrors];

              const dynDownloads = (dynData.downloads || []).map(dl => ({
                ...dl,
                quality: dl.quality,
                source: sourceName
              }));
              data.downloads = [...(data.downloads || []), ...dynDownloads];
            }
          });
        }
      } catch (err) {
        console.error('Failed to parse parent anime cover or fetch dynamic mirrors:', err);
      }
    }

    return Response.json(data);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
