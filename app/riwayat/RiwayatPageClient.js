'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function RiwayatPageClient() {
  const [history, setHistory] = useState([]);
  const [watchlist, setWatchlist] = useState([]);
  const [activeTab, setActiveTab] = useState('history'); // 'history' or 'watchlist'
  const [loaded, setLoaded] = useState(false);

  // Load data from localStorage
  const loadData = () => {
    try {
      const historyStr = localStorage.getItem('ns_watch_history');
      if (historyStr) {
        setHistory(JSON.parse(historyStr));
      }
      
      const watchlistStr = localStorage.getItem('ns_watchlist');
      if (watchlistStr) {
        setWatchlist(JSON.parse(watchlistStr));
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadData();
    setLoaded(true);

    // Watch for updates
    const handleWatchlistUpdate = () => {
      loadData();
    };

    window.addEventListener('watchlist-updated', handleWatchlistUpdate);
    return () => {
      window.removeEventListener('watchlist-updated', handleWatchlistUpdate);
    };
  }, []);

  const handleClearAllHistory = () => {
    if (confirm('Apakah Anda yakin ingin menghapus seluruh riwayat tontonan?')) {
      localStorage.removeItem('ns_watch_history');
      setHistory([]);
    }
  };

  const handleDeleteHistoryItem = (slugToDelete) => {
    const updated = history.filter(item => item.slug !== slugToDelete);
    setHistory(updated);
    localStorage.setItem('ns_watch_history', JSON.stringify(updated));
  };

  const handleRemoveWatchlistItem = (slugToRemove) => {
    const updated = watchlist.filter(item => item.slug !== slugToRemove);
    setWatchlist(updated);
    localStorage.setItem('ns_watchlist', JSON.stringify(updated));
  };

  if (!loaded) {
    return (
      <div className="section-wrapper" style={{ minHeight: '50vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--text-muted)' }}>Memuat data...</p>
      </div>
    );
  }

  return (
    <div className="section-wrapper">
      {/* Header and Titles */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
        <div>
          <h1 className="section-title" style={{ marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-candy-purple)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            Ruang Personal Anda
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Kelola riwayat tontonan dan daftar watchlist simpanan Anda secara instan di browser.
          </p>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
        paddingBottom: '0.75rem',
        marginBottom: '2rem'
      }}>
        <button
          onClick={() => setActiveTab('history')}
          className={`btn-mirror ${activeTab === 'history' ? 'active' : ''}`}
          style={{
            padding: '0.5rem 1.25rem',
            fontSize: '0.85rem',
            borderRadius: '9999px',
            border: '1px solid',
            borderColor: activeTab === 'history' ? 'var(--color-candy-purple)' : 'transparent',
            backgroundColor: activeTab === 'history' ? 'rgba(176, 92, 255, 0.15)' : 'transparent',
            color: activeTab === 'history' ? 'var(--color-candy-purple)' : 'var(--text-muted)',
            cursor: 'pointer',
            fontWeight: 600,
            transition: 'all 0.25s ease'
          }}
        >
          Riwayat Nonton ({history.length})
        </button>

        <button
          onClick={() => setActiveTab('watchlist')}
          className={`btn-mirror ${activeTab === 'watchlist' ? 'active' : ''}`}
          style={{
            padding: '0.5rem 1.25rem',
            fontSize: '0.85rem',
            borderRadius: '9999px',
            border: '1px solid',
            borderColor: activeTab === 'watchlist' ? 'var(--color-candy-pink)' : 'transparent',
            backgroundColor: activeTab === 'watchlist' ? 'rgba(255, 96, 151, 0.15)' : 'transparent',
            color: activeTab === 'watchlist' ? 'var(--color-candy-pink)' : 'var(--text-muted)',
            cursor: 'pointer',
            fontWeight: 600,
            transition: 'all 0.25s ease'
          }}
        >
          Watchlist Saya ({watchlist.length})
        </button>
      </div>

      {/* Content Render based on active tab */}
      {activeTab === 'history' ? (
        <div>
          {/* Action Header for History */}
          {history.length > 0 && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
              <button 
                onClick={handleClearAllHistory}
                className="btn-download"
                style={{ 
                  backgroundColor: 'rgba(255, 96, 151, 0.1)', 
                  borderColor: 'rgba(255, 96, 151, 0.3)',
                  color: 'var(--color-candy-pink)',
                  padding: '0.5rem 1rem',
                  fontSize: '0.8rem',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem'
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                </svg>
                Hapus Semua Riwayat
              </button>
            </div>
          )}

          {history.length === 0 ? (
            <div style={emptyStateStyle}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '0.5rem', opacity: 0.7 }}>
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                <line x1="8" y1="21" x2="16" y2="21" />
                <line x1="12" y1="17" x2="12" y2="21" />
              </svg>
              <p style={{ fontWeight: '600', marginBottom: '0.2rem', color: 'var(--text-main)' }}>Belum ada riwayat tontonan.</p>
              <p style={{ fontSize: '0.8rem', opacity: 0.8 }}>Silakan buka episode streaming anime untuk mulai merekam riwayat.</p>
            </div>
          ) : (
            <div className="history-list-container">
              {history.map((item, idx) => {
                const watchedDate = new Date(item.watchedAt);
                const dateStr = `${watchedDate.getDate()}/${watchedDate.getMonth() + 1}/${watchedDate.getFullYear()}, ${String(watchedDate.getHours()).padStart(2, '0')}.${String(watchedDate.getMinutes()).padStart(2, '0')}.${String(watchedDate.getSeconds()).padStart(2, '0')}`;

                return (
                  <div key={idx} className="history-list-row">
                    <div className="history-row-img-wrapper">
                      <img
                        src={item.thumb ? `/api/img?url=${encodeURIComponent(item.thumb)}` : '/placeholder.svg'}
                        alt={item.animeTitle}
                        className="history-row-img"
                        loading="lazy"
                      />
                    </div>

                    <div className="history-row-info">
                      <h3 className="history-row-title">
                        {item.animeTitle} {item.episodeTitle}
                      </h3>
                      <div className="history-row-meta">
                        <p className="history-row-subtitle">
                          {item.episodeTitle} <span className="dot-divider">·</span> Baru ditonton
                        </p>
                        <p className="history-row-date">{dateStr}</p>
                      </div>
                    </div>

                    <div className="history-row-actions">
                      <Link href={`/episode/${item.slug}`} className="btn-continue-watch">
                        Lanjutkan
                      </Link>
                      <button onClick={() => handleDeleteHistoryItem(item.slug)} className="btn-delete-history">
                        Hapus
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* Watchlist Tab View */
        <div>
          {watchlist.length === 0 ? (
            <div style={emptyStateStyle}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '0.5rem', opacity: 0.7 }}>
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
              </svg>
              <p style={{ fontWeight: '600', marginBottom: '0.2rem', color: 'var(--text-main)' }}>Watchlist Anda masih kosong.</p>
              <p style={{ fontSize: '0.8rem', opacity: 0.8 }}>Klik tombol "Tambah ke Watchlist" di halaman info anime untuk menandai.</p>
            </div>
          ) : (
            <div className="history-list-container">
              {watchlist.map((item, idx) => {
                return (
                  <div key={idx} className="history-list-row">
                    <div className="history-row-img-wrapper">
                      <img
                        src={item.thumb ? `/api/img?url=${encodeURIComponent(item.thumb)}` : '/placeholder.svg'}
                        alt={item.title}
                        className="history-row-img"
                        loading="lazy"
                      />
                    </div>

                    <div className="history-row-info">
                      <h3 className="history-row-title">{item.title}</h3>
                      <div className="history-row-meta">
                        <p className="history-row-subtitle" style={{ color: 'var(--color-candy-cyan)' }}>
                          Status: {item.status} <span className="dot-divider">·</span> Rating: {item.rating}
                        </p>
                        <p className="history-row-date">
                          Ditambahkan: {new Date(item.addedAt).toLocaleDateString('id-ID')}
                        </p>
                      </div>
                    </div>

                    <div className="history-row-actions">
                      <Link href={`/anime/${item.slug}`} className="btn-continue-watch" style={{ backgroundColor: 'rgba(255, 96, 151, 0.1)', color: 'var(--color-candy-pink)' }}>
                        Buka Anime
                      </Link>
                      <button onClick={() => handleRemoveWatchlistItem(item.slug)} className="btn-delete-history">
                        Hapus
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const emptyStateStyle = {
  backgroundColor: 'var(--bg-card)', 
  border: '1px solid rgba(255, 255, 255, 0.03)', 
  borderRadius: '16px',
  padding: '4rem 2rem',
  textAlign: 'center',
  color: 'var(--text-muted)',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '0.5rem'
};
