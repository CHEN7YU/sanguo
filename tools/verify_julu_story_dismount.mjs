import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const game=fs.readFileSync(path.join(root,'game.js'),'utf8');
const story=fs.readFileSync(path.join(root,'story-data.js'),'utf8');
assert.ok(story.includes("setup:[A('颜良',23,10.5,0,111),A('张郃',4,17,0,117)]"),'Yan Liang must stand on the tent floor in front of the command table');
const indoor=game.slice(game.indexOf('  const storyActorAssets='),game.indexOf('  const storyWorldActorAssets='));
const world=game.slice(game.indexOf('  const storyWorldActorAssets='),game.indexOf('  const storyGestureRoot='));
for(const [name,slug] of [['张郃','zhang-he'],['颜良','yan-liang']]){
  const master=path.join(root,'assets-master','level-04-julu','story-actors',slug+'-dismounted-walk-sheet-v1.png');
  const release=path.join(root,'assets','level-04-julu','story-actors',slug+'-dismounted-walk-sheet-v1.webp');
  assert.ok(fs.existsSync(master),name+' dismounted master is missing');
  assert.ok(fs.existsSync(release),name+' dismounted release sprite is missing');
  assert.ok(indoor.includes(name+":'assets/level-04-julu/story-actors/"+slug+"-dismounted-walk-sheet-v1.webp'"),name+' indoor mapping still uses a horse');
  const probe=execFileSync('ffprobe',['-v','error','-select_streams','v:0','-show_entries','stream=width,height,pix_fmt','-of','json',release],{encoding:'utf8'});
  const stream=JSON.parse(probe).streams[0];
  assert.equal(stream.width,1252);assert.equal(stream.height,1252);assert.ok(stream.pix_fmt.includes('a'),name+' release sprite lost transparency');
}
assert.ok(world.includes("张郃:'assets/level-05-jieqiao/core-animation/zhanghe/zhanghe-walk-v1.webp'"),'Zhang He world march must stay mounted');
assert.ok(world.includes("颜良:'assets/level-05-jieqiao/core-animation/yanliang/yanliang-walk-v1.webp'"),'Yan Liang world march must stay mounted');
console.log('Julu story dismount passed: Zhang He and Yan Liang use transparent foot sprites in tents while world marching remains mounted.');
