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

const fs = require('fs');

// Smart resolution for team photos and public assets (serves from /public or root)
app.get('/public/:filename(*)', (req, res, next) => {
  const decoded = decodeURIComponent(req.params.filename);
  const inPublic = path.join(__dirname, 'public', decoded);
  if (fs.existsSync(inPublic)) return res.sendFile(inPublic);
  const inRoot = path.join(__dirname, decoded);
  if (fs.existsSync(inRoot)) return res.sendFile(inRoot);

  // If filename is foto-sede or sede portal without exact extension match, test other extensions
  if (decoded.startsWith('foto-sede') || decoded.toLowerCase().includes('sede')) {
    const exts = ['.jpeg', '.jpg', '.png', '.webp'];
    const baseNames = ['sede portal', 'foto-sede', 'sede-portal', decoded.replace(/\.[^/.]+$/, '')];
    for (const base of baseNames) {
      for (const ext of exts) {
        const p = path.join(__dirname, 'public', `${base}${ext}`);
        if (fs.existsSync(p)) return res.sendFile(p);
        const r = path.join(__dirname, `${base}${ext}`);
        if (fs.existsSync(r)) return res.sendFile(r);
      }
    }
  }
  next();
});

// Direct route for /foto-sede, /sede portal, /sede-portal with smart extension lookup
app.get(['/foto-sede', '/foto-sede.*', '/sede-portal', '/sede-portal.*', '/sede', '/sede.*', '/sede%20portal*', '/sede portal*'], (req, res, next) => {
  const exts = ['.jpeg', '.jpg', '.png', '.webp'];
  const baseNames = ['sede portal', 'foto-sede', 'sede-portal'];
  for (const base of baseNames) {
    for (const ext of exts) {
      const pub = path.join(__dirname, 'public', `${base}${ext}`);
      if (fs.existsSync(pub)) return res.sendFile(pub);
      const root = path.join(__dirname, `${base}${ext}`);
      if (fs.existsSync(root)) return res.sendFile(root);
    }
  }
  next();
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
