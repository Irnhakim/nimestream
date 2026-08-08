'use client';

import { useState, useEffect } from 'react';

export default function KusonimeBatchLink({ animeTitle }) {
  const [batchDetails, setBatchDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [kusoEnabled, setKusoEnabled] = useState(false);

  useEffect(() => {
    setKusoEnabled(process.env.NEXT_PUBLIC_KUSONIME_ENABLED === 'true');
  }, []);

  useEffect(() => {
    if (!animeTitle || process.env.NEXT_PUBLIC_KUSONIME_ENABLED !== 'true') return;

    // Clean anime title to maximize search matching
    const cleanTitle = animeTitle
      .replace(/subtitle indonesia/gi, '')
      .replace(/sub indo/gi, '')
      .replace(/season \d+/gi, '')
      .replace(/s\d+/gi, '')
      .trim();

    if (!cleanTitle) return;

    setLoading(true);
    fetch(`/api/kusonime/search?q=${encodeURIComponent(cleanTitle)}`)
      .then(res => (res.ok ? res.json() : []))
      .then(data => {
        if (data && data.length > 0) {
          // Verify strict title similarity
          const targetNorm = cleanTitle.toLowerCase().replace(/[^a-z0-9]/g, '');
          const match = data.find(item => {
            const itemNorm = (item.title || '').toLowerCase()
              .replace(/subtitle indonesia|sub indo|season \d+|s\d+/gi, '')
              .replace(/[^a-z0-9]/g, '');
            // Both must share a strong title overlap
            return itemNorm.includes(targetNorm) || targetNorm.includes(itemNorm);
          });
          
          if (match) {
            // Fetch full batch details containing the direct download links
            return fetch(`/api/kusonime/detail/${match.slug}`);
          }
        }
        return null;
      })
      .then(res => (res && res.ok ? res.json() : null))
      .then(details => {
        setBatchDetails(details);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [animeTitle]);

  if (!kusoEnabled) return null;
  if (loading) return <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Mencari link batch download...</p>;
  if (!batchDetails || !batchDetails.downloads || batchDetails.downloads.length === 0) return null;

  return (
    <div style={{ marginBottom: '2rem' }}>
      <h2 className="section-title">Batch Download (Mirror)</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {batchDetails.downloads.map((dlBlock, idx) => (
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
    </div>
  );
}
