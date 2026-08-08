import * as cheerio from 'cheerio';

// Helper to check if a source is enabled and read its URL dynamically
export const getSourceConfig = (sourceKey) => {
  const envKeyEnabled = `NEXT_PUBLIC_${sourceKey.toUpperCase()}_ENABLED`;
  const envKeyUrl = `NEXT_PUBLIC_${sourceKey.toUpperCase()}_URL`;
  
  return {
    enabled: process.env[envKeyEnabled] === 'true',
    url: process.env[envKeyUrl] || ''
  };
};

// Generic fetcher simulating clean headers
async function fetchHtml(url, sourceKey) {
  const config = getSourceConfig(sourceKey);
  if (!config.enabled || !config.url) return null;

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
    console.error(`MultiScraper fetch error on [${sourceKey}]: ${url}`, error.message);
    return null;
  }
}

// 1. Get Latest Anime List dynamically from standard WordPress Anime Themes
export async function getLatestFromSource(sourceKey) {
  const config = getSourceConfig(sourceKey);
  if (!config.enabled) return [];

  const html = await fetchHtml(`${config.url}/page/1/`, sourceKey);
  if (!html) return [];

  const $ = cheerio.load(html);
  const items = [];

  // Match common theme lists: Themesia (article.bs) or AnimeStream (div.utxt / div.listupd)
  const selectors = ['div.listupd article.bs', 'div.listupd div.utxt', 'div.listupd div.excstla li'];
  
  let found = false;
  for (const sel of selectors) {
    const elements = $(sel);
    if (elements.length > 0) {
      found = true;
      elements.each((i, el) => {
        const title = $(el).find('h2, h3, .title').first().text().trim();
        const href = $(el).find('a').first().attr('href') || '';
        const slug = href ? href.replace(/\/$/, '').split('/').pop() : '';
        const thumb = $(el).find('img').first().attr('src') || $(el).find('img').first().attr('data-src') || '';
        const ep = $(el).find('.epxs, .ep, .epnum').first().text().trim() || 'Episode ?';

        if (slug && title) {
          items.push({
            title,
            slug,
            thumb,
            ep,
            date: 'Update',
            source: sourceKey
          });
        }
      });
      break;
    }
  }

  // Fallback selector for generic wordpress layouts
  if (!found) {
    $('article, .post-item').each((i, el) => {
      const title = $(el).find('h2, h3, .entry-title').text().trim();
      const href = $(el).find('a').attr('href') || '';
      const slug = href ? href.replace(/\/$/, '').split('/').pop() : '';
      const thumb = $(el).find('img').attr('src') || '';
      if (slug && title) {
        items.push({
          title,
          slug,
          thumb,
          ep: 'Episode ?',
          date: 'Update',
          source: sourceKey
        });
      }
    });
  }

  return items;
}

// 2. Generic WordPress Search
export async function searchFromSource(sourceKey, query) {
  const config = getSourceConfig(sourceKey);
  if (!config.enabled) return [];

  const html = await fetchHtml(`${config.url}/?s=${encodeURIComponent(query)}`, sourceKey);
  if (!html) return [];

  const $ = cheerio.load(html);
  const items = [];

  $('div.listupd article.bs, div.listupd div.utxt, article, .post-item').each((i, el) => {
    const title = $(el).find('h2, h3, .title, .entry-title').first().text().trim();
    const href = $(el).find('a').first().attr('href') || '';
    const slug = href ? href.replace(/\/$/, '').split('/').pop() : '';
    const thumb = $(el).find('img').first().attr('src') || $(el).find('img').first().attr('data-src') || '';

    if (slug && title) {
      items.push({
        title,
        slug,
        thumb,
        genres: [],
        status: 'Unknown',
        rating: '?',
        source: sourceKey
      });
    }
  });

  return items;
}

