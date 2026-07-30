'use client';

import Link from 'next/link';

export default function NotFound() {
  return (
    <main style={{ 
      minHeight: '80vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      flexDirection: 'column',
      padding: '2rem',
      textAlign: 'center',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Dynamic Background Glows */}
      <div style={{
        position: 'absolute',
        width: '300px',
        height: '300px',
        background: 'radial-gradient(circle, rgba(255, 96, 151, 0.15) 0%, transparent 70%)',
        top: '10%',
        left: '20%',
        zIndex: 0,
        pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute',
        width: '300px',
        height: '300px',
        background: 'radial-gradient(circle, rgba(60, 212, 255, 0.15) 0%, transparent 70%)',
        bottom: '10%',
        right: '20%',
        zIndex: 0,
        pointerEvents: 'none'
      }} />

      {/* Content Card Wrapper */}
      <div style={{ position: 'relative', zIndex: 1, maxWidth: '600px' }}>
        {/* Floating Animation Wrapper */}
        <div style={{ animation: 'floatAnim 4s ease-in-out infinite', marginBottom: '2rem' }}>
          <h1 
            style={{ 
              fontSize: '8rem', 
              fontWeight: '900', 
              margin: 0,
              background: 'linear-gradient(135deg, var(--color-candy-pink), var(--color-candy-purple), var(--color-candy-cyan))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              letterSpacing: '-2px',
              lineHeight: '1',
              textShadow: '0 0 40px rgba(176, 92, 255, 0.2)'
            }}
            className="glitch-title"
          >
            404
          </h1>
          <div style={{
            fontSize: '1.25rem',
            fontWeight: '600',
            color: 'var(--color-candy-cyan)',
            marginTop: '0.5rem',
            letterSpacing: '0.1em',
            textTransform: 'uppercase'
          }}>
            DIMENSI TIDAK DITEMUKAN
          </div>
        </div>

        {/* Anime Custom text */}
        <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '1rem', color: 'var(--text-main)' }}>
          Waduh! Sepertinya Halaman Ini Hilang di Isekai... 🌌
        </h2>
        <p style={{ color: 'var(--text-muted)', lineHeight: '1.6', marginBottom: '2.5rem', fontSize: '0.95rem' }}>
          Mungkin tautan yang Anda tuju sudah terhapus, pindah domain, atau ter-seal oleh jutsu kuno. Silakan kembali ke beranda untuk mencari anime favorit Anda lainnya!
        </p>

        {/* Action Button */}
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <Link 
            href="/" 
            className="btn-candy"
            style={{ 
              padding: '0.8rem 2rem', 
              fontSize: '0.9rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            Kembali ke Beranda
          </Link>
        </div>
      </div>

      <style>{`
        @keyframes floatAnim {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-15px) rotate(-1deg); }
        }
      `}</style>
    </main>
  );
}
