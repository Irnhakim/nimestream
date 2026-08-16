'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';

export default function EpisodeBox({ episodes, animeTitle = '', anime = null }) {
  const [search, setSearch] = useState('');
  const [order, setOrder] = useState('desc'); // desc = terbaru dulu
  const [resolvedAnime, setResolvedAnime] = useState(anime);

  useEffect(() => {
    setResolvedAnime(anime);
    if (!anime) return;
    fetch(`/api/anime/${anime.slug}/mirrors?title=${encodeURIComponent(anime.title)}`)
      .then(res => {
        if (!res.ok) return null;
        return res.json();
      })
      .then(mirrorsData => {
        if (mirrorsData) {
          setResolvedAnime(prev => ({
            ...prev,
            ...mirrorsData
          }));
        }
      })
      .catch(err => console.error('Failed to resolve background mirrors:', err));
  }, [anime]);

  const getEpisodeNumber = (title) => {
    if (!title) return 0;
    // Look specifically for numbers following episode/ep E.g. "Episode 6", "Ep. 06"
    const match = title.match(/(?:episode|ep)\s*\.?\s*(\d+(?:\.\d+)?)/i);
    if (match) return parseFloat(match[1]);
    
    // Fallback: get the last number block in the string (since episode number is usually at the end)
    const allNums = title.match(/(\d+(?:\.\d+)?)/g);
    if (allNums && allNums.length > 0) {
      return parseFloat(allNums[allNums.length - 1]);
    }
    return 0;
  };

  const sorted = [...episodes].sort((a, b) => {
    const numA = getEpisodeNumber(a.title);
    const numB = getEpisodeNumber(b.title);
    return order === 'desc' ? numB - numA : numA - numB;
  });
  const filtered = search.trim()
    ? sorted.filter(ep => ep.title.toLowerCase().includes(search.toLowerCase()))
    : sorted;

  // Helper function to clean title by removing redundant parent anime name and tags
  const cleanEpisodeTitle = (title) => {
    if (!title) return '';
    let cleaned = title;

    if (animeTitle) {
      // Create a normalized search regex for the anime title
      const escapedTitle = animeTitle
        .replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')
        .trim();
      const titleRegex = new RegExp(escapedTitle, 'i');
      cleaned = cleaned.replace(titleRegex, '');
    }

    // Clean common Otakudesu trailing words
    cleaned = cleaned
      .replace(/Subtitle\s*Indonesia/gi, '')
      .replace(/Sub\s*Indo/gi, '')
      .replace(/^\s*-\s*/, '') // Remove starting dashes
      .trim();

    // If everything got cleaned, fallback to original
    if (!cleaned) return title;

    // Capitalize first letter of Episode
    return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  };

  // Build query params for mirror sources
  const getEpisodeQueryString = () => {
    if (!resolvedAnime) return '';
    const queryParams = [];
    if (resolvedAnime.mirrorSlug) queryParams.push(`oploverz=${encodeURIComponent(resolvedAnime.mirrorSlug)}`);
    if (resolvedAnime.mirrorSlugAlqanime) queryParams.push(`alqanime=${encodeURIComponent(resolvedAnime.mirrorSlugAlqanime)}`);
    if (resolvedAnime.mirrorSlugOtakudesu) queryParams.push(`otakudesu=${encodeURIComponent(resolvedAnime.mirrorSlugOtakudesu)}`);
    
    const sourceKeys = [
      'donghua', 'samehadaku', 'animasu', 'zoronime', 'anoboy', 
      'nimegami', 'animeindo', 'animekuindo', 'winbu', 'kuramanime', 
      'animekompi', 'donghub', 'dramabox'
    ];
    sourceKeys.forEach(key => {
      const displayName = key.charAt(0).toUpperCase() + key.slice(1);
      const attr = `mirrorSlug${displayName}`;
      if (resolvedAnime[attr]) {
        queryParams.push(`${key}=${encodeURIComponent(resolvedAnime[attr])}`);
      }
    });

    return queryParams.length > 0 ? `?${queryParams.join('&')}` : '';
  };

  const queryString = getEpisodeQueryString();

  return (
    <div className="episode-box">
      {/* Navbar */}
      <div className="episode-box-nav">
        <span className="episode-box-count">
          {filtered.length} / {episodes.length} Episode
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {/* Search */}
          <div className="episode-search-wrap">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              type="text"
              placeholder="Cari episode..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="episode-search-input"
            />
          </div>
          {/* Order Toggle */}
          <button
            onClick={() => setOrder(o => o === 'desc' ? 'asc' : 'desc')}
            className="episode-order-btn"
            title={order === 'desc' ? 'Terbaru dulu' : 'Terlama dulu'}
          >
            {order === 'desc' ? (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M3 4h13M3 8h9M3 12h5M17 4v16M17 20l-4-4M17 20l4-4"/>
              </svg>
            ) : (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M3 20h13M3 16h9M3 12h5M17 20V4M17 4l-4 4M17 4l4 4"/>
              </svg>
            )}
            <span style={{ fontSize: '0.72rem' }}>{order === 'desc' ? 'Terbaru' : 'Terlama'}</span>
          </button>
        </div>
      </div>

      {/* Episode Scroll List */}
      <div className="episode-scroll-list">
        {filtered.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', padding: '1rem', textAlign: 'center' }}>
            Episode tidak ditemukan.
          </p>
        ) : (
          filtered.map((ep, idx) => (
            <Link key={idx} href={`/episode/${ep.slug}${queryString}`} className="episode-item">
              <span className="episode-title">{cleanEpisodeTitle(ep.title)}</span>
              <span className="episode-date">{ep.date}</span>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
