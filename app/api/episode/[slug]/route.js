import { fetchHtml, parseEpisodeDetails } from '@/lib/scraper';
import { getOploverzEpisode } from '@/lib/oploverzScraper';
import { getAlqanimeEpisode } from '@/lib/alqanimeScraper';
import { getEpisodeFromSource } from '@/lib/multiScraper';

export async function GET(request, { params }) {
  const { slug } = await params;
  if (!slug) {
    return Response.json({ error: 'Missing slug' }, { status: 400 });
  }

  // Dynamic sourceKeys routing check for multiScraper episode players
  const sourceKeys = [
    'donghua', 'samehadaku', 'animasu', 'zoronime', 'anoboy', 
    'nimegami', 'animeindo', 'animekuindo', 'winbu', 'kuramanime', 
    'animekompi', 'donghub', 'dramabox'
  ];

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
          // Fetch Oploverz & Alqanime mirrors concurrently
          const [oploResult, alqaResult] = await Promise.allSettled([
            getOploverzEpisode(cleanParentSlug, epNumber),
            getAlqanimeEpisode(`${cleanParentSlug}-episode-${epNumber}`)
          ]);

          // Merge Oploverz mirrors
          if (oploResult.status === 'fulfilled' && oploResult.value) {
            const oploData = oploResult.value;
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
          if (alqaResult.status === 'fulfilled' && alqaResult.value) {
            const alqaData = alqaResult.value;
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
