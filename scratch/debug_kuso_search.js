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
    const startIdx = html.indexOf('class="content"');
    if (startIdx !== -1) {
      console.log("DUMP content:\n", html.substring(startIdx - 100, startIdx + 800));
    } else {
      console.log("Not found.");
    }
  });
}).on('error', e => console.error(e));
