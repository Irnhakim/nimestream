import { fetchHtml, parseOngoingAnimeList } from '@/lib/scraper';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const page = searchParams.get('page') || '';
  
  const url = page && parseInt(page) > 1 
    ? `https://otakudesu.blog/ongoing-anime/page/${page}/`
    : `https://otakudesu.blog/ongoing-anime/`;

  try {
    const html = await fetchHtml(url);
    const data = parseOngoingAnimeList(html);
    return Response.json(data);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
