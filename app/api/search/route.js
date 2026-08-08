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

    // Helper function to normalize titles for matching
    const cleanTitle = (t) => t.toLowerCase()
      .replace(/subtitle indonesia|sub indo|season|s\d+/gi, '')
      .replace(/[^a-z0-9]/g, '')
      .trim();

    const matchedOploverzSlugs = new Set();
    const matchedAlqanimeSlugs = new Set();
    const matchedDynamicSlugs = {};
    activeSources.forEach(key => {
      matchedDynamicSlugs[key] = new Set();
    });

    otakuData.forEach(otakuItem => {
      const otakuNorm = cleanTitle(otakuItem.title);
      const updatedItem = { ...otakuItem };
      
      // Find matching oploverz item
      const opMatch = normalizedOploverz.find(opItem => {
        if (matchedOploverzSlugs.has(opItem.slug)) return false;
        const opNorm = cleanTitle(opItem.title);
        return otakuNorm.includes(opNorm) || opNorm.includes(otakuNorm);
      });

      if (opMatch) {
        matchedOploverzSlugs.add(opMatch.slug);
        updatedItem.mirrorSlug = opMatch.slug;
      }

      // Find matching alqanime item
      const alqaMatch = normalizedAlqanime.find(alqaItem => {
        if (matchedAlqanimeSlugs.has(alqaItem.slug)) return false;
        const alqaNorm = cleanTitle(alqaItem.title);
        return otakuNorm.includes(alqaNorm) || alqaNorm.includes(otakuNorm);
      });

      if (alqaMatch) {
        matchedAlqanimeSlugs.add(alqaMatch.slug);
        updatedItem.mirrorSlugAlqanime = alqaMatch.slug;
      }

      // Find matching dynamic search results
      dynamicSearchList.forEach(dyn => {
        const match = dyn.data.find(dynItem => {
          if (matchedDynamicSlugs[dyn.key].has(dynItem.slug)) return false;
          const dynNorm = cleanTitle(dynItem.title);
          return otakuNorm.includes(dynNorm) || dynNorm.includes(otakuNorm);
        });

        if (match) {
          matchedDynamicSlugs[dyn.key].add(match.slug);
          const attrName = `mirrorSlug${dyn.displayName}`;
          updatedItem[attrName] = match.slug;
        }
      });

      merged.push(updatedItem);
    });

    // Gather all leftover items from all non-Otakudesu sources
    const leftovers = [];
    
    normalizedOploverz.forEach(opItem => {
      if (!matchedOploverzSlugs.has(opItem.slug)) {
        leftovers.push(opItem);
      }
    });

    normalizedAlqanime.forEach(alqaItem => {
      if (!matchedAlqanimeSlugs.has(alqaItem.slug)) {
        leftovers.push(alqaItem);
      }
    });

    dynamicSearchList.forEach(dyn => {
      dyn.data.forEach(dynItem => {
        if (!matchedDynamicSlugs[dyn.key].has(dynItem.slug)) {
          leftovers.push(dynItem);
        }
      });
    });

    // Deduplicate leftovers among themselves
    const uniqueLeftovers = [];
    const matchedLeftoverSlugs = new Set();

    leftovers.forEach(item => {
      if (matchedLeftoverSlugs.has(item.slug)) return;

      const norm = cleanTitle(item.title);
      const updatedItem = { ...item };
      matchedLeftoverSlugs.add(item.slug);

      // Find other leftovers with similar titles
      leftovers.forEach(other => {
        if (item.slug === other.slug || matchedLeftoverSlugs.has(other.slug)) return;

        const otherNorm = cleanTitle(other.title);
        // Fuzzy title comparison: first 2 words matching
        const words1 = norm.split(' ').slice(0, 2).join(' ');
        const words2 = otherNorm.split(' ').slice(0, 2).join(' ');

        // Visual cover check: extract image filename (E.g. Release-that-Witch.jpg)
        const getCoverFilename = (url) => {
          if (!url) return '';
          return decodeURIComponent(url).split('/').pop().split('?')[0].toLowerCase().replace(/-\d+x\d+/g, ''); // strip wordpress sizes
        };

        const cover1 = getCoverFilename(item.thumb);
        const cover2 = getCoverFilename(other.thumb);

        const isTitleMatch = words1.length > 2 && words2.length > 2 && (words1.includes(words2) || words2.includes(words1));
        const isCoverMatch = cover1.length > 5 && cover2.length > 5 && (cover1.includes(cover2) || cover2.includes(cover1));

        if (isTitleMatch || isCoverMatch) {
          matchedLeftoverSlugs.add(other.slug);
          
          // Map mirror key based on source name
          if (other.source === 'Oploverz') {
            updatedItem.mirrorSlug = other.slug;
          } else if (other.source === 'Alqanime') {
            updatedItem.mirrorSlugAlqanime = other.slug;
          } else {
            // Dynamic sources (E.g. Samehadaku -> mirrorSlugSamehadaku)
            const attrName = `mirrorSlug${other.source}`;
            updatedItem[attrName] = other.slug;
          }
        }
      });

      uniqueLeftovers.push(updatedItem);
    });

    // Append the unified unique leftovers
    merged.push(...uniqueLeftovers);

    return Response.json(merged);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
