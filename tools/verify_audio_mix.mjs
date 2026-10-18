import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=fileURLToPath(new URL('..',import.meta.url));
const game=fs.readFileSync(path.join(root,'game.js'),'utf8');
const index=fs.readFileSync(path.join(root,'index.html'),'utf8');
const fail=message=>{throw new Error(message)};

for(const token of [
  'const MUSIC_MIX_GAIN=.44,SFX_MIX_GAIN=2.1',
  'function mixedMusicVolume(multiplier=musicSceneMultiplier)',
  'function applySfxMix()',
  'if(!musicEnabled)return',
  "const movement=['movementStep','hoofStep','footStep'].includes(name),heavy=['block','duelClash','duelFinish','impact','fall'].includes(name),strike=['attack','charge'].includes(name)",
  'musicSceneMultiplier*(heavy?.32:strike?.44:movement?.62:.5)',
  'musicSceneMultiplier=previousMusicSceneMultiplier;applyMusicMix()',
  'duckMusicForSfx(name);fn(a,sfxBus',
])if(!game.includes(token))fail(`missing global audio mix behavior: ${token}`);

if(/\.volume=musicVolume(?:[;*]|$)/m.test(game))fail('a music element still bypasses the global music mix');
if(!/game\.js\?build=20\d{6}-[^"']+/.test(index))fail('versioned game script cache key is missing');

console.log('Audio mix verified: music attenuation, SFX gain and transient combat ducking apply globally.');
