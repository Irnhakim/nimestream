const https = require('https');

const options = {
  hostname: 'backapi.oploverz.ac',
  path: '/api/series/one-piece',
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  }
};

let html = '';
https.get(options, res => {
  res.on('data', chunk => html += chunk);
  res.on('end', () => {
    try {
      const json = JSON.parse(html);
      console.log("Series keys:", Object.keys(json));
      if (json.data) {
        console.log("Series data keys:", Object.keys(json.data));
        console.log("Episodes isArray:", Array.isArray(json.data.episodes));
        if (Array.isArray(json.data.episodes)) {
          console.log("Episodes count:", json.data.episodes.length);
          if (json.data.episodes.length > 0) {
            console.log("First episode details keys:", Object.keys(json.data.episodes[0]));
            console.log("First episode sample:", json.data.episodes[0]);
          }
        }
      }
    } catch (e) {
      console.error("Parse error:", e.message);
      console.log("Raw response (first 200 chars):", html.substring(0, 200));
    }
  });
}).on('error', e => console.error("Request error:", e));
