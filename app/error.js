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
  let errorTitle = 'Gagal Memuat Data!';
  let errorDesc = 'Terjadi kesalahan sistem internal atau sumber data eksternal mengalami gangguan.';

  if (errorMessage.includes('403')) {
    errorCode = '403';
    errorTitle = 'Akses Ditolak';
    errorDesc = 'Anda tidak memiliki izin untuk mengakses halaman ini.';
  } else if (errorMessage.includes('402')) {
    errorCode = '402';
    errorTitle = 'Layanan Berbayar';
    errorDesc = 'Halaman ini membutuhkan akses khusus yang saat ini belum dikonfigurasi.';
  } else if (errorMessage.includes('401')) {
    errorCode = '401';
    errorTitle = 'Butuh Otorisasi';
    errorDesc = 'Silakan masuk atau verifikasi akun Anda terlebih dahulu untuk mengakses halaman ini.';
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
      {/* Background Subtle Accent Glow */}
      <div style={{
        position: 'absolute',
        width: '320px',
        height: '320px',
        background: 'radial-gradient(circle, rgba(108, 92, 231, 0.08) 0%, transparent 70%)',
        top: '20%',
        right: '15%',
        zIndex: 0,
        pointerEvents: 'none',
        animation: 'pulseGlow 6s ease-in-out infinite'
      }} />

      {/* Main card panel */}
      <div style={{ position: 'relative', zIndex: 1, maxWidth: '600px' }}>
        <div style={{ animation: 'floatAnim 4s ease-in-out infinite', marginBottom: '2rem' }}>
          <h1
            style={{
              fontSize: '8.5rem',
              fontWeight: '900',
              margin: 0,
              color: 'var(--color-accent)',
              letterSpacing: '-3px',
              lineHeight: '1'
            }}
          >
            {errorCode}
          </h1>
          <div style={{
            fontSize: '1.25rem',
            fontWeight: '700',
            color: 'var(--color-pink)',
            marginTop: '0.6rem',
            letterSpacing: '0.12em',
            textTransform: 'uppercase'
          }}>
            {errorTitle}
          </div>
        </div>

        <h2 style={{ fontSize: '1.4rem', fontWeight: '700', marginBottom: '1.25rem', color: 'var(--text-main)' }}>
          Maaf, Terjadi Gangguan 🌀
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
            className="btn-all"
            style={{
              padding: '0.8rem 2rem',
              fontSize: '0.9rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              borderRadius: '6px'
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
