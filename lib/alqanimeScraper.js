import * as cheerio from 'cheerio';

export const ALQANIME_ENABLED = process.env.NEXT_PUBLIC_ALQANIME_ENABLED === 'true';
const BASE_URL = process.env.NEXT_PUBLIC_ALQANIME_URL || 'https://alqanime.net';

// Helper fetch with agent headers to mimic browser request
async function fetchHtml(url) {
  if (!ALQANIME_ENABLED) return null;
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
      },
      cache: 'no-store'
    });
    if (!res.ok) return null;
    return await res.text();
  } catch (error) {
    console.error(`Alqanime fetch error on: ${url}`, error.message);
    return null;
  }
}

// 1. Get Latest Ongoing Anime List from Alqanime (WordPress Homepage /page/1/)
export async function getLatestAlqanime() {
  if (!ALQANIME_ENABLED) return [];
  const html = await fetchHtml(`${BASE_URL}/page/1/`);
  if (!html) return [];

  const $ = cheerio.load(html);
  const items = [];

  $('div.listupd:not(.popularslider) article.bs').each((i, el) => {
    const title = $(el).find('.tt h2').text().trim() || $(el).find('h2').text().trim();
    const href = $(el).find('a').attr('href') || '';
    const slug = href ? href.replace(/\/$/, '').split('/').pop() : '';
    const thumb = $(el).find('img').attr('src') || $(el).find('img').attr('data-src') || '';
    const epText = $(el).find('.epxs').text().trim(); // E.g. "Ep 12"

    if (slug) {
      items.push({
        title,
        slug,
        thumb,
        ep: epText || 'Episode ?',
        date: 'Update',
        source: 'Alqanime'
      });
    }
  });

  return items;
}

// 2. Search Anime from Alqanime
export async function searchAlqanime(query) {
  if (!ALQANIME_ENABLED) return [];
  const html = await fetchHtml(`${BASE_URL}/?s=${encodeURIComponent(query)}`);
  if (!html) return [];

  const $ = cheerio.load(html);
  const items = [];

  $('div.listupd article.bs').each((i, el) => {
    const title = $(el).find('.tt h2').text().trim() || $(el).find('h2').text().trim();
    const href = $(el).find('a').attr('href') || '';
    const slug = href ? href.replace(/\/$/, '').split('/').pop() : '';
    const thumb = $(el).find('img').attr('src') || $(el).find('img').attr('data-src') || '';
    
    if (slug) {
      items.push({
        title,
        slug,
        thumb,
        genres: [],
        status: 'Unknown',
        rating: '?',
        source: 'Alqanime'
      });
    }
  });

  return items;
}

// 3. Get Details of a Series along with Episodes List
export async function getAlqanimeDetails(slug) {
  if (!ALQANIME_ENABLED) return null;
  const html = await fetchHtml(`${BASE_URL}/anime/${slug}/`);
  if (!html) return null;

  const $ = cheerio.load(html);
  const title = $('.entry-title').text().trim() || $('h1').text().trim();
  const thumb = $('.thumb img').attr('src') || $('.thumb img').attr('data-src') || '';
  const sinopsis = $('.entry-content p').text().trim() || $('.entry-content').text().trim();

  // Info details parsing
  const info = {};
  $('.info-content span').each((i, el) => {
    const text = $(el).text();
    if (text.includes(':')) {
      const parts = text.split(':');
      const key = parts[0].trim();
      const val = parts.slice(1).join(':').trim();
      info[key] = val;
    }
  });

  // Genres
  const genres = [];
  $('.genxpage a').each((i, el) => {
    genres.push($(el).text().trim());
  });

  // Episodes List
  const episodes = [];
  $('.eplister ul li').each((i, el) => {
    const href = $(el).find('a').attr('href') || '';
    const epSlug = href ? href.replace(/\/$/, '').split('/').pop() : '';
    const epTitle = $(el).find('.epl-num').text().trim() + ' ' + $(el).find('.epl-title').text().trim();
    const epDate = $(el).find('.epl-date').text().trim();

    if (epSlug) {
      episodes.push({
        title: epTitle.trim(),
        slug: `alqanime-${epSlug}`, // prepend alqanime prefix
        date: epDate
      });
    }
  });

  return {
    title,
    thumb,
    sinopsis,
    genres,
    episodes,
    info,
    source: 'Alqanime'
  };
}

// 4. Get Episode Streaming Details and Download Links
export async function getAlqanimeEpisode(episodeSlug) {
  if (!ALQANIME_ENABLED) return null;
  const html = await fetchHtml(`${BASE_URL}/${episodeSlug}/`);
  if (!html) return null;

  const $ = cheerio.load(html);
  const title = $('.entry-title').text().trim() || $('h1').text().trim();

  // Stream mirrors extraction (from Themesia player selections)
  const mirrors = [];
  $('select.mirror option').each((i, el) => {
    const serverVal = $(el).attr('value');
    const serverName = $(el).text().trim();
    if (serverVal) {
      // Decode base64 mirror if encoded, standard themesia helper
      let decodedVal = serverVal;
      try {
        decodedVal = Buffer.from(serverVal, 'base64').toString('ascii');
      } catch (e) {}
      
      mirrors.push({
        server: serverName,
        content: decodedVal.includes('iframe') ? decodedVal.match(/src="([^"]+)"/)?.[1] || decodedVal : decodedVal,
        quality: '720p'
      });
    }
  });

  // Fallback direct iframe extraction if no mirror select list
  if (mirrors.length === 0) {
    const iframeSrc = $('iframe').attr('src');
    if (iframeSrc) {
      mirrors.push({
        server: 'Default Player',
        content: iframeSrc,
        quality: '720p'
      });
    }
  }

  // Download links extraction
  const downloads = [];
  $('.sorashare .soraurl').each((i, el) => {
    const quality = $(el).find('strong').text().trim() || 'Resolusi ?';
    const links = [];
    $(el).find('a').each((j, linkEl) => {
      links.push({
        server: $(linkEl).text().trim() || 'Download',
        href: $(linkEl).attr('href') || ''
      });
    });
    if (links.length > 0) {
      downloads.push({ quality, links });
    }
  });

  // Navigation slugs
  const prevHref = $('.naveko .prev a').attr('href') || '';
  const nextHref = $('.naveko .next a').attr('href') || '';
  const animeHref = $('.naveko .all a').attr('href') || '';

  const prevSlug = prevHref ? `alqanime-${prevHref.replace(/\/$/, '').split('/').pop()}` : null;
  const nextSlug = nextHref ? `alqanime-${nextHref.replace(/\/$/, '').split('/').pop()}` : null;
  const animeSlug = animeHref ? `alqanime-${animeHref.replace(/\/$/, '').split('/').pop()}` : null;

  return {
    title,
    animeSlug,
    defaultStreamUrl: mirrors.length > 0 ? mirrors[0].content : '',
    mirrors,
    downloads,
    prevSlug,
    nextSlug,
    source: 'Alqanime'
  };
}
