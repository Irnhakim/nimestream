export const OPLOVERZ_ENABLED = process.env.NEXT_PUBLIC_OPLOVERZ_ENABLED === 'true';
const BACK_API_URL = process.env.NEXT_PUBLIC_OPLOVERZ_API_URL || 'https://backapi.oploverz.ac/api';
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

async function fetchJson(url) {
  if (!OPLOVERZ_ENABLED) return null;
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'application/json'
      },
      cache: 'no-store'
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    console.error(`Oploverz API fetch error on: ${url}`, error.message);
    return null;
  }
}

// 1. Get Ongoing Anime List from Oploverz
export async function getLatestOploverz() {
  if (!OPLOVERZ_ENABLED) return [];
  const json = await fetchJson(`${BACK_API_URL}/series?status=Ongoing&limit=20`);
  if (!json || !json.data) return [];
  
  return json.data.map(item => ({
    title: item.title,
    slug: item.slug,
    thumb: item.cover ? `https://backapi.oploverz.ac${item.cover}` : '/placeholder.svg',
    ep: `Episode ${item.episodeCount || '?'}`,
    date: item.updatedAt ? new Date(item.updatedAt).toLocaleDateString('id-ID') : 'Ongoing',
    source: 'Oploverz'
  }));
}

// 2. Search Anime from Oploverz
export async function searchOploverz(query) {
  if (!OPLOVERZ_ENABLED) return [];
  const json = await fetchJson(`${BACK_API_URL}/series?search=${encodeURIComponent(query)}&limit=15`);
  if (!json || !json.data) return [];

  return json.data.map(item => ({
    title: item.title,
    slug: item.slug,
    thumb: item.cover ? `https://backapi.oploverz.ac${item.cover}` : '/placeholder.svg',
    genres: item.genres ? item.genres.map(g => g.name) : [],
    status: item.status || 'Unknown',
    rating: item.rating || '?',
    source: 'Oploverz'
  }));
}

// 3. Get Details of a Series along with Episodes List
export async function getOploverzDetails(slug) {
  if (!OPLOVERZ_ENABLED) return null;
  const json = await fetchJson(`${BACK_API_URL}/series/${slug}`);
  if (!json || !json.data) return null;

  const item = json.data;
  const info = {
    'Judul': item.title,
    'Status': item.status || 'Ongoing',
    'Rating': item.rating || '?',
    'Tipe': item.type || 'TV',
    'Total Episode': item.totalEpisodes || item.episodeCount || '?',
    'Rilis': item.releaseDate ? new Date(item.releaseDate).toLocaleDateString('id-ID') : '?'
  };

  // Fetch episodes using series ID
  const epJson = await fetchJson(`${BACK_API_URL}/episodes?seriesId=${item.id}&limit=500`);
  const episodesData = epJson && epJson.data ? epJson.data : [];

  const episodes = episodesData.map(ep => ({
    title: `Episode ${ep.episodeNumber}: ${ep.title || 'Subtitle Indonesia'}`.trim(),
    slug: `oploverz-${slug}-episode-${ep.episodeNumber}`, // prepend source prefix to resolve correctly
    date: ep.releasedAt ? new Date(ep.releasedAt).toLocaleDateString('id-ID') : ''
  }));

  return {
    title: item.title,
    thumb: item.cover ? `https://backapi.oploverz.ac${item.cover}` : null,
    sinopsis: item.description || '',
    genres: item.genres ? item.genres.map(g => g.name) : [],
    episodes: episodes, // Sorted as returned (usually newest to oldest or vice-versa)
    info,
    source: 'Oploverz'
  };
}

// 4. Get Episode Streaming Details and Download Links
export async function getOploverzEpisode(seriesSlug, epNumber) {
  if (!OPLOVERZ_ENABLED) return null;
  // First, find the series detail to get the series ID
  const seriesJson = await fetchJson(`${BACK_API_URL}/series/${seriesSlug}`);
  if (!seriesJson || !seriesJson.data) return null;

  const seriesId = seriesJson.data.id;

  // Query episodes list matching the episode number
  const epsJson = await fetchJson(`${BACK_API_URL}/episodes?seriesId=${seriesId}&limit=500`);
  if (!epsJson || !epsJson.data) return null;

  const episode = epsJson.data.find(ep => String(ep.episodeNumber) === String(epNumber));
  if (!episode) return null;

  // Format mirror stream links
  const mirrors = episode.streamUrl ? episode.streamUrl.map((st, idx) => ({
    server: st.source || `Player ${idx + 1}`,
    content: st.url,
    quality: st.source && st.source.includes('720') ? '720p' : st.source && st.source.includes('1080') ? '1080p' : '480p'
  })) : [];

  // Format download lists
  const downloads = [];
  if (episode.downloadUrl && Array.isArray(episode.downloadUrl)) {
    episode.downloadUrl.forEach(dl => {
      const format = dl.format || 'Mp4';
      if (dl.resolutions && Array.isArray(dl.resolutions)) {
        dl.resolutions.forEach(res => {
          const quality = `${format.toUpperCase()} ${res.resolution || '480p'}`;
          const links = res.servers ? res.servers.map(srv => ({
            server: srv.name || 'Server',
            href: srv.url
          })) : [];
          if (links.length > 0) {
            downloads.push({ quality, links });
          }
        });
      }
    });
  }

  // Prev / Next Slugs logic
  const currentNum = parseFloat(epNumber);
  const prevEp = epsJson.data.find(ep => parseFloat(ep.episodeNumber) === currentNum - 1);
  const nextEp = epsJson.data.find(ep => parseFloat(ep.episodeNumber) === currentNum + 1);

  return {
    title: `${seriesJson.data.title} Episode ${epNumber}`,
    animeSlug: `oploverz-${seriesSlug}`,
    defaultStreamUrl: mirrors.length > 0 ? mirrors[0].content : '',
    mirrors,
    downloads,
    prevSlug: prevEp ? `oploverz-${seriesSlug}-episode-${prevEp.episodeNumber}` : null,
    nextSlug: nextEp ? `oploverz-${seriesSlug}-episode-${nextEp.episodeNumber}` : null,
    source: 'Oploverz'
  };
}

