import Link from 'next/link';
import { LOCAL_API_URL } from '@/lib/scraper';

async function getGenres() {
  try {
    const res = await fetch(`${LOCAL_API_URL}/api/genres`, {
      cache: 'no-store'
    });
    if (!res.ok) return [];
    return await res.json();
  } catch (e) {
    console.error('Failed to get genres:', e);
    return [];
  }
}

export default async function GenreListPage() {
  const genres = await getGenres();

  return (
    <main>
      <div className="section-wrapper">
        <h1 className="section-title">Genre List</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '2rem' }}>
          Temukan anime berdasarkan kategori atau genre favorit Anda.
        </p>

        <div className="genre-grid">
          {genres.map((g, idx) => (
            <Link
              key={idx}
              href={`/genres/${g.slug}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '1.25rem 1rem',
                backgroundColor: 'var(--bg-card)',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.03)',
                fontSize: '0.95rem',
                fontWeight: '600',
                textAlign: 'center',
                transition: 'var(--transition-smooth)'
              }}
              className="genre-item-card"
            >
              {g.title}
            </Link>
          ))}
        </div>
      </div>

      <style>{`
        .genre-item-card:hover {
          border-color: var(--color-candy-cyan) !important;
          color: var(--color-candy-cyan);
          transform: scale(1.04);
          box-shadow: 0 8px 20px rgba(60, 212, 255, 0.15);
        }
      `}</style>
    </main>
  );
}
