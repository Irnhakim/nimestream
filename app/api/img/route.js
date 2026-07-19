import { BASE_URL } from '@/lib/scraper';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const imageUrl = searchParams.get('url');

  if (!imageUrl) {
    return new Response('Missing url parameter', { status: 400 });
  }

  // Only allow proxying images from otakudesu domain for security
  const allowed = ['otakudesu.blog', 'otakudesu.cloud', 'otakudesu.ltd', 'i3.wp.com', 'i2.wp.com', 'i1.wp.com', 'i0.wp.com', 'cdn.otakudesu'];
  const isAllowed = allowed.some(domain => imageUrl.includes(domain));
  if (!isAllowed) {
    return new Response('Forbidden', { status: 403 });
  }

  try {
    const response = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': `${BASE_URL}/`,
        'Accept': 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      return new Response('Image not found', { status: 404 });
    }

    const contentType = response.headers.get('content-type') || 'image/jpeg';
    const imageBuffer = await response.arrayBuffer();

    return new Response(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=43200',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (err) {
    console.error('Image proxy error:', err);
    return new Response('Proxy error', { status: 500 });
  }
}
