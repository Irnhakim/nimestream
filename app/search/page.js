'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

function SearchPageClient() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';

  const [otakudesuResults, setOtakudesuResults] = useState([]);
  const [kusonimeResults, setKusonimeResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'streaming', 'batch'
  const [kusoEnabled, setKusoEnabled] = useState(false);

  useEffect(() => {
    // Check if Kusonime is enabled in env
    setKusoEnabled(process.env.NEXT_PUBLIC_KUSONIME_ENABLED === 'true');
  }, []);

  useEffect(() => {
    if (!query) return;

    async function fetchResults() {
      setLoading(true);
      try {
        const fetchOtakudesu = fetch(`/api/search?q=${encodeURIComponent(query)}`)
          .then(res => res.ok ? res.json() : [])
          .catch(() => []);

        const fetchKusonime = process.env.NEXT_PUBLIC_KUSONIME_ENABLED === 'true'
          ? fetch(`/api/kusonime/search?q=${encodeURIComponent(query)}`)
              .then(res => res.ok ? res.json() : [])
              .catch(() => [])
          : Promise.resolve([]);

        const [otaku, kuso] = await Promise.all([fetchOtakudesu, fetchKusonime]);
        setOtakudesuResults(otaku);
        setKusonimeResults(kuso);
      } catch (err) {
        console.error('Error searching:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchResults();
  }, [query]);

  // Filter items based on active tab
  const showStreaming = activeTab === 'all' || activeTab === 'streaming';
  const showBatch = (activeTab === 'all' || activeTab === 'batch') && kusoEnabled;

  const totalResultsCount = 
    (showStreaming ? otakudesuResults.length : 0) + 
    (showBatch ? kusonimeResults.length : 0);

  return (
    <main>
      <div className="section-wrapper">
        <h2 className="section-title">Hasil Pencarian: &quot;{query}&quot;</h2>

        {/* Tab Filter (Only show if Kusonime is enabled) */}
        {kusoEnabled && (
          <div style={{ display: 'flex', gap: '0.5rem', margin: '1.5rem 0' }}>
            <button
              onClick={() => setActiveTab('all')}
              className={`btn-order ${activeTab === 'all' ? 'active' : ''}`}
              style={tabButtonStyle(activeTab === 'all')}
            >
              Semua ({otakudesuResults.length + kusonimeResults.length})
            </button>
            <button
              onClick={() => setActiveTab('streaming')}
              className={`btn-order ${activeTab === 'streaming' ? 'active' : ''}`}
              style={tabButtonStyle(activeTab === 'streaming')}
            >
              📺 Streaming ({otakudesuResults.length})
            </button>
            <button
              onClick={() => setActiveTab('batch')}
              className={`btn-order ${activeTab === 'batch' ? 'active' : ''}`}
              style={tabButtonStyle(activeTab === 'batch')}
            >
              📦 Batch Download ({kusonimeResults.length})
            </button>
          </div>
        )}

        {loading ? (
          <p style={{ color: 'var(--text-muted)', marginTop: '2rem' }}>Sedang mencari anime...</p>
        ) : totalResultsCount === 0 ? (
          <p style={{ color: 'var(--text-muted)', marginTop: '1.5rem' }}>
            Tidak ada anime yang ditemukan untuk kata kunci tersebut. Silakan coba kata kunci lain.
          </p>
        ) : (
          <div className="anime-grid">
            {/* Render Otakudesu (Streaming) */}
            {showStreaming && otakudesuResults.map((item, idx) => (
              <Link key={`otaku-${idx}`} href={`/anime/${item.slug}`} className="anime-card">
                <div className="card-img-wrapper">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.thumb ? `/api/img?url=${encodeURIComponent(item.thumb)}` : '/placeholder.svg'}
                    alt={item.title}
                    className="card-img"
                    loading="lazy"
                  />
                  {item.rating && (
                    <div className="card-badge" style={{ background: 'linear-gradient(135deg, var(--color-candy-cyan), var(--color-candy-purple))' }}>
                      ★ {item.rating}
                    </div>
                  )}
                </div>
                <div className="card-info">
                  <h3 className="card-title" title={item.title}>
                    {item.title}
                  </h3>
                  <div className="card-meta">
                    <span>{item.status}</span>
                  </div>
                </div>
              </Link>
            ))}

            {/* Render Kusonime (Batch) */}
            {showBatch && kusonimeResults.map((item, idx) => (
              <Link key={`kuso-${idx}`} href={`/batch/kuso/${item.slug}`} className="anime-card" style={{ border: '1px solid rgba(176, 92, 255, 0.2)' }}>
                <div className="card-img-wrapper">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.thumb ? `/api/img?url=${encodeURIComponent(item.thumb)}` : '/placeholder.svg'}
                    alt={item.title}
                    className="card-img"
                    loading="lazy"
                  />
                  <div className="card-badge" style={{ background: 'linear-gradient(135deg, var(--color-candy-purple), var(--color-candy-pink))' }}>
                    📦 BATCH
                  </div>
                </div>
                <div className="card-info">
                  <h3 className="card-title" title={item.title}>
                    {item.title}
                  </h3>
                  <div className="card-meta">
                    <span>Batch</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <main>
        <div className="section-wrapper">
          <p style={{ color: 'var(--text-muted)', marginTop: '2rem' }}>Sedang mencari anime...</p>
        </div>
      </main>
    }>
      <SearchPageClient />
    </Suspense>
  );
}

function tabButtonStyle(isActive) {
  return {
    padding: '0.45rem 1rem',
    borderRadius: '10px',
    fontSize: '0.85rem',
    fontWeight: '700',
    border: '1px solid',
    borderColor: isActive ? 'var(--color-candy-purple)' : 'rgba(255,255,255,0.06)',
    backgroundColor: isActive ? 'rgba(176, 92, 255, 0.1)' : 'rgba(255,255,255,0.03)',
    color: isActive ? 'var(--color-candy-purple)' : 'var(--text-muted)',
    cursor: 'pointer',
    transition: 'var(--transition-smooth)'
  };
}

