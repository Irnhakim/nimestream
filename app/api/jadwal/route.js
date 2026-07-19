import { fetchHtml, parseJadwalRilis } from '@/lib/scraper';

export async function GET() {
  try {
    const html = await fetchHtml('https://otakudesu.blog/jadwal-rilis/');
    const data = parseJadwalRilis(html);
    return Response.json(data);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
