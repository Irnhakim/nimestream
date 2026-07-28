import Link from 'next/link';
import { getLatestKusonime } from '@/lib/kusonimeScraper';

export default async function BatchAnimePage({ searchParams }) {
  const resolvedSearchParams = await searchParams;
  const page = resolvedSearchParams.page || '1';
  const pageNum = parseInt(page, 10);

  const items = await getLatestKusonime(pageNum);

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
                  style={{ border: '1px solid rgba(176, 92, 255, 0.15)' }}
                >
                  <div className="card-img-wrapper">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.thumb ? `/api/img?url=${encodeURIComponent(item.thumb)}` : '/placeholder.svg'}
                      alt={item.title}
                      className="card-img"
                      loading="lazy"
                    />
                    <div className="card-badge" style={{ background: 'linear-gradient(135deg, var(--color-candy-purple), var(--color-candy-pink))' }}>
                      📦 BATCH
                    </div>
                  </div>
                  <div className="card-info">
                    <h3 className="card-title" title={item.title}>
                      {item.title}
                    </h3>
                    <div className="card-meta">
                      <span>Batch</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '3rem' }}>
              {pageNum > 1 && (
                <Link
                  href={`/batch-list?page=${pageNum - 1}`}
                  className="btn-download"
                  style={{ padding: '0.5rem 1.25rem', borderRadius: '8px' }}
                >
                  &laquo; SEBELUMNYA
                </Link>
              )}
              <Link
                href={`/batch-list?page=${pageNum + 1}`}
                className="btn-download"
                style={{ padding: '0.5rem 1.25rem', borderRadius: '8px' }}
              >
                SELANJUTNYA &raquo;
              </Link>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
