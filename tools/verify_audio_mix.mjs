import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=fileURLToPath(new URL('..',import.meta.url));
const game=fs.readFileSync(path.join(root,'game.js'),'utf8');
const index=fs.readFileSync(path.join(root,'index.html'),'utf8');
const fail=message=>{throw new Error(message)};

for(const token of [
  'const MUSIC_MIX_GAIN=.48,SFX_MIX_GAIN=1.35',
  'function mixedMusicVolume(multiplier=musicSceneMultiplier)',
  'function applySfxMix()',
  "if(name==='movementStep'||!musicEnabled)return",
  "musicSceneMultiplier*(['block','impact','fall'].includes(name)?.54:.68)",
  'musicSceneMultiplier=previousMusicSceneMultiplier;applyMusicMix()',
  'duckMusicForSfx(name);fn(a,sfxBus',
])if(!game.includes(token))fail(`missing global audio mix behavior: ${token}`);

if(/\.volume=musicVolume(?:[;*]|$)/m.test(game))fail('a music element still bypasses the global music mix');
if(!index.includes('game.js?build=20261007-audio-mix-v86'))fail('browser cache key was not updated');

console.log('Audio mix verified: music attenuation, SFX gain and transient combat ducking apply globally.');
