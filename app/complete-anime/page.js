import Link from 'next/link';
import { LOCAL_API_URL } from '@/lib/scraper';

async function getCompleteAnimeList(page = 1) {
  try {
    const res = await fetch(`${LOCAL_API_URL}/api/complete-anime?page=${page}`, {
      cache: 'no-store'
    });
    if (!res.ok) return { items: [], pagination: [] };
    return await res.json();
  } catch (e) {
    console.error('Failed to get complete anime:', e);
    return { items: [], pagination: [] };
  }
}

export const metadata = {
  title: 'Anime Completed / Tamat Terbaru - NimeStream',
  description: 'Daftar anime yang sudah tamat (completed) subtitle Indonesia dengan kualitas terbaik dan link streaming lengkap di NimeStream.'
};

export default async function CompleteAnimePage({ searchParams }) {
  const resolvedParams = await searchParams;
  const page = resolvedParams.page || '1';
  const { items, pagination } = await getCompleteAnimeList(page);

  return (
    <main>
      <div className="section-wrapper">
        <h1 className="section-title">Anime Completed (Tamat) Terbaru</h1>
        
        {items.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', marginTop: '2rem' }}>Gagal memuat daftar anime completed.</p>
        ) : (
          <>
            <div className="anime-grid">
              {items.map((item, idx) => (
                <Link key={idx} href={`/anime/${item.slug}`} className="anime-card">
                  <div className="card-img-wrapper">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.thumb ? `/api/img?url=${encodeURIComponent(item.thumb)}` : '/placeholder.svg'}
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
                        ⭐ {item.dayOrRating}
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
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
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
            {pagination && pagination.length > 1 && (
              <div className="pagination-wrapper" style={{ marginTop: '2.5rem', display: 'flex', justifyContent: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                {pagination.map((p, i) => {
                  if (p.active) {
                    return (
                      <span key={i} className="pagination-btn active">
                        {p.text}
                      </span>
                    );
                  }
                  if (!p.page) {
                    return (
                      <span key={i} className="pagination-ellipsis">
                        {p.text}
                      </span>
                    );
                  }
                  return (
                    <Link
                      key={i}
                      href={`/complete-anime?page=${p.page}`}
                      className="pagination-btn"
                    >
                      {p.text}
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
