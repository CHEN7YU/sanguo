const assert=require('node:assert/strict');
const {execFileSync}=require('node:child_process');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const base=process.env.PREVIEW_URL||'http://127.0.0.1:4176';
const cwd=require('node:path').resolve(__dirname,'..');
const baseline=Object.fromEntries(['index.html','game.js'].map(file=>[file,execFileSync('git',['-c',`safe.directory=${cwd.replaceAll('\\','/')}`,'show',`HEAD:${file}`],{cwd,encoding:'utf8',maxBuffer:8*1024*1024})]));
const hook=`window.__pcAudit={buildingSetup:type=>{resetBattleState();hideTitle(false);document.getElementById('shopOverlay').classList.add('hidden');battleStarted=true;selected=units.find(u=>u.id==='mifang')||units.find(u=>u.id==='liu');for(const u of units)if(u!==selected)u.side='reserve';for(let y=0;y<ROWS;y++)for(let x=0;x<COLS;x++){if(map[y][x]!==type)continue;for(const [nx,ny] of neighbors(x,y)){if(!passable(selected,nx,ny)||!canCrossMovementEdge(nx,ny,x,y))continue;selected.x=nx;selected.y=ny;phase='move';reachable=calcReach(selected);if(!reachable.has(keyOf(x,y)))continue;resetBattleCamera({x,y});syncUI();draw();const p=iso(x,y),r=canvas.getBoundingClientRect();return{x:p.x+r.left,y:p.y+r.top,tile:{x,y},id:selected.id}}}return null},unit:id=>{const u=units.find(u=>u.id===id);return{x:u.x,y:u.y}},hp:id=>units.find(u=>u.id===id).hp,attackSetup:()=>{selected=units.find(u=>u.id==='guan');selected.acted=false;selected.x=Math.floor(COLS/2);selected.y=Math.floor(ROWS/2);const e=units.find(u=>u.side==='enemy');e.x=selected.x+1;e.y=selected.y;e.hp=10000;e.maxHp=10000;for(const u of units)if(u!==selected&&u!==e&&Math.abs(u.x-selected.x)+Math.abs(u.y-selected.y)<3){u.x=0;u.y=0}phase='attack';reachable.clear();attackable=attackTiles(selected);animationSpeed=20;compactRepeatedAnimations=true;resetBattleCamera(selected);syncUI();draw();const p=iso(e.x,e.y),r=canvas.getBoundingClientRect();return{x:p.x+r.left,y:p.y+r.top,id:e.id,hp:e.hp}},state:()=>({zoom,panX,panY,phase,selected:selected&&{x:selected.x,y:selected.y}}),target:()=>{for(const k of reachable.keys()){const [x,y]=k.split(',').map(Number),p=iso(x,y),r=canvas.getBoundingClientRect();if(!unitAt(x,y)&&p.x>60&&p.x<wrap.clientWidth-60&&p.y>100&&p.y<wrap.clientHeight-70)return{x:p.x+r.left,y:p.y+r.top,tile:{x,y}}}}};`;
new (require('node:vm').Script)(hook);
(async()=>{
 const b=await chromium.launch({headless:true,...(process.env.BROWSER_EXE?{executablePath:process.env.BROWSER_EXE}:{})});
 try{
  for(const size of [{width:1440,height:900},{width:1920,height:1080},{width:900,height:650}]){
   const results=[];
   for(const original of [true,false]){
    const p=await b.newPage({viewport:size});const errors=[];p.on('pageerror',e=>errors.push(e.message));
    await p.route('**/*',async route=>{const url=new URL(route.request().url());let s;
     if(original&&url.pathname==='/'){await route.fulfill({contentType:'text/html',body:baseline['index.html']});return}
     if(url.pathname==='/game.js'){let response;if(original)s=baseline['game.js'];else{response=await route.fetch();s=await response.text()}const i=s.lastIndexOf('})();');await route.fulfill({contentType:'text/javascript',body:s.slice(0,i)+hook+s.slice(i)});return}
     await route.continue();
    });
    await p.goto(`${base}/?level=12&huainanCampGatePreview=1`);await p.waitForTimeout(900);
    const layout=await p.evaluate(()=>Object.fromEntries(['#battlefield','.sidebar','.portrait-card','.action-panel','#endTurnBtn'].map(s=>[s,document.querySelector(s).getBoundingClientRect().toJSON()])));
    const target=await p.evaluate(()=>__pcAudit.target());assert.ok(target);await p.mouse.click(target.x,target.y);await p.waitForTimeout(1800);
    assert.deepEqual((await p.evaluate(()=>__pcAudit.state())).selected,target.tile,'PC single click must still move immediately');
    await p.mouse.move(400,300);await p.mouse.wheel(0,-120);await p.waitForTimeout(150);const wheel=await p.evaluate(()=>__pcAudit.state());
    await p.mouse.down({button:'middle'});await p.mouse.move(450,330,{steps:3});await p.mouse.up({button:'middle'});const dragged=await p.evaluate(()=>__pcAudit.state());
    await p.locator('#menuBtn').click();assert.ok(await p.locator('#gameMenuOverlay').isVisible());await p.locator('#resumeGameBtn').click();assert.equal(await p.locator('#gameMenuOverlay').isVisible(),false);
    await p.locator('#settingsBtn').click();assert.ok(await p.locator('#settingsPanel').isVisible());await p.locator('#fullscreenBtn').click();await p.waitForTimeout(100);const fullscreen=await p.evaluate(()=>!!document.fullscreenElement);assert.ok(fullscreen);await p.evaluate(()=>document.exitFullscreen());await p.locator('#settingsCloseBtn').click();
    const enemy=await p.evaluate(()=>{Math.random=()=>.5;return __pcAudit.attackSetup()});await p.mouse.click(enemy.x,enemy.y);await p.waitForFunction(id=>__pcAudit.hp(id)<10000,enemy.id,{timeout:15000});
    for(const type of ['village','treasure']){
     await p.goto(`${base}/?level=12&huainanCampGatePreview=1`);await p.waitForTimeout(700);const building=await p.evaluate(t=>__pcAudit.buildingSetup(t),type);assert.ok(building,`missing ${type} fixture`);await p.mouse.click(building.x,building.y);await p.waitForFunction(t=>{const u=__pcAudit.unit(t.id);return u.x===t.tile.x&&u.y===t.tile.y},building,{timeout:10000});
    }
    assert.deepEqual(errors,[]);results.push({layout,wheel,dragged,fullscreen});await p.close();
   }
   assert.deepEqual(results[1],results[0],`Desktop differs from baseline at ${JSON.stringify(size)}`);console.log(`PASS PC ${size.width}x${size.height}: layout, single-click move/attack, wheel, drag, menus, fullscreen, village and treasure clicks match HEAD`);
  }
 }finally{await b.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
