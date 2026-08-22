export const revalidate = 300;

import AnimeGrid from './components/AnimeGrid';
import { fetchHtml, parseHomeList } from '@/lib/scraper';
import { getLatestKusonime } from '@/lib/kusonimeScraper';
import ResumeWatchingBlock from './components/ResumeWatchingBlock';

export default async function Home() {
  const [ongoingHtml, completedHtml] = await Promise.all([
    fetchHtml('/').catch(() => ''),
    fetchHtml('/').catch(() => ''),
  ]);

  const ongoing = ongoingHtml ? parseHomeList(ongoingHtml, 'ongoing') : [];
  const completed = completedHtml ? parseHomeList(completedHtml, 'completed') : [];

  // Server-side fetch for Kusonime if enabled
  let latestBatch = [];
  if (process.env.NEXT_PUBLIC_KUSONIME_ENABLED === 'true') {
    const kusoData = await getLatestKusonime(1);
    latestBatch = kusoData?.items || [];
  }

  return (
    <main>
      <div className="hero-banner">
        <h1 className="hero-title">Nonton Anime <span>Subtitle Indonesia</span></h1>
        <p className="hero-desc">
          Temukan koleksi anime favoritmu mulai dari yang sedang tayang (ongoing) hingga yang sudah tamat lengkap secara gratis dengan kualitas terbaik.
        </p>
      </div>

      {/* Watch History (Client-side dynamic render) */}
      <ResumeWatchingBlock />

      {/* Ongoing Section */}
      <AnimeGrid title="Anime On-Going Terbaru" items={ongoing} moreLink="/ongoing-anime" />
      
      {/* Completed Section */}
      <AnimeGrid title="Anime Completed Terbaru" items={completed} moreLink="/anime-list" />

      {/* Kusonime Batch Section */}
      {process.env.NEXT_PUBLIC_KUSONIME_ENABLED === 'true' && latestBatch.length > 0 && (
        <AnimeGrid title="Anime Batch Terbaru" items={latestBatch} isBatch={true} moreLink="/batch-list" />
      )}
    </main>
  );
}
