import { fetchHtml, parseEpisodeDetails } from '@/lib/scraper';
import { getOploverzEpisode } from '@/lib/oploverzScraper';

export async function GET(request, { params }) {
  const { slug } = await params;
  if (!slug) {
    return Response.json({ error: 'Missing slug' }, { status: 400 });
  }

  // Route matching for Oploverz source
  if (slug.startsWith('oploverz-')) {
    try {
      // Expected slug format: oploverz-{seriesSlug}-episode-{epNumber}
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

  try {
    const html = await fetchHtml(`https://otakudesu.blog/episode/${slug}/`);
    const data = parseEpisodeDetails(html);

    // If animeSlug is parsed, fetch parent anime detail page to get high-quality portrait cover
    if (data.animeSlug) {
      try {
        const parentHtml = await fetchHtml(`https://otakudesu.blog/anime/${data.animeSlug}/`);
        // Find portrait thumbnail in parent HTML
        const coverMatch = parentHtml.match(/class=["']fotoanime["'][^>]*>\s*<img[^>]+src=["']([^"']+)["']/i)
          || parentHtml.match(/class=["']fotoanime["'][^>]*>\s*<img[^>]+data-src=["']([^"']+)["']/i);
        if (coverMatch && coverMatch[1]) {
          data.thumb = coverMatch[1];
        }
      } catch (err) {
        console.error('Failed to parse parent anime cover:', err);
      }
    }

    return Response.json(data);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
