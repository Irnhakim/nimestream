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
        <meta name="b1a183711a4cd7aa4f65c6eaebb8283660c15d5e" content="b1a183711a4cd7aa4f65c6eaebb8283660c15d5e" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body>
        <Header />
        {children}
        <footer>
          <div className="support-section">
            <p className="support-title">☕ Dukung Developer</p>
            <p className="support-desc">Kalau NimeStream bermanfaat, bantu dukung pengembangan dengan donasi kecil ya!</p>
            <div className="support-buttons">
              <a
                href="https://buymeacoffee.com/irnhakim"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-support btn-bmc"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.216 6.415l-.132-.666c-.119-.598-.388-1.163-1.001-1.379-.197-.069-.42-.098-.57-.241-.152-.143-.196-.366-.231-.572-.065-.378-.125-.756-.192-1.133-.057-.325-.102-.69-.25-.987-.195-.4-.597-.634-.996-.788a5.723 5.723 0 00-.626-.194c-1-.263-2.05-.36-3.077-.416a25.834 25.834 0 00-3.7.062c-.915.083-1.88.184-2.75.5-.318.116-.646.256-.888.501-.297.302-.393.77-.177 1.146.154.267.415.456.692.58.36.162.737.284 1.123.366 1.075.238 2.189.331 3.287.37 1.218.05 2.437.01 3.65-.118.299-.033.598-.073.896-.119.352-.054.578-.513.474-.834-.124-.383-.457-.531-.834-.473-.466.074-.96.108-1.382.146-1.177.08-2.358.082-3.536.006a22.228 22.228 0 01-1.157-.107c-.086-.01-.18-.025-.258-.036-.243-.036-.484-.08-.724-.13-.111-.027-.111-.185 0-.212h.005c.277-.06.557-.108.838-.147h.002c.131-.009.263-.032.394-.048a25.076 25.076 0 013.426-.12c.674.019 1.347.067 2.017.144l.228.031c.267.04.533.088.798.145.392.085.895.113 1.07.542.055.137.08.288.117.432l.018.062c.066.268.222.376.454.274.19-.082.38-.255.374-.462l-.005-.017a4.27 4.27 0 00-.195-.645c-.07-.171-.152-.341-.18-.524-.104-.66.07-1.32-.2-1.974-.26-.62-.82-1.077-1.437-1.394-.63-.326-1.31-.54-1.993-.696A25.39 25.39 0 0012 2.003c-1.48 0-2.964.157-4.397.48-.69.157-1.378.37-2.003.728-.595.34-1.14.81-1.427 1.44-.3.66-.14 1.34-.222 2.01-.082.67-.41 1.27-.532 1.93-.124.67-.068 1.36.12 2.01.187.65.536 1.25.85 1.86.294.574.618 1.14.87 1.73.253.59.44 1.2.438 1.82a4.86 4.86 0 01-.44 1.82c-.25.59-.574 1.15-.87 1.73-.313.61-.662 1.21-.85 1.86-.187.65-.244 1.34-.12 2.01.12.66.45 1.26.532 1.93.082.67-.078 1.35.222 2.01.286.63.832 1.1 1.427 1.44.625.358 1.313.57 2.003.728C9.036 21.843 10.52 22 12 22c1.48 0 2.964-.157 4.397-.48.69-.157 1.378-.37 2.003-.728.595-.34 1.14-.81 1.427-1.44.3-.66.14-1.34.222-2.01.082-.67.41-1.27.532-1.93.124-.67.068-1.36-.12-2.01-.187-.65-.536-1.25-.85-1.86-.294-.574-.618-1.14-.87-1.73-.253-.59-.44-1.2-.438-1.82a4.86 4.86 0 01.44-1.82c.25-.59.574-1.15.87-1.73.313-.61.662-1.21.85-1.86.187-.65.244-1.34.12-2.01z"/>
                </svg>
                Buy Me a Coffee
              </a>
              <a
                href="https://saweria.co/irnhakim"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-support btn-saweria"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
                </svg>
                Saweria
              </a>
            </div>
          </div>
          <p>NimeStream &copy; 2026. Made with <span>&hearts;</span> for Anime Lovers.</p>
          <p style={{ fontSize: '0.75rem', marginTop: '0.25rem', opacity: 0.7 }}>
            All data scraped from otakudesu.blog. We do not store any files on our server.
          </p>
        </footer>
      </body>
    </html>
  );
}
