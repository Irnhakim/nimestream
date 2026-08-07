const https = require('https');

const options = {
  hostname: 'otakudesu.blog',
  path: '/anime/classroom-of-the-elite-season-3/',
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  }
};

let html = '';
https.get(options, res => {
  res.on('data', chunk => html += chunk);
  res.on('end', () => {
    console.log("HTML length:", html.length);
    // Search for recommendation tags like 'recommend', 'rekomend', 'relts', etc.
    const startIdx = html.indexOf('rekomend');
    if (startIdx !== -1) {
      console.log("DUMP around rekomend:\n", html.substring(startIdx - 100, startIdx + 1200));
    } else {
      const startIdx2 = html.indexOf('recommend');
      if (startIdx2 !== -1) {
        console.log("DUMP around recommend:\n", html.substring(startIdx2 - 100, startIdx2 + 1200));
      } else {
        console.log("No recommendation keyword found in html.");
      }
    }
  });
}).on('error', e => console.error(e));
