import './globals.css';
import Header from './components/Header';
import PopunderAd from './components/PopunderAd';
import PageProgressBar from './components/PageProgressBar';

export const metadata = {
  title: 'NimeStream - Nonton Anime Sub Indo Gratis | Streaming Anime Subtitle Indonesia',
  description: 'Nonton anime sub indo gratis di NimeStream. Streaming anime subtitle indonesia terlengkap, update setiap hari, kualitas HD. Anime ongoing, completed, dan batch tersedia.',
  keywords: 'nonton anime sub indo, streaming anime sub indo, download anime sub indo, nonton anime subtitle indonesia, streaming anime subtitle indonesia gratis, download anime subtitle indonesia, anime sub indo terbaru, anime ongoing sub indo, nonton anime online gratis',
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/logo.svg',
  },
  openGraph: {
    title: 'NimeStream - Nonton Anime Sub Indo Gratis | Streaming Anime Subtitle Indonesia',
    description: 'Nonton anime sub indo gratis di NimeStream. Streaming anime subtitle indonesia terlengkap, update setiap hari, kualitas HD.',
    url: 'https://nimestream.my.id',
    siteName: 'NimeStream',
    images: [
      {
        url: 'https://nimestream.my.id/logo.svg',
        width: 512,
        height: 512,
        alt: 'NimeStream - Nonton Anime Sub Indo',
      },
    ],
    locale: 'id_ID',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'NimeStream - Nonton Anime Sub Indo Gratis',
    description: 'Nonton anime sub indo gratis di NimeStream. Streaming anime subtitle indonesia terlengkap, update setiap hari.',
    images: ['https://nimestream.my.id/logo.svg'],
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <head>
        <meta name="b1a183711a4cd7aa4f65c6eaebb8283660c15d5e" content="b1a183711a4cd7aa4f65c6eaebb8283660c15d5e" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
        {/* Preconnect to frequently fetched image CDN domains */}
        <link rel="preconnect" href="https://i0.wp.com" />
        <link rel="preconnect" href="https://i1.wp.com" />
        <link rel="preconnect" href="https://i2.wp.com" />
        <link rel="preconnect" href="https://i3.wp.com" />
        <link rel="dns-prefetch" href="https://otakudesu.cloud" />
        <link rel="dns-prefetch" href="https://kusonime.com" />
      </head>
      <body>
        <PageProgressBar />
        <Header />
        <PopunderAd />
        {children}
        <footer>
          <div className="support-section">
            <p className="support-title">☕ Dukung Developer</p>
            <div className="support-buttons">
              <a
                href="https://trakteer.id/ryuzure"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-support btn-bmc"
              >
                Trakteer
              </a>
              <a
                href="https://saweria.co/irnhakim"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-support btn-saweria"
              >
                Saweria
              </a>
            </div>
          </div>
          <p>NimeStream &copy; 2026. Made with <span>&hearts;</span> for Anime Lovers.</p>
          <p style={{ fontSize: '0.75rem', marginTop: '0.25rem', opacity: 0.7 }}>
            All data scraped from Internet. We do not store any files on our server.
          </p>
        </footer>
      </body>
    </html>
  );
}
