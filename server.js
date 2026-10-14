const express = require('express');
const path = require('path');

const app = express();
const PORT = 3000;
const HOST = '0.0.0.0';

// Clean routes before static files
app.get('/politica-de-privacidade', (req, res) => {
  res.sendFile(path.join(__dirname, 'politica-de-privacidade.html'));
});

app.get('/politica-de-privacidade/', (req, res) => {
  res.sendFile(path.join(__dirname, 'politica-de-privacidade.html'));
});

app.get('/politica-de-privacidade.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'politica-de-privacidade.html'));
});

app.get('/robots.txt', (req, res) => {
  res.type('text/plain');
  res.sendFile(path.join(__dirname, 'robots.txt'));
});

app.get('/sitemap.xml', (req, res) => {
  res.type('application/xml');
  res.sendFile(path.join(__dirname, 'sitemap.xml'));
});

// Serve static assets from root directory with no-cache headers for instant preview updates
app.use(express.static(path.join(__dirname), {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.mp4') || filePath.endsWith('.webm')) {
      res.setHeader('Accept-Ranges', 'bytes');
      res.setHeader('Cache-Control', 'public, max-age=86400');
    } else {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    }
  }
}));

// Route fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, HOST, () => {
  console.log(`[Portal da Psicologia] Server listening on http://${HOST}:${PORT}`);
});
