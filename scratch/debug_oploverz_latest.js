const https = require('https');

const options = {
  hostname: 'backapi.oploverz.ac',
  path: '/api/episodes?limit=20',
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
      console.log("Response keys:", Object.keys(json));
      if (json.data && Array.isArray(json.data)) {
        console.log("Count returned:", json.data.length);
        console.log("First item data keys:", Object.keys(json.data[0]));
        console.log("First item series info:", json.data[0].series);
        console.log("First item title & episode:", {
          seriesTitle: json.data[0].series ? json.data[0].series.title : '?',
          seriesSlug: json.data[0].series ? json.data[0].series.slug : '?',
          epNumber: json.data[0].episodeNumber,
          releasedAt: json.data[0].releasedAt
        });
      }
    } catch (e) {
      console.error(e);
    }
  });
});
