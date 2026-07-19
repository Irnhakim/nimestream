import { fetchHtml, parseHomeList } from '@/lib/scraper';

export async function GET() {
  try {
    const html = await fetchHtml('https://otakudesu.blog/');
    const data = parseHomeList(html, 'completed');
    return Response.json(data);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
