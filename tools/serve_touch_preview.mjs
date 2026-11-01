import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,sep,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=process.env.PREVIEW_ROOT?resolve(process.env.PREVIEW_ROOT):fileURLToPath(new URL('..',import.meta.url)).replace(/[\\/]$/,'');
const assets=process.env.PREVIEW_ASSETS;
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.webp':'image/webp','.png':'image/png','.opus':'audio/ogg','.mp4':'video/mp4'};
createServer(async(req,res)=>{
 try{
  const rel=decodeURIComponent(new URL(req.url,'http://localhost').pathname).replace(/^\/+/, '')||'index.html';
  const base=assets&&rel.startsWith('assets/')?resolve(assets):root;
  const file=resolve(base,base===root?rel:rel.slice(7));
  if(!file.startsWith(base+sep))throw Error('outside preview');
  const data=await readFile(file);
  res.writeHead(200,{'Content-Type':types[extname(file)]||'application/octet-stream','Cache-Control':'no-store'});res.end(data);
 }catch{res.writeHead(404);res.end('Not found')}
}).listen(Number(process.env.PORT||4176),'127.0.0.1',()=>console.log(`Independent touch preview: http://127.0.0.1:${process.env.PORT||4176} (no API backend)`));
