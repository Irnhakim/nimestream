'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function EpisodeStreamPlayer({ episode, slug }) {
  const [resolvedEpisode, setResolvedEpisode] = useState(episode);
  const [currentIframeSrc, setCurrentIframeSrc] = useState(episode.defaultStreamUrl);
  const [activeMirror, setActiveMirror] = useState(null);
  const [resolving, setResolving] = useState(false);
  const [loadingMirrors, setLoadingMirrors] = useState(false);

  useEffect(() => {
    setResolvedEpisode(episode);
    setCurrentIframeSrc(episode.defaultStreamUrl);
    setActiveMirror(null);
    setLoadingMirrors(true);

    const queryParams = window.location.search;
    fetch(`/api/episode/${slug}/mirrors${queryParams}`)
      .then(res => {
        if (!res.ok) return null;
        return res.json();
      })
      .then(mirrorsData => {
        if (mirrorsData) {
          setResolvedEpisode(prev => {
            const originMirrors = prev.mirrors || [];
            const newMirrors = mirrorsData.mirrors || [];
            const mergedMirrors = [...originMirrors];

            // Prevent duplicate server items
            newMirrors.forEach(nm => {
              const exists = mergedMirrors.some(om => om.content === nm.content && om.server === nm.server);
              if (!exists) {
                mergedMirrors.push(nm);
              }
            });

            const originDownloads = prev.downloads || [];
            const newDownloads = mirrorsData.downloads || [];
            const mergedDownloads = [...originDownloads];

            // Merge downloads matching quality groups
            newDownloads.forEach(nd => {
              const targetRow = mergedDownloads.find(od => od.quality.toLowerCase() === nd.quality.toLowerCase());
              if (targetRow) {
                nd.links.forEach(nl => {
                  const linkExists = targetRow.links.some(ol => ol.href === nl.href);
                  if (!linkExists) {
                    targetRow.links.push({
                      ...nl,
                      server: `${nl.server} (${nd.source || 'Mirror'})`
                    });
                  }
                });
              } else {
                mergedDownloads.push({
                  quality: nd.quality,
                  source: nd.source,
                  links: nd.links.map(nl => ({
                    ...nl,
                    server: `${nl.server} (${nd.source || 'Mirror'})`
                  }))
                });
              }
            });

            return {
              ...prev,
              mirrors: mergedMirrors,
              downloads: mergedDownloads
            };
          });
        }
      })
      .catch(err => console.error('Failed to load background mirrors:', err))
      .finally(() => setLoadingMirrors(false));
  }, [episode, slug]);

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
  const groupedMirrors = (resolvedEpisode.mirrors || []).reduce((acc, curr) => {
    // Label display for mirrors including their platform source name
    const serverLabel = curr.source && curr.source !== 'Otakudesu' 
      ? `${curr.server} (${curr.source})`
      : curr.server;
    
    const mappedItem = {
      ...curr,
      server: serverLabel
    };

    if (!acc[curr.quality]) {
      acc[curr.quality] = [];
    }
    acc[curr.quality].push(mappedItem);
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
          <h1 className="stream-title">{resolvedEpisode.title}</h1>
          
          <div className="nav-buttons">
            {resolvedEpisode.prevSlug ? (
              <Link href={`/episode/${resolvedEpisode.prevSlug}`} className="btn-nav">
                &larr; Prev Episode
              </Link>
            ) : (
              <span className="btn-nav disabled">&larr; Prev Episode</span>
            )}

            {resolvedEpisode.animeSlug && (
              <Link href={`/anime/${resolvedEpisode.animeSlug}`} className="btn-all">
                Semua Episode
              </Link>
            )}

            {resolvedEpisode.nextSlug ? (
              <Link href={`/episode/${resolvedEpisode.nextSlug}`} className="btn-nav">
                Next Episode &rarr;
              </Link>
            ) : (
              <span className="btn-nav disabled">Next Episode &rarr;</span>
            )}
          </div>
        </div>
      </div>

      {/* Sidebar Server Selector */}
      <div className="mirror-panel">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
          <h3 className="section-title" style={{ margin: 0 }}>Pilih Server</h3>
          {loadingMirrors && (
            <span style={{ fontSize: '0.72rem', color: 'var(--color-candy-cyan)', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
              <span className="loading-dots">Mencari mirror...</span>
            </span>
          )}
        </div>
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

      {/* Download Section (Moved to be a direct sibling of main wrapper and mirror-panel) */}
      {(resolvedEpisode.downloads || []).length > 0 && (
        <div className="download-box">
          <h3 className="section-title">Download Episode</h3>
          {resolvedEpisode.downloads.map((dl, idx) => (
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
  );
}
