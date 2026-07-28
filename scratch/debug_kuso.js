const https = require('https');

const options = {
  hostname: 'kusonime.com',
  path: '/bokuyaba-movie-subtitle-indonesia/',
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  }
};

let html = '';
https.get(options, res => {
  res.on('data', chunk => html += chunk);
  res.on('end', () => {
    console.log("HTML length:", html.length);
    // Find class names or structures
    const smokeClassMatches = html.match(/class=["']([^"']*(?:smoke|dl|bodz)[^"']*)["']/gi);
    console.log("Classes found:", smokeClassMatches ? [...new Set(smokeClassMatches)].slice(0, 15) : "none");

    const startIdx2 = html.indexOf("class='dlbodz'");
    if (startIdx2 !== -1) {
      console.log("DUMP dlbodz:\n", html.substring(startIdx2 - 100, startIdx2 + 1200));
    } else {
      const startIdx = html.indexOf('class="smokeddl"');
      if (startIdx !== -1) {
        console.log("DUMP smokeddl:\n", html.substring(startIdx - 100, startIdx + 1200));
      }
    }
  });
});