// 3. Generic Details Parser
export async function getDetailsFromSource(sourceKey, slug) {
  const config = getSourceConfig(sourceKey);
  if (!config.enabled) return null;

  // Handle nested subfolders (like /anime/ or direct root post slugs)
  let html = await fetchHtml(`${config.url}/anime/${slug}/`, sourceKey);
  if (!html) {
    html = await fetchHtml(`${config.url}/${slug}/`, sourceKey);
  }
  if (!html) return null;

  const $ = cheerio.load(html);
  const title = $('.entry-title, h1.title, h1').first().text().trim();
  const thumb = $('.thumb img, img.wp-post-image, .cover img').first().attr('src') || '';
  const sinopsis = $('.entry-content p, .sinopsis p, .description p').first().text().trim() || $('.entry-content').text().trim();

  // Info content list
  const info = {};
  $('.info-content span, .info span, .details span').each((i, el) => {
    const text = $(el).text();
    if (text.includes(':')) {
      const parts = text.split(':');
      info[parts[0].trim()] = parts.slice(1).join(':').trim();
    }
  });

  // Genres
  const genres = [];
  $('.genxpage a, .genres a, .genre a').each((i, el) => {
    genres.push($(el).text().trim());
  });

  // Episode List
  const episodes = [];
  $('.eplister ul li, .episode-list ul li, .list-episodes ul li').each((i, el) => {
    const href = $(el).find('a').first().attr('href') || '';
    const epSlug = href ? href.replace(/\/$/, '').split('/').pop() : '';
    const epTitle = $(el).find('.epl-num, .ep-num').text().trim() + ' ' + $(el).find('.epl-title, .ep-title').text().trim();
    const epDate = $(el).find('.epl-date, .ep-date').text().trim();

    if (epSlug) {
      episodes.push({
        title: epTitle.trim() || `Episode ${i + 1}`,
        slug: `${sourceKey}-${epSlug}`, // prefix for unique resolution routing
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
    source: sourceKey
  };
}

// 4. Generic Episode Player and Mirror/Download parser
export async function getEpisodeFromSource(sourceKey, episodeSlug) {
  const config = getSourceConfig(sourceKey);
  if (!config.enabled) return null;

  const html = await fetchHtml(`${config.url}/${episodeSlug}/`, sourceKey);
  if (!html) return null;

  const $ = cheerio.load(html);
  const title = $('.entry-title, h1').first().text().trim();

  // Extract mirrors
  const mirrors = [];
  $('select.mirror option, select.player-select option').each((i, el) => {
    const val = $(el).attr('value');
    const name = $(el).text().trim();
    if (val) {
      let decoded = val;
      if (/^[a-zA-Z0-9+/={}\s]+$/.test(val)) {
        try {
          decoded = Buffer.from(val, 'base64').toString('ascii');
        } catch (e) {}
      }
      mirrors.push({
        server: name,
        content: decoded.includes('iframe') ? decoded.match(/src="([^"]+)"/)?.[1] || decoded : decoded,
        quality: '720p'
      });
    }
  });

  if (mirrors.length === 0) {
    const iframe = $('iframe').first().attr('src');
    if (iframe) {
      mirrors.push({
        server: 'Default Player',
        content: iframe,
        quality: '720p'
      });
    }
  }

  // Extract downloads (WordPress soralink structure)
  const downloads = [];
  $('.sorashare .soraurl, .download-links, .dl-links').each((i, el) => {
    const quality = $(el).find('strong, span, .quality').first().text().trim() || 'Resolusi ?';
    const links = [];
    $(el).find('a').each((j, linkEl) => {
      links.push({
        server: $(linkEl).text().trim() || 'Server',
        href: $(linkEl).attr('href') || ''
      });
    });
    if (links.length > 0) {
      downloads.push({ quality, links });
    }
  });

  // Pagination navigation
  const prevHref = $('.naveko .prev a, .navigation-links .prev a').attr('href') || '';
  const nextHref = $('.naveko .next a, .navigation-links .next a').attr('href') || '';
  const animeHref = $('.naveko .all a, .navigation-links .all a').attr('href') || '';

  const prevSlug = prevHref ? `${sourceKey}-${prevHref.replace(/\/$/, '').split('/').pop()}` : null;
  const nextSlug = nextHref ? `${sourceKey}-${nextHref.replace(/\/$/, '').split('/').pop()}` : null;
  const animeSlug = animeHref ? `${sourceKey}-${animeHref.replace(/\/$/, '').split('/').pop()}` : null;

  return {
    title,
    animeSlug,
    defaultStreamUrl: mirrors.length > 0 ? mirrors[0].content : '',
    mirrors,
    downloads,
    prevSlug,
    nextSlug,
    source: sourceKey
  };
}
