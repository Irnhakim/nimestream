import AnimeGrid from './components/AnimeGrid';

async function getData(endpoint) {
  try {
    const res = await fetch(`http://localhost:3000/api/${endpoint}`, {
      cache: 'no-store'
    });
    if (!res.ok) return [];
    return await res.json();
  } catch (e) {
    console.error(`Failed to fetch ${endpoint}:`, e);
    return [];
  }
}

export default async function Home() {
  const ongoing = await getData('ongoing');
  const completed = await getData('completed');

  return (
    <main>
      <div className="hero-banner">
        <h1 className="hero-title">Nonton Anime <span>Subtitle Indonesia</span></h1>
        <p className="hero-desc">
          Temukan koleksi anime favoritmu mulai dari yang sedang tayang (ongoing) hingga yang sudah tamat lengkap secara gratis dengan kualitas terbaik.
        </p>
      </div>

      <AnimeGrid title="Anime On-Going Terbaru" items={ongoing} moreLink="/ongoing-anime" />
      
      <AnimeGrid title="Anime Completed Terbaru" items={completed} moreLink="/anime-list" />
    </main>
  );
}
