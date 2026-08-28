'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function EpisodeStreamPlayer({ episode, slug }) {
  const [resolvedEpisode, setResolvedEpisode] = useState(episode);
  const [currentIframeSrc, setCurrentIframeSrc] = useState(episode.defaultStreamUrl);
  const [activeMirror, setActiveMirror] = useState(null);
  const [resolving, setResolving] = useState(false);
  const [iframeLoading, setIframeLoading] = useState(false);
  const [loadingMirrors, setLoadingMirrors] = useState(false);

  useEffect(() => {
    setResolvedEpisode(episode);
    setCurrentIframeSrc(episode.defaultStreamUrl);
    setActiveMirror(null);
    setLoadingMirrors(true);
    setIframeLoading(false);

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

    setIframeLoading(true);
    // Direct URLs (non-Otakudesu streams) can be set directly to iframe src
    const isDirectUrl = /^(https?:)?\/\//i.test(mirror.content);
    if (isDirectUrl || (mirror.source && mirror.source !== 'Otakudesu')) {
      setCurrentIframeSrc(mirror.content);
      setActiveMirror(index);
      return;
    }

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
        setIframeLoading(false);
      }
    } catch (e) {
      console.error(e);
      alert('Error saat memuat video player.');
      setIframeLoading(false);
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
                backgroundColor: '#050608', color: 'var(--color-candy-cyan)', fontWeight: 'bold',
                zIndex: 10
              }}>
                Menyiapkan player, harap tunggu...
              </div>
            ) : null}

            {iframeLoading && !resolving ? (
              <div style={{
                position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                backgroundColor: 'rgba(5, 6, 8, 0.85)', color: '#fff', fontSize: '0.9rem',
                zIndex: 9
              }}>
                Memuat video...
              </div>
            ) : null}

            <iframe
              src={currentIframeSrc}
              allowFullScreen={true}
              referrerPolicy="no-referrer"
              sandbox="allow-scripts allow-same-origin allow-forms allow-pointer-lock allow-popups allow-popups-to-escape-sandbox allow-presentation"
              onLoad={() => setIframeLoading(false)}
            />
          </div>
        </div>

        <div className="stream-meta">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.8rem', marginBottom: '1rem' }}>
            <h1 className="stream-title" style={{ margin: 0 }}>{resolvedEpisode.title}</h1>
            {currentIframeSrc && (
              <a
                href={currentIframeSrc}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-download"
                style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
              >
                🗗 Buka Player di Tab Baru
              </a>
            )}
          </div>

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
