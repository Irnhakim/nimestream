import * as cheerio from 'cheerio';

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

export const KUSONIME_URL = process.env.NEXT_PUBLIC_KUSONIME_URL || 'https://kusonime.com';
export const KUSONIME_ENABLED = process.env.NEXT_PUBLIC_KUSONIME_ENABLED === 'true';

// Safe fetch wrapper to prevent crashes if Kusonime is down or blocked
async function fetchKusonimeHtml(url) {
  if (!KUSONIME_ENABLED) return '';
  try {
    let targetUrl = url.startsWith('/') ? `${KUSONIME_URL}${url}` : url;
    
    // Replace domain to configured env
    if (url.includes('kusonime.com')) {
      targetUrl = url.replace(/https?:\/\/kusonime\.com/gi, KUSONIME_URL);
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000); // 8 seconds timeout

    const res = await fetch(targetUrl, {
      headers: { 'User-Agent': USER_AGENT },
      signal: controller.signal,
      cache: 'no-store'
    });
    
    clearTimeout(timeout);
    if (!res.ok) return '';
    return await res.text();
  } catch (error) {
    console.error('Kusonime fetch error:', error.message);
    return '';
  }
}

// Fetch latest batch posts from Kusonime homepage
export async function getLatestKusonime(page = 1) {
  if (!KUSONIME_ENABLED) return [];
  try {
    const url = page > 1 ? `${KUSONIME_URL}/page/${page}/` : `${KUSONIME_URL}/`;
    const html = await fetchKusonimeHtml(url);
    if (!html) return [];

    const $ = cheerio.load(html);
    const items = [];

    $('.venz .kover').each((i, el) => {
      const title = $(el).find('.content h2 a').text().trim();
      const href = $(el).find('.content h2 a').attr('href');
      const slug = href ? href.replace(/\/$/g, '').split('/').pop() : '';
      const imgEl = $(el).find('.thumb img');
      const thumb = imgEl.attr('src') || imgEl.attr('data-src') || imgEl.attr('data-lazy-src') || imgEl.attr('data-original') || null;
      const genres = [];
      $(el).find('.content .genre a').each((j, a) => {
        genres.push($(a).text().trim());
      });

      if (title && slug) {
        items.push({
          title,
          slug,
          thumb,
          genres,
          status: 'Batch',
          source: 'Kusonime'
        });
      }
    });

    return items;
  } catch (error) {
    console.error('Kusonime latest fetch error:', error);
    return [];
  }
}

// Search anime from Kusonime
export async function searchKusonime(query) {
  if (!KUSONIME_ENABLED || !query) return [];
  try {
    const searchUrl = `${KUSONIME_URL}/?s=${encodeURIComponent(query)}&post_type=post`;
    const html = await fetchKusonimeHtml(searchUrl);
    if (!html) return [];

    const $ = cheerio.load(html);
    const items = [];

    $('.venz .kover').each((i, el) => {
      const title = $(el).find('.content h2 a').text().trim();
      const href = $(el).find('.content h2 a').attr('href');
      const slug = href ? href.replace(/\/$/g, '').split('/').pop() : '';
      const imgEl = $(el).find('.thumb img');
      const thumb = imgEl.attr('src') || imgEl.attr('data-src') || imgEl.attr('data-lazy-src') || imgEl.attr('data-original') || null;
      const genres = [];
      $(el).find('.content .genre a').each((j, a) => {
        genres.push($(a).text().trim());
      });

      if (title && slug) {
        items.push({
          title,
          slug,
          thumb,
          genres,
          status: 'Batch',
          source: 'Kusonime'
        });
      }
    });

    return items;
  } catch (error) {
    console.error('Kusonime search error:', error);
    return [];
  }
}

// Parse Kusonime details and download links
export async function getKusonimeDetails(slug) {
  if (!KUSONIME_ENABLED || !slug) return null;
  try {
    const url = `${KUSONIME_URL}/${slug}/`;
    const html = await fetchKusonimeHtml(url);
    if (!html) return null;

    const $ = cheerio.load(html);
    const title = $('.post-thumb img').attr('title') || $('.jdlz').text().trim();
    const thumb = $('.post-thumb img').attr('src');
    const sinopsis = $('.lexot p').first().text().trim() || $('.lexot').text().trim().substring(0, 300) + '...';

    // Parse info metadata
    const info = {};
    $('.info p').each((i, el) => {
      const text = $(el).text();
      if (text.includes(':')) {
        const parts = text.split(':');
        const key = parts[0].trim();
        const val = parts.slice(1).join(':').trim();
        info[key] = val;
      }
    });

    // Parse batch download links
    const downloads = [];
    $('.dlbodz .smokeddlrh').each((i, block) => {
      const headerTitle = $(block).find('.smokettlrh').text().trim();
      const links = [];

      $(block).find('.smokeurlrh').each((j, linkRow) => {
        const quality = $(linkRow).find('strong').text().trim();
        const serverLinks = [];

        $(linkRow).find('a').each((k, a) => {
          const serverName = $(a).text().trim();
          const href = $(a).attr('href');
          if (serverName && href) {
            serverLinks.push({ server: serverName, url: href });
          }
        });

        if (quality && serverLinks.length > 0) {
          links.push({ quality, servers: serverLinks });
        }
      });

      if (links.length > 0) {
        downloads.push({
          title: headerTitle || 'Download Links',
          links
        });
      }
    });

    // If dlbodz wrapper is empty, try to parse fallback download list inside content body
    if (downloads.length === 0) {
      $('.lexot a').each((i, a) => {
        const href = $(a).attr('href');
        const text = $(a).text().trim();
        if (href && (href.includes('drive.google') || href.includes('mega.nz') || href.includes('mediafire'))) {
          downloads.push({
            title: text || 'Download Link',
            links: [{ quality: 'Batch', servers: [{ server: 'Mirror', url: href }] }]
          });
        }
      });
    }

    return {
      title,
      slug,
      thumb,
      sinopsis,
      info,
      downloads,
      source: 'Kusonime'
    };
  } catch (error) {
    console.error('Kusonime parse details error:', error);
    return null;
  }
}
