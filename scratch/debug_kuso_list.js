const https = require('https');

const options = {
  hostname: 'kusonime.com',
  path: '/list-anime-batch-sub-indo/',
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  }
};

let html = '';
https.get(options, res => {
  res.on('data', chunk => html += chunk);
  res.on('end', () => {
    console.log("HTML length:", html.length);
    // Find list containers
    const startIdx = html.indexOf('class="daftarkartun"');
    if (startIdx !== -1) {
      const sub = html.substring(startIdx, startIdx + 30000);
      const ulIdx = sub.indexOf('<ul');
      if (ulIdx !== -1) {
        console.log("DUMP around ul tag:\n", sub.substring(ulIdx - 100, ulIdx + 1500));
      } else {
        console.log("No ul found. Dump first 1000 chars of daftarkartun content:\n", sub.substring(0, 1000));
      }
    } else {
      console.log("Not found.");
    }
  });
}).on('error', e => console.error(e));
