import Link from 'next/link';
import { LOCAL_API_URL } from '@/lib/scraper';
import EpisodeBox from '@/app/components/EpisodeBox';
import KusonimeBatchLink from '@/app/components/KusonimeBatchLink';
import AnimeGrid from '@/app/components/AnimeGrid';
import BookmarkButton from '@/app/components/BookmarkButton';
import SynopsisBox from '@/app/components/SynopsisBox';

async function getAnimeDetails(slug) {
  try {
    const res = await fetch(`${LOCAL_API_URL}/api/anime/${slug}`, {
      cache: 'no-store'
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (e) {
    console.error('Failed to get anime details:', e);
    return null;
  }
}

export default async function AnimeDetailsPage({ params }) {
  const resolvedParams = await params;
  const { slug } = resolvedParams;
  const anime = await getAnimeDetails(slug);

  if (!anime) {
    return (
      <main>
        <p style={{ textAlign: 'center', margin: '5rem 0', color: 'var(--text-muted)' }}>
          Detail anime tidak ditemukan atau gagal memuat data.
        </p>
      </main>
    );
  }

  return (
    <main style={{ position: 'relative' }}>
      {/* Dynamic Ambiance Background from Cover Thumbnail */}
      {anime.thumb && (
        <div
          className="detail-backdrop-bg"
          style={{
            backgroundImage: `url(/api/img?url=${encodeURIComponent(anime.thumb)})`
          }}
        />
      )}

      <div className="detail-container" style={{ position: 'relative', zIndex: 1 }}>
        <div className="detail-sidebar">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={anime.thumb ? `/api/img?url=${encodeURIComponent(anime.thumb)}` : '/placeholder.svg'} alt={anime.title} className="detail-thumb" />
          
          <div className="info-box">
            {Object.entries(anime.info).map(([key, value]) => (
              <div key={key} className="info-item">
                <span className="info-label">{key}</span>
                <span className="info-value">{value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="detail-main">
          <h1 className="detail-title">{anime.title}</h1>
          
          {anime.sinopsis && (
            <div>
              <h2 className="section-title">Sinopsis</h2>
              <SynopsisBox htmlContent={anime.sinopsis} />
            </div>
          )}

          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
            <BookmarkButton anime={anime} />

            {anime.batchSlug && (
              <Link href={`/batch/${anime.batchSlug}`} className="btn-candy" style={{ display: 'inline-flex' }}>
                <svg fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style={{width: '20px', height: '20px'}}>
                  <path fillRule="evenodd" d="M12 2.25a.75.75 0 01.75.75v11.69l3.22-3.22a.75.75 0 111.06 1.06l-4.5 4.5a.75.75 0 01-1.06 0l-4.5-4.5a.75.75 0 111.06-1.06l3.22 3.22V3a.75.75 0 01.75-.75zm-9 13.5a.75.75 0 01.75.75v2.25a1.5 1.5 0 001.5 1.5h13.5a1.5 1.5 0 001.5-1.5V16.5a.75.75 0 011.5 0v2.25a3 3 0 01-3 3H5.25a3 3 0 01-3-3V16.5a.75.75 0 01.75-.75z" clipRule="evenodd" />
                </svg>
                Download Batch Full Episode
              </Link>
            )}
          </div>

          {/* Automatic Kusonime Batch Finder Link */}
          <KusonimeBatchLink animeTitle={anime.title} />

          <div style={{ marginBottom: '2.5rem' }}>
            <h2 className="section-title">Daftar Episode</h2>
            {anime.episodes.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Belum ada episode yang dirilis.</p>
            ) : (
              <EpisodeBox episodes={anime.episodes} animeTitle={anime.title} anime={anime} />
            )}
          </div>

          {/* Smart Recommendations Section */}
          {anime.recommendations && anime.recommendations.length > 0 && (
            <div style={{ marginTop: '1.5rem' }}>
              <AnimeGrid title="Rekomendasi Anime Serupa" items={anime.recommendations} />
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
