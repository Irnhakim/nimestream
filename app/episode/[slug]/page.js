import EpisodeStreamPlayer from '@/app/components/EpisodeStreamPlayer';
import { LOCAL_API_URL } from '@/lib/scraper';

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

  return (
    <main>
      <EpisodeStreamPlayer episode={episode} slug={slug} />
    </main>
  );
}
