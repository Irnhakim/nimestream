import Link from 'next/link';

export default function AnimeGrid({ title, items }) {
  if (!items || items.length === 0) {
    return null;
  }

  return (
    <div className="section-wrapper">
      <h2 className="section-title">{title}</h2>
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
