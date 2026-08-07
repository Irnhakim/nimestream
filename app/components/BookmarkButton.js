'use client';

import { useState, useEffect } from 'react';

export default function BookmarkButton({ anime }) {
  const [isBookmarked, setIsBookmarked] = useState(false);

  useEffect(() => {
    const watchlist = JSON.parse(localStorage.getItem('ns_watchlist') || '[]');
    const exists = watchlist.some(item => item.slug === anime.slug);
    setIsBookmarked(exists);
  }, [anime.slug]);

  const toggleBookmark = () => {
    const watchlist = JSON.parse(localStorage.getItem('ns_watchlist') || '[]');
    let updated;

    if (isBookmarked) {
      // Remove from watchlist
      updated = watchlist.filter(item => item.slug !== anime.slug);
      setIsBookmarked(false);
    } else {
      // Add to watchlist
      const newItem = {
        title: anime.title,
        slug: anime.slug,
        thumb: anime.thumb,
        rating: anime.info.rating || anime.info.score || '?',
        status: anime.info.status || '?',
        addedAt: Date.now()
      };
      updated = [newItem, ...watchlist];
      setIsBookmarked(true);
    }

    localStorage.setItem('ns_watchlist', JSON.stringify(updated));
    // Trigger custom event for real-time synchronization on other pages/tabs
    window.dispatchEvent(new Event('watchlist-updated'));
  };

  return (
    <button
      onClick={toggleBookmark}
      className={`btn-candy ${isBookmarked ? 'active-bookmark' : ''}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.6rem 1.25rem',
        fontSize: '0.85rem',
        cursor: 'pointer',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        backgroundColor: isBookmarked ? 'rgba(255, 96, 151, 0.15)' : 'rgba(255, 255, 255, 0.02)',
        color: isBookmarked ? 'var(--color-candy-pink)' : 'var(--text-main)',
        borderColor: isBookmarked ? 'var(--color-candy-pink)' : 'rgba(255, 255, 255, 0.08)',
        transition: 'all 0.25s ease'
      }}
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill={isBookmarked ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
      </svg>
      {isBookmarked ? 'Tersimpan di Watchlist' : 'Tambah ke Watchlist'}
    </button>
  );
}
