import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const sandbox={window:{}};
vm.runInNewContext(fs.readFileSync(new URL('../battle-view.js',import.meta.url),'utf8'),sandbox);
const {hulaoView,hulaoTileAt,hulaoTileCenter}=sandbox.window.BATTLE_VIEW;
const {squareView,squareTileAt,squareTileCenter}=sandbox.window.BATTLE_VIEW;
for(const [width,height,compact] of [[490,316,true],[670,685,true],[1520,990,false],[3040,1980,false]]){
  for(const zoom of [.48,1,2.4]){
    const rect=hulaoView({width,height,compact,zoom});
    assert.ok(Math.abs(rect.w/16-rect.h/24)<1e-9,'Cells must be square');
    assert.ok(Math.abs(rect.w/rect.h-2/3)<1e-9,'The 2:3 battlefield art must preserve its aspect ratio');
    if(compact&&zoom===1)assert.ok(rect.cell*.92>=44,'Default touch tile must show at least 44px');
    for(let y=0;y<24;y++)for(let x=0;x<16;x++)for(const dx of [-.49,0,.49])for(const dy of [-.49,0,.49]){
      const hit=hulaoTileAt(rect,rect.x+((x+dx+.5)/16)*rect.w,rect.y+((y+dy+.5)/24)*rect.h);
      assert.equal(hit?.x,x,`Missed cell ${x},${y} at horizontal edge`);
      assert.equal(hit?.y,y,`Missed cell ${x},${y} at vertical edge`);
    }
    for(let y=0;y<24;y++)for(let x=0;x<16;x++){
      const center=hulaoTileCenter(rect,x,y),hit=hulaoTileAt(rect,center.x,center.y);
      assert.equal(hit?.x,x,`Rendered center and input x disagree at ${x},${y}`);
      assert.equal(hit?.y,y,`Rendered center and input y disagree at ${x},${y}`);
    }
    assert.equal(hulaoTileAt(rect,rect.x+(-.01/16)*rect.w,rect.y+(.5/24)*rect.h),null,'Outside map must not select an edge unit');
  }
  const overview=hulaoView({width,height,compact,overview:true});
  assert.ok(overview.x>=0&&overview.y>=0&&overview.x+overview.w<=width&&overview.y+overview.h<=height,'Overview must fit whole map');
  for(const focus of [{x:0,y:0},{x:15,y:23},{x:6,y:5},{x:15,y:21}]){
    const rect=hulaoView({width,height,compact,focus});
    const sx=rect.x+((focus.x+.5)/16)*rect.w,sy=rect.y+((focus.y+.5)/24)*rect.h;
    assert.ok(sx>=0&&sx<=width&&sy>=0&&sy<=height,'Focused cell must be visible');
  }
}
console.log('Battle view passed: square grid, 44px default touch tiles, every cell edge, out-of-map rejection, overview and camera focus across phone/tablet/1080p/4K.');
const guangchuan={width:20,height:11,viewProjection:{x:.025,y:.055,dx:.05,dy:.089}};
for(const [width,height,compact] of [[490,316,true],[760,520,true],[1520,990,false]]){
  const rect=squareView({width,height,compact,level:guangchuan,overview:true});
  for(let y=0;y<11;y++)for(let x=0;x<20;x++){
    const c=squareTileCenter(rect,x,y,guangchuan),hit=squareTileAt(rect,c.x,c.y,guangchuan);
    assert.equal(JSON.stringify(hit),JSON.stringify({x,y}));
    assert.ok(Math.abs(rect.w*guangchuan.viewProjection.dx-rect.h*guangchuan.viewProjection.dy)<1e-7,'Guangchuan cells must stay square');
  }
}
console.log('Guangchuan view passed: 20x11 square cells and matching pointer hit targets.');
// Exercise the actual touch-up handler, including OS cancellation and gestures.
const game=fs.readFileSync(new URL('../game.js',import.meta.url),'utf8');
const handler=game.slice(game.indexOf('  function finishTouch('),game.indexOf("  canvas.addEventListener('pointerup'"));
assert.ok(handler.includes('function finishTouch'));
for(const [type,moved,multi,expected] of [['pointerup',false,false,1],['pointerup',true,false,0],['pointerup',false,true,0],['pointercancel',false,false,0]]){
  const taps=[];
  const context={touchPoints:new Map([[1,{x:100,y:100}]]),touchGesture:{moved,multi},ignoreClickUntil:0,canvas:{getBoundingClientRect:()=>({left:5,top:10})},handleBattleTap:(x,y)=>taps.push([x,y])};
  vm.runInNewContext(handler+';finishTouch({pointerId:1,pointerType:"touch",type:'+JSON.stringify(type)+',clientX:100,clientY:100,preventDefault(){}});',context);
  assert.equal(taps.length,expected,`${type}, moved=${moved}, multi=${multi} dispatched wrong action`);
  assert.equal(context.touchPoints.size,0);
  assert.equal(context.touchGesture,null);
}
console.log('Touch passed: taps act once; drag, pinch and pointer cancellation cannot issue a move.');
