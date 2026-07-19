import Link from 'next/link';

async function getAnimeList() {
  try {
    const res = await fetch('http://localhost:3000/api/animelist', {
      next: { revalidate: 600 }
    });
    if (!res.ok) return {};
    return await res.json();
  } catch (e) {
    console.error('Failed to get anime list:', e);
    return {};
  }
}

export default async function AnimeListPage() {
  const list = await getAnimeList();
  const letters = Object.keys(list).sort();

  return (
    <main>
      <div className="section-wrapper">
        <h1 className="section-title">Anime List</h1>
        
        {/* Letter Quick Nav */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.5rem',
          marginBottom: '2.5rem',
          padding: '1rem',
          backgroundColor: 'var(--bg-card)',
          borderRadius: '12px',
          border: '1px solid rgba(255, 255, 255, 0.03)'
        }}>
          {letters.map((char) => (
            <a
              key={char}
              href={`#char-${char}`}
              className="btn-mirror"
              style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
            >
              {char}
            </a>
          ))}
        </div>

        {/* Alphabetical Listing */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
          {letters.map((char) => (
            <div key={char} id={`char-${char}`} style={{ scrollMarginTop: '100px' }}>
              <h2 style={{
                fontSize: '1.8rem',
                fontWeight: '800',
                color: 'var(--color-candy-pink)',
                borderBottom: '2px solid rgba(255, 96, 151, 0.2)',
                paddingBottom: '0.5rem',
                marginBottom: '1rem'
              }}>
                {char}
              </h2>
              
              <div className="anime-list-grid">
                {list[char].map((anime, idx) => (
                  <Link
                    key={idx}
                    href={`/anime/${anime.slug}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '0.75rem 1rem',
                      backgroundColor: 'var(--bg-card)',
                      borderRadius: '8px',
                      border: '1px solid rgba(255, 255, 255, 0.02)',
                      fontSize: '0.9rem',
                      fontWeight: '500',
                      transition: 'var(--transition-smooth)'
                    }}
                    className="anime-list-item-link"
                  >
                    <span style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--color-candy-cyan)',
                      marginRight: '0.75rem',
                      flexShrink: 0
                    }}></span>
                    <span style={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {anime.title}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <style>{`
        .anime-list-item-link:hover {
          border-color: var(--color-candy-purple) !important;
          transform: translateY(-2px);
          color: var(--color-candy-cyan);
          box-shadow: 0 4px 12px rgba(176, 92, 255, 0.1);
        }
      `}</style>
    </main>
  );
}
