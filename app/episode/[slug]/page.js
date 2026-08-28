import EpisodeStreamPlayer from '@/app/components/EpisodeStreamPlayer';
import { LOCAL_API_URL } from '@/lib/scraper';
import WatchHistoryTracker from '@/app/components/WatchHistoryTracker';

async function getEpisodeDetails(slug, searchParamsStr = '') {
  try {
    const url = `${LOCAL_API_URL}/api/episode/${slug}${searchParamsStr ? `?${searchParamsStr}` : ''}`;
    const res = await fetch(url, {
      cache: 'no-store'
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (e) {
    console.error('Failed to get episode details:', e);
    return null;
  }
}

export default async function EpisodePage({ params, searchParams }) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const { slug } = resolvedParams;

  // Build query string from searchParams to forward to local API endpoint
  const queryParams = [];
  if (resolvedSearchParams) {
    Object.entries(resolvedSearchParams).forEach(([k, v]) => {
      if (v) {
        queryParams.push(`${k}=${encodeURIComponent(v)}`);
      }
    });
  }
  const searchParamsStr = queryParams.join('&');
  const episode = await getEpisodeDetails(slug, searchParamsStr);

  if (!episode) {
    return (
      <main>
        <p style={{ textAlign: 'center', margin: '2rem 0', color: 'var(--text-muted)' }}>
          Episode tidak ditemukan atau gagal memuat data.
        </p>
      </main>
    );
  }

  // Parse parent anime title and episode title
  // E.g., title = "Tsundere Akuyaku Reijou Liselotte Episode 1 Subtitle Indonesia"
  // E.g., parentTitle = "Tsundere Akuyaku Reijou Liselotte", episodeTitle = "Episode 1"
  const rawTitle = episode.title || '';
  let animeTitle = rawTitle;
  let episodeTitle = 'Episode Baru';

  const epMatch = rawTitle.match(/(.*)\s+(Episode\s+\d+)/i);
  if (epMatch) {
    animeTitle = epMatch[1].trim();
    episodeTitle = epMatch[2].trim();
  } else {
    // Alternate parsing if no match (just split by "Episode")
    const parts = rawTitle.split(/episode/i);
    if (parts.length > 1) {
      animeTitle = parts[0].trim();
      episodeTitle = `Episode ${parts[1].replace(/subtitle indonesia|sub indo/gi, '').trim()}`;
    }
  }

  return (
    <main>
      <WatchHistoryTracker 
        animeTitle={animeTitle}
        episodeTitle={episodeTitle}
        slug={slug}
        thumb={episode.thumb}
        source="Otakudesu"
      />
      <EpisodeStreamPlayer episode={episode} slug={slug} />
    </main>
  );
}
