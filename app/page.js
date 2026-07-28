import AnimeGrid from './components/AnimeGrid';
import { LOCAL_API_URL } from '@/lib/scraper';
import { getLatestKusonime } from '@/lib/kusonimeScraper';

async function getData(endpoint) {
  try {
    const res = await fetch(`${LOCAL_API_URL}/api/${endpoint}`, {
      cache: 'no-store'
    });
    if (!res.ok) return [];
    return await res.json();
  } catch (e) {
    console.error(`Failed to fetch ${endpoint}:`, e);
    return [];
  }
}

export default async function Home() {
  const ongoing = await getData('ongoing');
  const completed = await getData('completed');

  // Server-side fetch for Kusonime if enabled
  let latestBatch = [];
  if (process.env.NEXT_PUBLIC_KUSONIME_ENABLED === 'true') {
    latestBatch = await getLatestKusonime(1);
  }

  return (
    <main>
      <div className="hero-banner">
        <h1 className="hero-title">Nonton Anime <span>Subtitle Indonesia</span></h1>
        <p className="hero-desc">
          Temukan koleksi anime favoritmu mulai dari yang sedang tayang (ongoing) hingga yang sudah tamat lengkap secara gratis dengan kualitas terbaik.
        </p>
      </div>

      {/* Ongoing Section */}
      <AnimeGrid title="Anime On-Going Terbaru" items={ongoing} moreLink="/ongoing-anime" />
      
      {/* Completed Section */}
      <AnimeGrid title="Anime Completed Terbaru" items={completed} moreLink="/anime-list" />

      {/* Kusonime Batch Section */}
      {process.env.NEXT_PUBLIC_KUSONIME_ENABLED === 'true' && latestBatch.length > 0 && (
        <AnimeGrid title="Anime Batch Terbaru" items={latestBatch} isBatch={true} />
      )}
    </main>
  );
}
