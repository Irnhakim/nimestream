import { fetchHtml, parseSearchList } from '@/lib/scraper';
import { searchOploverz } from '@/lib/oploverzScraper';
import { searchAlqanime } from '@/lib/alqanimeScraper';
import { searchFromSource, getSourceConfig } from '@/lib/multiScraper';

const sourceKeys = [
  'donghua', 'samehadaku', 'animasu', 'zoronime', 'anoboy', 
  'nimegami', 'animeindo', 'animekuindo', 'winbu', 'kuramanime', 
  'animekompi', 'donghub', 'dramabox'
];

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q') || '';
  if (!q) {
    return Response.json([]);
  }
  
  try {
    const isPostId = /^\d+$/.test(q);
    const targetUrl = isPostId 
      ? `https://otakudesu.blog/?p=${q}`
      : `https://otakudesu.blog/?s=${encodeURIComponent(q)}&post_type=anime`;

    // Determine active dynamic sources
    const activeSources = sourceKeys.filter(k => getSourceConfig(k).enabled);

    // Fetch Otakudesu search, Oploverz search, and Alqanime search concurrently
    const promises = [
      fetchHtml(targetUrl).then(html => {
        if (isPostId && (html.includes('sinopc') || html.includes('infozin'))) {
          const slugMatch = html.match(/href=["']https?:\/\/(?:www\.)?otakudesu\.[^"']+\/anime\/([^"'\s>]+)\/?["']/i);
          const canonicalSlug = html.match(/link rel=["']canonical["'] href=["']https?:\/\/(?:www\.)?otakudesu\.[^"']+\/anime\/([^"'\s>]+)\/?["']/i);
          const slug = canonicalSlug?.[1] || slugMatch?.[1] || '';
          if (slug) {
            const titleMatch = html.match(/<h1 class="entry-title"[^>]*>([^<]+)<\/h1>/i) || html.match(/<title>([^<|]+)/i);
            const title = titleMatch ? titleMatch[1].replace('Subtitle Indonesia', '').trim() : 'Redirecting...';
            return [{ title, slug, status: 'Redirect', redirect: true }];
          }
        }
        return parseSearchList(html);
      }),
      searchOploverz(q),
      searchAlqanime(q),
      ...activeSources.map(key => searchFromSource(key, q))
    ];

    const results = await Promise.allSettled(promises);

    const otakuData = results[0].status === 'fulfilled' ? results[0].value : [];
    const oploverzData = results[1].status === 'fulfilled' ? results[1].value : [];
    const alqaData = results[2].status === 'fulfilled' ? results[2].value : [];

    // Map dynamic search results
    const dynamicSearchList = [];
    activeSources.forEach((key, idx) => {
      const resIndex = 3 + idx;
      const data = results[resIndex].status === 'fulfilled' ? results[resIndex].value : [];
      const displayName = key.charAt(0).toUpperCase() + key.slice(1);
      const normalized = data.map(item => ({
        ...item,
        slug: `${key}-${item.slug}`,
        source: displayName
      }));
      dynamicSearchList.push({ key, displayName, data: normalized });
    });

    // Deduplicate logic
    const merged = [];
    const normalizedOploverz = oploverzData.map(item => ({
      ...item,
      slug: `oploverz-${item.slug}`,
      source: 'Oploverz'
    }));

    const normalizedAlqanime = alqaData.map(item => ({
      ...item,
      slug: `alqanime-${item.slug}`,
      source: 'Alqanime'
    }));

    // Helper to get season number
    const getSeason = (titleStr) => {
      const t = titleStr.toLowerCase();
      const ordMatch = t.match(/(\d+)(?:st|nd|rd|th)\s+season/);
      if (ordMatch) return parseInt(ordMatch[1], 10);
      const seasonMatch = t.match(/season\s+(\d+)/);
      if (seasonMatch) return parseInt(seasonMatch[1], 10);
      const sMatch = t.match(/\bs(\d+)\b/);
      if (sMatch) return parseInt(sMatch[1], 10);
      return 1; // Default to season 1
    };

    // Helper function to normalize titles for matching (gets primary title segment)
    const cleanTitle = (t) => {
      let mainPart = t.split(/[:(]/)[0];
      return mainPart.toLowerCase()
        .replace(/subtitle indonesia|sub indo/gi, '')
        .replace(/season\s*\d+|s\d+/gi, '')
        .replace(/[^a-z0-9]/g, '')
        .trim();
    };

    // Strict overlap & season match checker
    const isSearchMatch = (t1, t2) => {
      if (getSeason(t1) !== getSeason(t2)) return false;
      const n1 = cleanTitle(t1);
      const n2 = cleanTitle(t2);
      return n1.includes(n2) || n2.includes(n1);
    };

    const allItems = [
      ...otakuData.map(item => ({ ...item, source: 'Otakudesu', originSlug: item.slug })),
      ...normalizedOploverz.map(item => ({ ...item, source: 'Oploverz', originSlug: item.slug })),
      ...normalizedAlqanime.map(item => ({ ...item, source: 'Alqanime', originSlug: item.slug })),
    ];
    dynamicSearchList.forEach(dyn => {
      allItems.push(...dyn.data.map(item => ({ ...item, source: dyn.displayName, originSlug: item.slug })));
    });

    const finalMerged = [];

    allItems.forEach(item => {
      // Find matching item in finalMerged based on title and season
      const existing = finalMerged.find(fItem => isSearchMatch(fItem.title, item.title));

      if (existing) {
        // Map slug to the appropriate mirror key
        if (item.source === 'Oploverz') {
          existing.mirrorSlug = item.originSlug;
        } else if (item.source === 'Alqanime') {
          existing.mirrorSlugAlqanime = item.originSlug;
        } else if (item.source !== 'Otakudesu') {
          existing[`mirrorSlug${item.source}`] = item.originSlug;
        }
        
        // Use better thumbnail if current is missing/placeholder
        if ((!existing.thumb || existing.thumb.includes('placeholder')) && item.thumb && !item.thumb.includes('placeholder')) {
          existing.thumb = item.thumb;
        }
        // Update status if current is unknown/empty
        if ((!existing.status || existing.status === '?' || existing.status === 'Unknown') && item.status && item.status !== 'Unknown') {
          existing.status = item.status;
        }
      } else {
        // Create new merged item
        const newItem = {
          title: item.title,
          slug: item.originSlug,
          thumb: item.thumb,
          status: item.status,
          source: item.source
        };

        if (item.source === 'Oploverz') {
          newItem.mirrorSlug = item.originSlug;
        } else if (item.source === 'Alqanime') {
          newItem.mirrorSlugAlqanime = item.originSlug;
        } else if (item.source !== 'Otakudesu') {
          newItem[`mirrorSlug${item.source}`] = item.originSlug;
        }

        finalMerged.push(newItem);
      }
    });

    return Response.json(finalMerged);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
