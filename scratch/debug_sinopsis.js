const https = require('https');

const options = {
  hostname: 'otakudesu.blog',
  path: '/anime/classroom-of-the-elite-season-4-sub-indo/',
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  }
};

let html = '';
https.get(options, res => {
  res.on('data', chunk => html += chunk);
  res.on('end', () => {
    const matches = html.match(/class=["']([^"']*(?:sinop|cukder)[^"']*)["']/gi);
    console.log("Matches found:", matches ? [...new Set(matches)] : "none");

    const startIdx = html.indexOf('class="sinopse"');
    if (startIdx !== -1) {
      console.log("DUMP sinopse:\n", html.substring(startIdx - 50, startIdx + 1500));
    } else {
      const idx2 = html.indexOf('class="sinopc"');
      if (idx2 !== -1) {
        console.log("DUMP sinopc:\n", html.substring(idx2 - 50, idx2 + 1500));
      } else {
        console.log("Not found.");
      }
    }
  });
}).on('error', e => console.error(e));
