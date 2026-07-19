import { fetchHtml, parseAnimeDetails } from '@/lib/scraper';

export async function GET(request, { params }) {
  // In Next.js 16/React 19, params might be an object, but sometimes in dynamic routers we await it.
  const { slug } = await params;
  if (!slug) {
    return Response.json({ error: 'Missing slug' }, { status: 400 });
  }

  try {
    const html = await fetchHtml(`https://otakudesu.blog/anime/${slug}/`);
    const data = parseAnimeDetails(html, slug);
    return Response.json(data);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
