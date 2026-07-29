const https = require('https');

const options = {
  hostname: 'otakudesu.blog',
  path: '/episode/classroom-of-the-elite-season-3-episode-13-sub-indo/',
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  }
};

let html = '';
https.get(options, res => {
  res.on('data', chunk => html += chunk);
  res.on('end', () => {
    console.log("HTML length:", html.length);
    // Find all images
    const imgMatches = html.match(/<img[^>]+src=["']([^"']+)["']/gi);
    console.log("Images found:", imgMatches ? imgMatches.slice(0, 10) : "none");

    const ogImage = html.match(/property=["']og:image["']\s+content=["']([^"']+)["']/i);
    console.log("OG Image:", ogImage ? ogImage[1] : "none");
    
    // Find back-link / parent anime link in the page
    const backLink = html.match(/href=["']https?:\/\/(?:www\.)?otakudesu\.[^"']+\/anime\/([^"'\s>]+)\/?["']/i);
    console.log("Back to anime slug:", backLink ? backLink[1] : "none");
  });
}).on('error', e => console.error(e));
