const https = require('https');

const options = {
  hostname: 'kusonime.com',
  path: '/',
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  }
};

let html = '';
https.get(options, res => {
  res.on('data', chunk => html += chunk);
  res.on('end', () => {
    console.log("HTML length:", html.length);
    const startIdx = html.indexOf('class="pagination"');
    if (startIdx !== -1) {
      console.log("DUMP pagination:\n", html.substring(startIdx - 50, startIdx + 1200));
    } else {
      const startIdx2 = html.indexOf('page-numbers');
      if (startIdx2 !== -1) {
        console.log("DUMP page-numbers:\n", html.substring(startIdx2 - 100, startIdx2 + 1000));
      } else {
        console.log("Not found.");
      }
    }
  });
});
