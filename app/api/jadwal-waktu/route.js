// Fetch broadcast times from AniList API (GraphQL)
// Anilist GraphQL endpoint is fast, reliable, and does not require API keys.

const ANILIST_API_URL = 'https://graphql.anilist.co';

const DAY_MAP = {
  1: 'Senin',
  2: 'Selasa',
  3: 'Rabu',
  4: 'Kamis',
  5: 'Jumat',
  6: 'Sabtu',
  0: 'Minggu'
};

// GraphQL Query to get current airing schedule
const query = `
query ($start: Int, $end: Int) {
  Page(page: 1, perPage: 50) {
    airingSchedules(airingAt_greater: $start, airingAt_lesser: $end, sort: TIME) {
      id
      episode
      airingAt
      media {
        id
        idMal
        title {
          romaji
          english
          native
        }
        coverImage {
          large
        }
        averageScore
        episodes
      }
    }
  }
}
`;

export async function GET() {
  try {
    const results = {
      'Senin': [],
      'Selasa': [],
      'Rabu': [],
      'Kamis': [],
      'Jumat': [],
      'Sabtu': [],
      'Minggu': []
    };

    // We fetch schedule for the current week starting from Monday 00:00:00 local time
    const now = new Date();
    const currentDay = now.getDay(); // 0 is Sunday, 1 is Monday, etc.
    const distanceToMonday = currentDay === 0 ? -6 : 1 - currentDay;
    
    // Set to Monday 00:00:00 WIB
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() + distanceToMonday);
    startOfWeek.setHours(0, 0, 0, 0);

    const startTimestamp = Math.floor(startOfWeek.getTime() / 1000);
    const endTimestamp = startTimestamp + (7 * 24 * 60 * 60); // 7 days in seconds

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(ANILIST_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        query,
        variables: {
          start: startTimestamp,
          end: endTimestamp
        }
      }),
      signal: controller.signal,
      cache: 'no-store'
    });

    clearTimeout(timeout);
    
    if (!res.ok) {
      throw new Error(`Anilist API returned status ${res.status}`);
    }

    const json = await res.json();
    const schedules = json?.data?.Page?.airingSchedules || [];

    schedules.forEach(sched => {
      if (!sched.media) return;

      // Get air date day in local WIB timezone
      const airDate = new Date(sched.airingAt * 1000);
      const dayName = DAY_MAP[airDate.getDay()];

      // Format air time to HH:MM WIB
      const hours = String(airDate.getHours()).padStart(2, '0');
      const minutes = String(airDate.getMinutes()).padStart(2, '0');
      const timeStr = `${hours}:${minutes}`;

      const title = sched.media.title.english || sched.media.title.romaji;
      const titleId = sched.media.title.native;

      // Push to results
      results[dayName].push({
        malId: sched.media.idMal || sched.media.id,
        title,
        titleId,
        time: timeStr,
        timezone: 'Asia/Jakarta',
        episodes: sched.media.episodes || sched.episode,
        score: sched.media.averageScore ? (sched.media.averageScore / 10).toFixed(1) : null,
        thumb: sched.media.coverImage?.large || null,
        url: `https://anilist.co/anime/${sched.media.id}`
      });
    });

    // Deduplicate entries by malId within the same day list
    Object.keys(results).forEach(day => {
      const seen = new Set();
      results[day] = results[day].filter(anime => {
        if (seen.has(anime.malId)) return false;
        seen.add(anime.malId);
        return true;
      });
    });

    return Response.json(results, {
      headers: { 'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=900' }
    });
  } catch (error) {
    console.error('Anilist schedules fetch failed:', error.message);
    // Return empty fallback list
    return Response.json({
      'Senin': [],
      'Selasa': [],
      'Rabu': [],
      'Kamis': [],
      'Jumat': [],
      'Sabtu': [],
      'Minggu': []
    });
  }
}
