'use client';

import { useState } from 'react';

export default function SynopsisBox({ htmlContent }) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!htmlContent) return null;

  return (
    <div className="synopsis-wrapper">
      <div
        className={`synopsis-content ${isExpanded ? 'expanded' : 'collapsed'}`}
        dangerouslySetInnerHTML={{ __html: htmlContent }}
      />
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="synopsis-toggle-btn"
      >
        {isExpanded ? (
          <>
            Sembunyikan
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: '0.25rem' }}>
              <polyline points="18 15 12 9 6 15" />
            </svg>
          </>
        ) : (
          <>
            Baca Selengkapnya
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: '0.25rem' }}>
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </>
        )}
      </button>
    </div>
  );
}
