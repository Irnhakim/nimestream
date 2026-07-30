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
    <div className="section-wrapper" style={{ marginTop: '2rem', paddingBottom: '0.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <h2 className="section-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-candy-cyan)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
            <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Lanjutkan Menonton
        </h2>
        <Link 
          href="/riwayat" 
          className="btn-mirror" 
          style={{ 
            padding: '0.35rem 0.75rem', 
            fontSize: '0.75rem', 
            borderColor: 'rgba(255,255,255,0.05)',
            backgroundColor: 'rgba(255,255,255,0.02)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.25rem'
          }}
        >
          Lihat Semua 
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>

      <div 
        style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
          gap: '1rem'
        }}
        className="resume-grid-mobile"
      >
        {history.map((item, idx) => (
          <Link
            key={idx}
            href={`/episode/${item.slug}`}
            className="anime-card"
            style={{ 
              border: '1px solid rgba(176, 92, 255, 0.08)',
              backgroundColor: 'rgba(15, 16, 32, 0.4)'
            }}
          >
            <div className="card-img-wrapper" style={{ aspectRatio: '3/4', height: 'auto' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.thumb ? `/api/img?url=${encodeURIComponent(item.thumb)}` : '/placeholder.svg'}
                alt={item.animeTitle}
                className="card-img"
                loading="lazy"
                style={{ objectPosition: 'center 20%', height: '100%' }}
              />
              <div className="card-badge" style={{ background: 'linear-gradient(135deg, var(--color-candy-purple), var(--color-candy-pink))', fontSize: '0.65rem', padding: '0.1rem 0.35rem' }}>
                {item.episodeTitle}
              </div>
            </div>
            <div className="card-info" style={{ padding: '0.65rem 0.75rem' }}>
              <h4 
                className="card-title" 
                title={item.animeTitle}
                style={{ 
                  fontSize: '0.8rem', 
                  minHeight: '2.5rem',
                  lineHeight: '1.25',
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  marginBottom: '0.4rem'
                }}
              >
                {item.animeTitle}
              </h4>
              <div className="card-meta" style={{ fontSize: '0.65rem', display: 'flex', justifyContent: 'flex-end', marginTop: '0.2rem' }}>
                <span style={{ color: 'var(--color-candy-cyan)', fontWeight: '700' }}>Lanjut &raquo;</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
