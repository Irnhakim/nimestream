const https = require('https');

// We have the ID from 'one-piece' details. Let's fetch the detail first to get the series ID,
// then query the episodes endpoint using different patterns.

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
      const seriesId = json.data.id;
      console.log("Series ID for One Piece:", seriesId);

      // Now try to fetch the episodes list using the seriesId
      const epOptions = {
        hostname: 'backapi.oploverz.ac',
        path: `/api/episodes?seriesId=${seriesId}&limit=100`,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      };

      let epHtml = '';
      https.get(epOptions, epRes => {
        epRes.on('data', c => epHtml += c);
        epRes.on('end', () => {
          try {
            const epJson = JSON.parse(epHtml);
            console.log("Episodes API response keys:", Object.keys(epJson));
            if (epJson.data && Array.isArray(epJson.data)) {
              console.log("Episodes found count:", epJson.data.length);
              if (epJson.data.length > 0) {
                console.log("Sample Episode keys:", Object.keys(epJson.data[0]));
                console.log("Sample Episode data:", epJson.data[0]);
              }
            } else {
              console.log("Data is not an array or missing:", typeof epJson.data);
            }
          } catch (err) {
            console.log("Failed to parse episodes JSON:", err.message);
          }
        });
      });
    } catch (e) {
      console.error("Parse error:", e.message);
    }
  });
});
