'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function EpisodeStreamPlayer({ episode, slug }) {
  const [currentIframeSrc, setCurrentIframeSrc] = useState(episode.defaultStreamUrl);
  const [activeMirror, setActiveMirror] = useState(null);
  const [resolving, setResolving] = useState(false);

  const resolveMirror = async (mirror, index) => {
    if (activeMirror === index) return;
    setResolving(true);
    setActiveMirror(index);
    try {
      const res = await fetch('/api/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ content: mirror.content })
      });
      const data = await res.json();
      if (data.src) {
        setCurrentIframeSrc(data.src);
      } else {
        alert('Gagal memuat mirror stream. Silakan pilih server lain.');
      }
    } catch (e) {
      console.error(e);
      alert('Error saat memuat video player.');
    } finally {
      setResolving(false);
    }
  };

  // Group mirrors by quality for beautiful tab display
  const groupedMirrors = episode.mirrors.reduce((acc, curr) => {
    if (!acc[curr.quality]) {
      acc[curr.quality] = [];
    }
    acc[curr.quality].push(curr);
    return acc;
  }, {});

  return (
    <div className="stream-container">
      <div>
        <div className="player-wrapper">
          <div className="aspect-ratio-video">
            {resolving ? (
              <div style={{
                position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                backgroundColor: '#050608', color: 'var(--color-candy-cyan)', fontWeight: 'bold'
              }}>
                Menyiapkan player, harap tunggu...
              </div>
            ) : (
              <iframe
                src={currentIframeSrc}
                allowFullScreen={true}
                sandbox="allow-scripts allow-same-origin allow-forms allow-pointer-lock"
              />
            )}
          </div>
        </div>

        <div className="stream-meta">
          <h1 className="stream-title">{episode.title}</h1>
          
          <div className="nav-buttons">
            {episode.prevSlug ? (
              <Link href={`/episode/${episode.prevSlug}`} className="btn-nav">
                &larr; Prev Episode
              </Link>
            ) : (
              <span className="btn-nav disabled">&larr; Prev Episode</span>
            )}

            {episode.animeSlug && (
              <Link href={`/anime/${episode.animeSlug}`} className="btn-all">
                Semua Episode
              </Link>
            )}

            {episode.nextSlug ? (
              <Link href={`/episode/${episode.nextSlug}`} className="btn-nav">
                Next Episode &rarr;
              </Link>
            ) : (
              <span className="btn-nav disabled">Next Episode &rarr;</span>
            )}
          </div>
        </div>

        {/* Download Section */}
        {episode.downloads.length > 0 && (
          <div className="download-box">
            <h3 className="section-title">Download Episode</h3>
            {episode.downloads.map((dl, idx) => (
              <div key={idx} className="download-row">
                <span className="download-quality">{dl.quality}</span>
                <div className="download-links">
                  {dl.links.map((link, j) => (
                    <a
                      key={j}
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-download"
                    >
                      {link.server}
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sidebar Server Selector */}
      <div className="mirror-panel">
        <h3 className="section-title">Pilih Server</h3>
        {Object.keys(groupedMirrors).length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Server alternatif tidak tersedia.</p>
        ) : (
          Object.entries(groupedMirrors).map(([quality, list]) => (
            <div key={quality} className="mirror-group">
              <div className="mirror-label">Kualitas {quality}</div>
              <div className="mirror-grid">
                {list.map((mirror, idx) => {
                  const itemIndex = `${quality}-${idx}`;
                  return (
                    <button
                      key={idx}
                      className={`btn-mirror ${activeMirror === itemIndex ? 'active' : ''}`}
                      onClick={() => resolveMirror(mirror, itemIndex)}
                    >
                      {mirror.server}
                    </button>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
