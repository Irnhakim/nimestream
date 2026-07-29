const https = require('https');

const options = {
  hostname: 'otakudesu.blog',
  path: '/episode/tsundere-akuyaku-reijou-liselotte-episode-1-sub-indo/',
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  }
};

let html = '';
https.get(options, res => {
  res.on('data', chunk => html += chunk);
  res.on('end', () => {
    const startIdx = html.indexOf('cukder');
    if (startIdx !== -1) {
      console.log("DUMP around cukder:\n", html.substring(startIdx - 100, startIdx + 1200));
    } else {
      const startIdx2 = html.indexOf('fotoanime');
      if (startIdx2 !== -1) {
        console.log("DUMP around fotoanime:\n", html.substring(startIdx2 - 100, startIdx2 + 1200));
      } else {
        console.log("Not found.");
      }
    }
  });
}).on('error', e => console.error(e));
