import Link from 'next/link';

export default function AnimeGrid({ title, items, moreLink, isBatch }) {
  if (!items || items.length === 0) {
    return null;
  }

  return (
    <div className="section-wrapper">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <h2 className="section-title" style={{ marginBottom: 0, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</h2>
        {moreLink && (
          <Link href={moreLink} className="btn-download" style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem', borderRadius: '8px' }}>
            LIHAT SELENGKAPNYA &raquo;
          </Link>
        )}
      </div>
      <div className="anime-grid">
        {items.map((item, idx) => {
          const detailUrl = isBatch ? `/batch/kuso/${item.slug}` : `/anime/${item.slug}`;
          return (
            <Link
              key={item.slug || idx}
              href={detailUrl}
              className="anime-card"
              style={isBatch ? { borderColor: 'var(--color-accent)' } : {}}
            >
              <div className="card-img-wrapper">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.thumb ? `/api/img?url=${encodeURIComponent(item.thumb)}` : '/placeholder.svg'}
                  alt={item.title}
                  className="card-img"
                  loading="lazy"
                />
                {isBatch ? (
                  <div className="card-badge">
                    📦 BATCH
                  </div>
                ) : (
                  <>
                    {item.ep && (
                      <div className="card-badge">
                        {item.ep}
                      </div>
                    )}
                  </>
                )}
              </div>
              <div className="card-info">
                <h3 className="card-title" title={item.title}>
                  {item.title}
                </h3>
                <div className="card-meta" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  {item.dayOrRating && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', color: '#ffd54f' }}>
                      {/^\d+(\.\d+)?$/.test(item.dayOrRating) && (
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="#ffd54f" stroke="#ffd54f" strokeWidth="1" style={{ flexShrink: 0 }}>
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                        </svg>
                      )}
                      <span style={{ color: 'var(--text-muted)' }}>{item.dayOrRating}</span>
                    </span>
                  )}
                  {item.date && (
                    <span>
                      <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style={{width: '12px', height: '12px'}}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                      {item.date}
                    </span>
                  )}
                  {(item.source === 'Oploverz' || (item.slug && item.slug.startsWith('oploverz-'))) && (
                    <span style={{
                      fontSize: '0.65rem',
                      backgroundColor: 'rgba(6, 182, 212, 0.1)',
                      color: 'var(--color-accent)',
                      padding: '0.15rem 0.4rem',
                      borderRadius: '4px',
                      fontWeight: '700',
                      border: '1px solid rgba(6, 182, 212, 0.2)'
                    }}>
                      OPLOVERZ
                    </span>
                  )}
                  {(item.source === 'Alqanime' || (item.slug && item.slug.startsWith('alqanime-'))) && (
                    <span style={{
                      fontSize: '0.65rem',
                      backgroundColor: 'rgba(108, 92, 231, 0.1)',
                      color: 'var(--color-accent)',
                      padding: '0.15rem 0.4rem',
                      borderRadius: '4px',
                      fontWeight: '700',
                      border: '1px solid rgba(108, 92, 231, 0.2)'
                    }}>
                      ALQANIME
                    </span>
                  )}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
