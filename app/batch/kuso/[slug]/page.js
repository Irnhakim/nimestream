import Link from 'next/link';
import { LOCAL_API_URL } from '@/lib/scraper';

async function getKusonimeDetails(slug) {
  try {
    const res = await fetch(`${LOCAL_API_URL}/api/kusonime/detail/${slug}`, {
      cache: 'no-store'
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (e) {
    console.error('Failed to get Kusonime details:', e);
    return null;
  }
}

export default async function KusonimeBatchPage({ params }) {
  const resolvedParams = await params;
  const { slug } = resolvedParams;
  const anime = await getKusonimeDetails(slug);

  if (!anime) {
    return (
      <main>
        <p style={{ textAlign: 'center', margin: '5rem 0', color: 'var(--text-muted)' }}>
          Detail batch anime Kusonime tidak ditemukan atau gagal memuat data.
        </p>
      </main>
    );
  }

  return (
    <main>
      <div className="detail-container">
        <div className="detail-sidebar">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img 
            src={anime.thumb ? `/api/img?url=${encodeURIComponent(anime.thumb)}` : '/placeholder.svg'} 
            alt={anime.title} 
            className="detail-thumb" 
          />
          
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
            <h2 className="section-title">Daftar Link Download Batch</h2>
            {anime.downloads.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Belum ada link download batch yang tersedia.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {anime.downloads.map((dlBlock, idx) => (
                  <div 
                    key={idx} 
                    style={{ 
                      backgroundColor: 'var(--bg-card)', 
                      borderRadius: '14px', 
                      border: '1px solid rgba(176, 92, 255, 0.15)',
                      overflow: 'hidden'
                    }}
                  >
                    <div style={{ 
                      padding: '0.75rem 1rem', 
                      background: 'rgba(176, 92, 255, 0.08)',
                      borderBottom: '1px solid rgba(176, 92, 255, 0.15)',
                      fontWeight: '700',
                      fontSize: '0.9rem',
                      color: 'var(--text-main)'
                    }}>
                      📦 {dlBlock.title}
                    </div>
                    <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {dlBlock.links.map((linkRow, lIdx) => (
                        <div 
                          key={lIdx} 
                          style={{ 
                            display: 'flex', 
                            flexDirection: 'column', 
                            gap: '0.4rem',
                            borderBottom: lIdx === dlBlock.links.length - 1 ? 'none' : '1px solid rgba(255,255,255,0.03)',
                            paddingBottom: lIdx === dlBlock.links.length - 1 ? '0' : '0.75rem'
                          }}
                        >
                          <span style={{ 
                            fontSize: '0.8rem', 
                            fontWeight: '700', 
                            color: 'var(--color-candy-pink)' 
                          }}>
                            {linkRow.quality}
                          </span>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                            {linkRow.servers.map((srv, sIdx) => (
                              <a
                                key={sIdx}
                                href={srv.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn-download"
                                style={{ 
                                  fontSize: '0.75rem', 
                                  padding: '0.35rem 0.75rem',
                                  transition: 'var(--transition-smooth)'
                                }}
                              >
                                🔗 {srv.server}
                              </a>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
