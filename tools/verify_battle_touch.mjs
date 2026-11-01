import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const sandbox={window:{}};
vm.runInNewContext(fs.readFileSync(new URL('../battle-touch.js',import.meta.url),'utf8'),sandbox);
const T=sandbox.window.BATTLE_TOUCH;
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-7,`${a} != ${b}`);
// CSS layout scaling and DPR must not change the target drawing coordinate.
for(const ratio of [.5,1,1.5,2,3]){
 const p=T.localPoint({left:23,top:41,width:800*ratio,height:400*ratio},800,400,23+317*ratio,41+129*ratio);
 near(p.x,317);near(p.y,129);
}
for(const zoom of [.48,1,2.4]){
 const view={x:-100,y:-50,w:1600,h:1200,zoom};
 for(const scale of [.5,1,2]){
  const v=T.anchoredRect(view,{x:200,y:150},{x:240,y:160},scale);
  near((240-v.x)/v.w,(200-view.x)/view.w);
  near((160-v.y)/v.h,(150-view.y)/view.h);
 }
}
const small=T.boundedRect({x:999,y:-999,w:100,h:200},800,400);
near(small.x,350);near(small.y,100);
const large=T.boundedRect({x:999,y:-9999,w:1600,h:1200},800,400);
near(large.x,0);near(large.y,-800);
let view={x:-100,y:-50,w:1600,h:1200,zoom:1},taps=0;
const g=T.gestures({getView:()=>view,setView:v=>view=v,onTap:()=>taps++});
g.down(1,{x:100,y:100});g.up(1,{x:102,y:102});assert.equal(taps,1);
g.down(1,{x:100,y:100});g.move(1,{x:180,y:120});g.up(1,{x:180,y:120});assert.equal(taps,1);near(view.x,-20);
g.down(1,{x:100,y:100});g.down(2,{x:200,y:100});g.move(2,{x:300,y:100});near(view.zoom,2);
g.up(2,{x:300,y:100});g.up(1,{x:100,y:100});assert.equal(taps,1);
g.down(1,{x:100,y:100});g.cancel();g.up(1,{x:100,y:100});assert.equal(taps,1);assert.equal(g.size,0);
g.down(1,{x:100,y:100});g.up(1,{x:100,y:100},true);assert.equal(taps,1);
g.down(1,{x:100,y:100});g.down(2,{x:101,y:100});g.move(2,{x:1000,y:100});near(view.zoom,2.4);
g.cancel();g.down(1,{x:100,y:100});g.up(1,{x:100,y:100});assert.equal(taps,2);
console.log('PASS: coordinate scaling, pinch anchor, bounds, tap/drag separation, pinch lift, interruption, zoom limits');
