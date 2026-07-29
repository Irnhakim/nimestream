import { fetchHtml, parseEpisodeDetails } from '@/lib/scraper';

export async function GET(request, { params }) {
  const { slug } = await params;
  if (!slug) {
    return Response.json({ error: 'Missing slug' }, { status: 400 });
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
