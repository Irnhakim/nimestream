import { fetchHtml, parseSearchList } from '@/lib/scraper';

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

    const html = await fetchHtml(targetUrl);
    
    // If it was a redirect to details page (which contains .sinopc or similar details structure)
    if (isPostId && (html.includes('sinopc') || html.includes('infozin'))) {
      // Parse details page slug and return it so client can directly navigate
      const slugMatch = html.match(/href=["']https?:\/\/(?:www\.)?otakudesu\.[^"']+\/anime\/([^"'\s>]+)\/?["']/i);
      const canonicalSlug = html.match(/link rel=["']canonical["'] href=["']https?:\/\/(?:www\.)?otakudesu\.[^"']+\/anime\/([^"'\s>]+)\/?["']/i);
      
      const slug = canonicalSlug?.[1] || slugMatch?.[1] || '';
      if (slug) {
        // Return structured item pointing to the target slug
        const titleMatch = html.match(/<h1 class="entry-title"[^>]*>([^<]+)<\/h1>/i) || html.match(/<title>([^<|]+)/i);
        const title = titleMatch ? titleMatch[1].replace('Subtitle Indonesia', '').trim() : 'Redirecting...';
        return Response.json([{ title, slug, status: 'Redirect', redirect: true }]);
      }
    }

    const data = parseSearchList(html);
    return Response.json(data);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
