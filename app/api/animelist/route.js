import { fetchHtml, parseAnimeList } from '@/lib/scraper';

export async function GET() {
  try {
    const html = await fetchHtml('https://otakudesu.blog/anime-list/');
    const data = parseAnimeList(html);
    return Response.json(data);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
