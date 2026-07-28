// Fetch broadcast times from Jikan API (MyAnimeList)
// Maps English day names to Indonesian
const DAY_MAP = {
  mondays: 'Senin',
  tuesdays: 'Selasa',
  wednesdays: 'Rabu',
  thursdays: 'Kamis',
  fridays: 'Jumat',
  saturdays: 'Sabtu',
  sundays: 'Minggu',
};

export async function GET() {
  try {
    const days = Object.keys(DAY_MAP);
    const results = {};

    // Fetch all days in parallel with 8s timeout
    const fetches = days.map(async (day) => {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);
        const res = await fetch(`https://api.jikan.moe/v4/schedules?filter=${day}&limit=25`, {
          headers: { 'Accept': 'application/json' },
          signal: controller.signal,
          next: { revalidate: 3600 }
        });
        clearTimeout(timeout);
        if (!res.ok) return;
        const json = await res.json();

        const idDay = DAY_MAP[day];
        results[idDay] = (json.data || []).map(anime => ({
          malId: anime.mal_id,
          title: anime.title,
          titleId: anime.title_japanese,
          time: anime.broadcast?.time || null,
          timezone: anime.broadcast?.timezone || 'Asia/Tokyo',
          episodes: anime.episodes,
          score: anime.score,
          thumb: anime.images?.jpg?.image_url || null,
          url: anime.url,
        }));
      } catch {
        // Silently skip this day if Jikan is unavailable
      }
    });

    await Promise.all(fetches);

    return Response.json(results, {
      headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=1800' }
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
