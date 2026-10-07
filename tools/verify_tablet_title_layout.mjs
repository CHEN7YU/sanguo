import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=fileURLToPath(new URL('..',import.meta.url));
const css=fs.readFileSync(path.join(root,'style.css'),'utf8');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const fail=message=>{throw new Error(message)};

for(const token of [
  '@media(max-height:850px) and (orientation:landscape)',
  'top:clamp(150px,27vh,220px)',
  'min-height:clamp(38px,5.8vh,44px)',
  '@media(max-height:430px) and (orientation:landscape)',
  '.title-menu{top:20%;right:8%;gap:4px}',
  '.title-save-note{display:none}',
])if(!css.includes(token))fail(`missing tablet title layout rule: ${token}`);

if(!html.includes('id="titleSettingsBtn">游戏设置</button>'))fail('settings button missing from title menu');
if(!/style\.css\?build=20261007-[^"']+/.test(html))fail('versioned stylesheet cache key is missing');

console.log('Tablet title layout verified: menu rises with limited viewport height and keeps the settings button reachable.');
