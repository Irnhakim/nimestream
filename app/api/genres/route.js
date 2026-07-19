import { fetchHtml, parseGenreList } from '@/lib/scraper';

export async function GET() {
  try {
    const html = await fetchHtml('https://otakudesu.blog/genre-list/');
    const data = parseGenreList(html);
    return Response.json(data);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
