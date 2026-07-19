import './globals.css';
import Header from './components/Header';

export const metadata = {
  title: 'NimeStream - Nonton & Streaming Anime Subtitle Indonesia',
  description: 'NimeStream adalah tempat nonton dan streaming anime subtitle indonesia gratis terlengkap dengan tampilan premium.',
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/logo.svg',
  }
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <head>
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body>
        <Header />
        {children}
        <footer>
          <p>NimeStream &copy; 2026. Made with <span>&hearts;</span> for Anime Lovers.</p>
          <p style={{ fontSize: '0.75rem', marginTop: '0.25rem', opacity: 0.7 }}>
            All data scraped from otakudesu.blog. We do not store any files on our server.
          </p>
        </footer>
      </body>
    </html>
  );
}
