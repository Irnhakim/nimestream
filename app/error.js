'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function ErrorPage({ error, reset }) {
  useEffect(() => {
    // Log the error to console
    console.error('Captured by global error boundary:', error);
  }, [error]);

  // Determine error messages or codes dynamically
  const errorMessage = error?.message || '';
  let errorCode = '500';
  let errorTitle = 'Jutsu Scraper Gagal!';
  let errorDesc = 'Terjadi kesalahan sistem internal atau sumber data eksternal mengalami timeout.';

  if (errorMessage.includes('403')) {
    errorCode = '403';
    errorTitle = 'Akses Terlarang (Forbidden)';
    errorDesc = 'Jalan Anda ter-block oleh barrier pelindung. Anda tidak memiliki izin untuk membuka segel halaman ini.';
  } else if (errorMessage.includes('402')) {
    errorCode = '402';
    errorTitle = 'Payment Required';
    errorDesc = 'Halaman ini membutuhkan energi chakra premium (layanan berbayar) yang saat ini belum dikonfigurasi.';
  } else if (errorMessage.includes('401')) {
    errorCode = '401';
    errorTitle = 'Unauthorized';
    errorDesc = 'Akses ditolak. Silakan login atau masukkan token enkripsi Anda terlebih dahulu.';
  }

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
      {/* Background Neon Pulsing Glows */}
      <div style={{
        position: 'absolute',
        width: '320px',
        height: '320px',
        background: 'radial-gradient(circle, rgba(255, 96, 151, 0.18) 0%, transparent 70%)',
        top: '20%',
        right: '15%',
        zIndex: 0,
        pointerEvents: 'none',
        animation: 'pulseGlow 6s ease-in-out infinite'
      }} />
      <div style={{
        position: 'absolute',
        width: '320px',
        height: '320px',
        background: 'radial-gradient(circle, rgba(176, 92, 255, 0.15) 0%, transparent 70%)',
        bottom: '15%',
        left: '15%',
        zIndex: 0,
        pointerEvents: 'none',
        animation: 'pulseGlow 6s ease-in-out infinite 3s'
      }} />

      {/* Main card panel */}
      <div style={{ position: 'relative', zIndex: 1, maxWidth: '600px' }}>
        <div style={{ animation: 'floatAnim 4s ease-in-out infinite', marginBottom: '2rem' }}>
          <h1 
            style={{ 
              fontSize: '8.5rem', 
              fontWeight: '900', 
              margin: 0,
              background: 'linear-gradient(135deg, var(--color-candy-purple), var(--color-candy-pink), var(--color-candy-yellow))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              letterSpacing: '-3px',
              lineHeight: '1',
              textShadow: '0 0 50px rgba(255, 96, 151, 0.3)'
            }}
          >
            {errorCode}
          </h1>
          <div style={{
            fontSize: '1.25rem',
            fontWeight: '700',
            color: 'var(--color-candy-pink)',
            marginTop: '0.6rem',
            letterSpacing: '0.12em',
            textTransform: 'uppercase'
          }}>
            {errorTitle}
          </div>
        </div>

        <h2 style={{ fontSize: '1.4rem', fontWeight: '700', marginBottom: '1.25rem', color: 'var(--text-main)' }}>
          Kacau! {errorTitle} 🌀
        </h2>
        <p style={{ color: 'var(--text-muted)', lineHeight: '1.6', marginBottom: '2.5rem', fontSize: '0.95rem' }}>
          {errorDesc}
        </p>

        {/* Action Controls */}
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button 
            onClick={() => reset()}
            className="btn-candy"
            style={{ 
              padding: '0.8rem 2rem', 
              fontSize: '0.9rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              cursor: 'pointer'
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
            </svg>
            Ulangi Memuat (Retry)
          </button>
          
          <Link 
            href="/" 
            className="btn-mirror"
            style={{ 
              padding: '0.8rem 2rem', 
              fontSize: '0.9rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              borderRadius: '9999px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              backgroundColor: 'rgba(255, 255, 255, 0.02)'
            }}
          >
            Kembali ke Home
          </Link>
        </div>
      </div>

      <style>{`
        @keyframes floatAnim {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-12px) rotate(0.5deg); }
        }
        @keyframes pulseGlow {
          0%, 100% { transform: scale(1); opacity: 0.8; }
          50% { transform: scale(1.15); opacity: 0.5; }
        }
      `}</style>
    </main>
  );
}
