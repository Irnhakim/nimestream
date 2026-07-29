import EpisodeStreamPlayer from '@/app/components/EpisodeStreamPlayer';
import { LOCAL_API_URL } from '@/lib/scraper';
import WatchHistoryTracker from '@/app/components/WatchHistoryTracker';

async function getEpisodeDetails(slug) {
  try {
    const res = await fetch(`${LOCAL_API_URL}/api/episode/${slug}`, {
      cache: 'no-store'
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (e) {
    console.error('Failed to get episode details:', e);
    return null;
  }
}

export default async function EpisodePage({ params }) {
  const resolvedParams = await params;
  const { slug } = resolvedParams;
  const episode = await getEpisodeDetails(slug);

  if (!episode) {
    return (
      <main>
        <p style={{ textAlign: 'center', margin: '5rem 0', color: 'var(--text-muted)' }}>
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
