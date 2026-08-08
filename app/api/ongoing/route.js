import { fetchHtml, parseHomeList } from '@/lib/scraper';
import { getFileCache, setFileCache } from '@/lib/fileCache';
import { getLatestOploverz, OPLOVERZ_ENABLED } from '@/lib/oploverzScraper';
import { getLatestAlqanime, ALQANIME_ENABLED } from '@/lib/alqanimeScraper';
import { getLatestFromSource, getSourceConfig } from '@/lib/multiScraper';

const ONE_HOUR_MS = 1 * 60 * 60 * 1000;
const CACHE_KEY = 'ongoing_list';

// Dynamic multi-source keys from config
const sourceKeys = [
  'donghua', 'samehadaku', 'animasu', 'zoronime', 'anoboy', 
  'nimegami', 'animeindo', 'animekuindo', 'winbu', 'kuramanime', 
  'animekompi', 'donghub', 'dramabox'
];

export async function GET() {
  const cachedData = getFileCache(CACHE_KEY, ONE_HOUR_MS);
  if (cachedData) {
    let filtered = cachedData;
    // Filter out disabled sources dynamically to prevent ghost data
    if (!OPLOVERZ_ENABLED) {
      filtered = filtered.filter(item => item.source !== 'Oploverz');
    }
    if (!ALQANIME_ENABLED) {
      filtered = filtered.filter(item => item.source !== 'Alqanime');
    }
    
    // Dynamically filter disabled multi-sources
    for (const key of sourceKeys) {
      const conf = getSourceConfig(key);
      if (!conf.enabled) {
        const displayName = key.charAt(0).toUpperCase() + key.slice(1);
        filtered = filtered.filter(item => item.source !== displayName);
      }
    }
    return Response.json(filtered);
  }

  try {
    // Determine which dynamic sources are enabled to query them
    const activeSources = sourceKeys.filter(k => getSourceConfig(k).enabled);

    // Fetch all active source updates concurrently
    const promises = [
      fetchHtml('https://otakudesu.blog/').then(html => parseHomeList(html, 'ongoing')),
      getLatestOploverz(),
      getLatestAlqanime(),
      ...activeSources.map(key => getLatestFromSource(key))
    ];

    const results = await Promise.allSettled(promises);

    const otakuData = results[0].status === 'fulfilled' ? results[0].value : [];
    const oploverzData = results[1].status === 'fulfilled' ? results[1].value : [];
    const alqaData = results[2].status === 'fulfilled' ? results[2].value : [];

    // Helper to calculate weekday name
    const getTodayName = () => {
      const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
      return days[new Date().getDay()];
    };

    // Helper to calculate today formatted date string (e.g. "08 Agu")
    const getTodayDateString = () => {
      const d = new Date();
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
      const day = String(d.getDate()).padStart(2, '0');
      return `${day} ${months[d.getMonth()]}`;
    };

    const todayName = getTodayName();
    const todayDateStr = getTodayDateString();

    // Map dynamic sources data
    const dynamicDataList = [];
    activeSources.forEach((key, idx) => {
      const resIndex = 3 + idx;
      const data = results[resIndex].status === 'fulfilled' ? results[resIndex].value : [];
      
      const displayName = key.charAt(0).toUpperCase() + key.slice(1);
      const normalized = data.map(item => ({
        ...item,
        slug: `${key}-${item.slug}`,
        source: displayName,
        dayOrRating: todayName,
        date: item.date && item.date !== 'Update' ? item.date : todayDateStr
      }));
      dynamicDataList.push({ key, displayName, data: normalized });
    });

    // Add source tag and normalize slugs for Oploverz items
    const normalizedOploverz = oploverzData.map(item => ({
      ...item,
      slug: `oploverz-${item.slug}`,
      source: 'Oploverz',
      dayOrRating: todayName,
      date: item.date && item.date !== 'Ongoing' ? item.date : todayDateStr
    }));

    // Add source tag and normalize slugs for Alqanime items
    const normalizedAlqanime = alqaData.map(item => ({
      ...item,
      slug: `alqanime-${item.slug}`,
      source: 'Alqanime',
      dayOrRating: todayName,
      date: item.date && item.date !== 'Update' ? item.date : todayDateStr
    }));

    // Deduplicate logic
    const merged = [];
    const matchedOploverzSlugs = new Set();
    const matchedAlqanimeSlugs = new Set();
    
    // Unique check to deduplicate Otakudesu internal same-slug items
    const uniqueOtakuData = [];
    const seenOtakuSlugs = new Set();
    otakuData.forEach(item => {
      if (!seenOtakuSlugs.has(item.slug)) {
        seenOtakuSlugs.add(item.slug);
        uniqueOtakuData.push(item);
      }
    });

    // Track matched slugs for dynamic sources
    const matchedDynamicSlugs = {};
    activeSources.forEach(key => {
      matchedDynamicSlugs[key] = new Set();
    });

    // Helper to normalize titles and get core keywords (first 2 words + season info if present)
    const getCoreKeywords = (title) => {
      const clean = title.toLowerCase()
        .replace(/\([^)]*\)/g, '')
        .replace(/subtitle indonesia|sub indo/gi, '') // DO NOT strip 'season' or 's\d+' to keep them distinct
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
      
      const words = clean.split(' ').filter(w => w.length > 1);
      // Return first 2 words plus any season number tag if present to keep seasons separate
      const base = words.slice(0, 2).join(' ');
      const seasonMatch = clean.match(/season\s*(\d+)|s\s*(\d+)/i);
      if (seasonMatch) {
        return `${base} s${seasonMatch[1] || seasonMatch[2]}`;
      }
      return base;
    };

    uniqueOtakuData.forEach(otakuItem => {
      const otakuCore = getCoreKeywords(otakuItem.title);
      const updatedItem = { ...otakuItem };

      // Try matching Oploverz
      const opMatch = normalizedOploverz.find(opItem => {
        if (matchedOploverzSlugs.has(opItem.slug)) return false;
        const opCore = getCoreKeywords(opItem.title);
        return otakuCore.length > 0 && opCore.length > 0 && (otakuCore.includes(opCore) || opCore.includes(otakuCore));
      });

      if (opMatch) {
        matchedOploverzSlugs.add(opMatch.slug);
        updatedItem.mirrorSlug = opMatch.slug;
      }

      // Try matching Alqanime
      const alqaMatch = normalizedAlqanime.find(alqaItem => {
        if (matchedAlqanimeSlugs.has(alqaItem.slug)) return false;
        const alqaCore = getCoreKeywords(alqaItem.title);
        return otakuCore.length > 0 && alqaCore.length > 0 && (otakuCore.includes(alqaCore) || alqaCore.includes(otakuCore));
      });

      if (alqaMatch) {
        matchedAlqanimeSlugs.add(alqaMatch.slug);
        updatedItem.mirrorSlugAlqanime = alqaMatch.slug;
      }

      // Try matching dynamic sources
      dynamicDataList.forEach(dyn => {
        const match = dyn.data.find(dynItem => {
          if (matchedDynamicSlugs[dyn.key].has(dynItem.slug)) return false;
          const dynCore = getCoreKeywords(dynItem.title);
          return otakuCore.length > 0 && dynCore.length > 0 && (otakuCore.includes(dynCore) || dynCore.includes(otakuCore));
        });

        if (match) {
          matchedDynamicSlugs[dyn.key].add(match.slug);
          // Dynamically attach mirror attributes (e.g. mirrorSlugSamehadaku)
          const attrName = `mirrorSlug${dyn.displayName}`;
          updatedItem[attrName] = match.slug;
        }
      });

      merged.push(updatedItem);
    });

    // Helper to check if an item is strictly ongoing (not batch/movie/completed)
    const isStrictlyOngoing = (item) => {
      const titleLower = item.title.toLowerCase();
      // Skip completed batches, movies, bds, and explicitly marked completed posts
      const isCompleted = titleLower.includes('batch') || 
                          titleLower.includes('movie') || 
                          titleLower.includes('bluray') || 
                          titleLower.includes(' bd') || 
                          titleLower.includes('tamat') ||
                          titleLower.includes('complete');
      return !isCompleted;
    };

    // Add remaining Oploverz items
    normalizedOploverz.forEach(opItem => {
      if (!matchedOploverzSlugs.has(opItem.slug) && isStrictlyOngoing(opItem)) {
        merged.push(opItem);
      }
    });

    // Add remaining Alqanime items
    normalizedAlqanime.forEach(alqaItem => {
      if (!matchedAlqanimeSlugs.has(alqaItem.slug) && isStrictlyOngoing(alqaItem)) {
        merged.push(alqaItem);
      }
    });

    // Add remaining dynamic sources items
    dynamicDataList.forEach(dyn => {
      dyn.data.forEach(dynItem => {
        if (!matchedDynamicSlugs[dyn.key].has(dynItem.slug) && isStrictlyOngoing(dynItem)) {
          merged.push(dynItem);
        }
      });
    });

    // Helper to parse date strings "07 Agu" to comparison timestamp values
    const parseToTimestamp = (dateStr) => {
      if (!dateStr || dateStr === 'Update') return 0;
      
      const currentYear = new Date().getFullYear();
      const monthMap = {
        'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'Mei': 4, 'Jun': 5,
        'Jul': 6, 'Agu': 7, 'Sep': 8, 'Okt': 9, 'Nov': 10, 'Des': 11
      };
      
      // If date is weekday name e.g. "Sabtu", fallback to current timestamp minus some hours to keep order
      if (/^[a-zA-Z]+$/.test(dateStr)) {
        return Date.now() - 3600000;
      }
      
      const match = dateStr.match(/(\d+)\s+([a-zA-Z]+)/);
      if (match) {
        const day = parseInt(match[1], 10);
        const monthName = match[2];
        const month = monthMap[monthName] !== undefined ? monthMap[monthName] : 0;
        return new Date(currentYear, month, day).getTime();
      }
      
      return 0;
    };

    // Sort ongoing list dynamically from newest to oldest date rilis
    merged.sort((a, b) => {
      const timeA = parseToTimestamp(a.date);
      const timeB = parseToTimestamp(b.date);
      return timeB - timeA; // Descending order
    });
    
    // Save to disk cache
    setFileCache(CACHE_KEY, merged);

    return Response.json(merged);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
