import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=fileURLToPath(new URL('..',import.meta.url));
const game=fs.readFileSync(path.join(root,'game.js'),'utf8');
const levelSource=fs.readFileSync(path.join(root,'level-03-guangchuan.js'),'utf8');
const context={window:{}};
vm.createContext(context);
vm.runInContext(levelSource,context);
const jian=context.window.LEVEL_03_GUANGCHUAN.units.find(unit=>unit.id==='jian');
if(!jian||jian.side!=='ally'||jian.troop!=='archer')throw new Error('Jian Yong is not configured as an allied archer');

for(const stale of ['alliedGenericPaletteFilter','usesGenericAlliedPalette','hue-rotate(155deg)']){
  if(game.includes(stale))throw new Error(`stale full-sprite faction tint remains: ${stale}`);
}
for(const token of [
  "function usesGenericFriendlyArt(u){return u.side!=='enemy'&&!art[u.id]}",
  'function drawFactionGroundMarker(u,pos,isMounted,dimmed,fade=1)',
  "if(u.side==='enemy')return;const s=bgRect.scale,color=u.side==='guest'?'#85dff1':'#45c9dd'",
  'drawFactionGroundMarker(u,pos,isMounted,done,flagFade)',
  "portraitImage.style.filter=''",
  "!portraitPaths[x.id]&&usesGenericFriendlyArt(x)?'ally-generic':''"
]) if(!game.includes(token))throw new Error(`missing natural-colour friendly marker rule: ${token}`);

console.log('Friendly colours verified: generic allies keep natural skin and mount colours while flags, bars, rings and UI borders show faction.');
