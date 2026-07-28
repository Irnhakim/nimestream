'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function KusonimeBatchLink({ animeTitle }) {
  const [batchInfo, setBatchInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [kusoEnabled, setKusoEnabled] = useState(false);

  useEffect(() => {
    setKusoEnabled(process.env.NEXT_PUBLIC_KUSONIME_ENABLED === 'true');
  }, []);

  useEffect(() => {
    if (!animeTitle || process.env.NEXT_PUBLIC_KUSONIME_ENABLED !== 'true') return;

    // Clean anime title to maximize search matching (remove tags like "Subtitle Indonesia", Season terms, etc.)
    const cleanTitle = animeTitle
      .replace(/subtitle indonesia/gi, '')
      .replace(/sub indo/gi, '')
      .replace(/season \d+/gi, '')
      .replace(/s\d+/gi, '')
      .trim();

    if (!cleanTitle) return;

    setLoading(true);
    fetch(`/api/kusonime/search?q=${encodeURIComponent(cleanTitle)}`)
      .then(res => (res.ok ? res.json() : []))
      .then(data => {
        // Find best fuzzy match
        if (data && data.length > 0) {
          const match = data[0]; // Take first search result as best matching candidate
          setBatchInfo(match);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [animeTitle]);

  if (!kusoEnabled || loading || !batchInfo) return null;

  return (
    <div 
      style={{ 
        marginBottom: '2rem',
        padding: '1.25rem',
        backgroundColor: 'rgba(176, 92, 255, 0.05)',
        border: '1px dashed var(--color-candy-purple)',
        borderRadius: '12px'
      }}
    >
      <h3 style={{ fontSize: '0.95rem', fontWeight: '800', color: 'var(--color-candy-purple)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
        📦 Batch Download Tersedia
      </h3>
      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
        Dapatkan seluruh episode sekaligus dengan kualitas dan server mirror lengkap dari Kusonime.
      </p>
      <Link 
        href={`/batch/kuso/${batchInfo.slug}`} 
        className="btn-candy" 
        style={{ 
          display: 'inline-flex',
          padding: '0.5rem 1.25rem',
          fontSize: '0.8rem',
          background: 'linear-gradient(135deg, var(--color-candy-purple), var(--color-candy-pink))'
        }}
      >
        <svg fill="currentColor" viewBox="0 0 24 24" style={{ width: '16px', height: '16px' }}>
          <path d="M11.644 3.066a1.75 1.75 0 0 1 1.712 0l7.25 4.15a1.75 1.75 0 0 1 0 3.034l-7.25 4.15a1.75 1.75 0 0 1-1.712 0l-7.25-4.15a1.75 1.75 0 0 1 0-3.034l7.25-4.15Z" />
          <path d="m21.3 12.285-2.25 1.288-6.175-3.535a1.75 1.75 0 0 0-1.75 0l-6.175 3.535-2.25-1.288a.75.75 0 1 0-.75 1.3l2.25 1.288-2.25 1.288a.75.75 0 1 0 .75 1.3l2.25-1.288 6.175 3.535a1.75 1.75 0 0 0 1.75 0l6.175-3.535 2.25 1.288a.75.75 0 1 0 .75-1.3l-2.25-1.288 2.25-1.288a.75.75 0 1 0-.75-1.3Z" />
        </svg>
        Download Batch ({batchInfo.title})
      </Link>
    </div>
  );
}
