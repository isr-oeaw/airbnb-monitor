import { createServer } from 'node:http';
import { appendFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';

const PORT = Number(process.env.PORT ?? 3001);
const LOG_FILE = process.env.LOG_FILE ?? './data/logs/address-searches.jsonl';
const MAX_BODY_BYTES = 4096;

function isValidPayload(value) {
  if (!value || typeof value !== 'object') return false;
  const { address, lat, lng } = value;
  return (
    typeof address === 'string'
    && address.length > 0
    && address.length <= 500
    && typeof lat === 'number'
    && Number.isFinite(lat)
    && typeof lng === 'number'
    && Number.isFinite(lng)
  );
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;

    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        reject(new Error('Payload too large'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });

    req.on('end', () => {
      try {
        const raw = Buffer.concat(chunks).toString('utf8');
        resolve(raw ? JSON.parse(raw) : null);
      } catch {
        reject(new Error('Invalid JSON'));
      }
    });

    req.on('error', reject);
  });
}

async function appendLogEntry(payload) {
  const entry = {
    address: payload.address.trim(),
    lat: payload.lat,
    lng: payload.lng,
    viewMode: typeof payload.viewMode === 'string' ? payload.viewMode.slice(0, 32) : undefined,
    timestamp: typeof payload.timestamp === 'string' ? payload.timestamp.slice(0, 32) : new Date().toISOString(),
    loggedAt: new Date().toISOString(),
  };

  await mkdir(dirname(LOG_FILE), { recursive: true });
  await appendFile(LOG_FILE, `${JSON.stringify(entry)}\n`, 'utf8');
}

const server = createServer(async (req, res) => {
  if (req.method === 'POST' && req.url === '/api/search-log') {
    try {
      const payload = await readJsonBody(req);
      if (!isValidPayload(payload)) {
        res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Invalid payload');
        return;
      }
      await appendLogEntry(payload);
      res.writeHead(204);
      res.end();
    } catch (error) {
      const status = error.message === 'Payload too large' ? 413 : 400;
      res.writeHead(status, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end(error.message === 'Payload too large' ? 'Payload too large' : 'Bad request');
    }
    return;
  }

  res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('Not found');
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Search log API listening on :${PORT}, writing to ${LOG_FILE}`);
});
