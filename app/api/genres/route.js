import { fetchHtml, parseGenreList } from '@/lib/scraper';

// Long-term cache for Genre list (TTL 1 month)
let genresCache = null;
let genresCacheTime = 0;
const ONE_MONTH_MS = 30 * 24 * 60 * 60 * 1000;

export async function GET() {
  const now = Date.now();
  if (genresCache && (now - genresCacheTime < ONE_MONTH_MS)) {
    return Response.json(genresCache);
  }

  try {
    const html = await fetchHtml('https://otakudesu.blog/genre-list/');
    const data = parseGenreList(html);
    
    // Save to cache
    genresCache = data;
    genresCacheTime = now;

    return Response.json(data);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
