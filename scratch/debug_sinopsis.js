const https = require('https');

const options = {
  hostname: 'otakudesu.blog',
  path: '/batch/tbna-batch-sub-indo/',
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  }
};

let html = '';
https.get(options, res => {
  res.on('data', chunk => html += chunk);
  res.on('end', () => {
    const matches = html.match(/class=["']([^"']*(?:batch|dl|down)[^"']*)["']/gi);
    console.log("Matches:", matches ? [...new Set(matches)].slice(0, 15) : "none");

    const startIdx = html.indexOf('class="batchlink"');
    if (startIdx !== -1) {
      console.log("DUMP around batchlink:\n", html.substring(startIdx - 100, startIdx + 1200));
    } else {
      const startIdx2 = html.indexOf('class="download"');
      if (startIdx2 !== -1) {
        console.log("DUMP around download:\n", html.substring(startIdx2 - 100, startIdx2 + 1200));
      } else {
        console.log("Not found.");
      }
    }
  });
}).on('error', e => console.error(e));
