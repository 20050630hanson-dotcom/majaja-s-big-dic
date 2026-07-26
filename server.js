const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8080;
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.webm': 'audio/webm',
  '.json': 'application/json'
};

const server = http.createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/api/save-clips') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const clipsData = JSON.parse(body);
        updateSoundJsFile(clipsData);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
      } catch (e) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: e.message }));
      }
    });
    return;
  }

  let relativePath = req.url === '/' ? 'preview.html' : req.url;
  let filePath = path.join(__dirname, decodeURIComponent(relativePath));
  const ext = path.extname(filePath);
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('File Not Found');
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    }
  });
});

function updateSoundJsFile(clipsArray) {
  const soundJsPath = path.join(__dirname, 'src', 'audio', 'sound.js');
  let content = fs.readFileSync(soundJsPath, 'utf8');

  // Convert array back into clips object string
  let clipsObjStr = '  const clips = {\n';
  clipsArray.forEach((c, idx) => {
    clipsObjStr += `    ${c.id}: { name: '${c.name}', start: ${c.start}, duration: ${c.duration}, defaultAction: '${c.id}' }${idx < clipsArray.length - 1 ? ',' : ''}\n`;
  });
  clipsObjStr += '  };';

  content = content.replace(/const clips = \{[\s\S]*?\};/, clipsObjStr.trim());
  fs.writeFileSync(soundJsPath, content, 'utf8');
}

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/preview.html`);
});
