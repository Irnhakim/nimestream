import { fetchHtml, parseSearchList } from '@/lib/scraper';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q') || '';
  if (!q) {
    return Response.json([]);
  }
  
  try {
    const html = await fetchHtml(`https://otakudesu.blog/?s=${encodeURIComponent(q)}&post_type=anime`);
    const data = parseSearchList(html);
    return Response.json(data);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
