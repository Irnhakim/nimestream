import { fetchHtml, parseSearchList } from '@/lib/scraper';
import { searchOploverz } from '@/lib/oploverzScraper';

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

    // Fetch Otakudesu search and Oploverz search concurrently
    const [otakuResult, oploverzResult] = await Promise.allSettled([
      fetchHtml(targetUrl).then(html => {
        // If it was a redirect to details page (which contains .sinopc or similar details structure)
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
      searchOploverz(q)
    ]);

    const otakuData = otakuResult.status === 'fulfilled' ? otakuResult.value : [];
    const oploverzData = oploverzResult.status === 'fulfilled' ? oploverzResult.value : [];

    // Deduplicate logic
    const merged = [];
    const normalizedOploverz = oploverzData.map(item => ({
      ...item,
      slug: `oploverz-${item.slug}`
    }));

    // Helper function to normalize titles for matching
    const cleanTitle = (t) => t.toLowerCase()
      .replace(/subtitle indonesia|sub indo|season|s\d+/gi, '')
      .replace(/[^a-z0-9]/g, '')
      .trim();

    const matchedOploverzSlugs = new Set();

    otakuData.forEach(otakuItem => {
      const otakuNorm = cleanTitle(otakuItem.title);
      
      // Find matching oploverz item
      const match = normalizedOploverz.find(opItem => {
        if (matchedOploverzSlugs.has(opItem.slug)) return false;
        const opNorm = cleanTitle(opItem.title);
        return otakuNorm.includes(opNorm) || opNorm.includes(otakuNorm);
      });

      if (match) {
        matchedOploverzSlugs.add(match.slug);
        merged.push({
          ...otakuItem,
          // Attach mirrorSlug for frontend/detail router to fetch secondary source details
          mirrorSlug: match.slug
        });
      } else {
        merged.push(otakuItem);
      }
    });

    // Append remaining Oploverz items that were not merged
    normalizedOploverz.forEach(opItem => {
      if (!matchedOploverzSlugs.has(opItem.slug)) {
        merged.push(opItem);
      }
    });

    return Response.json(merged);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
