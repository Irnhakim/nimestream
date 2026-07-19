'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

export default function Header() {
  const [query, setQuery] = useState('');
  const router = useRouter();
  const pathname = usePathname();

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query)}`);
    }
  };

  return (
    <header>
      <div className="header-container">
        <Link href="/" className="logo">
          Nime<span>Stream</span>
        </Link>

        <nav className="nav-links">
          <Link href="/" className={`nav-link ${pathname === '/' ? 'active' : ''}`}>
            HOME
          </Link>
          <Link href="/anime-list" className={`nav-link ${pathname === '/anime-list' ? 'active' : ''}`}>
            ANIME LIST
          </Link>
          <Link href="/jadwal-rilis" className={`nav-link ${pathname === '/jadwal-rilis' ? 'active' : ''}`}>
            JADWAL RILIS
          </Link>
          <Link href="/ongoing-anime" className={`nav-link ${pathname === '/ongoing-anime' ? 'active' : ''}`}>
            ON-GOING ANIME
          </Link>
          <Link href="/genre-list" className={`nav-link ${pathname === '/genre-list' ? 'active' : ''}`}>
            GENRE LIST
          </Link>
        </nav>
        
        <form onSubmit={handleSearch} className="search-bar">
          <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
          </svg>
          <input
            type="text"
            placeholder="Cari anime..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </form>
      </div>
    </header>
  );
}
