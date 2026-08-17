const fs = require('fs');
const path = require('path');
const https = require('https');

const dir = path.join(__dirname, 'public', 'sounds');
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

const tracks = [
  { name: 'rain.mp3', url: 'https://assets.codepen.io/154694/rain.mp3' },
  { name: 'cafe.mp3', url: 'https://assets.codepen.io/154694/cafe.mp3' },
  { name: 'thunder.mp3', url: 'https://assets.codepen.io/154694/thunder.mp3' },
  { name: 'birds.mp3', url: 'https://assets.codepen.io/154694/birds.mp3' }
];

function download(url, filePath, callback) {
  const options = {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
  };

  https.get(url, options, (res) => {
    if (res.statusCode === 302 || res.statusCode === 301) {
      download(res.headers.location, filePath, callback);
      return;
    }
    if (res.statusCode !== 200) {
      console.error(`Failed to download from ${url}: Status Code ${res.statusCode}`);
      if (callback) callback(new Error(`Status ${res.statusCode}`));
      return;
    }
    const fileStream = fs.createWriteStream(filePath);
    res.pipe(fileStream);
    fileStream.on('finish', () => {
      fileStream.close();
      console.log(`Successfully downloaded: ${path.basename(filePath)}`);
      if (callback) callback();
    });
  }).on('error', (err) => {
    console.error(`Error downloading ${url}:`, err);
    if (callback) callback(err);
  });
}

console.log('Starting ambient focus sounds download...');
let completed = 0;
let failed = false;

tracks.forEach(t => {
  const filePath = path.join(dir, t.name);
  download(t.url, filePath, (err) => {
    completed++;
    if (err) failed = true;
    if (completed === tracks.length) {
      if (failed) {
        console.error('Some downloads failed. Please verify your internet connection.');
      } else {
        console.log('All focus sounds downloaded successfully to public/sounds/!');
      }
    }
  });
});
