import { fetchHtml, parseSearchList } from '@/lib/scraper';
import { searchOploverz } from '@/lib/oploverzScraper';
import { searchAlqanime } from '@/lib/alqanimeScraper';

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

    // Fetch Otakudesu search, Oploverz search, and Alqanime search concurrently
    const [otakuResult, oploverzResult, alqaResult] = await Promise.allSettled([
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
      searchAlqanime(q)
    ]);

    const otakuData = otakuResult.status === 'fulfilled' ? otakuResult.value : [];
    const oploverzData = oploverzResult.status === 'fulfilled' ? oploverzResult.value : [];
    const alqaData = alqaResult.status === 'fulfilled' ? alqaResult.value : [];

    // Deduplicate logic
    const merged = [];
    const normalizedOploverz = oploverzData.map(item => ({
      ...item,
      slug: `oploverz-${item.slug}`
    }));

    const normalizedAlqanime = alqaData.map(item => ({
      ...item,
      slug: `alqanime-${item.slug}`
    }));

    // Helper function to normalize titles for matching
    const cleanTitle = (t) => t.toLowerCase()
      .replace(/subtitle indonesia|sub indo|season|s\d+/gi, '')
      .replace(/[^a-z0-9]/g, '')
      .trim();

    const matchedOploverzSlugs = new Set();
    const matchedAlqanimeSlugs = new Set();

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

      merged.push(updatedItem);
    });

    // Append remaining Oploverz items that were not merged
    normalizedOploverz.forEach(opItem => {
      if (!matchedOploverzSlugs.has(opItem.slug)) {
        merged.push(opItem);
      }
    });

    // Append remaining Alqanime items that were not merged
    normalizedAlqanime.forEach(alqaItem => {
      if (!matchedAlqanimeSlugs.has(alqaItem.slug)) {
        merged.push(alqaItem);
      }
    });

    return Response.json(merged);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
