'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function RiwayatPageClient() {
  const [history, setHistory] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const historyStr = localStorage.getItem('ns_watch_history');
      if (historyStr) {
        setHistory(JSON.parse(historyStr));
      }
    } catch (e) {
      console.error(e);
    }
    setLoaded(true);
  }, []);

  const handleClearAll = () => {
    if (confirm('Apakah Anda yakin ingin menghapus seluruh riwayat tontonan?')) {
      localStorage.removeItem('ns_watch_history');
      setHistory([]);
    }
  };

  const handleDeleteItem = (slugToDelete) => {
    const updated = history.filter(item => item.slug !== slugToDelete);
    setHistory(updated);
    localStorage.setItem('ns_watch_history', JSON.stringify(updated));
  };

  if (!loaded) {
    return (
      <div className="section-wrapper" style={{ minHeight: '50vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--text-muted)' }}>Memuat riwayat...</p>
      </div>
    );
  }

  return (
    <div className="section-wrapper">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '2.5rem' }}>
        <div>
          <h1 className="section-title" style={{ marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>🕒</span> Riwayat Tontonan
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Daftar anime yang baru saja Anda tonton (data disimpan secara lokal di perangkat Anda).
          </p>
        </div>
        
        {history.length > 0 && (
          <button 
            onClick={handleClearAll}
            className="btn-download"
            style={{ 
              backgroundColor: 'rgba(255, 96, 151, 0.1)', 
              borderColor: 'rgba(255, 96, 151, 0.3)',
              color: 'var(--color-candy-pink)',
              padding: '0.5rem 1rem',
              fontSize: '0.8rem',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            🗑️ Hapus Semua
          </button>
        )}
      </div>

      {/* List Layout */}
      {history.length === 0 ? (
        <div 
          style={{ 
            backgroundColor: 'var(--bg-card)', 
            border: '1px solid rgba(255, 255, 255, 0.03)', 
            borderRadius: '16px',
            padding: '4rem 2rem',
            textAlign: 'center',
            color: 'var(--text-muted)'
          }}
        >
          <span style={{ fontSize: '3rem', display: 'block', marginBottom: '1rem' }}>📺</span>
          <p style={{ fontWeight: '600', marginBottom: '0.5rem' }}>Belum ada riwayat tontonan.</p>
          <p style={{ fontSize: '0.8rem', opacity: 0.8 }}>Silakan buka episode streaming anime untuk mulai merekam riwayat.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {history.map((item, idx) => {
            // Format full date time display: DD/M/YYYY, HH.MM.SS
            const watchedDate = new Date(item.watchedAt);
            const dateStr = `${watchedDate.getDate()}/${watchedDate.getMonth() + 1}/${watchedDate.getFullYear()}, ${String(watchedDate.getHours()).padStart(2, '0')}.${String(watchedDate.getMinutes()).padStart(2, '0')}.${String(watchedDate.getSeconds()).padStart(2, '0')}`;

            return (
              <div 
                key={idx}
                style={{ 
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1.25rem',
                  padding: '1rem',
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid rgba(176, 92, 255, 0.15)',
                  borderRadius: '12px',
                  position: 'relative',
                  transition: 'var(--transition-smooth)'
                }}
                className="history-list-row"
              >
                {/* Anime Cover (Portrait Layout) */}
                <div 
                  style={{ 
                    width: '140px', 
                    height: '80px', 
                    borderRadius: '8px', 
                    overflow: 'hidden', 
                    flexShrink: 0,
                    position: 'relative'
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.thumb ? `/api/img?url=${encodeURIComponent(item.thumb)}` : '/placeholder.svg'}
                    alt={item.animeTitle}
                    style={{ 
                      width: '100%', 
                      height: '100%', 
                      objectFit: 'cover',
                      objectPosition: 'center 20%'
                    }}
                    loading="lazy"
                  />
                </div>

                {/* Middle Info Details */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 
                    style={{ 
                      fontSize: '0.95rem', 
                      fontWeight: '700', 
                      color: 'var(--text-main)',
                      marginBottom: '0.35rem',
                      lineHeight: '1.3',
                      wordBreak: 'break-word',
                      marginTop: '0.2rem'
                    }}
                  >
                    {item.animeTitle} {item.episodeTitle}
                  </h3>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {item.episodeTitle} <span style={{ opacity: 0.5 }}>·</span> Baru ditonton
                    </p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', opacity: 0.8 }}>
                      {dateStr}
                    </p>
                  </div>
                </div>

                {/* Right Actions */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'center', minWidth: '95px', flexShrink: 0 }}>
                  <Link 
                    href={`/episode/${item.slug}`}
                    className="btn-mirror"
                    style={{
                      padding: '0.45rem 1rem',
                      fontSize: '0.8rem',
                      fontWeight: '700',
                      borderRadius: '8px',
                      backgroundColor: 'white',
                      borderColor: 'white',
                      color: 'black',
                      textAlign: 'center',
                      width: '100%',
                      boxShadow: '0 4px 12px rgba(255, 255, 255, 0.1)'
                    }}
                  >
                    Lanjutkan
                  </Link>

                  <button
                    onClick={() => handleDeleteItem(item.slug)}
                    style={{
                      backgroundColor: 'transparent',
                      border: 'none',
                      color: 'var(--text-muted)',
                      fontSize: '0.8rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'color 0.2s',
                      padding: '0.25rem'
                    }}
                    onMouseEnter={(e) => e.target.style.color = 'var(--color-candy-pink)'}
                    onMouseLeave={(e) => e.target.style.color = 'var(--text-muted)'}
                  >
                    Hapus
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function formatTimeAgo(isoString) {
  try {
    const diffMs = Date.now() - new Date(isoString).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Baru saja';
    if (diffMins < 60) return `${diffMins}m yang lalu`;
    if (diffHours < 24) return `${diffHours}jam yang lalu`;
    return `${diffDays} hari lalu`;
  } catch (e) {
    return 'Baru saja';
  }
}
