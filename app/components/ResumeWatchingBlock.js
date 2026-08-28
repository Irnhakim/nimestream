'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function ResumeWatchingBlock() {
  const [history, setHistory] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const historyStr = localStorage.getItem('ns_watch_history');
      if (historyStr) {
        const parsed = JSON.parse(historyStr);
        if (Array.isArray(parsed)) {
          // Take the 5 most recently watched items
          setHistory(parsed.slice(0, 5));
        }
      }
    } catch (e) {
      console.error(e);
    }
    setLoaded(true);
  }, []);

  if (!loaded || history.length === 0) return null;

  return (
    <div className="section-wrapper resume-section">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
        <h2 className="section-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-turquoise)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
            <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Lanjutkan Menonton
        </h2>
        <Link
          href="/riwayat"
          className="btn-mirror"
          style={{
            padding: '0.3rem 0.6rem',
            fontSize: '0.7rem',
            borderColor: 'rgba(255,255,255,0.05)',
            backgroundColor: 'rgba(255,255,255,0.02)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.2rem'
          }}
        >
          Semua
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>

      <div className="resume-grid">
        {history.map((item, idx) => (
          <Link
            key={idx}
            href={`/episode/${item.slug}`}
            className="anime-card resume-card"
          >
            <div className="card-img-wrapper">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.thumb ? `/api/img?url=${encodeURIComponent(item.thumb)}` : '/placeholder.svg'}
                alt={item.animeTitle}
                className="card-img"
                loading="lazy"
                style={{ objectPosition: 'center 20%' }}
              />
              <div className="card-badge resume-badge">
                {item.episodeTitle}
              </div>
            </div>
            <div className="card-info">
              <h4 className="card-title" title={item.animeTitle}>
                {item.animeTitle}
              </h4>
              <div className="card-meta">
                <span className="resume-next-btn">Lanjut &raquo;</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
