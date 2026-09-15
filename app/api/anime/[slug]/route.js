import { fetchHtml, parseAnimeDetails, parseSearchList } from '@/lib/scraper';
import { getFileCache, setFileCache, deleteFileCache } from '@/lib/fileCache';
import { getOploverzDetails } from '@/lib/oploverzScraper';
import { getAlqanimeDetails } from '@/lib/alqanimeScraper';
import { getDetailsFromSource } from '@/lib/multiScraper';

const sourceKeys = [
  'donghua', 'samehadaku', 'animasu', 'zoronime', 'anoboy',
  'nimegami', 'animeindo', 'animekuindo', 'winbu', 'kuramanime',
  'animekompi', 'donghub', 'dramabox'
];

// Helper to extract episode number from string (e.g., "Episode 11", "Ep. 09", or "11")
function extractEpNumber(str) {
  if (!str) return 0;
  const match = str.match(/(?:episode|ep)\s*\.?\s*(\d+(?:\.\d+)?)/i);
  if (match) return parseFloat(match[1]);
  const allNums = str.match(/(\d+(?:\.\d+)?)/g);
  if (allNums && allNums.length > 0) {
    return parseFloat(allNums[allNums.length - 1]);
  }
  return 0;
}

// Find corresponding ongoing item for this anime slug
function findOngoingItem(slug, ongoingList) {
  if (!ongoingList || !Array.isArray(ongoingList)) return null;

  // Exact slug match
  let found = ongoingList.find(item => item.slug === slug);
  if (found) return found;

  // Clean slug match (without sub-indo / prefixes)
  const cleanCurrent = slug
    .replace(/^([a-z0-9]+-)/, '')
    .replace(/-sub-indo$/i, '')
    .replace(/-subtitle-indonesia$/i, '');

  found = ongoingList.find(item => {
    if (!item.slug) return false;
    const cleanItem = item.slug
      .replace(/^([a-z0-9]+-)/, '')
      .replace(/-sub-indo$/i, '')
      .replace(/-subtitle-indonesia$/i, '');
    return cleanItem === cleanCurrent;
  });

  return found || null;
}

// Samakan dengan durasi cache ongoing list (1 jam)
const ANIME_CACHE_TTL = 1 * 60 * 60 * 1000; // 1 hour (sama seperti ongoing)

