import { fetchHtml, parseEpisodeDetails } from '@/lib/scraper';

export async function GET(request, { params }) {
  const { slug } = await params;
  if (!slug) {
    return Response.json({ error: 'Missing slug' }, { status: 400 });
  }

  try {
    const html = await fetchHtml(`https://otakudesu.blog/episode/${slug}/`);
    const data = parseEpisodeDetails(html);
    return Response.json(data);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
