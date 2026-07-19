import Link from 'next/link';
import { LOCAL_API_URL } from '@/lib/scraper';

async function performSearch(query) {
  try {
    const res = await fetch(`${LOCAL_API_URL}/api/search?q=${encodeURIComponent(query)}`, {
      cache: 'no-store'
    });
    if (!res.ok) return [];
    return await res.json();
  } catch (e) {
    console.error('Search failed:', e);
    return [];
  }
}

export default async function SearchPage({ searchParams }) {
  const params = await searchParams;
  const query = params.q || '';
  const results = query ? await performSearch(query) : [];

  return (
    <main>
      <div className="section-wrapper">
        <h2 className="section-title">Hasil Pencarian: &quot;{query}&quot;</h2>
        
        {results.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', marginTop: '1.5rem' }}>
            Tidak ada anime yang ditemukan untuk kata kunci tersebut. Silakan coba kata kunci lain.
          </p>
        ) : (
          <div className="anime-grid">
            {results.map((item, idx) => (
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
                  <div className="card-meta">
                    <span>
                      {item.status}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
