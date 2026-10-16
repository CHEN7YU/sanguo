import fs from 'node:fs';
import path from 'node:path';

const root=path.resolve(import.meta.dirname,'..');
const game=fs.readFileSync(path.join(root,'game.js'),'utf8');
const check=(condition,message)=>{if(!condition)throw new Error(message)};

check(game.includes('function retryQueuedEndPlayerTurn()'),'Queued end-turn retry is missing');
check(game.includes("if(dialogue||phase==='animating'){if(fromQueue)retryQueuedEndPlayerTurn();return}"),'Queued end turn still abandons the transition when dialogue or animation is active');
check(game.includes('function recoverStalledBattleFlow()'),'Stalled animation recovery watchdog is missing');
check(game.includes('setInterval(recoverStalledBattleFlow,400)'),'Stalled animation recovery watchdog is not armed');
check(game.includes("phase=resumeQueuedTurn?'turnEnding':'select'"),'Recovery does not restore a legal phase');
check(game.includes("setTimeout(()=>endPlayerTurn(true),0)"),'Recovered queued turn does not resume its transition');
check(game.includes("previewParams.has('turnRecoveryPreview')"),'Turn-lock browser regression preview is missing');
check(game.includes("prepButton.disabled=origin!=='game'"),'Battle prep recovery remains disabled after the first turn');
check(game.includes("prepButton.textContent=battleStarted?'重新整备本关':'战前整备'"),'Battle prep recovery action is not explained in the menu');
check(game.includes("document.getElementById('battlePrepBtn').onclick=restartBattle"),'Battle prep button does not restart from a clean battle state');
check(game.includes('clearTimeout(autoSaveTimer);autoSaveTimer=null;anim=null;combatFx=null;stalledAnimationSince=0'),'Battle reset does not clear stale timers and presentation state');
check(game.includes("overlay.classList.remove('from-story','from-title')"),'Game menu origin classes are not fully cleared');

console.log('Turn-lock recovery verified: queued transitions retry, stale animations recover, and battle prep restarts from a clean state.');
