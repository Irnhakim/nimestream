import Link from 'next/link';
import { LOCAL_API_URL } from '@/lib/scraper';

async function getOngoingAnimeList(page = 1) {
  try {
    const res = await fetch(`${LOCAL_API_URL}/api/ongoing-list?page=${page}`, {
      cache: 'no-store'
    });
    if (!res.ok) return { items: [], pagination: [] };
    return await res.json();
  } catch (e) {
    console.error('Failed to get ongoing anime:', e);
    return { items: [], pagination: [] };
  }
}

export default async function OngoingAnimePage({ searchParams }) {
  const resolvedParams = await searchParams;
  const page = resolvedParams.page || '1';
  const { items, pagination } = await getOngoingAnimeList(page);

  return (
    <main>
      <div className="section-wrapper">
        <h1 className="section-title">On-Going Anime Terbaru</h1>
        
        {items.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', marginTop: '2rem' }}>Gagal memuat daftar anime ongoing.</p>
        ) : (
          <>
            <div className="anime-grid">
              {items.map((item, idx) => (
                <Link key={idx} href={`/anime/${item.slug}`} className="anime-card">
                  <div className="card-img-wrapper">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.thumb}
                      alt={item.title}
                      className="card-img"
                      loading="lazy"
                    />
                    {item.ep && (
                      <div className="card-badge">
                        {item.ep}
                      </div>
                    )}
                    {item.dayOrRating && (
                      <div className="card-badge-sub">
                        {item.dayOrRating}
                      </div>
                    )}
                  </div>
                  <div className="card-info">
                    <h3 className="card-title" title={item.title}>
                      {item.title}
                    </h3>
                    <div className="card-meta">
                      {item.date && (
                        <span>
                          <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style={{width: '12px', height: '12px'}}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                          </svg>
                          {item.date}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Pagination Controls */}
            {pagination.length > 0 && (
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                flexWrap: 'wrap',
                gap: '0.5rem',
                marginTop: '3rem'
              }}>
                {pagination.map((pag, idx) => {
                  if (!pag.page) {
                    return (
                      <span
                        key={idx}
                        className="btn-mirror active"
                        style={{ padding: '0.5rem 1rem', cursor: 'default' }}
                      >
                        {pag.text}
                      </span>
                    );
                  }
                  return (
                    <Link
                      key={idx}
                      href={`/ongoing-anime?page=${pag.page}`}
                      className="btn-mirror"
                      style={{
                        padding: '0.5rem 1rem',
                        backgroundColor: pag.active ? 'var(--color-candy-pink)' : 'rgba(255,255,255,0.04)',
                        borderColor: pag.active ? 'var(--color-candy-pink)' : 'rgba(255,255,255,0.05)'
                      }}
                    >
                      {pag.text.replace('&raquo;', '»').replace('&laquo;', '«')}
                    </Link>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