export async function GET(request, { params }) {
  const { slug } = await params;
  if (!slug) {
    return Response.json({ error: 'Missing slug' }, { status: 400 });
  }

  // Dukung query parameter ?refresh=true untuk bypass/paksa update jika ada episode baru
  const { searchParams } = new URL(request.url);
  const forceRefresh = searchParams.get('refresh') === 'true';

  // Ambil cache ongoing_list untuk mendeteksi episode terbaru yang tampil di beranda
  const ongoingList = getFileCache('ongoing_list', 24 * 60 * 60 * 1000) || [];
  const ongoingMatch = findOngoingItem(slug, ongoingList);
  const ongoingEpNum = ongoingMatch ? extractEpNumber(ongoingMatch.ep) : 0;

  const cacheKey = `anime_detail_${slug}`;
  let cached = !forceRefresh ? getFileCache(cacheKey, ANIME_CACHE_TTL) : null;

  // Jika ada cache tapi episode di ongoing lebih baru daripada episode yang ada di cache:
  // Bypass cache agar detail anime di-fetch ulang (mungkin otakudesu baru update halamannya)
  if (cached && ongoingEpNum > 0 && Array.isArray(cached.episodes)) {
    const cachedMaxEp = cached.episodes.reduce((max, ep) => Math.max(max, extractEpNumber(ep.title)), 0);
    if (ongoingEpNum > cachedMaxEp) {
      cached = null; // Invalidate cache untuk ambil data terbaru dari source
    }
  }

  if (cached) {
    return Response.json(cached);
  }

  let data = null;
  let originSource = 'Otakudesu';
  let matchedKey = null;

  // Detect which source the slug belongs to
  for (const key of sourceKeys) {
    if (slug.startsWith(`${key}-`)) {
      matchedKey = key;
      break;
    }
  }

  try {
    if (matchedKey) {
      originSource = matchedKey.charAt(0).toUpperCase() + matchedKey.slice(1);
      const realSlug = slug.replace(`${matchedKey}-`, '');
      data = await getDetailsFromSource(matchedKey, realSlug);
    } else if (slug.startsWith('oploverz-')) {
      originSource = 'Oploverz';
      const realSlug = slug.replace('oploverz-', '');
      data = await getOploverzDetails(realSlug);
    } else if (slug.startsWith('alqanime-')) {
      originSource = 'Alqanime';
      const realSlug = slug.replace('alqanime-', '');
      data = await getAlqanimeDetails(realSlug);
    } else {
      // Otakudesu
      const html = await fetchHtml(`https://otakudesu.blog/anime/${slug}/`);
      data = parseAnimeDetails(html, slug);
    }

    if (!data) {
      return Response.json({ error: 'Anime not found' }, { status: 404 });
    }

    data.slug = slug;

    // SINKRONISASI OTOMATIS EPISODE TERBARU DARI ONGOING/BERANDA (OPSI 3)
    // Jika data ongoing memiliki episode yang lebih baru daripada daftar episode di detail
    // (misal admin sumber sudah posting episode baru di homepage tapi belum update list di halaman anime),
    // sisipkan episode tersebut secara sintetis agar user langsung bisa menontonnya.
    if (ongoingEpNum > 0 && Array.isArray(data.episodes)) {
      const currentMaxEp = data.episodes.reduce((max, ep) => Math.max(max, extractEpNumber(ep.title)), 0);
      if (ongoingEpNum > currentMaxEp) {
        // Cari contoh format slug dan title dari episode terakhir yang ada
        const lastEp = data.episodes[data.episodes.length - 1] || data.episodes[0];
        
        for (let epToInsert = currentMaxEp + 1; epToInsert <= ongoingEpNum; epToInsert++) {
          let synthSlug = '';
          let synthTitle = `${data.title} Episode ${epToInsert} Subtitle Indonesia`;
          
          if (lastEp && lastEp.slug) {
            // Ganti angka episode pada slug episode referensi (misal: otgsmbosd-s2-episode-7-sub-indo -> episode-8)
            const slugReplaced = lastEp.slug.replace(/(-episode-|-ep-)\d+/i, `$1${epToInsert}`);
            if (slugReplaced !== lastEp.slug) {
              synthSlug = slugReplaced;
            }
          }
          
          // Jika tidak bisa derive dari slug referensi, gunakan pola standar
          if (!synthSlug) {
            if (matchedKey) {
              synthSlug = `${matchedKey}-${slug.replace(`${matchedKey}-`, '')}-episode-${epToInsert}`;
            } else if (slug.startsWith('oploverz-')) {
              synthSlug = `oploverz-${slug.replace('oploverz-', '')}-episode-${epToInsert}`;
            } else if (slug.startsWith('alqanime-')) {
              synthSlug = `alqanime-${slug.replace('alqanime-', '')}-episode-${epToInsert}`;
            } else {
              synthSlug = `${slug}-episode-${epToInsert}-sub-indo`;
            }
          }

          data.episodes.push({
            title: synthTitle,
            slug: synthSlug,
            date: ongoingMatch?.date || 'Baru Rilis'
          });
        }
      }
    }

    // Smart Recommendation System (Genre matching)
    let recommendations = [];
    const targetGenres = data.genres || [];

    if (targetGenres.length > 0) {
      try {
        const ongoingList = getFileCache('ongoing_list', 24 * 60 * 60 * 1000) || [];
        const completedList = getFileCache('completed_list', 24 * 60 * 60 * 1000) || [];
        const pool = [...ongoingList, ...completedList];
        
        if (pool.length > 0) {
          const scored = pool
            .filter(item => item.slug !== slug)
            .map(item => {
              let score = 0;
              const cleanTargetTitle = data.title.toLowerCase().replace(/[^a-z0-9\s]/g, '');
              const cleanItemTitle = item.title.toLowerCase().replace(/[^a-z0-9\s]/g, '');
              
              const targetWords = cleanTargetTitle.split(' ').filter(w => w.length > 3);
              const itemWords = cleanItemTitle.split(' ').filter(w => w.length > 3);
              
              const commonWords = targetWords.filter(w => itemWords.includes(w));
              score += commonWords.length * 3;

              if (item.dayOrRating && /^\d+(\.\d+)?$/.test(item.dayOrRating)) {
                score += parseFloat(item.dayOrRating) * 0.1;
              }

              return { ...item, score };
            })
            .filter(item => item.score > 0 || Math.random() > 0.7)
            .sort((a, b) => b.score - a.score);

          const uniqueSlugs = new Set();
          for (const item of scored) {
            if (!uniqueSlugs.has(item.slug)) {
              uniqueSlugs.add(item.slug);
              recommendations.push(item);
            }
            if (recommendations.length >= 6) break;
          }
        }
      } catch (err) {
        console.error('Failed to generate smart recommendations:', err);
      }
    }

    data.recommendations = recommendations;

    setFileCache(cacheKey, data);
    return Response.json(data);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
