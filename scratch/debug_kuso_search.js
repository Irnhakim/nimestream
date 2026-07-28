const https = require('https');

const options = {
  hostname: 'kusonime.com',
  path: '/?s=blue+lock&post_type=post',
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  }
};

let html = '';
https.get(options, res => {
  res.on('data', chunk => html += chunk);
  res.on('end', () => {
    const startIdx = html.indexOf('class="kover"');
    if (startIdx !== -1) {
      console.log("DUMP kover:\n", html.substring(startIdx, startIdx + 1200));
    } else {
      const startIdx2 = html.indexOf('class="thumb"');
      if (startIdx2 !== -1) {
        console.log("DUMP thumb:\n", html.substring(startIdx2 - 100, startIdx2 + 1000));
      } else {
        console.log("Not found. Dumping 1000 chars of HTML:");
        console.log(html.substring(0, 1000));
      }
    }
  });
}).on('error', e => console.error(e));
