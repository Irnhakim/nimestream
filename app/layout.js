import './globals.css';
import Header from './components/Header';
import PopunderAd from './components/PopunderAd';
import PageProgressBar from './components/PageProgressBar';

export const metadata = {
  title: 'NimeStream - Nonton & Streaming Anime Subtitle Indonesia',
  description: 'NimeStream adalah tempat nonton dan streaming anime subtitle indonesia gratis terlengkap dengan tampilan premium.',
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/logo.svg',
  },
  openGraph: {
    title: 'NimeStream - Nonton & Streaming Anime Subtitle Indonesia',
    description: 'NimeStream adalah tempat nonton dan streaming anime subtitle indonesia gratis terlengkap dengan tampilan premium.',
    url: 'https://anime.irnhakim.my.id',
    siteName: 'NimeStream',
    images: [
      {
        url: 'https://anime.irnhakim.my.id/logo.svg',
        width: 512,
        height: 512,
        alt: 'NimeStream Logo',
      },
    ],
    locale: 'id_ID',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'NimeStream - Nonton & Streaming Anime Subtitle Indonesia',
    description: 'NimeStream adalah tempat nonton dan streaming anime subtitle indonesia gratis terlengkap dengan tampilan premium.',
    images: ['https://anime.irnhakim.my.id/logo.svg'],
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <head>
        <meta name="b1a183711a4cd7aa4f65c6eaebb8283660c15d5e" content="b1a183711a4cd7aa4f65c6eaebb8283660c15d5e" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
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
                href="https://buymeacoffee.com/irnhakim"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-support btn-bmc"
              >
                Buy Me a Coffee
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
            All data scraped from Otakudesu & Kusonime. We do not store any files on our server.
          </p>
        </footer>
      </body>
    </html>
  );
}
