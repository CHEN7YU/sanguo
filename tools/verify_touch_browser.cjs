// Run against the independent preview. Hooks exist only in intercepted test responses.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const base=process.env.PREVIEW_URL||'http://127.0.0.1:4176';
const output=path.resolve(__dirname,'../../output/touch-audit');fs.mkdirSync(output,{recursive:true});
const hook=`window.__audit={
 state:()=>({zoom,phase,touchMode,turn,playerTurn,gestureCount:touchController.size,pending:touchPending,selected:selected&&{x:selected.x,y:selected.y},rect:{...bgRect}}),
 target:()=>{for(const k of reachable.keys()){const [x,y]=k.split(',').map(Number),p=iso(x,y);if(!unitAt(x,y)&&p.x>40&&p.x<wrap.clientWidth-40&&p.y>80&&p.y<wrap.clientHeight-80)return {...p,tile:{x,y},left:canvas.getBoundingClientRect().left,top:canvas.getBoundingClientRect().top}}},
 coordinates:()=>{let count=0;for(const z of [.48,1,2.4])for(const offset of [0,-127]){touchCamera=null;zoom=z;panX=offset;panY=offset;updateBgRect();if(touchMode)setTouchView({...bgRect,zoom});for(let y=0;y<ROWS;y++)for(let x=0;x<COLS;x++){const p=iso(x,y),q=screenToTile(p.x,p.y);if(!q||q.x!==x||q.y!==y)throw Error('level '+level.id+' tile '+x+','+y+' zoom '+z);count++}}return count},
 begin:()=>{resetBattleState();hideTitle(false);document.getElementById('shopOverlay').classList.add('hidden');battleStarted=true;selectUnit(units.find(u=>u.id==='guan'));resetBattleCamera(selected);syncUI();draw()},
 attackSetup:()=>{const enemy=units.find(u=>u.side==='enemy'&&u.hp>0);selected.x=Math.floor(COLS/2);selected.y=Math.floor(ROWS/2);enemy.x=selected.x+1;enemy.y=selected.y;for(const u of units)if(u!==selected&&u!==enemy&&Math.abs(u.x-selected.x)+Math.abs(u.y-selected.y)<3){u.x=0;u.y=0}phase='attack';reachable.clear();attackable=attackTiles(selected);resetBattleCamera(selected);syncUI();draw();const p=iso(enemy.x,enemy.y),r=canvas.getBoundingClientRect();return{x:p.x+r.left,y:p.y+r.top,hp:enemy.hp,id:enemy.id}},
 hitProbe:(args)=>{clearTouchPending();hideForecast();touchCamera=null;zoom=args.zoom;panX=0;panY=0;battleFocus={x:selected.x,y:selected.y};updateBgRect();const desired={x:wrap.clientWidth*args.x,y:wrap.clientHeight*args.y};let candidates=[];for(let y=0;y<ROWS;y++)for(let x=0;x<COLS;x++){const p=iso(x,y);if(p.x<35||p.x>wrap.clientWidth-35||p.y<90||p.y>wrap.clientHeight-65||unitAt(x,y)||!Number.isFinite(tileCost(selected,x,y)))continue;candidates.push({x,y,p,d:Math.hypot(p.x-desired.x,p.y-desired.y)})}candidates.sort((a,b)=>a.d-b.d);for(const q of candidates)for(const [nx,ny] of neighbors(q.x,q.y)){if(!passable(selected,nx,ny)||!canCrossMovementEdge(nx,ny,q.x,q.y))continue;selected.x=nx;selected.y=ny;phase='move';reachable=calcReach(selected);if(!reachable.has(keyOf(q.x,q.y)))continue;syncUI();draw();const r=canvas.getBoundingClientRect();return{x:q.p.x+r.left,y:q.p.y+r.top,tile:{x:q.x,y:q.y}}}return null},
 fast:()=>{animationSpeed=20;compactRepeatedAnimations=true},
 position:id=>{const u=units.find(u=>u.id===id);return{x:u.x,y:u.y}},
 hp:id=>units.find(u=>u.id===id).hp,
 cameraCheck:()=>{resetBattleCamera(selected);const p=iso(selected.x,selected.y),inside=p.x>=0&&p.x<=wrap.clientWidth&&p.y>=0&&p.y<=wrap.clientHeight;toggleBattleOverview();updateBgRect();const full=bgRect.x>=-.01&&bgRect.y>=-.01&&bgRect.x+bgRect.w<=wrap.clientWidth+.01&&bgRect.y+bgRect.h<=wrap.clientHeight+.01;toggleBattleOverview();return{inside,full}}
};`;
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.BROWSER_EXE?{executablePath:process.env.BROWSER_EXE}:{})});
 const report={coordinates:[],layouts:[],checks:[]};
 try{
  const page=await browser.newPage({viewport:{width:844,height:390},hasTouch:true,isMobile:true});
  await page.addInitScript(()=>localStorage.setItem('zhaolie-touch-zoom-v1','1'));
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/game.js*',async route=>{const response=await route.fetch(),s=await response.text(),i=s.lastIndexOf('})();');await route.fulfill({response,body:s.slice(0,i)+hook+s.slice(i)})});
  for(let level=1;level<=12;level++){
   await page.goto(`${base}/?level=${level}&tabletAudit=1`);await page.waitForFunction(()=>window.__audit);await page.evaluate(()=>__audit.begin());
   const count=await page.evaluate(()=>__audit.coordinates());report.coordinates.push({level,count});console.log(`PASS level ${level}: ${count} cell centers at 3 zooms and 2 pans`);
   assert.deepEqual(await page.evaluate(()=>__audit.cameraCheck()),{inside:true,full:true},`level ${level} center and overview`);
   let taps=0;for(const zoom of [.8,1.5,2.4])for(const [x,y] of [[.15,.35],[.85,.35],[.15,.75],[.85,.75],[.5,.5]]){
    const target=await page.evaluate(a=>__audit.hitProbe(a),{zoom,x,y});assert.ok(target,`level ${level} zoom ${zoom} needs a visible test destination`);
    await page.touchscreen.tap(target.x,target.y);assert.deepEqual((await page.evaluate(()=>__audit.state())).pending?.q,target.tile,`level ${level} zoom ${zoom} tap ${x},${y}`);taps++;
   }report.checks.push(`level ${level}: ${taps} center/corner touch hits at 3 zooms`);
  }
  for(const [width,height] of [[568,320],[844,390],[1024,768],[390,844]]){
   await page.setViewportSize({width,height});await page.goto(`${base}/?level=12&tabletAudit=1`);await page.waitForFunction(()=>window.__audit);await page.evaluate(()=>__audit.begin());
   if(await page.locator('#portraitContinueBtn').isVisible())await page.locator('#portraitContinueBtn').tap();
   const layout=await page.evaluate(()=>{const side=document.querySelector('.sidebar').getBoundingClientRect();return [...document.querySelectorAll('.action-grid button')].filter(e=>getComputedStyle(e).display!=='none').map(e=>{const r=e.getBoundingClientRect();return{id:e.id,visible:r.top>=side.top&&r.bottom<=side.bottom&&r.right<=innerWidth,height:r.height}})});
   assert.ok(layout.every(e=>e.visible),`${width}x${height}: ${JSON.stringify(layout)}`);report.layouts.push({width,height,buttons:layout});await page.screenshot({path:path.join(output,`${width}x${height}.png`)});
  }
  await page.setViewportSize({width:844,height:390});await page.goto(`${base}/?level=12&tabletAudit=1&huainanCampGatePreview=1`);await page.waitForTimeout(700);
  await page.evaluate(()=>{__audit.begin();});
  const target=await page.evaluate(()=>__audit.target());assert.ok(target);const before=await page.evaluate(()=>__audit.state());
  await page.touchscreen.tap(target.x+target.left,target.y+target.top);let after=await page.evaluate(()=>__audit.state());assert.deepEqual(after.selected,before.selected);assert.deepEqual(after.pending.q,target.tile);assert.match(await page.locator('#touchConfirm').innerText(),/耗\d/);
  await page.locator('#touchToolsToggle').tap();const overlap=await page.evaluate(()=>{const a=document.querySelector('#touchConfirm').getBoundingClientRect(),b=document.querySelector('#touchControls').getBoundingClientRect();return a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top});assert.equal(overlap,false,'Confirmation must not overlap expanded camera tools');await page.locator('#touchToolsToggle').tap();
  await page.locator('#touchConfirm').tap();await page.waitForTimeout(2200);after=await page.evaluate(()=>__audit.state());assert.deepEqual(after.selected,target.tile);report.checks.push('tap previews; confirm moves to target');await page.locator('#undoBtn').tap();assert.deepEqual(await page.evaluate(()=>__audit.position('guan')),before.selected);report.checks.push('cancel restores pre-move position');await page.evaluate(()=>__audit.begin());after=await page.evaluate(()=>__audit.state());
  const cdp=await page.context().newCDPSession(page);const touch=(type,touchPoints)=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints});
  await touch('touchStart',[{x:200,y:170,id:1},{x:300,y:170,id:2}]);await touch('touchMove',[{x:150,y:170,id:1},{x:350,y:170,id:2}]);await touch('touchEnd',[]);
  const pinched=await page.evaluate(()=>__audit.state());assert.ok(pinched.zoom>after.zoom);assert.deepEqual(pinched.selected,after.selected);assert.equal(pinched.pending,null);report.checks.push('two-finger pinch produces no action');
  await touch('touchStart',[{x:200,y:170,id:1}]);await touch('touchMove',[{x:270,y:200,id:1}]);await touch('touchCancel',[]);assert.equal((await page.evaluate(()=>__audit.state())).pending,null);report.checks.push('drag cancellation produces no action');
  await page.locator('#undoBtn').tap();await page.evaluate(()=>__audit.begin());
  const enemy=await page.evaluate(()=>{Math.random=()=>.5;__audit.fast();return __audit.attackSetup()});await page.touchscreen.tap(enemy.x,enemy.y);
  assert.equal(await page.evaluate(id=>__audit.hp(id),enemy.id),enemy.hp);assert.equal(await page.locator('#touchConfirm').innerText(),'确认攻击');assert.ok(await page.locator('#forecast').isVisible());report.checks.push('attack tap shows forecast without damage');await page.locator('#touchConfirm').tap();await page.waitForFunction(e=>__audit.hp(e.id)<e.hp,enemy,{timeout:15000});await page.waitForFunction(()=>__audit.state().phase!=='animating');report.checks.push('confirmed touch attack applies damage');
  await page.evaluate(()=>__audit.begin());
  const initial=await page.evaluate(()=>__audit.state());
  await page.locator('#touchDetails').tap();assert.ok(await page.locator('.touch-details-open').count());
  assert.ok(await page.locator('#waitBtn').isVisible());await page.locator('#touchDetails').tap();assert.equal(await page.locator('.touch-details-open').count(),0);
  await page.locator('#itemBtn').tap();assert.ok(await page.locator('#itemMenu').isVisible());await page.locator('#undoBtn').tap();assert.equal(await page.locator('#itemMenu').isVisible(),false);
  await page.evaluate(()=>__audit.begin());await page.locator('#waitBtn').tap();assert.equal((await page.evaluate(()=>__audit.state())).selected,null);report.checks.push('details, item menu, cancel, wait remain usable');
  await page.evaluate(()=>__audit.begin());
  await touch('touchStart',[{x:200,y:170,id:1}]);await page.locator('#menuBtn').dispatchEvent('pointerdown',{pointerType:'touch',pointerId:2,bubbles:true});assert.equal((await page.evaluate(()=>__audit.state())).gestureCount,0);await touch('touchCancel',[]);
  await page.locator('#menuBtn').tap();assert.ok(await page.locator('#gameMenuOverlay').isVisible());await page.locator('#resumeGameBtn').tap();assert.equal(await page.locator('#gameMenuOverlay').isVisible(),false);report.checks.push('menu interrupts active map gesture and returns');
  const oldZoom=(await page.evaluate(()=>__audit.state())).zoom;await page.setViewportSize({width:390,height:844});await page.waitForTimeout(100);await page.setViewportSize({width:844,height:390});await page.waitForTimeout(100);assert.equal((await page.evaluate(()=>__audit.state())).zoom,oldZoom);report.checks.push('orientation resize preserves zoom');
  await page.mouse.move(400,200);await page.mouse.move(420,210);await page.waitForTimeout(100);assert.equal((await page.evaluate(()=>__audit.state())).touchMode,false);await page.locator('#menuBtn').tap();assert.equal((await page.evaluate(()=>__audit.state())).touchMode,true);await page.locator('#resumeGameBtn').tap();report.checks.push('mouse restores PC mode; touch restores touch mode');
  await page.evaluate(()=>{__audit.begin();__audit.fast()});const oldTurn=(await page.evaluate(()=>__audit.state())).turn;await page.locator('#endTurnBtn').tap();await page.waitForFunction(t=>{const s=__audit.state();return s.turn>t&&s.playerTurn},oldTurn,{timeout:45000});report.checks.push('enemy phase completes and player controls recover');
  assert.deepEqual(errors,[]);console.log('PASS layouts, touch actions, menus, orientation, hybrid input and enemy turn');
  fs.writeFileSync(path.join(output,'results.json'),JSON.stringify(report,null,2));
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
