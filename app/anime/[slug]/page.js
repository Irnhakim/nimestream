import Link from 'next/link';

async function getAnimeDetails(slug) {
  try {
    const res = await fetch(`http://localhost:3000/api/anime/${slug}`, {
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
    <main>
      <div className="detail-container">
        <div className="detail-sidebar">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={anime.thumb} alt={anime.title} className="detail-thumb" />
          
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
              <div className="synopsis-box">
                <p>{anime.sinopsis}</p>
              </div>
            </div>
          )}

          <div>
            <h2 className="section-title">Daftar Episode</h2>
            <div className="episode-list">
              {anime.episodes.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Belum ada episode yang dirilis.</p>
              ) : (
                anime.episodes.map((ep, idx) => (
                  <Link key={idx} href={`/episode/${ep.slug}`} className="episode-item">
                    <span className="episode-title">{ep.title}</span>
                    <span className="episode-date">{ep.date}</span>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
