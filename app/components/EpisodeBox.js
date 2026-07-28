'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function EpisodeBox({ episodes }) {
  const [search, setSearch] = useState('');
  const [order, setOrder] = useState('desc'); // desc = terbaru dulu

  const sorted = order === 'desc' ? [...episodes].reverse() : [...episodes];
  const filtered = search.trim()
    ? sorted.filter(ep => ep.title.toLowerCase().includes(search.toLowerCase()))
    : sorted;

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
            <Link key={idx} href={`/episode/${ep.slug}`} className="episode-item">
              <span className="episode-title">{ep.title}</span>
              <span className="episode-date">{ep.date}</span>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
