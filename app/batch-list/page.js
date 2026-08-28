import Link from 'next/link';
import { getLatestKusonime } from '@/lib/kusonimeScraper';

export default async function BatchAnimePage({ searchParams }) {
  const resolvedSearchParams = await searchParams;
  const page = resolvedSearchParams.page || '1';
  const pageNum = parseInt(page, 10);

  const { items, pagination } = await getLatestKusonime(pageNum);

  return (
    <main>
      <div className="section-wrapper">
        <h1 className="section-title">Daftar Anime Batch Terbaru</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '2rem' }}>
          Daftar rilis batch anime subtitle Indonesia terlengkap dari Kusonime.
        </p>

        {items.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', marginTop: '2rem' }}>
            Tidak ada anime batch yang ditemukan atau gagal memuat data.
          </p>
        ) : (
          <>
            <div className="anime-grid">
              {items.map((item, idx) => (
                <Link
                  key={idx}
                  href={`/batch/kuso/${item.slug}`}
                  className="anime-card"
                  style={{ borderColor: 'var(--color-accent)' }}
                >
                  <div className="card-img-wrapper">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.thumb ? `/api/img?url=${encodeURIComponent(item.thumb)}` : '/placeholder.svg'}
                      alt={item.title}
                      className="card-img"
                      loading="lazy"
                    />
                    <div className="card-badge">
                      📦 BATCH
                    </div>
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

            {/* wp-pagenavi Style Pagination */}
            {pagination.length > 0 && (
              <div 
                style={{ 
                  display: 'flex', 
                  justifyContent: 'center', 
                  flexWrap: 'wrap', 
                  gap: '0.4rem', 
                  marginTop: '3.5rem' 
                }}
              >
                {pagination.map((pag, idx) => {
                  // If it's a page count info span (e.g. "Page 1 of 506")
                  if (pag.text.includes('Page') && pag.text.includes('of')) {
                    return (
                      <span
                        key={idx}
                        style={{
                          padding: '0.5rem 0.8rem',
                          fontSize: '0.8rem',
                          color: 'var(--text-muted)',
                          alignSelf: 'center'
                        }}
                      >
                        {pag.text}
                      </span>
                    );
                  }

                  // If it's active page number
                  if (pag.active) {
                    return (
                      <span
                        key={idx}
                        className="btn-mirror active"
                        style={{
                          padding: '0.5rem 0.95rem',
                          fontSize: '0.8rem',
                          fontWeight: '700',
                          backgroundColor: 'var(--color-accent)',
                          borderColor: 'var(--color-accent)',
                          color: 'white',
                          borderRadius: '8px',
                          cursor: 'default'
                        }}
                      >
                        {pag.text}
                      </span>
                    );
                  }

                  // If it's the extend (...) dots
                  if (pag.isExtend || pag.text === '...') {
                    return (
                      <span
                        key={idx}
                        style={{
                          padding: '0.5rem 0.5rem',
                          fontSize: '0.8rem',
                          color: 'var(--text-muted)',
                          alignSelf: 'flex-end'
                        }}
                      >
                        ...
                      </span>
                    );
                  }

                  // Standard page links (Next, Last, page numbers)
                  const targetPage = pag.page || '1';
                  return (
                    <Link
                      key={idx}
                      href={`/batch-list?page=${targetPage}`}
                      className="btn-mirror"
                      style={{
                        padding: '0.5rem 0.95rem',
                        fontSize: '0.8rem',
                        borderRadius: '8px',
                        backgroundColor: 'rgba(255, 255, 255, 0.03)',
                        borderColor: 'rgba(255, 255, 255, 0.05)',
                        transition: 'var(--transition-smooth)'
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
