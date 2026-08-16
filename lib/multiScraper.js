import * as cheerio from 'cheerio';
import { execFile } from 'child_process';
import { promisify } from 'util';
const execFilePromise = promisify(execFile);

// Helper to check if a source is enabled and read its URL dynamically
export const getSourceConfig = (sourceKey) => {
  const envKeyEnabled = `NEXT_PUBLIC_${sourceKey.toUpperCase()}_ENABLED`;
  const envKeyUrl = `NEXT_PUBLIC_${sourceKey.toUpperCase()}_URL`;
  
  return {
    enabled: process.env[envKeyEnabled] === 'true',
    url: process.env[envKeyUrl] || ''
  };
};

async function fetchHtmlWithCurl(url) {
  try {
    const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
    const { stdout } = await execFilePromise('curl', [
      '-H', `User-Agent: ${userAgent}`,
      '-s',
      '-L',
      url
    ], {
      timeout: 8000,
      maxBuffer: 15 * 1024 * 1024
    });
    return stdout;
  } catch (err) {
    console.error(`[MultiScraper Curl Fallback Error] Failed for ${url}:`, err.message);
    return null;
  }
}

// Generic fetcher simulating clean headers with quick timeout limits
async function fetchHtml(url, sourceKey) {
  const config = getSourceConfig(sourceKey);
  if (!config.enabled || !config.url) return null;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6000); // 6 seconds timeout limit

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
      },
      signal: controller.signal,
      cache: 'no-store'
    });
    clearTimeout(timeoutId);
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    return await res.text();
  } catch (error) {
    clearTimeout(timeoutId);
    console.warn(`[MultiScraper Fetch Warning] Standard fetch failed/timeout on [${sourceKey}]: ${url} (${error.message}). Attempting curl fallback...`);
    const curlHtml = await fetchHtmlWithCurl(url);
    if (curlHtml) {
      return curlHtml;
    }
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
        let rawTitle = $(el).find('h2, h3, .title').first().text().trim();
        const href = $(el).find('a').first().attr('href') || '';
        const slug = href ? href.replace(/\/$/, '').split('/').pop() : '';
        const thumb = $(el).find('img').first().attr('src') || $(el).find('img').first().attr('data-src') || '';
        
        // Extrapolate episode label text
        let epText = $(el).find('.epxs, .ep, .epnum').first().text().trim();
        let dateText = $(el).find('.date, .time, .released, .post-date').first().text().trim();

        // Convert standard date string "August 7, 2026" or "Aug 7, 2026" to "07 Agu"
        if (dateText) {
          const d = new Date(dateText);
          if (!isNaN(d.getTime())) {
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
            const day = String(d.getDate()).padStart(2, '0');
            dateText = `${day} ${months[d.getMonth()]}`;
          }
        }
        if (!dateText || dateText === 'Update') {
          dateText = 'Update';
        }

        // Regex split: e.g. "Soul Land Episode 629 Subtitle Indonesia", "Perfect World Ep 281"
        const epMatch = rawTitle.match(/(.*?)\s+(episode\s+\d+|ep\s*\.?\s*\d+|\b\d+\b\s*$)/i);
        let title = rawTitle;
        if (epMatch) {
          title = epMatch[1].trim();
          if (!epText || epText === 'Episode ?' || epText === '' || epText.includes('isode')) {
            const numPart = epMatch[2].match(/\d+/);
            epText = numPart ? `Episode ${numPart[0]}` : epMatch[2].trim();
          }
        }

        // Clean trailing tags like "Subtitle Indonesia" or "Sub Indo"
        title = title.replace(/\s*(subtitle indonesia|sub indo)\s*$/gi, '').trim();

        // Standardize episode format E.g. "Ep 165" or "165" -> "Episode 165"
        if (epText) {
          const numOnly = epText.match(/\d+/);
          epText = numOnly ? `Episode ${numOnly[0]}` : epText;
        }

        // Fallback: Parse slug digits if epText is still failed
        if (!epText || epText === 'Episode ?' || epText === '') {
          const slugEpMatch = slug.match(/-episode-(\d+)/i) || slug.match(/-ep-(\d+)/i) || slug.match(/-(\d+)(?:-|$)/);
          if (slugEpMatch) {
            epText = `Episode ${slugEpMatch[1]}`;
          }
        }

        if (slug && title) {
          items.push({
            title,
            slug,
            thumb,
            ep: epText || 'Episode ?',
            date: dateText,
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

  // Clean episode format from slug to resolve series detail page E.g. anime-name-episode-14 -> anime-name
  let cleanSlug = slug
    .replace(/-episode-\d+.*$/i, '')
    .replace(/-ep-\d+.*$/i, '')
    .replace(/-sub-indo.*$/i, '')
    .replace(/-subtitle-indonesia.*$/i, '');

  let html = await fetchHtml(`${config.url}/anime/${cleanSlug}/`, sourceKey);
  if (!html) {
    html = await fetchHtml(`${config.url}/${cleanSlug}/`, sourceKey);
  }
  
  // Try fallback with the original slug if cleanSlug failed
  if (!html && cleanSlug !== slug) {
    html = await fetchHtml(`${config.url}/anime/${slug}/`, sourceKey);
    if (!html) {
      html = await fetchHtml(`${config.url}/${slug}/`, sourceKey);
    }
  }
  if (!html) return null;

  const $ = cheerio.load(html);
  const title = $('.entry-title, h1.title, h1').first().text().trim();

  // Mismatch Protection: Verify parsed title contains at least one core word from requested cleanSlug
  const slugWords = cleanSlug.split('-').filter(w => w.length > 2);
  const titleLower = title.toLowerCase();
  const isMatch = slugWords.some(word => titleLower.includes(word));
  if (slugWords.length > 0 && !isMatch) {
    console.warn(`Mismatch protection triggered: Requested [${cleanSlug}], but parsed [${title}]. Aborting.`);
    return null;
  }

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

  if (sourceKey === 'nimegami') {
    $('.list_eps_stream li.select-eps').each((i, el) => {
      const epTitle = $(el).attr('title') || $(el).text().trim();
      const epNumMatch = epTitle.match(/(?:episode|ep)\s*(\d+)/i) || $(el).text().trim().match(/(\d+)/);
      const epNum = epNumMatch ? epNumMatch[1] : (i + 1);
      
      episodes.push({
        title: epTitle.startsWith('Episode') ? epTitle : `Episode ${epTitle}`,
        slug: `${sourceKey}-${cleanSlug}-episode-${epNum}`,
        date: ''
      });
    });
  } else {
    $('.eplister ul li, .episode-list ul li, .list-episodes ul li').each((i, el) => {
      const href = $(el).find('a').first().attr('href') || '';
      const epSlug = href ? href.replace(/\/$/, '').split('/').pop() : '';
      
      const epNum = $(el).find('.epl-num, .ep-num').text().trim();
      let epTitle = $(el).find('.epl-title, .ep-title').text().trim();

      if (!epTitle) {
        epTitle = epNum ? `Episode ${epNum}` : `Episode ${i + 1}`;
      } else if (epNum && !epTitle.startsWith(epNum) && !epTitle.toLowerCase().includes(`episode ${epNum}`)) {
        epTitle = `${epNum} ${epTitle}`;
      }

      const epDate = $(el).find('.epl-date, .ep-date').text().trim();

      if (epSlug) {
        episodes.push({
          title: epTitle.trim() || `Episode ${i + 1}`,
          slug: `${sourceKey}-${epSlug}`,
          date: epDate
        });
      }
    });
  }

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

  // Customized parser for Nimegami because it embeds all episodes on the parent anime details page
  if (sourceKey === 'nimegami') {
    const epNumMatch = episodeSlug.match(/-episode-(\d+)/i) || episodeSlug.match(/-ep-(\d+)/i);
    const epNumber = epNumMatch ? epNumMatch[1] : '1';
    const parentSlug = episodeSlug.split('-episode-')[0].split('-ep-')[0];

    const parentHtml = await fetchHtml(`${config.url}/${parentSlug}/`, sourceKey);
    if (!parentHtml) return null;

    const $ = cheerio.load(parentHtml);
    const title = ($('.entry-title, h1.title, h1').first().text().trim() || 'Nimegami Anime') + ` Episode ${epNumber}`;

    const mirrors = [];
    $('.list_eps_stream li.select-eps').each((i, el) => {
      const epTitle = $(el).attr('title') || $(el).text().trim();
      const thisEpNumMatch = epTitle.match(/(?:episode|ep)\s*(\d+)/i) || $(el).text().trim().match(/(\d+)/);
      const thisEpNum = thisEpNumMatch ? thisEpNumMatch[1] : (i + 1);

      if (parseFloat(thisEpNum) === parseFloat(epNumber)) {
        const rawData = $(el).attr('data');
        if (rawData) {
          try {
            const decodedJson = Buffer.from(rawData, 'base64').toString('ascii');
            const dataObj = JSON.parse(decodedJson);
            dataObj.forEach(item => {
              const quality = item.format || '720p';
              const urls = item.url || [];
              urls.forEach((streamUrl, idx) => {
                mirrors.push({
                  server: urls.length > 1 ? `Server ${idx + 1} (${quality})` : `Nimegami Stream (${quality})`,
                  content: streamUrl,
                  quality: quality
                });
              });
            });
          } catch (err) {
            console.error('Failed to parse Nimegami base64 stream links:', err.message);
          }
        }
      }
    });

    const downloads = [];
    let targetHeader = null;
    $('h4, h3, h5, h2').each((i, el) => {
      const text = $(el).text().toLowerCase();
      if (text.includes(`episode ${epNumber}`) || text.includes(`ep ${epNumber}`) || text.includes(`episode ${parseFloat(epNumber)}`)) {
        targetHeader = $(el);
        return false;
      }
    });

    if (targetHeader) {
      let nextEl = targetHeader.next();
      while (nextEl.length > 0 && !/^h[1-6]$/i.test(nextEl[0].tagName)) {
        nextEl.find('li').each((i, liEl) => {
          const quality = $(liEl).find('strong, span, .quality').first().text().trim() || 'Resolusi ?';
          const links = [];
          $(liEl).find('a').each((j, aEl) => {
            links.push({
              server: $(aEl).text().trim() || 'Server',
              href: $(aEl).attr('href') || ''
            });
          });
          if (links.length > 0) {
            downloads.push({ quality, links });
          }
        });
        nextEl = nextEl.next();
      }
    }

    const thumb = $('.thumb img, img.wp-post-image, .cover img, .poster img').first().attr('src') || '';

    return {
      title,
      animeSlug: `${sourceKey}-${parentSlug}`,
      thumb,
      defaultStreamUrl: mirrors.length > 0 ? mirrors[0].content : '',
      mirrors,
      downloads,
      prevSlug: parseFloat(epNumber) > 1 ? `${sourceKey}-${parentSlug}-episode-${parseFloat(epNumber) - 1}` : null,
      nextSlug: `${sourceKey}-${parentSlug}-episode-${parseFloat(epNumber) + 1}`,
      source: sourceKey
    };
  }

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
      
      let contentUrl = decoded;
      if (decoded.includes('iframe')) {
        contentUrl = decoded.match(/src=["']([^"']+)["']/)?.[1] || decoded;
      } else if (decoded.includes('href=')) {
        contentUrl = decoded.match(/href=["']([^"']+)["']/)?.[1] || decoded;
      }

      mirrors.push({
        server: name,
        content: contentUrl,
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

  // Extract thumbnail/cover image
  const thumb = $('.thumb img, img.wp-post-image, .cover img, .poster img').first().attr('src') || 
                $('.thumb img, img.wp-post-image, .cover img, .poster img').first().attr('data-src') || '';

  // Pagination navigation (Themesia & AnimeStream theme selectors)
  const prevHref = $('.nvs a[rel="prev"], .naveps a:contains("Prev"), .npage .prev a, .npv .prev a, .npvprev a, .naveko .prev a, .navigation-links .prev a').first().attr('href') || 
                   $('.nvs a:contains("Prev"), .npage a:contains("Prev"), .npage a:contains("Sebelumnya")').first().attr('href') || '';
                   
  const nextHref = $('.nvs a[rel="next"], .naveps a:contains("Next"), .npage .next a, .npv .next a, .npvnext a, .naveko .next a, .navigation-links .next a').first().attr('href') || 
                   $('.nvs a:contains("Next"), .npage a:contains("Next"), .npage a:contains("Selanjutnya")').first().attr('href') || '';
                   
  const animeHref = $('.nvs.nvsc a, .naveps a:contains("All"), .npage .all a, .npv .all a, .npage a.all, .naveko .all a, .naveko .back a, .navigation-links .all a, .npage a:contains("Series"), .npage a:contains("All")').first().attr('href') || '';

  const prevSlug = prevHref ? `${sourceKey}-${prevHref.replace(/\/$/, '').split('/').pop()}` : null;
  const nextSlug = nextHref ? `${sourceKey}-${nextHref.replace(/\/$/, '').split('/').pop()}` : null;
  
  // Clean anime slug E.g. samehadaku-anime-name-episode-12 -> samehadaku-anime-name
  let animeSlug = null;
  if (animeHref) {
    const rawAnimeSlug = animeHref.replace(/\/$/, '').split('/').pop();
    const cleanSeries = rawAnimeSlug
      .replace(/-episode-\d+.*$/i, '')
      .replace(/-ep-\d+.*$/i, '')
      .replace(/-sub-indo.*$/i, '')
      .replace(/-subtitle-indonesia.*$/i, '');
    animeSlug = `${sourceKey}-${cleanSeries}`;
  }

  return {
    title,
    animeSlug,
    thumb,
    defaultStreamUrl: mirrors.length > 0 ? mirrors[0].content : '',
    mirrors,
    downloads,
    prevSlug,
    nextSlug,
    source: sourceKey
  };
}

// 5. Scrape A-Z Anime List dynamically from standard WordPress Theme layouts
export async function getAnimeListFromSource(sourceKey) {
  const config = getSourceConfig(sourceKey);
  if (!config.enabled) return {};

  const html = await fetchHtml(`${config.url}/anime-list/`, sourceKey) || await fetchHtml(`${config.url}/anime/`, sourceKey);
  if (!html) return {};

  const $ = cheerio.load(html);
  const result = {};

  // Match alphabetical blocks (common Themesia/AnimeStream index templates)
  $('.letter-section, .listp, .list-anime, .list-index').each((i, block) => {
    // Find the grouping letter
    let letter = $(block).find('.letter, h4, h3, .idx').first().text().trim().toUpperCase();
    if (!letter) {
      // Fallback: try to guess letter from first item
      const firstItem = $(block).find('a').first().text().trim();
      letter = firstItem ? firstItem.charAt(0).toUpperCase() : '#';
    }

    if (!result[letter]) {
      result[letter] = [];
    }

    $(block).find('a.series, a.series-link, .soralist a, ul li a').each((j, el) => {
      const title = $(el).text().trim().replace(/\s*(subtitle indonesia|sub indo)\s*$/gi, '').trim();
      const href = $(el).attr('href') || '';
      const slug = href ? href.replace(/\/$/, '').split('/').pop() : '';

      if (slug && title && !title.includes('Episode') && !title.includes('Movie')) {
        // Prevent duplicate entries within the same letter list
        if (!result[letter].some(item => item.slug === `${sourceKey}-${slug}`)) {
          result[letter].push({
            title,
            slug: `${sourceKey}-${slug}`,
            source: sourceKey
          });
        }
      }
    });
  });

  // Fallback: If letter section parsing yields nothing, scrape all links on the list page
  if (Object.keys(result).length === 0) {
    $('a').each((i, el) => {
      const href = $(el).attr('href') || '';
      if (href.includes('/anime/') || href.includes('/manga/')) {
        const title = $(el).text().trim().replace(/\s*(subtitle indonesia|sub indo)\s*$/gi, '').trim();
        const slug = href.replace(/\/$/, '').split('/').pop();
        if (slug && title && title.length > 2 && !title.includes('Episode') && !title.includes('Home') && !title.includes('List')) {
          const letter = title.charAt(0).toUpperCase();
          if (!result[letter]) {
            result[letter] = [];
          }
          if (!result[letter].some(item => item.slug === `${sourceKey}-${slug}`)) {
            result[letter].push({
              title,
              slug: `${sourceKey}-${slug}`,
              source: sourceKey
            });
          }
        }
      }
    });
  }

  return result;
}
