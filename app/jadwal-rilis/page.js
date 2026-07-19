import Link from 'next/link';

async function getJadwalRilis() {
  try {
    const res = await fetch('http://localhost:3000/api/jadwal', {
      next: { revalidate: 600 }
    });
    if (!res.ok) return {};
    return await res.json();
  } catch (e) {
    console.error('Failed to get schedule:', e);
    return {};
  }
}

export default async function JadwalRilisPage() {
  const schedule = await getJadwalRilis();
  
  // Custom sorting for Indonesian days
  const dayOrder = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu', 'Random'];
  const sortedDays = Object.keys(schedule).sort((a, b) => {
    return dayOrder.indexOf(a) - dayOrder.indexOf(b);
  });

  return (
    <main>
      <div className="section-wrapper">
        <h1 className="section-title">Jadwal Rilis Anime On-Going</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '2rem' }}>
          Berikut adalah jadwal rilis mingguan untuk anime yang sedang tayang (on-going).
        </p>

        <div className="schedule-grid">
          {sortedDays.map((day) => (
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
                {schedule[day].map((anime, idx) => (
                  <Link
                    key={idx}
                    href={`/anime/${anime.slug}`}
                    style={{
                      display: 'block',
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
                    {anime.title}
                  </Link>
                ))}
              </div>
            </div>
          ))}
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
