import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';

const root = process.cwd();
const types = {
  '.html':'text/html; charset=utf-8',
  '.css':'text/css; charset=utf-8',
  '.js':'text/javascript; charset=utf-8',
  '.png':'image/png',
  '.jpg':'image/jpeg',
  '.jpeg':'image/jpeg',
  '.webp':'image/webp',
  '.avif':'image/avif',
  '.svg':'image/svg+xml',
  '.mp3':'audio/mpeg',
  '.opus':'audio/ogg',
  '.wav':'audio/wav',
  '.mp4':'video/mp4'
};
const port=Number(process.env.PORT||4173);
const server = createServer(async (req,res)=>{
  try {
    const raw = decodeURIComponent((req.url || '/').split('?')[0]);
    const rel = raw === '/' ? 'index.html' : raw.replace(/^\/+/, '');
    const file = normalize(join(root, rel));
    if (!file.startsWith(root)) throw new Error('invalid path');
    const info = await stat(file);
    if (!info.isFile()) throw new Error('not file');
    res.writeHead(200, {'Content-Type':types[extname(file)] || 'application/octet-stream','Cache-Control':'no-store'});
    res.end(await readFile(file));
  } catch { res.writeHead(404); res.end('Not found'); }
});
server.listen(port,'127.0.0.1',()=>console.log(`昭烈传试玩：http://127.0.0.1:${port}`));
