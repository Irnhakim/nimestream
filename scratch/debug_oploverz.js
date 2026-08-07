const https = require('https');

const options = {
  hostname: 'oploverz.site',
  path: '/',
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  }
};

let html = '';
https.get(options, res => {
  res.on('data', chunk => html += chunk);
  res.on('end', () => {
    console.log("HTML length:", html.length);
    
    // Look for sveltekit data payload or backapi references
    const scripts = [];
    let idx = 0;
    while ((idx = html.indexOf('<script', idx)) !== -1) {
      const endIdx = html.indexOf('</script>', idx);
      if (endIdx !== -1) {
        const scriptContent = html.substring(idx, endIdx + 9);
        if (scriptContent.includes('backapi') || scriptContent.includes('__svelte') || scriptContent.includes('json')) {
          scripts.push(scriptContent.substring(0, 300) + '... (truncated)');
        }
        idx = endIdx + 9;
      } else {
        break;
      }
    }
    console.log("Found matching scripts count:", scripts.length);
    scripts.slice(0, 10).forEach((s, i) => console.log(`Script ${i}:\n`, s));

    // Also look for direct API URLs
    const apiRegex = /https?:\/\/[a-zA-Z0-9.-]+\/api\/[a-zA-Z0-9/_-]+/gi;
    const matches = html.match(apiRegex) || [];
    console.log("Found API matching URLs:", [...new Set(matches)]);
  });
}).on('error', e => console.error("Error fetching Oploverz:", e));
