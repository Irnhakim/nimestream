'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

const navLinks = [
  { href: '/', label: 'HOME' },
  { href: '/anime-list', label: 'ANIME LIST' },
  { href: '/jadwal-rilis', label: 'JADWAL RILIS' },
  { href: '/ongoing-anime', label: 'ON-GOING' },
  { href: '/batch-list', label: 'BATCH LIST' },
  { href: '/genre-list', label: 'GENRE LIST' },
];

export default function Header() {
  const [query, setQuery] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query)}`);
      setMenuOpen(false);
    }
  };

  const handleNavClick = () => setMenuOpen(false);

  return (
    <header>
      <div className="header-container">
        {/* Logo */}
        <Link href="/" className="logo" style={{ display: 'flex', alignItems: 'center' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.svg" alt="NS Logo" style={{ width: '30px', height: '30px', borderRadius: '8px', marginRight: '8px' }} />
          Nime<span>Stream</span>
        </Link>

        {/* Desktop Nav */}
        <nav className="nav-links nav-desktop">
          {navLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`nav-link ${pathname === href ? 'active' : ''}`}
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* Desktop Search */}
        <form onSubmit={handleSearch} className="search-bar search-desktop">
          <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Cari anime..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </form>

        {/* Hamburger Button (Mobile only) */}
        <button
          className="hamburger-btn"
          onClick={() => setMenuOpen(o => !o)}
          aria-label="Toggle menu"
        >
          {menuOpen ? (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M18 6 6 18M6 6l12 12"/>
            </svg>
          ) : (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M4 6h16M4 12h16M4 18h16"/>
            </svg>
          )}
        </button>
      </div>

      {/* Mobile Dropdown Menu */}
      {menuOpen && (
        <div className="mobile-menu">
          {/* Mobile Search */}
          <form onSubmit={handleSearch} className="mobile-search">
            <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" width="16" height="16">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Cari anime..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </form>

          {/* Mobile Nav Links */}
          <nav className="mobile-nav">
            {navLinks.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={`mobile-nav-link ${pathname === href ? 'active' : ''}`}
                onClick={handleNavClick}
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
