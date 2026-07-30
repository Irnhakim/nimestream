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
        <div className="history-list-container">
          {history.map((item, idx) => {
            // Format full date time display: DD/M/YYYY, HH.MM.SS
            const watchedDate = new Date(item.watchedAt);
            const dateStr = `${watchedDate.getDate()}/${watchedDate.getMonth() + 1}/${watchedDate.getFullYear()}, ${String(watchedDate.getHours()).padStart(2, '0')}.${String(watchedDate.getMinutes()).padStart(2, '0')}.${String(watchedDate.getSeconds()).padStart(2, '0')}`;

            return (
              <div 
                key={idx}
                className="history-list-row"
              >
                {/* Anime Cover (Portrait Layout) */}
                <div className="history-row-img-wrapper">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.thumb ? `/api/img?url=${encodeURIComponent(item.thumb)}` : '/placeholder.svg'}
                    alt={item.animeTitle}
                    className="history-row-img"
                    loading="lazy"
                  />
                </div>

                {/* Middle Info Details */}
                <div className="history-row-info">
                  <h3 className="history-row-title">
                    {item.animeTitle} {item.episodeTitle}
                  </h3>

                  <div className="history-row-meta">
                    <p className="history-row-subtitle">
                      {item.episodeTitle} <span className="dot-divider">·</span> Baru ditonton
                    </p>
                    <p className="history-row-date">
                      {dateStr}
                    </p>
                  </div>
                </div>

                {/* Right Actions */}
                <div className="history-row-actions">
                  <Link 
                    href={`/episode/${item.slug}`}
                    className="btn-continue-watch"
                  >
                    Lanjutkan
                  </Link>

                  <button
                    onClick={() => handleDeleteItem(item.slug)}
                    className="btn-delete-history"
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
