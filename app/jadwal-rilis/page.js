import Link from 'next/link';
import { LOCAL_API_URL } from '@/lib/scraper';

async function getJadwalRilis() {
  try {
    const res = await fetch(`${LOCAL_API_URL}/api/jadwal`, { cache: 'no-store' });
    if (!res.ok) return {};
    return await res.json();
  } catch (e) {
    console.error('Failed to get schedule:', e);
    return {};
  }
}

async function getJikanTimes() {
  try {
    const res = await fetch(`${LOCAL_API_URL}/api/jadwal-waktu`, {
      cache: 'no-store'
    });
    if (!res.ok) return {};
    return await res.json();
  } catch (e) {
    console.error('Failed to get jikan times:', e);
    return {};
  }
}

// Normalize title for fuzzy matching
function normalizeTitle(title) {
  if (!title) return '';
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Find broadcast time by fuzzy title match
function findTime(animeTitle, jikanDay) {
  if (!jikanDay || jikanDay.length === 0) return null;
  const normalized = normalizeTitle(animeTitle);

  // Try to find a match in AniList data
  const match = jikanDay.find(j => {
    const jNorm = normalizeTitle(j.title);
    const jNormId = j.titleId ? normalizeTitle(j.titleId) : '';
    
    // Check if titles match directly
    if (jNorm === normalized || jNormId === normalized) return true;
    if (jNorm.includes(normalized) || normalized.includes(jNorm)) return true;
    
    // Word overlap check (at least 1 word matches if it's long, or 2 words otherwise)
    const words = normalized.split(' ').filter(w => w.length > 3);
    const jWords = jNorm.split(' ').filter(w => w.length > 3);
    if (words.length === 0) return false;
    const matches = words.filter(w => jWords.includes(w));
    return matches.length >= 1;
  });

  if (!match || !match.time) return null;
  return match.time; // Already converted to WIB in the backend API
}

export default async function JadwalRilisPage() {
  const [schedule, jikanTimes] = await Promise.all([getJadwalRilis(), getJikanTimes()]);

  const dayOrder = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu', 'Random'];
  const sortedDays = Object.keys(schedule).sort((a, b) => {
    return dayOrder.indexOf(a) - dayOrder.indexOf(b);
  });

  return (
    <main>
      <div className="section-wrapper">
        <h1 className="section-title">Jadwal Rilis Anime On-Going</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
          Berikut adalah jadwal rilis mingguan untuk anime yang sedang tayang (on-going).
        </p>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-candy-purple)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          Jam tayang dalam <strong style={{ color: 'var(--color-candy-pink)' }}>WIB (UTC+7)</strong> — diambil dari AniList. Sebagian anime mungkin tidak memiliki data jam.
        </p>

        <div className="schedule-grid">
          {sortedDays.map((day) => {
            const jikanDay = jikanTimes[day] || [];
            return (
              <div
                key={day}
                style={{
                  backgroundColor: 'var(--bg-card)',
                  borderRadius: '16px',
                  padding: '1.5rem',
                  border: '1px solid rgba(255, 255, 255, 0.03)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem',
                  boxShadow: '0 8px 20px rgba(0,0,0,0.1)'
                }}
              >
                <h2 style={{
                  fontSize: '1.25rem',
                  fontWeight: '800',
                  color: 'var(--color-candy-purple)',
                  borderBottom: '2px solid rgba(176, 92, 255, 0.2)',
                  paddingBottom: '0.4rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  {day.toUpperCase()}
                  <span style={{
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    color: 'var(--text-muted)',
                    backgroundColor: 'rgba(255,255,255,0.04)',
                    padding: '0.2rem 0.5rem',
                    borderRadius: '6px'
                  }}>
                    {schedule[day].length} Anime
                  </span>
                </h2>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {schedule[day].map((anime, idx) => {
                    const wibTime = findTime(anime.title, jikanDay);
                    return (
                      <Link
                        key={idx}
                        href={`/anime/${anime.slug}`}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '0.5rem',
                          padding: '0.6rem 0.8rem',
                          backgroundColor: 'rgba(255, 255, 255, 0.02)',
                          borderRadius: '8px',
                          fontSize: '0.85rem',
                          fontWeight: '500',
                          color: 'var(--text-main)',
                          border: '1px solid rgba(255,255,255,0.01)',
                          transition: 'var(--transition-smooth)'
                        }}
                        className="schedule-item-link"
                      >
                        <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {anime.title}
                        </span>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle', marginTop: '-2px' }}>
                            <circle cx="12" cy="12" r="10" />
                            <polyline points="12 6 12 12 16 14" />
                          </svg>
                          {" " + wibTime} WIB
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <style>{`
        .schedule-item-link:hover {
          border-color: var(--color-candy-pink) !important;
          background-color: rgba(255, 96, 151, 0.05) !important;
          color: var(--color-candy-pink);
          transform: translateX(4px);
        }
      `}</style>
    </main>
  );
}
