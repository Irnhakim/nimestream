import Link from 'next/link';
import { LOCAL_API_URL } from '@/lib/scraper';

async function getGenreAnime(slug, page = 1) {
  try {
    const res = await fetch(`${LOCAL_API_URL}/api/genres/${slug}?page=${page}`, {
      cache: 'no-store'
    });
    if (!res.ok) return { items: [], pagination: [] };
    return await res.json();
  } catch (e) {
    console.error('Failed to get genre anime list:', e);
    return { items: [], pagination: [] };
  }
}

export default async function GenreCategoryPage({ params, searchParams }) {
  const resolvedParams = await params;
  const { slug } = resolvedParams;
  
  const resolvedSearchParams = await searchParams;
  const page = resolvedSearchParams.page || '1';

  const { items, pagination } = await getGenreAnime(slug, page);
  
  // Convert slug to readable genre name
  const genreName = slug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

  return (
    <main>
      <div className="section-wrapper">
        <h1 className="section-title">Genre: {genreName}</h1>
        
        {items.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', marginTop: '2rem' }}>
            Belum ada anime untuk genre ini atau gagal memuat data.
          </p>
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
                    {item.rating && (
                      <div className="card-badge" style={{ background: 'linear-gradient(135deg, var(--color-candy-cyan), var(--color-candy-purple))' }}>
                        &starf; {item.rating}
                      </div>
                    )}
                  </div>
                  <div className="card-info">
                    <h3 className="card-title" title={item.title}>
                      {item.title}
                    </h3>
                    {item.studio && (
                      <div className="card-meta">
                        <span>{item.studio}</span>
                      </div>
                    )}
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
                      href={`/genres/${slug}?page=${pag.page}`}
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
