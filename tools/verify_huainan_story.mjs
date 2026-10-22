import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {validatePayload} from '../save-format.mjs';
const read=f=>fs.readFileSync(new URL('../'+f,import.meta.url),'utf8');
const data={window:{}};vm.createContext(data);vm.runInContext(read('story-data.js'),data);
const pre=data.window.HUAINAN_CONTINUOUS_STORY,after=data.window.HUAINAN_POST_BATTLE_STORY;
assert(pre.some(x=>x.freeRoam&&x.location.includes('徐州')));
const yuan=pre.findIndex(x=>x.speaker==='袁胤'&&x.text.includes('后方'));
const letter=pre.findIndex(x=>x.speaker==='袁术书信');
const objection=pre.findIndex(x=>x.speaker==='张辽'&&x.text.includes('背叛'));
assert(yuan>=0&&letter>yuan&&objection>letter);
for(const branch of ['normal','alternate']){
 assert(after[branch].some(x=>x.speaker==='关羽'&&x.text.includes('许昌')));
 assert(after[branch].some(x=>x.speaker==='曹操'&&x.text.includes('放心')));
 assert(after[branch].some(x=>x.route));
}
assert.notEqual(after.normal[0].text,after.alternate[0].text);
const source=read('game.js');
const actorsSource=source.slice(source.indexOf('  const storyActorRoot='),source.indexOf('  const storyWorldActorAssets='));
const actorContext={};vm.createContext(actorContext);vm.runInContext(actorsSource+';this.assets=storyActorAssets;',actorContext);
for(const line of [...pre,...after.normal,...after.alternate])for(const actor of line.setup||[]){
 const asset=actorContext.assets[actor.name];
 assert(asset,`${actor.name} requires a complete directional story sheet`);
 assert(fs.existsSync(new URL('../'+asset,import.meta.url)),`${actor.name} story sheet is missing`);
}
const fn=source.slice(source.indexOf('  function victory('),source.indexOf('  function playHuainanAftermath('));
for(const variant of ['normal','alternate']){
 const c={ending:false,playerTurn:true,turnTransitionPending:true,phase:'select',levelIndex:12,turn:6,gold:500,campaignVictoryType:null,objectiveUnitId:'jiling',DEFAULT_CAMPAIGN_VICTORY_MUSIC_ID:16,
 level:{id:'huainan',events:{battleReward:400},alternateVictory:{goldReward:0,exp:50}},
 units:[{id:'liu',name:'刘备',side:'ally',hp:100,exp:0},{id:'guan',name:'关羽',side:'ally',hp:100,exp:0},{id:'dead',side:'ally',hp:0,exp:0}],
 window:{},startStoryMusic(){},resolvedNextLevelId(){return null},syncUI(){},flash(){},status(){},addLog(){},levelUp(u){u.level=(u.level||1)+1},
 awardLiuBeiClearExp(){c.units[0].exp+=50;return{amount:50}},
 playHuainanAftermath(branch,summary){c.after={branch,summary}},runDialogue(){throw Error('Huainan must enter cinematic renderer')}};
 vm.createContext(c);vm.runInContext(fn,c);vm.runInContext(`victory(false,'${variant}');victory(false,'${variant}')`,c);
 assert.equal(c.gold,variant==='normal'?900:500);
 assert.equal(c.units[0].exp,variant==='normal'?50:0);
 assert.equal(c.units[1].exp,variant==='normal'?0:50);
 assert.equal(c.units[2].exp,0,'retreated units receive no survivor bonus');
 assert.equal(c.after.branch,variant);
 const save={schema:1,levelId:'huainan',savedAt:1,phaseType:'postbattle',units:c.units.map(u=>({...u,x:0,y:0})),map:[['plain']],gold:c.gold,huainanAftermath:{variant,index:3,complete:false,actors:[],summary:c.after.summary}};
 const bundle={saveStore:{schema:1,auto:save,manual:Array(6).fill(null)},campaignTransfer:null};
 assert.deepEqual(validatePayload(bundle).saveStore.auto,save,'postbattle cinematic data survives cloud validation');
}
assert(source.includes("save.huainanAftermath&&!save.huainanAftermath.complete"));
console.log('Huainan story verified: source event order, free conversation, both aftermath branches, victory guard, survivor rewards and cloud snapshot preservation.');
