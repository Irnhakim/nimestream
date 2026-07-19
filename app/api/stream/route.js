import * as cheerio from 'cheerio';

export async function POST(request) {
  try {
    const { content } = await request.json();
    if (!content) {
      return Response.json({ error: 'Missing content payload' }, { status: 400 });
    }

    // 1. Decode base64 payload
    const decodedPayload = JSON.parse(Buffer.from(content, 'base64').toString('utf-8'));
    
    // 2. Fetch Nonce from Otakudesu admin-ajax.php
    const nonceFormData = new URLSearchParams();
    nonceFormData.append('action', 'aa1208d27f29ca340c92c66d1926f13f');
    
    const nonceRes = await fetch('https://otakudesu.blog/wp-admin/admin-ajax.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Origin': 'https://otakudesu.blog',
        'Referer': 'https://otakudesu.blog/'
      },
      body: nonceFormData.toString()
    });
    
    const nonceData = await nonceRes.json();
    const nonce = nonceData.data;
    if (!nonce) {
      return Response.json({ error: 'Failed to retrieve nonce' }, { status: 500 });
    }

    // 3. Resolve stream using the retrieved nonce
    const streamFormData = new URLSearchParams();
    streamFormData.append('action', '2a3505c93b0035d3f455df82bf976b84');
    streamFormData.append('nonce', nonce);
    streamFormData.append('id', decodedPayload.id);
    streamFormData.append('i', decodedPayload.i);
    streamFormData.append('q', decodedPayload.q);

    const streamRes = await fetch('https://otakudesu.blog/wp-admin/admin-ajax.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Origin': 'https://otakudesu.blog',
        'Referer': 'https://otakudesu.blog/'
      },
      body: streamFormData.toString()
    });

    const streamData = await streamRes.json();
    const encodedHtml = streamData.data;
    if (!encodedHtml) {
      return Response.json({ error: 'Failed to retrieve resolved stream data' }, { status: 500 });
    }

    // 4. Decode resolved HTML and extract iframe src
    const decodedHtml = Buffer.from(encodedHtml, 'base64').toString('utf-8');
    const $ = cheerio.load(decodedHtml);
    const src = $('iframe').attr('src') || '';

    return Response.json({ html: decodedHtml, src });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
