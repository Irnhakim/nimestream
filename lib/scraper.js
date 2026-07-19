import * as cheerio from 'cheerio';

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

export async function fetchHtml(url) {
  const res = await fetch(url, {
    headers: {
      'User-Agent': USER_AGENT
    },
    cache: 'no-store'
  });
  if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
  return await res.text();
}

export function parseHomeList(html, type = 'ongoing') {
  const $ = cheerio.load(html);
  const items = [];
  
  // Note: On Otakudesu, Ongoing is in the first .rseries.
  // Completed is in the second .rseries (if we select .rseries under .venutama).
  // Let's select by index:
  // index 0 -> Ongoing
  // index 1 -> Completed
  let section = $('.rseries').eq(0);
  if (type === 'completed') {
    section = $('.rseries').eq(1);
  }

  // To prevent nested matches, we select directly under this section
  section.find('.detpost').each((i, el) => {
    // If completed type, let's make sure it's inside the second .rseries
    const isInsideCompleted = $(el).parents('.rseries').length === 2;
    if (type === 'completed' && !isInsideCompleted) {
      return;
    }
    if (type === 'ongoing' && isInsideCompleted) {
      return;
    }

    const title = $(el).find('.thumb h2').text().trim();
    const href = $(el).find('a').attr('href');
    const slug = href ? href.split('/anime/')[1]?.replace(/\//g, '') : '';
    const ep = $(el).find('.epz').text().trim();
    const date = $(el).find('.newnime').text().trim();
    const thumb = $(el).find('.thumbz img').attr('src');
    const dayOrRating = $(el).find('.epztipe').text().trim();
    
    items.push({ title, slug, ep, date, thumb, dayOrRating });
  });
  
  return items;
}

export function parseSearchList(html) {
  const $ = cheerio.load(html);
  const items = [];
  
  $('.chivsrc li').each((i, el) => {
    const title = $(el).find('h2 a').text().trim();
    const href = $(el).find('h2 a').attr('href');
    const slug = href ? href.split('/anime/')[1]?.replace(/\//g, '') : '';
    const genres = [];
    $(el).find('.set').first().find('a').each((j, a) => {
      genres.push($(a).text().trim());
    });
    const status = $(el).find('.set').eq(1).text().replace('Status :', '').trim();
    const rating = $(el).find('.set').eq(2).text().replace('Rating :', '').trim();
    const thumb = $(el).find('img').attr('src');
    
    items.push({ title, slug, genres, status, rating, thumb });
  });
  
  return items;
}

export function parseAnimeDetails(html, slug) {
  const $ = cheerio.load(html);
  
  const info = {};
  $('.infozin p').each((i, el) => {
    const text = $(el).text();
    if (text.includes(':')) {
      const parts = text.split(':');
      const key = parts[0].trim().toLowerCase();
      const val = parts.slice(1).join(':').trim();
      info[key] = val;
    }
  });

  const title = info.judul 
    || $('h2:contains("Streaming")').text().replace('Streaming', '').replace('Sub Indo', '').trim()
    || $('title').text().split('|')[0].replace('Subtitle Indonesia', '').trim()
    || $('.infozw').prev().text().trim();

  const thumb = $('.fotoanime img').attr('src') 
    || $('.cukder img').attr('src')
    || $('.fotoanime img').attr('data-src')
    || $('.cukder img').attr('data-src');

  const sinopsis = $('.sinopc p').text().trim() 
    || $('.sinopse p').text().trim() 
    || $('.sinopc').text().trim()
    || $('.cukder').next().next().text().trim();
  
  const batchLink = $('a[href*="/batch/"]').first().attr('href') || null;
  const batchSlug = batchLink ? batchLink.split('/batch/')[1]?.replace(/\//g, '') : null;

  const episodes = [];
  $('.episodelist ul li, .episodelist li').each((i, el) => {
    const a = $(el).find('a');
    const epTitle = a.text().trim();
    const epHref = a.attr('href');
    const epSlug = epHref ? epHref.split('/episode/')[1]?.replace(/\//g, '') : '';
    const date = $(el).find('.ei-date').text().trim() || $(el).text().replace(epTitle, '').trim();
    
    if (epSlug) {
      episodes.push({ title: epTitle, slug: epSlug, date });
    }
  });
  
  return {
    title,
    thumb,
    info,
    sinopsis,
    batchSlug,
    episodes: episodes.reverse() // Display oldest first or keep newest first
  };
}

export function parseBatchDetails(html) {
  const $ = cheerio.load(html);
  
  const title = $('.posttl').text().trim() || $('title').text().split('|')[0].trim();
  
  const downloads = [];
  $('.download ul li, .download li').each((i, el) => {
    const quality = $(el).find('strong').text().trim();
    const links = [];
    $(el).find('a').each((j, a) => {
      const server = $(a).text().trim();
      const href = $(a).attr('href');
      if (server && href) {
        links.push({ server, href });
      }
    });
    if (quality && links.length > 0) {
      downloads.push({ quality, links });
    }
  });

  return {
    title,
    downloads
  };
}


export function parseEpisodeDetails(html) {
  const $ = cheerio.load(html);
  
  const title = $('.posttl').text().trim();
  const defaultStreamUrl = $('.responsive-embed-stream iframe').attr('src');
  
  // Parse Prev/Next links
  const prevUrl = $('.flir a[title="Episode Sebelumnya"]').attr('href') || $('.flir a:contains("Previous")').attr('href');
  const nextUrl = $('.flir a[title="Episode Selanjutnya"]').attr('href') || $('.flir a:contains("Next")').attr('href');
  const animeUrl = $('.flir a:contains("See All"), .flir a:contains("Semua Episode")').attr('href') || $('.flir a').eq(1).attr('href');
  
  const prevSlug = prevUrl ? prevUrl.split('/episode/')[1]?.replace(/\//g, '') : null;
  const nextSlug = nextUrl ? nextUrl.split('/episode/')[1]?.replace(/\//g, '') : null;
  const animeSlug = animeUrl ? animeUrl.split('/anime/')[1]?.replace(/\//g, '') : null;

  // Parse download links
  const downloads = [];
  $('.download ul li, .download li').each((i, el) => {
    // Quality is in <strong> tag
    const quality = $(el).find('strong').text().trim();
    const links = [];
    $(el).find('a').each((j, a) => {
      const server = $(a).text().trim();
      const href = $(a).attr('href');
      if (server && href) {
        links.push({ server, href });
      }
    });
    if (quality && links.length > 0) {
      downloads.push({ quality, links });
    }
  });

  // Parse mirror streams
  const mirrors = [];
  $('.mirrorstream ul').each((i, ul) => {
    const classAttr = $(ul).attr('class') || '';
    const quality = classAttr.replace('m', '').trim(); // e.g. m360p -> 360p
    $(ul).find('li a').each((j, a) => {
      const server = $(a).text().trim();
      const content = $(a).attr('data-content');
      if (server && content) {
        mirrors.push({
          quality,
          server,
          content // base64 encoded string containing {"id":...,"i":...,"q":...}
        });
      }
    });
  });

  return {
    title,
    defaultStreamUrl,
    prevSlug,
    nextSlug,
    animeSlug,
    downloads,
    mirrors
  };
}

export function parseAnimeList(html) {
  const $ = cheerio.load(html);
  const result = {};

  $('.bariskelom').each((i, el) => {
    const letter = $(el).find('.barispenz a').text().trim();
    if (!letter) return;
    
    const items = [];
    $(el).find('.penzbar .jdlbar ul li a').each((j, a) => {
      const title = $(a).text().trim();
      const href = $(a).attr('href');
      const slug = href ? href.split('/anime/')[1]?.replace(/\//g, '') : '';
      if (title && slug) {
        items.push({ title, slug });
      }
    });
    
    if (items.length > 0) {
      result[letter] = items;
    }
  });

  return result;
}

export function parseJadwalRilis(html) {
  const $ = cheerio.load(html);
  const result = {};

  $('.kglist321 h2').each((i, h2) => {
    const day = $(h2).text().trim();
    const items = [];
    
    $(h2).next('ul').find('li a').each((j, a) => {
      const title = $(a).text().trim();
      const href = $(a).attr('href');
      const slug = href ? href.split('/anime/')[1]?.replace(/\//g, '') : '';
      if (title && slug) {
        items.push({ title, slug });
      }
    });
    
    if (day && items.length > 0) {
      result[day] = items;
    }
  });

  return result;
}

export function parseGenreList(html) {
  const $ = cheerio.load(html);
  const genres = [];

  $('.genres li a, .genres a').each((i, a) => {
    const title = $(a).text().trim();
    const href = $(a).attr('href');
    const slug = href ? href.split('/genres/')[1]?.replace(/\//g, '') : '';
    if (title && slug) {
      genres.push({ title, slug });
    }
  });

  return genres;
}

export function parseGenreAnimeList(html) {
  const $ = cheerio.load(html);
  const items = [];
  
  $('.col-anime').each((i, el) => {
    const title = $(el).find('.col-anime-title a').text().trim();
    const href = $(el).find('.col-anime-title a').attr('href');
    const slug = href ? href.split('/anime/')[1]?.replace(/\//g, '') : '';
    const rating = $(el).find('.col-anime-rating').text().trim();
    const studio = $(el).find('.col-anime-studio').text().trim();
    const thumb = $(el).find('.col-anime-image img').attr('src');
    
    items.push({ title, slug, rating, studio, thumb });
  });

  // Fallback for search-like result page (e.g. if the genre page uses .chivsrc format)
  if (items.length === 0) {
    $('.chivsrc li').each((i, el) => {
      const title = $(el).find('h2 a').text().trim();
      const href = $(el).find('h2 a').attr('href');
      const slug = href ? href.split('/anime/')[1]?.replace(/\//g, '') : '';
      const rating = $(el).find('.set').eq(2).text().replace('Rating :', '').trim();
      const thumb = $(el).find('img').attr('src');
      items.push({ title, slug, rating, thumb });
    });
  }

  // Parse pagination
  const pagination = [];
  $('.pagination .page-numbers').each((i, el) => {
    const text = $(el).text().trim();
    const href = $(el).attr('href');
    const page = href ? href.split('/page/')[1]?.replace(/\//g, '') : null;
    pagination.push({ text, page, active: $(el).hasClass('current') });
  });

  return { items, pagination };
}

export function parseOngoingAnimeList(html) {
  const $ = cheerio.load(html);
  const items = [];

  $('.venutama .detpost').each((i, el) => {
    const title = $(el).find('.thumb h2').text().trim();
    const href = $(el).find('a').attr('href');
    const slug = href ? href.split('/anime/')[1]?.replace(/\//g, '') : '';
    const ep = $(el).find('.epz').text().trim();
    const date = $(el).find('.newnime').text().trim();
    const thumb = $(el).find('.thumbz img').attr('src');
    const dayOrRating = $(el).find('.epztipe').text().trim();
    
    items.push({ title, slug, ep, date, thumb, dayOrRating });
  });

  // Parse pagination
  const pagination = [];
  $('.pagination .page-numbers, .pagination a, .pagenavi .page-numbers, .pagenavi a').each((i, el) => {
    const text = $(el).text().trim();
    const href = $(el).attr('href');
    const page = href ? href.split('/page/')[1]?.replace(/\//g, '') : null;
    pagination.push({ text, page, active: $(el).hasClass('current') });
  });

  return { items, pagination };
}



