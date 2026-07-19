import Link from 'next/link';

export default function AnimeGrid({ title, items, moreLink }) {
  if (!items || items.length === 0) {
    return null;
  }

  return (
    <div className="section-wrapper">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <h2 className="section-title" style={{ marginBottom: 0 }}>{title}</h2>
        {moreLink && (
          <Link href={moreLink} className="btn-download" style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem', borderRadius: '8px' }}>
            {title.includes('On-Going') ? 'CEK ANIME ON-GOING LAINNYA' : 'CEK ANIME SELESAI LAINNYA'} &raquo;
          </Link>
        )}
      </div>
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
    </div>
  );
}
