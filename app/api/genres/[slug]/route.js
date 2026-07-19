import { fetchHtml, parseGenreAnimeList } from '@/lib/scraper';

export async function GET(request, { params }) {
  const { slug } = await params;
  if (!slug) {
    return Response.json({ error: 'Missing genre slug' }, { status: 400 });
  }

  const { searchParams } = new URL(request.url);
  const page = searchParams.get('page') || '';
  
  const url = page && parseInt(page) > 1 
    ? `https://otakudesu.blog/genres/${slug}/page/${page}/`
    : `https://otakudesu.blog/genres/${slug}/`;

  try {
    const html = await fetchHtml(url);
    const data = parseGenreAnimeList(html);
    return Response.json(data);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
