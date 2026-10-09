(() => {
  'use strict';
  const bootParams = new URLSearchParams(location.search);
  const RUNTIME_BUILD='20261009-xindu-dry-spawn-v95';
  const touchCapable=matchMedia('(pointer:coarse)').matches||navigator.maxTouchPoints>0||bootParams.has('tabletAudit');
  document.documentElement.classList.toggle('touch-capable',touchCapable);
  const levelIndex=bootParams.get('level');
  const level = levelIndex==='6' ? window.LEVEL_04_QINGHE : levelIndex==='5' ? window.LEVEL_04_JULU : levelIndex==='4' ? window.LEVEL_03_XINDU : levelIndex==='3' ? window.LEVEL_03_GUANGCHUAN : levelIndex==='2' ? window.LEVEL_02 : window.LEVEL_01;
  const squareBattlefield=level.squareGrid===true||level.id==='hulao-pass';
  let levelSelectActive=bootParams.has('levelSelect'),selectedBalanceLevel=null;
  const canvas = document.getElementById('battlefield');
  const ctx = canvas.getContext('2d');
  const mini = document.getElementById('minimap');
  const mctx = mini.getContext('2d');
  const duelCanvas=document.getElementById('duelCanvas'),duelCtx=duelCanvas.getContext('2d');
  const wrap = document.getElementById('battlefieldWrap');
  const COLS = level.width, ROWS = level.height;
  function applyPaintedTerrainOverrides(runtime){
    for(const override of level.paintedTerrainOverrides||[]){
      if(runtime[override.y]?.[override.x]!==undefined)runtime[override.y][override.x]=override.type;
    }
    return runtime
  }
  function buildRuntimeMap(){return applyPaintedTerrainOverrides(level.terrain.map(r=>[...r]))}
  const map = buildRuntimeMap();
  const assetPaths = {
    battlefield:level.battlefieldArt||'assets/sishui-remaster-v3.webp', liu:'assets/liu-squad.webp', guan:'assets/guan-squad-v2.webp',
    zhang:'assets/zhang-squad.webp', gongsun:'assets/gongsun-squad.webp', tao:'assets/tao-squad.webp',
    hua:'assets/hua-squad.webp', lvbu:'assets/lvbu-squad-v1.webp', zhangliao:'assets/zhangliao-squad-v1.webp',
    houcheng:'assets/houcheng-squad-v1.webp', songxian:'assets/songxian-squad-v1.webp', weixu:'assets/weixu-squad-v1.webp',
    yanliang:'assets/level-04-julu/units/yan-liang-mounted-v1.webp', zhanghe:'assets/level-04-julu/units/zhang-he-mounted-v1.webp',
    quyi:'assets/level-04-qinghe/qu-yi-mounted-v2.webp', yangang:'assets/level-04-qinghe/yan-gang-mounted-v1.webp',
    infantry:'assets/xiliang-infantry-squad.webp', archer:'assets/xiliang-archer-squad.webp', officer:'assets/xiliang-officer-squad.webp',
    martial:'assets/troops/martial-artist-v2.webp', bandit:'assets/troops/bandit-v2.webp',
    support:'assets/military-band-remaster-v1.webp'
  };
  const art = Object.fromEntries(Object.entries(assetPaths).map(([key,src])=>{const img=new Image();img.src=src;return [key,img]}));
  const friendlyAssetPaths={
    hua:'assets/friendly/hua-squad-friendly-v1.webp',infantry:'assets/friendly/infantry-squad-friendly-v1.webp',
    archer:'assets/friendly/archer-squad-friendly-v1.webp',officer:'assets/friendly/officer-squad-friendly-v1.webp',
    support:'assets/friendly/support-friendly-v1.webp',martial:'assets/friendly/martial-artist-friendly-v2.webp',
    bandit:'assets/friendly/bandit-friendly-v2.webp'
  };
  const friendlyArt=Object.fromEntries(Object.entries(friendlyAssetPaths).map(([key,src])=>{const img=new Image();img.src=src;return[key,img]}));
  const terrainArtPaths={village:'assets/tile-village.webp',treasure:'assets/tile-treasure-depot.webp',supply:'assets/tile-supply-depot.webp',fort:'assets/level-04-julu/fort-v1.webp'};
  const terrainArt=Object.fromEntries(Object.entries(terrainArtPaths).map(([key,src])=>{const img=new Image();img.src=src;return[key,img]}));
  const attackPaths = {
    liu:'assets/liu-attack.webp', guan:'assets/guan-attack.webp', zhang:'assets/zhang-attack.webp',
    gongsun:'assets/gongsun-attack.webp', tao:'assets/tao-attack.webp', hua:'assets/hua-attack.webp',
    lvbu:'assets/lvbu-attack-v1.webp', zhangliao:'assets/zhangliao-attack-v1.webp',
    houcheng:'assets/houcheng-attack-v1.webp', songxian:'assets/songxian-attack-v1.webp', weixu:'assets/weixu-attack-v1.webp',
    infantry:'assets/infantry-attack.webp', archer:'assets/archer-attack.webp', officer:'assets/officer-attack.webp',
    martial:'assets/troops/martial-artist-attack-v2.webp',bandit:'assets/troops/bandit-attack-v2.webp',
    support:'assets/troops/military-band-attack-v1.webp'
  };
  const attackArt = Object.fromEntries(Object.entries(attackPaths).map(([key,src])=>{const img=new Image();img.src=src;return [key,img]}));
  const friendlyAttackPaths={hua:'assets/friendly/hua-attack-friendly-v1.webp',infantry:'assets/friendly/infantry-attack-friendly-v1.webp',archer:'assets/friendly/archer-attack-friendly-v1.webp',officer:'assets/friendly/officer-attack-friendly-v1.webp',martial:'assets/friendly/martial-artist-attack-friendly-v2.webp',bandit:'assets/friendly/bandit-attack-friendly-v2.webp',support:'assets/troops/military-band-attack-v1.webp'};
  const friendlyAttackArt=Object.fromEntries(Object.entries(friendlyAttackPaths).map(([key,src])=>{const img=new Image();img.src=src;return[key,img]}));
  const walkPaths={liu:'assets/liu-walk-v1.webp',guan:'assets/guan-walk-v1.webp',zhang:'assets/zhang-walk-v1.webp',gongsun:'assets/gongsun-walk-v1.webp',tao:'assets/tao-walk-v1.webp',hua:'assets/hua-walk-v1.webp',lvbu:'assets/lvbu-walk-v1.webp',zhangliao:'assets/zhangliao-walk-v1.webp',houcheng:'assets/houcheng-walk-v1.webp',songxian:'assets/songxian-walk-v2.webp',weixu:'assets/weixu-walk-v1.webp',officer:'assets/officer-walk-v1.webp',archer:'assets/archer-walk-v1.webp',infantry:'assets/infantry-walk-v1.webp',martial:'assets/troops/martial-artist-walk-v2.webp',bandit:'assets/troops/bandit-walk-v2.webp',support:'assets/troops/military-band-walk-v1.webp'};
  const walkArt=Object.fromEntries(Object.entries(walkPaths).map(([key,src])=>{const img=new Image();img.src=src;return[key,img]}));
  const friendlyWalkPaths={hua:'assets/friendly/hua-walk-friendly-v1.webp',officer:'assets/friendly/officer-walk-friendly-v1.webp',archer:'assets/friendly/archer-walk-friendly-v1.webp',infantry:'assets/friendly/infantry-walk-friendly-v1.webp',martial:'assets/friendly/martial-artist-walk-friendly-v2.webp',bandit:'assets/friendly/bandit-walk-friendly-v2.webp',support:'assets/troops/military-band-walk-v1.webp'};
  const friendlyWalkArt=Object.fromEntries(Object.entries(friendlyWalkPaths).map(([key,src])=>{const img=new Image();img.src=src;return[key,img]}));
  const deathPaths={guan:'assets/guan-death-v1.webp',zhang:'assets/zhang-death-v1.webp',gongsun:'assets/gongsun-death-v1.webp',hua:'assets/hua-death-v1.webp',lvbu:'assets/lvbu-death-v1.webp',zhangliao:'assets/zhangliao-death-v1.webp',houcheng:'assets/houcheng-death-v1.webp',songxian:'assets/songxian-death-v1.webp',weixu:'assets/weixu-death-v1.webp'};
  const deathArt=Object.fromEntries(Object.entries(deathPaths).map(([key,src])=>{const img=new Image();img.src=src;return[key,img]}));
  const friendlyDeathPaths={hua:'assets/friendly/hua-death-friendly-v1.webp'};
  const friendlyDeathArt=Object.fromEntries(Object.entries(friendlyDeathPaths).map(([key,src])=>{const img=new Image();img.src=src;return[key,img]}));
  const hurtPaths={martial:'assets/troops/martial-artist-hurt-v2.webp',bandit:'assets/troops/bandit-hurt-v2.webp'};
  const hurtArt=Object.fromEntries(Object.entries(hurtPaths).map(([key,src])=>{const img=new Image();img.src=src;return[key,img]}));
  const friendlyHurtPaths={martial:'assets/friendly/martial-artist-hurt-friendly-v2.webp',bandit:'assets/friendly/bandit-hurt-friendly-v2.webp'};
  const friendlyHurtArt=Object.fromEntries(Object.entries(friendlyHurtPaths).map(([key,src])=>{const img=new Image();img.src=src;return[key,img]}));
  const woundedArt=new Image();woundedArt.src='assets/wounded-units-atlas-v1.webp';
  const friendlyWoundedArt=new Image();friendlyWoundedArt.src='assets/friendly/wounded-units-atlas-friendly-v1.webp';
  const woundedAtlasOrder=['liu','guan','zhang','gongsun','tao','hua','lvbu','zhangliao','houcheng','songxian','weixu','infantry','archer','officer'];
  const woundedFrameBounds={
    liu:[19,35,263,304],guan:[1,15,289,324],zhang:[0,30,291,309],gongsun:[0,1,289,338],
    tao:[30,0,260,327],hua:[0,0,290,335],lvbu:[0,0,291,329],zhangliao:[0,0,290,326],
    houcheng:[49,9,241,309],songxian:[15,15,272,323],weixu:[26,55,264,269],infantry:[24,87,240,251],
    archer:[21,16,255,285],officer:[31,0,259,292]
  };
  const deathFrameBounds={
    guan:[[83,147,390,541],[101,227,355,461],[90,304,377,384],[52,343,453,345],[62,480,433,208]],
    zhang:[[105,165,356,523],[93,192,380,496],[55,227,456,461],[52,270,463,418],[68,455,431,233]],
    gongsun:[[109,149,394,539],[91,242,430,446],[66,273,481,415],[52,434,509,254],[88,483,436,205]],
    hua:[[54,236,418,484],[82,279,362,441],[65,388,396,332],[53,335,421,385],[52,479,423,241]]
  };
  const walkFrameBounds={
    liu:[[[30,27,275,281],[24,21,284,287],[11,25,284,283],[22,21,267,287]],[[39,13,270,285],[33,14,275,284],[45,13,262,285],[33,13,264,285]],[[26,8,265,305],[26,7,263,306],[24,7,270,306],[28,8,260,305]],[[18,0,273,272],[18,0,272,272],[20,0,268,272],[28,0,261,272]]],
    guan:[[[42,10,260,309],[27,6,263,313],[23,16,267,303],[17,13,259,306]],[[29,0,254,320],[16,0,271,320],[22,0,271,320],[21,0,265,320]],[[44,0,244,319],[33,0,252,319],[34,0,261,319],[36,0,238,319]],[[41,0,247,276],[31,0,244,280],[37,0,244,280],[32,0,234,271]]],
    zhang:[[[20,4,266,307],[23,4,267,307],[35,4,248,307],[33,4,254,307]],[[31,2,253,306],[27,1,258,307],[32,3,250,305],[31,4,250,304]],[[37,6,252,304],[39,7,254,302],[35,8,256,305],[32,7,257,306]],[[35,1,231,298],[39,1,228,298],[33,1,235,298],[38,1,233,299]]],
    gongsun:[[[19,9,294,304],[0,11,314,302],[0,15,313,298],[0,18,308,295]],[[19,0,291,314],[27,0,282,314],[28,0,279,314],[20,0,279,311]],[[19,0,294,313],[0,0,312,313],[23,0,288,313],[27,1,279,312]],[[11,0,301,295],[5,0,307,294],[2,0,311,299],[0,0,303,295]]],
    tao:[[[27,9,286,304],[0,9,311,303],[12,9,293,301],[11,9,291,304]],[[35,0,206,309],[28,9,219,296],[33,9,209,296],[29,7,218,297]],[[35,11,239,302],[28,9,246,304],[26,9,247,304],[29,12,244,301]],[[16,0,278,287],[11,0,287,293],[12,0,289,297],[8,0,287,294]]],
    hua:[[[26,13,250,304],[21,15,256,302],[29,16,253,293],[34,12,246,306]],[[33,0,244,304],[32,2,244,302],[35,2,248,303],[40,2,240,304]],[[17,2,263,320],[19,2,267,320],[24,3,266,319],[19,3,266,319]],[[32,0,253,284],[29,0,262,283],[25,0,275,284],[41,0,254,283]]],
    officer:[[[20,31,260,259],[14,31,268,259],[19,31,257,259],[16,31,265,259]],[[25,31,249,262],[22,33,250,259],[25,30,252,264],[21,33,256,260]],[[38,25,254,265],[41,25,254,265],[39,25,253,265],[39,29,254,261]],[[30,13,270,260],[22,14,281,262],[31,13,268,263],[22,13,278,263]]],
    archer:[[[66,23,216,281],[69,23,211,280],[68,23,216,280],[67,23,213,280]],[[50,13,205,290],[50,11,208,292],[50,13,208,290],[51,11,209,292]],[[59,11,212,292],[63,11,204,293],[63,11,209,293],[55,14,212,289]],[[67,11,208,279],[66,11,207,279],[66,11,212,279],[71,11,201,279]]],
    infantry:[[[47,19,241,293],[54,19,245,293],[63,19,239,294],[70,19,228,293]],[[43,18,221,290],[53,18,220,288],[60,19,223,288],[60,15,218,291]],[[37,10,219,290],[55,11,217,291],[60,10,216,292],[72,10,210,291]],[[45,4,238,293],[63,5,230,287],[64,4,238,286],[62,5,233,291]]],
    martial:[[[26,17,253,299],[22,22,285,293],[0,24,299,292],[30,23,242,293]],[[36,12,260,297],[23,15,284,292],[0,15,307,293],[0,12,297,296]],[[60,6,247,313],[30,9,277,310],[0,6,305,313],[76,6,222,313]],[[18,0,286,295],[12,0,295,291],[0,0,307,295],[0,0,302,300]]],
    bandit:[[[27,31,247,287],[23,32,262,289],[23,35,256,286],[22,35,255,286]],[[47,18,259,295],[0,0,294,315],[46,0,252,315],[47,22,232,296]],[[41,15,261,305],[32,11,267,309],[47,14,250,306],[28,12,251,308]],[[36,0,218,293],[23,0,232,291],[17,0,242,292],[34,0,222,290]]],
    support:[[[85,0,193,293],[68,0,204,290],[52,0,197,291],[34,0,209,290]],[[88,8,189,307],[81,9,189,306],[67,7,178,308],[50,9,185,306]],[[101,10,199,305],[98,11,191,303],[72,10,183,305],[51,10,185,305]],[[103,0,178,312],[93,9,192,301],[66,0,188,308],[43,0,203,308]]]
  };
  // Per-frame non-transparent bounds. Attack sheets have large and uneven
  // transparent margins; drawing the whole frame made the unit visibly shrink.
  const attackFrameBounds = {
    liu:[[16,173,418,500],[0,34,434,652],[0,181,434,465],[0,181,434,496],[0,173,434,504]],
    guan:[[16,127,380,588],[0,17,396,700],[0,209,396,511],[0,177,396,538],[0,243,394,455]],
    zhang:[[18,53,383,608],[25,163,409,496],[0,208,434,448],[0,201,434,463],[0,64,432,595]],
    gongsun:[[14,113,412,516],[4,103,430,526],[0,161,434,482],[0,174,434,436],[0,144,421,489]],
    tao:[[32,145,377,511],[17,36,417,637],[0,182,434,471],[0,176,434,493],[0,145,429,512]],
    hua:[[7,9,408,721],[0,76,415,650],[0,187,415,541],[0,182,415,548],[0,188,413,542]],
    infantry:[[39,198,395,435],[0,86,434,547],[0,194,434,427],[0,200,434,423],[0,200,408,426]],
    archer:[[27,167,356,451],[31,112,403,506],[0,128,421,490],[6,126,428,492],[0,166,420,448]],
    officer:[[5,130,404,542],[0,129,409,539],[0,126,409,529],[0,126,409,526],[0,125,409,547]],
    martial:[[10,195,424,424],[0,185,435,434],[0,196,434,423],[0,178,435,448],[0,196,431,423]],
    bandit:[[41,198,377,426],[36,68,399,561],[0,204,434,433],[0,264,435,377],[0,198,414,424]],
    support:[[15,102,419,552],[0,74,434,576],[0,142,434,511],[0,131,434,522],[0,102,418,552]]
  };
  const hurtFrameBounds={
    martial:[[0,157,420,478],[21,157,414,473],[0,185,434,450],[0,291,413,335],[73,206,361,429]],
    bandit:[[20,153,386,441],[2,116,433,485],[0,142,421,468],[35,275,345,343],[40,216,375,400]]
  };
  const level02AnimationBounds=window.LEVEL_02_ANIMATION_BOUNDS||{};
  Object.assign(walkFrameBounds,level02AnimationBounds.walk||{});
  Object.assign(attackFrameBounds,level02AnimationBounds.attack||{});
  Object.assign(deathFrameBounds,level02AnimationBounds.death||{});
  const portraitPaths = {
    liu:'assets/liu-bei-remaster-v2.webp', guan:'assets/guan-yu-remaster-v2.webp',
    zhang:'assets/zhang-fei-remaster-v2.webp', gongsun:'assets/gongsun-zan-remaster-v2.webp',
    tao:'assets/tao-qian-remaster-v2.webp', hua:'assets/hua-xiong-remaster-v2.webp',
    hu:'assets/hu-zhen-remaster-v2.webp', zhao:'assets/zhao-cen-remaster-v2.webp',
    li:'assets/li-su-remaster-v2.webp',
    lvbu:'assets/story-portraits/remaster-v4/lv-bu-v4.webp',
    zhangliao:'assets/zhang-liao-portrait-v1.webp',
    houcheng:'assets/hou-cheng-portrait-v1.webp',
    songxian:'assets/song-xian-portrait-v1.webp',
    weixu:'assets/wei-xu-portrait-v1.webp',
    jian:'assets/level-03/portraits/jian-yong-v1.webp', fengji:'assets/level-03/portraits/feng-ji-v1.webp',
    chunyu:'assets/level-03-xindu/portraits/chunyu-qiong-v1.webp',fagong:'assets/level-03-xindu/portraits/fan-gong-v1.webp',
    hanying:'assets/level-03/portraits/han-ying-v1.webp',guoshi:'assets/level-03/portraits/guo-shi-v1.webp',
    zhanghe:'assets/level-04-julu/portraits/zhang-he-v1.webp',yanliang:'assets/level-04-julu/portraits/yan-liang-v1.webp',
    quyi:'assets/level-04-qinghe/qu-yi-portrait-v1.webp',yangang:'assets/level-04-qinghe/yan-gang-portrait-v1.webp',
    gaolan:'assets/level-04-julu/portraits/gao-lan-v1.webp',shenpei:'assets/level-04-julu/portraits/shen-pei-v1.webp',
    gongsunyue:'assets/level-04-julu/portraits/gongsun-yue-v1.webp',guanchun:'assets/level-04-julu/portraits/guan-chun-v1.webp',
    gengwu:'assets/level-04-julu/portraits/geng-wu-v1.webp',yuze:'assets/level-04-julu/portraits/yu-ze-v1.webp'
  };
  const storyPortraitRoot='assets/story-portraits/remaster-v4/';
  const storyPortraits={
    刘备:storyPortraitRoot+'liu-bei-v4.webp',关羽:storyPortraitRoot+'guan-yu-v4.webp',张飞:storyPortraitRoot+'zhang-fei-v4.webp',
    曹操:storyPortraitRoot+'cao-cao-v4.webp',袁绍:storyPortraitRoot+'yuan-shao-v4.webp',袁术:storyPortraitRoot+'yuan-shu-v4.webp',
    公孙瓒:storyPortraitRoot+'gongsun-zan-v4.webp',陶谦:storyPortraitRoot+'tao-qian-v4.webp',孔融:storyPortraitRoot+'kong-rong-v4.webp',
    董卓:storyPortraitRoot+'dong-zhuo-v4.webp',吕布:storyPortraitRoot+'lv-bu-v4.webp',华雄:storyPortraitRoot+'hua-xiong-v4.webp',
    李儒:storyPortraitRoot+'li-ru-v4.webp',李傕:storyPortraitRoot+'li-jue-v4.webp',郭汜:storyPortraitRoot+'guo-si-v4.webp',
    李肃:storyPortraitRoot+'li-su-v4.webp',胡轸:storyPortraitRoot+'hu-zhen-v4.webp',赵岑:storyPortraitRoot+'zhao-cen-v4.webp',
    董承:storyPortraitRoot+'dong-cheng-v4.webp',献帝:storyPortraitRoot+'emperor-v4.webp',
    武官:storyPortraitRoot+'officer-v4.webp',道具屋:storyPortraitRoot+'shopkeeper-v4.webp',使者:storyPortraitRoot+'officer-v4.webp',
    简雍:'assets/level-03/portraits/jian-yong-v1.webp',逢纪:'assets/level-03/portraits/feng-ji-v1.webp',韩英:'assets/level-03/portraits/han-ying-v1.webp',郭适:'assets/level-03/portraits/guo-shi-v1.webp',
    淳于琼:'assets/level-03-xindu/portraits/chunyu-qiong-v1.webp',藩宫:'assets/level-03-xindu/portraits/fan-gong-v1.webp',
    张郃:'assets/level-04-julu/portraits/zhang-he-v1.webp',颜良:'assets/level-04-julu/portraits/yan-liang-v1.webp',
    高览:'assets/level-04-julu/portraits/gao-lan-v1.webp',审配:'assets/level-04-julu/portraits/shen-pei-v1.webp',
    麴义:'assets/level-04-qinghe/qu-yi-portrait-v1.webp',严纲:'assets/level-04-qinghe/yan-gang-portrait-v1.webp',
    公孙越:'assets/level-04-julu/portraits/gongsun-yue-v1.webp',关纯:'assets/level-04-julu/portraits/guan-chun-v1.webp',
    耿武:'assets/level-04-julu/portraits/geng-wu-v1.webp',羽则:'assets/level-04-julu/portraits/yu-ze-v1.webp'
  };
  const storyActorRoot='assets/story-actors/remaster-v3/';
  const storyActorAssets={
    刘备:storyActorRoot+'liu-bei-walk-sheet-v4.webp',关羽:storyActorRoot+'guan-yu-walk-sheet-v4.webp',张飞:storyActorRoot+'zhang-fei-walk-sheet-v4.webp',
    曹操:storyActorRoot+'cao-cao-walk-sheet-v4.webp',袁绍:storyActorRoot+'yuan-shao-walk-sheet-v4.webp',袁术:storyActorRoot+'yuan-shu-walk-sheet-v4.webp',
    公孙瓒:storyActorRoot+'gongsun-zan-walk-sheet-v4.webp',陶谦:storyActorRoot+'tao-qian-walk-sheet-v4.webp',孔融:storyActorRoot+'kong-rong-walk-sheet-v4.webp',
    董卓:storyActorRoot+'dong-zhuo-walk-sheet-v4.webp',吕布:storyActorRoot+'lv-bu-walk-sheet-v4.webp',华雄:storyActorRoot+'hua-xiong-walk-sheet-v4.webp',
    李儒:storyActorRoot+'li-ru-walk-sheet-v4.webp',李傕:storyActorRoot+'li-jue-walk-sheet-v4.webp',郭汜:storyActorRoot+'guo-si-walk-sheet-v4.webp',
    李肃:storyActorRoot+'li-su-walk-sheet-v4.webp',胡轸:storyActorRoot+'hu-zhen-walk-sheet-v4.webp',赵岑:storyActorRoot+'zhao-cen-walk-sheet-v4.webp',
    董承:storyActorRoot+'dong-cheng-walk-sheet-v4.webp',献帝:storyActorRoot+'emperor-walk-sheet-v4.webp',
    武官:storyActorRoot+'officer-walk-sheet-v4.webp',道具屋:storyActorRoot+'shopkeeper-walk-sheet-v4.webp',
    少女:storyActorRoot+'maiden-walk-sheet-v4.webp',夫人:storyActorRoot+'lady-walk-sheet-v4.webp',
    简雍:storyActorRoot+'officer-walk-sheet-v4.webp',逢纪:storyActorRoot+'officer-walk-sheet-v4.webp',韩英:storyActorRoot+'officer-walk-sheet-v4.webp',郭适:storyActorRoot+'officer-walk-sheet-v4.webp',使者:storyActorRoot+'officer-walk-sheet-v4.webp',
    淳于琼:storyActorRoot+'officer-walk-sheet-v4.webp',藩宫:storyActorRoot+'officer-walk-sheet-v4.webp'
  };
  const storyWorldActorAssets={
    华雄:'assets/story-actors/world-v1/hua-xiong-march-sheet-v1.webp',
    吕布:'assets/story-actors/world-v1/lv-bu-march-sheet-v1.webp'
  };
  const storyGestureRoot='assets/story-actors/gestures-v1/';
  const storyGestureAssets={
    刘备:storyGestureRoot+'liu-bei-gesture-sheet-v1.webp',曹操:storyGestureRoot+'cao-cao-gesture-sheet-v1.webp',
    关羽:storyGestureRoot+'guan-yu-gesture-sheet-v1.webp',张飞:storyGestureRoot+'zhang-fei-gesture-sheet-v1.webp',
    袁绍:storyGestureRoot+'yuan-shao-gesture-sheet-v1.webp',袁术:storyGestureRoot+'yuan-shu-gesture-sheet-v1.webp',
    公孙瓒:storyGestureRoot+'gongsun-zan-gesture-sheet-v1.webp',陶谦:storyGestureRoot+'tao-qian-gesture-sheet-v1.webp',孔融:storyGestureRoot+'kong-rong-gesture-sheet-v1.webp',
    董卓:storyGestureRoot+'dong-zhuo-gesture-sheet-v1.webp',吕布:storyGestureRoot+'lv-bu-gesture-sheet-v1.webp',华雄:storyGestureRoot+'hua-xiong-gesture-sheet-v1.webp',李儒:storyGestureRoot+'li-ru-gesture-sheet-v1.webp',
    献帝:storyGestureRoot+'emperor-gesture-sheet-v1.webp',董承:storyGestureRoot+'dong-cheng-gesture-sheet-v1.webp',
    武官:storyGestureRoot+'officer-gesture-sheet-v1.webp',道具屋:storyGestureRoot+'shopkeeper-gesture-sheet-v1.webp'
  };
  const storySceneNavigation={
    tent:{minX:3,maxX:28,minY:6,maxY:17,obstacles:[
      {x1:18,y1:9,x2:23,y2:12},
      {x1:28,y1:14,x2:28,y2:17},
      {x1:4,y1:8,x2:8,y2:10}
    ]}
  };
  const firstRouteChoiceFlow=bootParams.has('routeChoice')&&level.id==='guangchuan';
  const secondRouteChoiceFlow=bootParams.has('secondRouteChoice')&&level.id==='julu';
  const routeChoiceFlow=firstRouteChoiceFlow||secondRouteChoiceFlow;
  const levelStory=window.STORY_BY_LEVEL?.[level.id]||window.PRE_BATTLE_STORY||[];
  const preBattleStory=firstRouteChoiceFlow?levelStory.slice(0,14).map((line,index)=>index===13?{...line,routeChoice:true}:line):secondRouteChoiceFlow?levelStory.slice(0,5).map((line,index)=>index===4?{...line,routeChoice:true}:line):levelStory;
  const preBattleNpcDialogue=window.NPC_DIALOGUE_BY_LEVEL?.[level.id]||window.PRE_BATTLE_NPC_DIALOGUE||{};
  const X=Infinity;
  const terrain = {
    plain:{cost:1,move:[1,1,1,1],name:'平原',def:0,color:'#5d8144'},
    forest:{cost:1,move:[1,X,2,1],name:'森林',def:20,color:'#3c6540'},
    hill:{cost:X,move:[X,X,X,1],name:'山地',def:30,color:'#596a46'},
    water:{cost:X,move:[X,X,X,X],name:'河流',def:0,color:'#397a91'},
    bridge:{cost:1,move:[1,1,1,1],name:'桥梁',def:0,color:'#7b6745'},
    wall:{cost:X,move:[X,X,X,X],name:'城墙',def:0,color:'#575d57'},
    city:{cost:1,move:[1,1,1,1],name:'城内',def:0,color:'#8e765e'},
    grass:{cost:1,move:[1,1,1,1],name:'草原',def:5,color:'#73934d'},
    village:{cost:2,move:[2,2,2,2],name:'村庄',def:5,color:'#6f844d',recoverHp:true,recoverMorale:true,effect:'回合开始恢复兵力与士气'},
    cliff:{cost:X,move:[X,X,X,X],name:'悬崖',def:0,color:'#4a4c42'},
    gate:{cost:X,move:[X,X,X,X],name:'城门',def:0,color:'#8f7050'},
    rough:{cost:1,move:[1,2,2,1],name:'荒地',def:0,color:'#8a7650'},
    fence:{cost:X,move:[X,X,X,X],name:'栅栏',def:0,color:'#765236'},
    fort:{cost:2,move:[2,3,2,2],name:'鹿砦',def:30,color:'#82705a',recoverHp:true,recoverMorale:true,effect:'回合开始恢复兵力与士气'},
    camp:{cost:2,move:[2,3,2,2],name:'兵营',def:10,color:'#8a5945',recoverHp:true,effect:'回合开始恢复兵力'},
    supply:{cost:2,move:[2,3,2,2],name:'粮仓',def:0,color:'#6d7852',effect:'首次进入获得豆×1'},
    supplyEmpty:{cost:2,move:[2,3,2,2],name:'粮仓（已取用）',def:0,color:'#626b54',effect:'物资已经取走'},
    treasure:{cost:2,move:[2,3,2,2],name:'宝物库',def:0,color:'#907241',effect:'首次进入获得金100'},
    treasureEmpty:{cost:2,move:[2,3,2,2],name:'宝物库（已开启）',def:0,color:'#71654d',effect:'物资已经取走'},
    house:{cost:X,move:[X,X,X,X],name:'房舍',def:0,color:'#8d6848'},
    fire:{cost:X,move:[X,X,X,X],name:'火焰',def:0,color:'#cb552f'},
    muddyWater:{cost:X,move:[X,X,X,X],name:'浊流',def:0,color:'#52737a'}
  };
  const treasureCatalog={
    qinglong:{name:'青龙偃月刀',effect:'attack',bonus:12},
    spear:{name:'蛇矛',effect:'attack',bonus:10},
    qinggang:{name:'青釭剑',effect:'attack',bonus:20},
    wuzi:{name:'吴子兵法',effect:'defense',bonus:20}
  };
  function treasureIdsFor(u){
    if(Array.isArray(u.treasureItems))return u.treasureItems.filter(id=>treasureCatalog[id]);
    if(u.equipmentItem&&u.weapon==='青龙偃月刀')return['qinglong'];
    if(u.equipmentItem&&u.weapon==='蛇矛')return['spear'];
    return[]
  }
  function refreshPassiveTreasures(u){
    u.treasureItems=treasureIdsFor(u);
    u.weaponBonus=u.treasureItems.reduce((sum,id)=>sum+(treasureCatalog[id]?.effect==='attack'?treasureCatalog[id].bonus:0),0);
    u.armorBonus=u.treasureItems.reduce((sum,id)=>sum+(treasureCatalog[id]?.effect==='defense'?treasureCatalog[id].bonus:0),0);
    delete u.equipmentItem;
    return u
  }
  function applyPaintedDeploymentOverride(u){const placement=level.paintedDeploymentOverrides?.find(p=>p.unitId===u.id&&u.x===p.fromX&&u.y===p.fromY);return placement?{...u,x:placement.x,y:placement.y}:u}
  function createRuntimeUnit(u,spawnOrder,inventory=[]){return refreshPassiveTreasures(applyPaintedDeploymentOverride({...u,acted:false,exp:0,spawnOrder,inventory:[...inventory],treasureItems:treasureIdsFor(u)}))}
  let units = level.units.map((u,spawnOrder) => createRuntimeUnit(u,spawnOrder));
  let selected=null, inspected=null, phase='select', reachable=new Map(), attackable=[], moveOrigin=null, activeStrategy=null, activeItem=null, strategyFx=null, hoverPath=[], dangerVisible=false, dangerTiles=[], keyboardCursor=null;
  let playerTurn=true, turn=1, hover=null, gold=500, dialogue=null, dialogIndex=0, ending=false, battleStarted=false, introPlayed=false, prepBaseline=null,turnTransitionPending=false;
  const timedEventsFired=new Set();
  const objectiveUnitId=level.objectiveUnitId||level.events?.duel?.defenderId||'hua';
  const MIN_ZOOM=.48,MAX_ZOOM=2.4;
  let tileW=72,tileH=36,originX=0,originY=90,zoom=1,panX=0,panY=0,drag=false,lastMouse=null,anim=null,combatFx=null,audioCtx=null,sfxBus=null,bgRect={x:0,y:0,w:1,h:1,scale:1};
  const touchPoints=new Map();let touchGesture=null,ignoreClickUntil=0;
  let battleOverview=false,battleFocus={x:units.find(u=>u.id==='liu')?.x??Math.floor(COLS/2),y:units.find(u=>u.id==='liu')?.y??Math.floor(ROWS/2)};
  const MUSIC_MIX_GAIN=.48,SFX_MIX_GAIN=1.35;
  let musicEnabled=true,musicStarted=false,musicVolume=.34,sfxVolume=.7,musicSceneMultiplier=1,musicDuckTimer=null,animationSpeed=1,compactRepeatedAnimations=true;
  const seenCombatMotions=new Set();
  const brotherMergeSpoken=new Set();
  // Implemented subset of the original strategy system.  Unit access is
  // always filtered through the original troop-type and level table below.
  const strategies={
    fire:{name:'焦热',cost:4,range:3,hit:.70,target:'enemy'},
    recover:{name:'援助',cost:6,range:2,hit:1,target:'friendly'}
  };
  const originalStrategyNames={fire:'焦热',falseReport:'虚言',encourage:'鼓舞',whirlwind:'旋风',vortex:'漩涡',fortify:'坚固',recover:'援助'};
  function learnedStrategyIds(u){
    // The rule table contains the original progression, including tactics not
    // yet represented by this prototype.  Only implemented original tactics
    // can enter the command menu or either NPC AI.
    return BattleRules.learnedStrategies({troop:u.troop,level:u.level,override:level.strategyAccess?.[u.id]}).filter(id=>strategies[id])
  }
  function knowsStrategy(u,type){return learnedStrategyIds(u).includes(type)}
  const shopItems={bean:{name:'豆',price:100,recoverHp:200},wheat:{name:'麦',price:0,recoverHp:400},wine:{name:'酒',price:50},fireScroll:{name:'焦热书',price:50}};
  const titleMusic=document.getElementById('titleMusic'),storyMusic=document.getElementById('storyMusic'),battleMusic=document.getElementById('battleMusic');
  const configuredBattleTrack=level.battleTrack||window.GAME_AUDIO_CONFIG?.battles?.[level.id];
  if(configuredBattleTrack)battleMusic.src=configuredBattleTrack;
  let storyMusicId=2;
  const storyTrackByScene={prologue:2,palace:2,tent:12,luoyang:11,world:3};
  function mixedMusicVolume(multiplier=musicSceneMultiplier){return Math.max(0,Math.min(1,musicVolume*MUSIC_MIX_GAIN*multiplier))}
  function applyMusicMix(multiplier=musicSceneMultiplier){const volume=mixedMusicVolume(multiplier);titleMusic.volume=volume;storyMusic.volume=volume;battleMusic.volume=volume}
  function applySfxMix(){if(sfxBus)sfxBus.gain.value=Math.max(0,Math.min(1.5,sfxVolume*SFX_MIX_GAIN))}
  function duckMusicForSfx(name){
    if(name==='movementStep'||!musicEnabled)return;
    clearTimeout(musicDuckTimer);applyMusicMix(musicSceneMultiplier*(['block','impact','fall'].includes(name)?.54:.68));
    musicDuckTimer=setTimeout(()=>applyMusicMix(),name==='impact'||name==='fall'?420:300)
  }
  applyMusicMix();
  const logs=[],dialogueHistory=[];
  const SAVE_KEY='sanguozhi-zhaolie-save-v1',SAVE_SCHEMA=1,MANUAL_SLOT_COUNT=6,CAMPAIGN_KEY='sanguozhi-zhaolie-campaign-v1',CAMPAIGN_SCHEMA=1,PORTABLE_SAVE_KIND='sanguozhi-zhaolie-portable-save',PORTABLE_SAVE_VERSION=1,IMPORT_BACKUP_KEY='sanguozhi-zhaolie-import-backup-v1',MAX_IMPORT_BYTES=10*1024*1024;
  let saveMenuMode='save',saveMenuOrigin='game',autoSaveTimer=null,titleIntroActive=false,titleIntroFadeTimer=null,openingActive=false,openingDone=null,storyActive=false,storyIndex=0,storyDone=null,storyAuto=false,storyTimer=null,storyRouteChoicePending=false;
  let outcomeAction=restartBattle,campaignVictoryType=null;
  let storyScene='',storyActors=new Map(),storyFreeRoam=false,storyInteraction=null,storyInteractionIndex=0,storyInteractionDone=null,storyAdvanceLocked=false,storyMomentToken=0;
  function emptySaveStore(){return{schema:SAVE_SCHEMA,auto:null,manual:Array(MANUAL_SLOT_COUNT).fill(null)}}
  function readSaveStore(){try{const raw=localStorage.getItem(SAVE_KEY);if(!raw)return emptySaveStore();const data=JSON.parse(raw);if(data?.schema!==SAVE_SCHEMA)return emptySaveStore();return{schema:SAVE_SCHEMA,auto:data.auto||null,manual:Array.from({length:MANUAL_SLOT_COUNT},(_,i)=>data.manual?.[i]||null)}}catch{return emptySaveStore()}}
  function writeSaveStore(store){try{localStorage.setItem(SAVE_KEY,JSON.stringify(store));return true}catch{flash('浏览器无法写入存档');return false}}
  function readCampaignTransferRaw(){try{const data=JSON.parse(localStorage.getItem(CAMPAIGN_KEY)||'null');return data?.schema===CAMPAIGN_SCHEMA?data:null}catch{return null}}
  function portableChecksum(text){let hash=2166136261;for(let i=0;i<text.length;i++)hash=Math.imul(hash^text.charCodeAt(i),16777619);return(hash>>>0).toString(16).padStart(8,'0')}
  function portablePayload(){return{saveStore:readSaveStore(),campaignTransfer:readCampaignTransferRaw()}}
  function portableSaveCount(store=readSaveStore()){return[store.auto,...store.manual].filter(storedSnapshot).length}
  function normalizePortableStore(store){if(!store||store.schema!==SAVE_SCHEMA||!Array.isArray(store.manual))throw new Error('存档版本不受支持');const normalized={schema:SAVE_SCHEMA,auto:store.auto||null,manual:Array.from({length:MANUAL_SLOT_COUNT},(_,i)=>store.manual[i]||null)};if(normalized.auto&&!storedSnapshot(normalized.auto))throw new Error('自动存档数据损坏');normalized.manual.forEach((save,i)=>{if(save&&!storedSnapshot(save))throw new Error(`档位 ${i+1} 数据损坏`)});return normalized}
  function normalizeCampaignTransfer(transfer){if(transfer===null||transfer===undefined)return null;if(transfer.schema!==CAMPAIGN_SCHEMA||!Array.isArray(transfer.units)||!transfer.fromLevelId||!transfer.toLevelId)throw new Error('关卡继承数据损坏');return transfer}
  function titleTransferNotice(message,error=false){const notice=document.getElementById('titleNotice'),hint=document.getElementById('saveMenuHint');if(notice){if(!('defaultText' in notice.dataset))notice.dataset.defaultText='';notice.textContent=message;notice.classList.toggle('transfer-error',error);notice.classList.toggle('transfer-ok',!error)}if(hint&&!document.getElementById('gameMenuOverlay').classList.contains('hidden'))hint.textContent=message;clearTimeout(titleTransferNotice.timer);titleTransferNotice.timer=setTimeout(()=>{if(notice){notice.textContent=notice.dataset.defaultText??'';notice.classList.remove('transfer-error','transfer-ok')}},7000)}
  function refreshPortableSaveButtons(){const hasData=portableSaveCount()>0||!!readCampaignTransferRaw();for(const id of ['titleExportSaveBtn','menuExportSaveBtn']){const button=document.getElementById(id);if(button)button.disabled=!hasData}let hasBackup=false;try{hasBackup=!!localStorage.getItem(IMPORT_BACKUP_KEY)}catch{}const undo=document.getElementById('titleUndoImportBtn');if(undo)undo.classList.toggle('hidden',!hasBackup)}
  function portableFilename(){const d=new Date(),pad=n=>String(n).padStart(2,'0');return`三国志昭烈传-存档-${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}.zhaolie-save.json`}
  async function exportPortableSave(){const payload=portablePayload(),count=portableSaveCount(payload.saveStore);if(!count&&!payload.campaignTransfer){titleTransferNotice('目前还没有可以导出的存档',true);return}const payloadText=JSON.stringify(payload),bundle={kind:PORTABLE_SAVE_KIND,formatVersion:PORTABLE_SAVE_VERSION,game:'三国志昭烈传',exportedAt:Date.now(),saveCount:count,payload,checksum:portableChecksum(payloadText)},text=JSON.stringify(bundle,null,2),filename=portableFilename(),file=new File([text],filename,{type:'application/json'});if(navigator.share&&navigator.canShare?.({files:[file]})){try{await navigator.share({title:'三国志昭烈传存档',text:`全部进度，共 ${count} 个存档`,files:[file]});titleTransferNotice(`已分享 ${count} 个存档`);return}catch(error){if(error?.name==='AbortError')return}}
    const url=URL.createObjectURL(file),link=document.createElement('a');link.href=url;link.download=filename;document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);titleTransferNotice(`已导出 ${count} 个存档，请妥善保存文件`)
  }
  function applyPortablePayload(payload,{createBackup=true}={}){const saveStore=normalizePortableStore(payload?.saveStore),campaignTransfer=normalizeCampaignTransfer(payload?.campaignTransfer),previous={saveStore:readSaveStore(),campaignTransfer:readCampaignTransferRaw()};if(createBackup)localStorage.setItem(IMPORT_BACKUP_KEY,JSON.stringify({kind:PORTABLE_SAVE_KIND,savedAt:Date.now(),payload:previous}));try{localStorage.setItem(SAVE_KEY,JSON.stringify(saveStore));if(campaignTransfer)localStorage.setItem(CAMPAIGN_KEY,JSON.stringify(campaignTransfer));else localStorage.removeItem(CAMPAIGN_KEY)}catch(error){localStorage.setItem(SAVE_KEY,JSON.stringify(previous.saveStore));if(previous.campaignTransfer)localStorage.setItem(CAMPAIGN_KEY,JSON.stringify(previous.campaignTransfer));else localStorage.removeItem(CAMPAIGN_KEY);throw error}return portableSaveCount(saveStore)}
  async function importPortableSaveFile(file){try{if(!file)throw new Error('没有选择存档文件');if(file.size>MAX_IMPORT_BYTES)throw new Error('存档文件过大，无法导入');const bundle=JSON.parse(await file.text());if(bundle?.kind!==PORTABLE_SAVE_KIND||bundle.formatVersion!==PORTABLE_SAVE_VERSION||!bundle.payload)throw new Error('这不是《三国志昭烈传》的存档文件');if(bundle.checksum!==portableChecksum(JSON.stringify(bundle.payload)))throw new Error('存档校验失败，文件可能已损坏');const count=applyPortablePayload(bundle.payload);refreshContinueButton();renderSaveSlots();refreshPortableSaveButtons();titleTransferNotice(`导入成功：恢复 ${count} 个存档；原存档已自动备份`)}catch(error){titleTransferNotice(error?.message||'存档导入失败',true)}finally{const input=document.getElementById('saveImportInput');if(input)input.value=''}}
  function choosePortableSaveFile(){const input=document.getElementById('saveImportInput');input.value='';input.click()}
  function undoPortableImport(){try{const backup=JSON.parse(localStorage.getItem(IMPORT_BACKUP_KEY)||'null');if(backup?.kind!==PORTABLE_SAVE_KIND||!backup.payload)throw new Error('没有可恢复的导入前存档');const count=applyPortablePayload(backup.payload,{createBackup:false});localStorage.removeItem(IMPORT_BACKUP_KEY);refreshContinueButton();renderSaveSlots();refreshPortableSaveButtons();titleTransferNotice(`已恢复导入前的 ${count} 个存档`)}catch(error){titleTransferNotice(error?.message||'无法撤销导入',true)}}
  function clearCampaignTransfer(){try{localStorage.removeItem(CAMPAIGN_KEY)}catch{}}
  function readCampaignTransfer(){try{const data=JSON.parse(localStorage.getItem(CAMPAIGN_KEY)||'null'),firstBranch=data?.fromLevelId==='hulao-pass'&&['guangchuan','xindu'].includes(data?.toLevelId)&&['guangchuan','xindu'].includes(level.id),secondBranch=['guangchuan','xindu'].includes(data?.fromLevelId)&&['julu','qinghe'].includes(data?.toLevelId)&&['julu','qinghe'].includes(level.id);return data?.schema===CAMPAIGN_SCHEMA&&(data.toLevelId===level.id||firstBranch||secondBranch)?data:null}catch{return null}}
  function writeCampaignTransfer(victoryType=campaignVictoryType){
    if(!level.nextLevelId)return false;
    const nextLevel=level.nextLevelId==='hulao-pass'?window.LEVEL_02:level.nextLevelId==='guangchuan'?window.LEVEL_03_GUANGCHUAN:level.nextLevelId==='julu'?window.LEVEL_04_JULU:level.nextLevelId==='qinghe'?window.LEVEL_04_QINGHE:null;if(!nextLevel)return false;
    const carryIds=new Set(nextLevel.units.filter(u=>u.carryover).map(u=>u.id));
    const payload={schema:CAMPAIGN_SCHEMA,fromLevelId:level.id,toLevelId:level.nextLevelId,savedAt:Date.now(),victoryType:victoryType||'normal',gold,units:units.filter(u=>carryIds.has(u.id)).map(u=>({id:u.id,level:u.level,exp:u.exp||0,inventory:[...(u.inventory||[])],treasureItems:[...(u.treasureItems||[])]}))};
    try{localStorage.setItem(CAMPAIGN_KEY,JSON.stringify(payload));return true}catch{return false}
  }
  function applyCampaignTransfer(runtimeUnits){
    if(levelSelectActive)return applyLevelSelectBalance(runtimeUnits);
    const transfer=readCampaignTransfer();if(!transfer)return{units:runtimeUnits,gold:500,applied:false};
    const carried=new Map((transfer.units||[]).map(u=>[u.id,u]));
    runtimeUnits.forEach(u=>{const saved=u.carryover?carried.get(u.id):null;if(!saved)return;u.level=Math.max(u.level,Number(saved.level)||u.level);u.exp=Math.max(0,Math.min(99,Number(saved.exp)||0));u.inventory=Array.isArray(saved.inventory)?[...saved.inventory]:[];u.treasureItems=Array.isArray(saved.treasureItems)?[...saved.treasureItems]:treasureIdsFor(u);const derived=originalDerivedStats(u);u.maxHp=derived.maxHp;u.hp=u.maxHp;u.maxStrategy=derived.maxStrategy;u.strategy=u.maxStrategy;u.morale=100;refreshPassiveTreasures(u)});
    return{units:runtimeUnits,gold:Math.max(0,Number(transfer.gold)||0),applied:true}
  }
  function levelSelectRecommendedLevel(){
    const enemies=level.units.filter(u=>u.side==='enemy'),boss=enemies.find(u=>u.boss)||enemies.reduce((best,u)=>!best||u.level>best.level?u:best,null),average=enemies.length?enemies.reduce((sum,u)=>sum+Math.max(1,Number(u.level)||1),0)/enemies.length:1,bossLevel=Math.max(1,Number(boss?.level)||Math.ceil(average));
    return Math.max(1,Math.min(Math.max(1,bossLevel-1),Math.floor((average+bossLevel)/2)))
  }
  function applyLevelSelectBalance(runtimeUnits){
    const frontlineLevel=levelSelectRecommendedLevel();
    selectedBalanceLevel=frontlineLevel;
    runtimeUnits.filter(u=>u.side==='ally').forEach(u=>{
      const backline=['archer','support','transport','sorcerer'].includes(u.troop),recommended=Math.max(1,frontlineLevel-(backline?1:0));
      u.level=Math.max(u.level,recommended);u.exp=0;const derived=originalDerivedStats(u);u.maxHp=derived.maxHp;u.hp=u.maxHp;u.atk=derived.attack;u.def=derived.defense;u.move=derived.move;u.maxStrategy=derived.maxStrategy;u.strategy=u.maxStrategy;u.morale=100
    });
    return{units:runtimeUnits,gold:500,applied:false,balanced:true,balanceLevel:frontlineLevel}
  }
  function syncLevelBalanceBadge(active=levelSelectActive,balanceLevel=selectedBalanceLevel){const badge=document.getElementById('levelBalanceBadge');badge.classList.toggle('hidden',!active);if(active)badge.textContent=`选关均衡 Lv.${balanceLevel||levelSelectRecommendedLevel()}`}
  function capturePrepBaseline(){
    prepBaseline={
      gold,
      units:Object.fromEntries(units.filter(u=>u.side==='ally').map(u=>[u.id,{inventory:[...(u.inventory||[])],treasureItems:[...(u.treasureItems||[])]}]))
    }
  }
  function snapshotLevelId(save){if(save?.levelId)return save.levelId;return save?.levelName==='清河之战'?'qinghe':save?.levelName==='巨鹿之战'?'julu':save?.levelName==='信都之战'?'xindu':save?.levelName==='广川之战'?'guangchuan':save?.levelName==='虎牢关之战'?'hulao-pass':save?.levelName==='汜水关之战'?'sishui-pass':null}
  function storedSnapshot(save){if(!save||save.schema!==SAVE_SCHEMA||!snapshotLevelId(save))return false;if(save.phaseType==='story')return Number.isInteger(save.storyIndex)&&Array.isArray(save.storyActors);if(save.phaseType==='prep')return true;return!!(Array.isArray(save.units)&&Array.isArray(save.map)&&save.map.every(row=>Array.isArray(row)))}
  function validSnapshot(save){if(!storedSnapshot(save)||snapshotLevelId(save)!==level.id)return false;if(save.phaseType==='story')return save.storyIndex>=0&&save.storyIndex<preBattleStory.length;if(save.phaseType==='prep')return true;return save.units.length===level.units.length&&save.map.length===ROWS&&save.map.every(row=>row.length===COLS)}
  function makeSnapshot(kind,slot=null){return{schema:SAVE_SCHEMA,levelId:level.id,levelName:level.name,chapter:level.chapter,kind,slot,savedAt:Date.now(),turn,side:playerTurn?'我军阶段':'敌军阶段',gold,playerTurn,phase:'select',battleStarted:true,dangerVisible,levelSelectBalanced:levelSelectActive,balanceLevel:selectedBalanceLevel,leaderboardClock:window.ZhaolieLeaderboard?.snapshotClock?.()||null,units:JSON.parse(JSON.stringify(units)),map:map.map(row=>[...row]),logs:logs.slice(-8),brotherMergeSpoken:[...brotherMergeSpoken],timedEventsFired:[...timedEventsFired]}}
  function makeStorySnapshot(kind,slot=null,phaseType='story'){
    return{schema:SAVE_SCHEMA,levelId:level.id,levelName:level.name,chapter:level.chapter,kind,slot,savedAt:Date.now(),turn:0,side:phaseType==='prep'?'战前整备':'剧情',gold,phaseType,storyIndex,storyScene,storyActors:[...storyActors.values()].map(({name,x,y,dir,sprite})=>({name,x,y,dir,sprite})),campaignTransfer:readCampaignTransferRaw(),routeChoiceFlow:routeChoiceFlow||undefined,levelSelectBalanced:levelSelectActive,balanceLevel:selectedBalanceLevel}
  }
  function saveGame(kind='auto',slot=null,{quiet=false}={}){
    if(!storyActive&&(!battleStarted||ending||dialogue||phase==='animating'||!playerTurn)){if(!quiet)flash('当前状态暂时不能存档');return false}
    const store=readSaveStore(),snapshot=storyActive?makeStorySnapshot(kind,slot):makeSnapshot(kind,slot);
    if(kind==='auto')store.auto=snapshot;else if(Number.isInteger(slot)&&slot>=0&&slot<MANUAL_SLOT_COUNT)store.manual[slot]=snapshot;else return false;
    if(!writeSaveStore(store))return false;refreshContinueButton();if(!quiet){flash(kind==='auto'?'已自动存档':`已保存到档位 ${slot+1}`);status(kind==='auto'?'自动存档完成':`进度已保存到档位 ${slot+1}`)}renderSaveSlots();return true
  }
  function scheduleAutoSave(delayMs=120){clearTimeout(autoSaveTimer);autoSaveTimer=setTimeout(()=>saveGame('auto',null,{quiet:true}),delayMs)}
  function latestSaveEntry(){const store=readSaveStore(),all=[{save:store.auto,token:'auto'},...store.manual.map((save,index)=>({save,token:String(index)}))].filter(entry=>storedSnapshot(entry.save));return all.sort((a,b)=>b.save.savedAt-a.save.savedAt)[0]||null}
  function latestSave(){return latestSaveEntry()?.save||null}
  function openStoredSnapshot(save,token){if(!storedSnapshot(save))return false;const targetId=snapshotLevelId(save),needsRouteFlow=!!save.routeChoiceFlow&&!routeChoiceFlow;if(targetId!==level.id||needsRouteFlow){const params=new URLSearchParams();params.set('level',targetId==='qinghe'?'6':targetId==='julu'?'5':targetId==='xindu'?'4':targetId==='guangchuan'?'3':targetId==='hulao-pass'?'2':'1');params.set('loadSlot',token);if(save.routeChoiceFlow)params.set(['julu','qinghe'].includes(targetId)?'secondRouteChoice':'routeChoice','1');if(save.levelSelectBalanced)params.set('levelSelect','1');location.href=`${location.pathname}?${params}`;return true}return loadSnapshot(save)}
  function formatSaveTime(timestamp){if(!timestamp)return'';try{return new Intl.DateTimeFormat('zh-CN',{month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date(timestamp))}catch{return new Date(timestamp).toLocaleString()}}
  function refreshContinueButton(){const hasSave=!!latestSave();document.getElementById('continueGameBtn').disabled=!hasSave;refreshPortableSaveButtons()}
  function renderSaveSlots(){
    const root=document.getElementById('saveSlots');if(!root)return;const store=readSaveStore(),entries=[{label:'自动存档',save:store.auto,auto:true},...store.manual.map((save,i)=>({label:`档位 ${i+1}`,save,index:i}))];
    root.innerHTML=entries.map(entry=>{const save=storedSnapshot(entry.save)?entry.save:null,disabled=saveMenuMode==='load'&&!save||saveMenuMode==='save'&&entry.auto,progress=save?.phaseType==='story'?`剧情 ${save.storyIndex+1}/${preBattleStory.length}`:save?.phaseType==='prep'?'战前整备':`第 ${save?.turn} 回合`;return`<button class="save-slot ${entry.auto?'auto':''} ${save?'':'empty'}" data-slot="${entry.auto?'auto':entry.index}" ${disabled?'disabled':''}><span class="slot-label">${entry.label}</span><span class="slot-meta">${save?`<b>${save.chapter} · ${save.levelName}</b><small>${progress} · ${save.side} · 金 ${save.gold}</small>`:'<b>空档位</b><small>'+(entry.auto?'系统将在关键节点自动保存':'点击此处保存当前进度')+'</small>'}</span>${save?`<time>${formatSaveTime(save.savedAt)}</time>`:''}</button>`}).join('');
    root.querySelectorAll('.save-slot').forEach(button=>button.onclick=()=>{const token=button.dataset.slot;if(saveMenuMode==='save'){if(token==='auto')return;saveGame('manual',Number(token));return}const save=token==='auto'?readSaveStore().auto:readSaveStore().manual[Number(token)];if(storedSnapshot(save)){if(saveMenuOrigin==='title')requestGameFullscreen();openStoredSnapshot(save,token)}})
  }
  function openGameMenu(mode='save',origin='game'){
    if(origin==='game'&&(dialogue||phase==='animating'||ending)){flash('请等待当前演出结束');return}
    if(origin==='game')cancelAction();saveMenuMode=mode;saveMenuOrigin=origin;const overlay=document.getElementById('gameMenuOverlay');overlay.classList.toggle('from-title',origin==='title');overlay.classList.toggle('from-story',origin==='story');overlay.classList.remove('hidden');document.getElementById('gameMenuTitle').textContent=mode==='save'?'保存进度':'读取进度';document.getElementById('saveTabBtn').classList.toggle('active',mode==='save');document.getElementById('loadTabBtn').classList.toggle('active',mode==='load');document.getElementById('saveTabBtn').disabled=origin==='title'||(!battleStarted&&!storyActive);document.getElementById('resumeGameBtn').textContent=origin==='title'?'返回开始画面':origin==='story'?'返回剧情':'返回游戏';const prepButton=document.getElementById('battlePrepBtn');prepButton.classList.toggle('hidden',origin==='title'||origin==='story');prepButton.disabled=origin!=='game'||!canOpenBattlePrep();document.getElementById('returnTitleBtn').classList.toggle('hidden',origin==='title'||origin==='story');document.getElementById('saveMenuHint').textContent=mode==='save'?(storyActive?'选择手动档位保存当前剧情位置；重要节点会自动保存。':battleStarted?'选择手动档位保存；自动存档由系统维护。':'开始战斗后才能保存。'):'选择已有进度继续游戏。';renderSaveSlots()
  }
  function closeGameMenu(){const overlay=document.getElementById('gameMenuOverlay');overlay.classList.add('hidden');overlay.classList.remove('from-story')}
  function titleVisible(){return!document.getElementById('titleScreen').classList.contains('hidden')}
  function revealTitleMenu(animate=false){
    const screen=document.getElementById('titleScreen'),overlay=document.getElementById('titleIntro'),video=document.getElementById('titleIntroVideo');
    titleIntroActive=false;clearTimeout(titleIntroFadeTimer);video.pause();screen.classList.remove('intro-playing');overlay.classList.toggle('finishing',animate);overlay.classList.toggle('hidden',!animate);
    if(animate)titleIntroFadeTimer=setTimeout(()=>{overlay.classList.add('hidden');overlay.classList.remove('finishing')},620)
  }
  function showTitle(){closeGameMenu();revealTitleMenu(false);document.getElementById('settingsPanel').classList.add('hidden');document.getElementById('settingsPanel').classList.remove('title-open');document.getElementById('titleScreen').classList.remove('hidden');refreshContinueButton();storyMusic.pause();battleMusic.pause();startTitleMusic()}
  function hideTitle(playMusic=true){document.getElementById('titleScreen').classList.add('hidden');titleMusic.pause();titleMusic.volume=mixedMusicVolume();if(playMusic)startBattleMusic()}
  function finishTitleIntro(){
    if(!titleIntroActive)return;revealTitleMenu(true);startTitleMusic()
  }
  function playTitleIntro(){
    const screen=document.getElementById('titleScreen'),overlay=document.getElementById('titleIntro'),video=document.getElementById('titleIntroVideo');titleIntroActive=true;screen.classList.add('intro-playing');overlay.classList.remove('hidden','finishing');storyMusic.pause();battleMusic.pause();titleMusic.currentTime=0;startTitleMusic();video.currentTime=0;video.muted=true;const playback=video.play();if(playback)playback.catch(finishTitleIntro)
  }
  function resetBattleState(){
    battleOverview=false;battleFocus=null;zoom=1;panX=0;panY=0;document.getElementById('touchOverview').setAttribute('aria-pressed','false');
    window.ZhaolieLeaderboard?.reset?.(level);
    const transfer=applyCampaignTransfer(level.units.map((u,spawnOrder)=>createRuntimeUnit(u,spawnOrder)));units=transfer.units;const focusUnit=units.find(u=>u.id==='liu');battleFocus=focusUnit?{x:focusUnit.x,y:focusUnit.y}:null;map.splice(0,map.length,...buildRuntimeMap());selected=null;inspected=null;phase='select';reachable.clear();attackable=[];moveOrigin=null;activeStrategy=null;activeItem=null;strategyFx=null;hoverPath=[];dangerVisible=false;dangerTiles=[];keyboardCursor=null;playerTurn=true;turnTransitionPending=false;turn=1;hover=null;gold=transfer.gold;capturePrepBaseline();dialogue=null;dialogIndex=0;ending=false;battleStarted=false;introPlayed=false;outcomeAction=restartBattle;logs.splice(0);brotherMergeSpoken.clear();timedEventsFired.clear();document.getElementById('turnNumber').textContent=turn;document.getElementById('sideLabel').textContent='我军阶段';syncLevelBalanceBadge(!!transfer.balanced,transfer.balanceLevel);document.getElementById('dialogOverlay').classList.add('hidden');document.getElementById('outcomeOverlay').classList.add('hidden');document.getElementById('shopOverlay').classList.add('hidden');document.getElementById('restartBtn').textContent='重新挑战';syncShop();syncUI();draw();status(transfer.balanced?`${level.name}已载入 · 选关均衡等级 Lv.${transfer.balanceLevel}`:transfer.applied?`${level.name}已载入 · 上一战部队已整补继承`:`${level.name}已载入`)
  }
  async function commenceBattle(){
    battleStarted=true;window.ZhaolieLeaderboard?.start?.(level);storyMusic.pause();startBattleMusic();document.getElementById('shopOverlay').classList.add('hidden');closeGameMenu();addLog(`战前整备完成 · 余金${gold} · 盟军${units.filter(u=>u.side==='guest').length}人`,true);syncUI();draw();
    if(introPlayed){status('请选择我军单位');scheduleAutoSave(0);return}
    introPlayed=true;
    const beginBattleIntro=()=>runDialogue(level.intro,()=>{phase='select';flash(`${level.name} · 我军阶段`);status('请选择我军单位');scheduleAutoSave(0)});
    const opening=level.openingDuel;
    if(opening){const winner=units.find(u=>u.id===opening.winnerId),loser=units.find(u=>u.id===opening.loserId);if(winner&&loser&&winner.hp>0&&loser.hp>0){await new Promise(resolve=>runDialogue(opening.challenge||[],resolve));phase='animating';status(`${winner.name} 单挑 ${loser.name}`);await playDuelCinematic(winner,loser,opening);loser.hp=0;loser.side='defeated';syncUI();draw();await new Promise(resolve=>runDialogue(opening.exchange||[],resolve));addLog(`${winner.name}阵前击败${loser.name}`,true)}}
    if(level.marchDialogue?.length&&!level.marchHandledByStory)runDialogue(level.marchDialogue,beginBattleIntro);else beginBattleIntro()
  }
  function finishOpeningMovie(){
    if(!openingActive)return;openingActive=false;const overlay=document.getElementById('openingOverlay'),video=document.getElementById('openingVideo'),done=openingDone;openingDone=null;video.pause();overlay.classList.add('hidden');if(done)done()
  }
  function playOpeningMovie(onDone){
    const overlay=document.getElementById('openingOverlay'),video=document.getElementById('openingVideo');openingDone=onDone;openingActive=true;titleMusic.pause();storyMusic.pause();battleMusic.pause();overlay.classList.remove('hidden');video.currentTime=0;video.volume=1;video.play().catch(finishOpeningMovie)
  }
  function storySpritePosition(sprite,dir){const col=((sprite%20)+20)%20,block=Math.max(0,Math.floor(sprite/20)),row=Math.min(7,block*4+(dir??0)%4);return`${-col*54}px ${-row*68}px`}
  function storyActorElement(actor){
    const el=document.createElement('button');el.type='button';el.className='story-actor';el.dataset.name=actor.name;el.setAttribute('aria-label',`${actor.name}，点击交谈`);el.innerHTML='<i></i><b></b>';el.querySelector('b').textContent=actor.name;
    el.onclick=e=>{e.stopPropagation();if(storyFreeRoam)interactStoryActor(actor.name)};document.getElementById('storyCast').appendChild(el);actor.el=el;return el
  }
  function renderStoryActorFrame(actor){
    const el=actor.el||storyActorElement(actor),sprite=el.querySelector('i'),dir=((actor.dir||0)%4+4)%4,wantsGesture=storyScene!=='world'&&Number.isInteger(actor.gestureFrame),gesture=wantsGesture&&dir<2?storyGestureAssets[actor.name]:null,asset=gesture||(storyScene==='world'?(storyWorldActorAssets[actor.name]||storyActorAssets[actor.name]):storyActorAssets[actor.name]);
    if(asset){const frame=Math.max(0,Math.min(3,wantsGesture?actor.gestureFrame:(actor.frame||0))),frameDir=dir===3?2:dir;el.classList.add('remastered');sprite.style.backgroundImage=`url('${asset}')`;sprite.style.backgroundSize=gesture?'400% 100%':'400% 400%';sprite.style.backgroundPosition=gesture?`${frame*100/3}% 0%`:`${frame*100/3}% ${frameDir*100/3}%`;sprite.style.transform=gesture?(dir===1?'scaleX(-1)':''):(dir===3?'scaleX(-1)':'')}
    else{el.classList.remove('remastered');sprite.style.transform='';sprite.style.backgroundImage="url('assets/story-actors.webp')";sprite.style.backgroundSize='1160px 576px';sprite.style.backgroundPosition=storySpritePosition(actor.sprite,actor.dir)}
  }
  function stopStoryGesture(actor,render=true){if(actor?.gestureTimer){clearInterval(actor.gestureTimer);actor.gestureTimer=null}if(actor&&Number.isInteger(actor.gestureFrame)){actor.gestureFrame=null;if(render)renderStoryActorFrame(actor)}}
  function startStoryGesture(actor,type='talk'){
    if(!actor||!storyGestureAssets[actor.name]||storyScene==='world')return;stopStoryGesture(actor,false);let index=0;const frames=type==='bow'?[0,3,3,0]:[1,2,1,0];actor.gestureFrame=frames[index];renderStoryActorFrame(actor);actor.gestureTimer=setInterval(()=>{index=(index+1)%frames.length;actor.gestureFrame=frames[index];renderStoryActorFrame(actor)},type==='bow'?520:430)
  }
  function stopStoryWalk(actor){if(actor?.walkTimer){clearInterval(actor.walkTimer);actor.walkTimer=null}if(actor){actor.frame=0;actor.el?.classList.remove('walking');renderStoryActorFrame(actor)}}
  function startStoryWalk(actor){
    if(!actor)return;stopStoryGesture(actor,false);stopStoryWalk(actor);actor.el?.classList.add('walking');actor.frame=1;renderStoryActorFrame(actor);
    if(storyActorAssets[actor.name])actor.walkTimer=setInterval(()=>{actor.frame=((actor.frame||0)+1)%4;renderStoryActorFrame(actor)},105)
  }
  function positionStoryActor(actor,animate=false,moveMs=120){
    const el=actor.el||storyActorElement(actor),depth=.86+Math.max(0,Math.min(1,(actor.y-6)/12))*.18;el.style.left=`${actor.x/32*100}%`;el.style.top=`${actor.y/20*100}%`;el.style.zIndex=String(100+Math.round(actor.y*10));el.style.setProperty('--story-depth',depth.toFixed(3));el.style.setProperty('--story-move-ms',`${moveMs}ms`);renderStoryActorFrame(actor);if(animate)startStoryWalk(actor)
  }
  function addStoryActor(spec){const actor={...spec,frame:0,walkTimer:null,gestureFrame:null,gestureTimer:null};storyActors.set(actor.name,actor);positionStoryActor(actor);return actor}
  function resetStoryActors(list=[]){storyActors.forEach(actor=>{stopStoryGesture(actor,false);stopStoryWalk(actor)});storyActors.clear();document.querySelectorAll('#storyCast .story-actor').forEach(el=>el.remove());list.forEach(addStoryActor)}
  const storyWait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
  function storyDirection(dx,dy,current=0){
    if(dy<0)return dx>=0?2:3;
    if(dy>0)return dx>=0?1:0;
    if(dx!==0)return dx>0?1:0;
    return current
  }
  function faceStoryActor(name,target){
    const actor=storyActors.get(name);if(!actor)return;
    const point=typeof target==='string'?storyActors.get(target):Array.isArray(target)?{x:target[0],y:target[1]}:null;
    if(!point||point===actor)return;
    actor.dir=storyDirection(point.x-actor.x,point.y-actor.y,actor.dir);positionStoryActor(actor)
  }
  function storyCellBlocked(x,y,actor,{ignoreActors=false,allowName=null}={}){
    const nav=storySceneNavigation[storyScene];if(nav&&(x<nav.minX||x>nav.maxX||y<nav.minY||y>nav.maxY))return true;
    if(nav?.obstacles.some(o=>x>=o.x1&&x<=o.x2&&y>=o.y1&&y<=o.y2))return true;
    if(ignoreActors)return false;return[...storyActors.values()].some(other=>other!==actor&&other.name!==allowName&&Math.round(other.x)===x&&Math.round(other.y)===y)
  }
  function nearestStoryWalkable(actor,targetX,targetY,options={}){
    const nav=storySceneNavigation[storyScene],rawX=Math.round(targetX),rawY=Math.round(targetY),minX=nav?.minX??0,maxX=nav?.maxX??32,minY=nav?.minY??0,maxY=nav?.maxY??20;
    const target=[Math.max(minX,Math.min(maxX,rawX)),Math.max(minY,Math.min(maxY,rawY))];
    if(!storyCellBlocked(target[0],target[1],actor,options))return target;
    const candidates=[];
    for(let radius=1;radius<=Math.max(maxX-minX,maxY-minY);radius++){
      for(let y=Math.max(minY,target[1]-radius);y<=Math.min(maxY,target[1]+radius);y++)for(let x=Math.max(minX,target[0]-radius);x<=Math.min(maxX,target[0]+radius);x++){
        if(Math.max(Math.abs(x-target[0]),Math.abs(y-target[1]))!==radius||storyCellBlocked(x,y,actor,options))continue;
        candidates.push([x,y,Math.abs(x-rawX)+Math.abs(y-rawY),Math.abs(x-actor.x)+Math.abs(y-actor.y)])
      }
      if(candidates.length){candidates.sort((a,b)=>a[2]-b[2]||a[3]-b[3]||a[1]-b[1]||a[0]-b[0]);return candidates[0].slice(0,2)}
    }
    return null
  }
  function findStoryPath(actor,targetX,targetY,options={}){
    const start=[Math.round(actor.x),Math.round(actor.y)],goal=nearestStoryWalkable(actor,targetX,targetY,options);if(!goal)return[];const queue=[start],seen=new Map([[start.join(','),null]]),steps=[[1,0],[-1,0],[0,1],[0,-1]];
    while(queue.length){const point=queue.shift();if(point[0]===goal[0]&&point[1]===goal[1]){const path=[];let key=point.join(',');while(seen.get(key)){const [x,y]=key.split(',').map(Number);path.push([x,y]);key=seen.get(key)}return path.reverse()}
      for(const [dx,dy] of steps){const x=point[0]+dx,y=point[1]+dy,key=`${x},${y}`;if(seen.has(key)||storyCellBlocked(x,y,actor,options)&&!(x===goal[0]&&y===goal[1]))continue;seen.set(key,point.join(','));queue.push([x,y])}
    }return[]
  }
  async function animateStoryPath(actor,path,{delay=0,finalDir=null,stepMs=105}={}){
    if(!actor||!path.length){if(actor&&finalDir!==null){actor.dir=finalDir;positionStoryActor(actor)}return 0}if(delay)await storyWait(delay);startStoryWalk(actor);
    let stepIndex=0;for(const [x,y] of path){if(!storyActive||storyActors.get(actor.name)!==actor)break;const dx=x-actor.x,dy=y-actor.y;actor.dir=storyDirection(dx,dy,actor.dir);actor.x=x;actor.y=y;positionStoryActor(actor,false,stepMs);if(stepIndex++%2===0)battleSfx('movementStep',actor,{mounted:false,alternate:stepIndex%4>1,terrain:'grass'});await storyWait(stepMs)}
    stopStoryWalk(actor);if(finalDir!==null){actor.dir=finalDir;positionStoryActor(actor)}return delay+path.length*stepMs
  }
  async function moveStoryActor(name,target,delay=0){
    const actor=storyActors.get(name);if(!actor)return 0;const goal=nearestStoryWalkable(actor,target[0],target[1],{ignoreActors:true});if(!goal)return 0;const path=findStoryPath(actor,goal[0],goal[1],{ignoreActors:true});
    if(!path.length){if(Math.round(actor.x)!==goal[0]||Math.round(actor.y)!==goal[1])return 0;actor.dir=target[2]??actor.dir;positionStoryActor(actor);return 0}
    return animateStoryPath(actor,path,{delay,finalDir:target[2]??actor.dir})
  }
  async function routeStoryActor(name,waypoints=[]){
    const routedActor=storyActors.get(name);
    for(const target of waypoints){
      if(!storyActive||storyActors.get(name)!==routedActor)break;
      await moveStoryActor(name,target);
    }
  }
  async function removeStoryActor(name,delay=0){const actor=storyActors.get(name);if(!actor)return;if(delay)await storyWait(delay);stopStoryGesture(actor,false);stopStoryWalk(actor);actor.el?.classList.add('leaving');await storyWait(260);actor.el?.remove();storyActors.delete(name)}
  function setStoryScene(scene){
    storyScene=scene;const overlay=document.getElementById('storyOverlay'),backdrop=document.getElementById('storyBackdrop');overlay.dataset.scene=scene;overlay.classList.toggle('prologue',scene==='prologue');backdrop.dataset.scene=scene;backdrop.classList.remove('scene-enter');void backdrop.offsetWidth;backdrop.classList.add('scene-enter');startStoryMusic(storyTrackByScene[scene]||2)
  }
  function setStoryDialogue(speaker,text,gesture='talk'){
    const img=document.getElementById('storyPortraitImage'),mark=document.getElementById('storyPortraitMark'),src=storyPortraits[speaker];document.getElementById('storySpeaker').textContent=speaker;document.getElementById('storyText').textContent=text;
    if(src){img.src=src;img.alt=`${speaker}立绘`;img.classList.remove('hidden');mark.classList.add('hidden')}else{img.classList.add('hidden');mark.classList.remove('hidden');mark.textContent=speaker==='史官'?'史':speaker==='提示'?'令':speaker[0]||'军'}
    storyActors.forEach(actor=>{const speaking=actor.name===speaker;actor.el?.classList.toggle('speaking',speaking);stopStoryGesture(actor);if(speaking)startStoryGesture(actor,gesture)})
  }
  function syncStoryRouteChoice(line){
    storyRouteChoicePending=!!line?.routeChoice;const overlay=document.getElementById('storyOverlay'),choices=document.getElementById('storyRouteChoices'),autoButton=document.getElementById('storyAutoBtn'),skipButton=document.getElementById('storySkipBtn');overlay.classList.toggle('route-choice',storyRouteChoicePending);choices.classList.toggle('hidden',!storyRouteChoicePending);autoButton.disabled=storyFreeRoam||storyRouteChoicePending;skipButton.disabled=storyRouteChoicePending;skipButton.textContent=storyRouteChoicePending?'请选择路线':routeChoiceFlow?'前往路线选择':'跳过剧情';
    if(storyRouteChoicePending){const buttons=[...choices.querySelectorAll('[data-story-route]')],second=secondRouteChoiceFlow,definitions=second?[['5','第四战A · 巨鹿路线','驰援公孙越，迎战张郃'],['6','第四战B · 清河路线','驰援严纲，迎战麴义']]:[['3','第三战A · 广川路线','路程较短，迎战逢纪'],['4','第三战B · 信都路线','驰援信都，迎战淳于琼']];buttons.forEach((button,index)=>{const [route,title,description]=definitions[index];button.dataset.storyRoute=route;button.querySelector('b').textContent=title;button.querySelector('span').textContent=description});storyAuto=false;autoButton.classList.remove('active');clearTimeout(storyTimer);status(second?'请选择巨鹿路线或清河路线':'请选择广川路线或信都路线')}
  }
  function chooseStoryRoute(levelNumber){
    const allowed=secondRouteChoiceFlow?['5','6']:['3','4'];if(!storyRouteChoicePending||!allowed.includes(String(levelNumber)))return;const targetId=String(levelNumber)==='6'?'qinghe':String(levelNumber)==='5'?'julu':String(levelNumber)==='4'?'xindu':'guangchuan',transfer=readCampaignTransferRaw();if(transfer&&(transfer.fromLevelId==='hulao-pass'||['guangchuan','xindu'].includes(transfer.fromLevelId))){transfer.toLevelId=targetId;transfer.savedAt=Date.now();try{localStorage.setItem(CAMPAIGN_KEY,JSON.stringify(transfer))}catch{}}
    storyRouteChoicePending=false;const params=new URLSearchParams();params.set('level',String(levelNumber));params.set('routeResume','1');params.set('build',RUNTIME_BUILD);location.href=`${location.pathname}?${params}`
  }
  async function applyStoryMoment(line){
    if(line.scene!==storyScene)setStoryScene(line.scene);if(line.setup)resetStoryActors(line.setup);await Promise.all((line.remove||[]).map(name=>removeStoryActor(name)));(line.spawn||[]).forEach(spec=>addStoryActor(spec));
    await Promise.all(Object.entries(line.move||{}).map(([name,target])=>moveStoryActor(name,target)));await Promise.all(Object.entries(line.thenMove||{}).map(([name,target])=>moveStoryActor(name,target,80)));await Promise.all(Object.entries(line.route||{}).map(([name,waypoints])=>routeStoryActor(name,waypoints)));
    Object.entries(line.turn||{}).forEach(([name,dir])=>{const actor=storyActors.get(name);if(actor){actor.dir=dir;positionStoryActor(actor)}});Object.entries(line.face||{}).forEach(([name,target])=>faceStoryActor(name,target));await Promise.all((line.removeAfter||[]).map(name=>removeStoryActor(name,100)));
  }
  async function showStoryLine(){
    const line=preBattleStory[storyIndex];if(!line){finishPreBattleStory();return}const token=++storyMomentToken;storyAdvanceLocked=true;clearTimeout(storyTimer);storyActors.forEach(actor=>{actor.el?.classList.remove('speaking');stopStoryGesture(actor)});storyFreeRoam=!!line.freeRoam;const overlay=document.getElementById('storyOverlay');overlay.classList.toggle('free-roam',storyFreeRoam);document.getElementById('storyObjective').classList.toggle('hidden',!storyFreeRoam);document.getElementById('storyLocation').textContent=line.location;document.getElementById('storyProgress').textContent=storyFreeRoam?'自由行动':`${storyIndex+1} / ${preBattleStory.length}`;document.getElementById('storyAutoBtn').disabled=storyFreeRoam;await applyStoryMoment(line);if(token!==storyMomentToken||!storyActive)return;setStoryDialogue(line.speaker,line.text,line.gesture);storyAdvanceLocked=false;syncStoryRouteChoice(line);
    if(!storyFreeRoam)saveStoryAutoCheckpoint();if(storyAuto&&!storyFreeRoam&&!storyRouteChoicePending)storyTimer=setTimeout(nextStoryLine,Math.max(2300,900+line.text.length*72))
  }
  function saveStoryAutoCheckpoint(phaseType='story'){
    const store=readSaveStore();store.auto=makeStorySnapshot('auto',null,phaseType);writeSaveStore(store);refreshContinueButton();renderSaveSlots()
  }
  function finishPreBattleStory(){if(!storyActive)return;if(routeChoiceFlow){storyIndex=preBattleStory.length-1;showStoryLine();return}saveStoryAutoCheckpoint('prep');storyMomentToken++;storyActive=false;storyActors.forEach(actor=>{stopStoryGesture(actor,false);stopStoryWalk(actor);actor.el?.remove()});storyActors.clear();storyAuto=false;storyFreeRoam=false;storyAdvanceLocked=false;storyInteraction=null;storyRouteChoicePending=false;clearTimeout(storyTimer);const overlay=document.getElementById('storyOverlay');overlay.classList.add('hidden');overlay.classList.remove('free-roam','route-choice');document.getElementById('storyRouteChoices').classList.add('hidden');document.getElementById('storyObjective').classList.add('hidden');document.getElementById('storyAutoBtn').classList.remove('active');document.getElementById('storySkipBtn').disabled=false;document.getElementById('storySkipBtn').textContent='跳过剧情';const done=storyDone;storyDone=null;if(done)done()}
  function leaveStoryFreeRoam(){if(storyIndex>=preBattleStory.length-1){finishPreBattleStory();return}storyFreeRoam=false;const overlay=document.getElementById('storyOverlay');overlay.classList.remove('free-roam');document.getElementById('storyObjective').classList.add('hidden');storyIndex++;showStoryLine()}
  function nextStoryLine(){
    if(!storyActive||storyAdvanceLocked||storyRouteChoicePending)return;if(storyInteraction){storyInteractionIndex++;if(storyInteractionIndex<storyInteraction.length){const item=storyInteraction[storyInteractionIndex];setStoryDialogue(item.speaker,item.text);return}const done=storyInteractionDone;storyInteraction=null;storyInteractionDone=null;if(done)done();return}
    if(storyFreeRoam)return;storyIndex++;if(storyIndex>=preBattleStory.length){finishPreBattleStory();return}showStoryLine()
  }
  function beginStoryInteraction(name,lines,onDone){storyInteraction=(lines||[]).map(text=>({speaker:name,text}));storyInteractionIndex=0;storyInteractionDone=onDone||null;if(storyInteraction.length)setStoryDialogue(name,storyInteraction[0].text);else if(onDone)onDone()}
  async function walkFreeRoamLiuTo(x,y,allowName=null){if(!storyFreeRoam||storyInteraction||storyAdvanceLocked)return false;const liu=storyActors.get('刘备');if(!liu)return false;const path=findStoryPath(liu,x,y,{allowName});if(!path.length)return false;storyAdvanceLocked=true;await animateStoryPath(liu,path,{stepMs:115});storyAdvanceLocked=false;return true}
  async function interactStoryActor(name){
    if(!storyFreeRoam||name==='刘备'||storyInteraction||storyAdvanceLocked)return;const liu=storyActors.get('刘备'),target=storyActors.get(name);if(!liu||!target)return;const candidates=[[target.x-1,target.y],[target.x+1,target.y],[target.x,target.y-1],[target.x,target.y+1]].map(([x,y])=>({x,y,path:findStoryPath(liu,x,y,{allowName:name})})).filter(x=>x.path.length||Math.round(liu.x)===x.x&&Math.round(liu.y)===x.y).sort((a,b)=>a.path.length-b.path.length);const best=candidates[0];if(!best)return;storyAdvanceLocked=true;if(best.path.length)await animateStoryPath(liu,best.path,{stepMs:115});liu.dir=storyDirection(target.x-liu.x,target.y-liu.y,liu.dir);target.dir=storyDirection(liu.x-target.x,liu.y-target.y,target.dir);positionStoryActor(liu);positionStoryActor(target);storyAdvanceLocked=false;const leave=name==='关羽'||name==='道具屋';beginStoryInteraction(name,preBattleNpcDialogue[name]||['……'],leave?leaveStoryFreeRoam:null)
  }
  async function moveFreeRoamLiu(dx,dy){if(!storyFreeRoam||storyInteraction||storyAdvanceLocked)return;const liu=storyActors.get('刘备');if(!liu)return;const x=Math.round(liu.x+dx),y=Math.round(liu.y+dy);if(storyCellBlocked(x,y,liu))return;await walkFreeRoamLiuTo(x,y)}
  function nearestStoryNpc(){const liu=storyActors.get('刘备');if(!liu)return null;return[...storyActors.values()].filter(a=>a.name!=='刘备').sort((a,b)=>(Math.abs(a.x-liu.x)+Math.abs(a.y-liu.y))-(Math.abs(b.x-liu.x)+Math.abs(b.y-liu.y)))[0]||null}
  function handleStoryKey(e){
    if(storyRouteChoicePending){if(e.target.closest?.('[data-story-route]'))return;const choices=secondRouteChoiceFlow?['5','6']:['3','4'];if(e.key==='1'||e.key==='ArrowLeft'){e.preventDefault();chooseStoryRoute(choices[0])}else if(e.key==='2'||e.key==='ArrowRight'){e.preventDefault();chooseStoryRoute(choices[1])}else e.preventDefault();return}if(storyInteraction){e.preventDefault();nextStoryLine();return}if(storyAdvanceLocked){e.preventDefault();return}if(!storyFreeRoam){e.preventDefault();nextStoryLine();return}const dirs={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]};if(dirs[e.key]){e.preventDefault();moveFreeRoamLiu(...dirs[e.key]);return}if(e.key==='Enter'||e.code==='Space'){e.preventDefault();const npc=nearestStoryNpc();if(npc&&Math.abs(npc.x-storyActors.get('刘备').x)+Math.abs(npc.y-storyActors.get('刘备').y)<=3)interactStoryActor(npc.name)}
  }
  function playPreBattleStory(onDone,startIndex=0){storyDone=onDone;storyIndex=Math.max(0,Math.min(preBattleStory.length-1,startIndex));storyActive=true;storyAuto=false;storyFreeRoam=false;storyAdvanceLocked=false;storyInteraction=null;storyRouteChoicePending=false;storyScene='';document.getElementById('storyOverlay').classList.remove('hidden');showStoryLine();setTimeout(()=>{if(storyActive&&storyIndex===startIndex)saveStoryAutoCheckpoint()},0)}
  function fadeOutTitleMusic(onDone){if(titleMusic.paused){onDone();return}const from=titleMusic.volume,start=performance.now(),duration=360;function frame(now){const p=Math.min(1,(now-start)/duration);titleMusic.volume=from*(1-p);if(p<1)requestAnimationFrame(frame);else{titleMusic.pause();titleMusic.volume=mixedMusicVolume();onDone()}}requestAnimationFrame(frame)}
  function startNewGame(){requestGameFullscreen();if(level.id==='sishui-pass')clearCampaignTransfer();resetBattleState();fadeOutTitleMusic(()=>{hideTitle(false);if(level.id==='sishui-pass')playOpeningMovie(()=>playPreBattleStory(openBattlePrep));else if(preBattleStory.length)playPreBattleStory(openBattlePrep);else openBattlePrep()})}
  function restartBattle(){resetBattleState();hideTitle();openBattlePrep()}
  function returnToTitleAfterBattle(){resetBattleState();showTitle()}
  function canOpenBattlePrep(){return turn===1&&playerTurn&&!ending&&phase==='select'&&units.filter(u=>u.side==='ally').every(u=>!u.acted)}
  function openBattlePrep(){if(!canOpenBattlePrep()){flash('只能在第一回合行动前整备');return}closeGameMenu();document.getElementById('shopOverlay').classList.remove('hidden');syncShop();status('战前整备：购买或转交道具后出征')}
  function loadStorySnapshot(save){
    try{if(save.campaignTransfer)localStorage.setItem(CAMPAIGN_KEY,JSON.stringify(save.campaignTransfer))}catch{}
    levelSelectActive=!!save.levelSelectBalanced;selectedBalanceLevel=levelSelectActive?(Number(save.balanceLevel)||levelSelectRecommendedLevel()):null;
    resetBattleState();hideTitle(false);closeGameMenu();gold=Number(save.gold)||gold;if(save.phaseType==='prep'){openBattlePrep();status('已恢复虎牢关战前整备');flash('读取进度完成');return true}
    storyDone=openBattlePrep;storyIndex=save.storyIndex;storyActive=true;storyAuto=false;storyFreeRoam=!!preBattleStory[storyIndex]?.freeRoam;storyAdvanceLocked=false;storyInteraction=null;storyScene='';const overlay=document.getElementById('storyOverlay');overlay.classList.remove('hidden');overlay.classList.toggle('free-roam',storyFreeRoam);setStoryScene(save.storyScene||preBattleStory[storyIndex].scene);resetStoryActors(save.storyActors||[]);const line=preBattleStory[storyIndex];document.getElementById('storyObjective').classList.toggle('hidden',!storyFreeRoam);document.getElementById('storyLocation').textContent=line.location;document.getElementById('storyProgress').textContent=storyFreeRoam?'自由行动':`${storyIndex+1} / ${preBattleStory.length}`;document.getElementById('storyAutoBtn').disabled=storyFreeRoam;setStoryDialogue(line.speaker,line.text,line.gesture);syncStoryRouteChoice(line);status(storyRouteChoicePending?(secondRouteChoiceFlow?'请选择巨鹿路线或清河路线':'请选择广川路线或信都路线'):'已恢复剧情进度');flash('读取进度完成');return true
  }
  function loadSnapshot(save){
    if(!validSnapshot(save)){flash('存档数据无效');return false}if(save.phaseType==='story'||save.phaseType==='prep')return loadStorySnapshot(save);levelSelectActive=!!save.levelSelectBalanced;selectedBalanceLevel=levelSelectActive?(Number(save.balanceLevel)||levelSelectRecommendedLevel()):null;units=save.units.map((u,i)=>refreshPassiveTreasures(applyPaintedDeploymentOverride({...u,spawnOrder:u.spawnOrder??i,inventory:Array.isArray(u.inventory)?[...u.inventory]:[],treasureItems:treasureIdsFor(u)})));const loadedMap=applyPaintedTerrainOverrides(save.map.map(row=>[...row]));map.splice(0,map.length,...loadedMap);turn=Math.max(1,Number(save.turn)||1);gold=Number(save.gold)||0;capturePrepBaseline();playerTurn=save.playerTurn!==false;turnTransitionPending=false;phase='select';battleStarted=true;window.ZhaolieLeaderboard?.restoreClock?.(save.leaderboardClock,level);introPlayed=true;ending=false;selected=null;inspected=null;dialogue=null;reachable.clear();attackable=[];moveOrigin=null;activeStrategy=null;activeItem=null;hoverPath=[];dangerVisible=!!save.dangerVisible;dangerTiles=[];keyboardCursor=null;logs.splice(0,logs.length,...(Array.isArray(save.logs)?save.logs.slice(-8):[]));brotherMergeSpoken.clear();(save.brotherMergeSpoken||[]).forEach(id=>brotherMergeSpoken.add(id));timedEventsFired.clear();(save.timedEventsFired||[]).forEach(id=>timedEventsFired.add(id));document.getElementById('turnNumber').textContent=turn;document.getElementById('sideLabel').textContent=playerTurn?'我军阶段':'敌军阶段';syncLevelBalanceBadge();document.getElementById('shopOverlay').classList.add('hidden');document.getElementById('dialogOverlay').classList.add('hidden');document.getElementById('outcomeOverlay').classList.add('hidden');hideTitle();closeGameMenu();if(dangerVisible)rebuildDangerTiles();syncUI();draw();status(`已读取第 ${turn} 回合进度${levelSelectActive?` · 选关均衡 Lv.${selectedBalanceLevel}`:''}`);flash('读取进度完成');return true
  }
  document.title=`三国志昭烈传 · 经典重燃InktoLife出品 · ${level.name}`;document.querySelector('.chapter small').textContent=level.chapter; document.querySelector('.chapter strong').textContent=level.name;document.getElementById('titleNotice').textContent='';document.getElementById('titleNotice').dataset.defaultText=''; document.querySelector('.objective b').textContent=level.objective;document.getElementById('defeatCondition').textContent=`败北：${level.defeat}`; document.getElementById('maxTurns').textContent=level.maxTurns;
  function resize(){const dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(wrap.clientWidth*dpr);canvas.height=Math.round(wrap.clientHeight*dpr);canvas.style.width=wrap.clientWidth+'px';canvas.style.height=wrap.clientHeight+'px';ctx.setTransform(dpr,0,0,dpr,0,0);originX=wrap.clientWidth/2;draw()}
  function updateBgRect(){const W=wrap.clientWidth,H=wrap.clientHeight;
    if(squareBattlefield){
      bgRect=level.id==='hulao-pass'?window.BATTLE_VIEW.hulaoView({width:W,height:H,zoom,panX,panY,focus:battleFocus||{x:13,y:19},overview:battleOverview,compact:matchMedia('(pointer:coarse)').matches||innerWidth<=1100}):window.BATTLE_VIEW.squareView({width:W,height:H,level,zoom,panX,panY,focus:battleFocus||{x:Math.floor(COLS/2),y:Math.floor(ROWS/2)},overview:battleOverview,compact:matchMedia('(pointer:coarse)').matches||innerWidth<=1100});return
    }
    const img=art.battlefield,iw=img.naturalWidth||1672,ih=img.naturalHeight||941,fit=Math.min(H/ih,(W/iw)*1.15),scale=fit*zoom;bgRect={x:(W-iw*scale)/2+panX,y:(H-ih*scale)/2+panY,w:iw*scale,h:ih*scale,scale}
  }
  function resetBattleCamera(unit=null){battleOverview=false;battleFocus=unit?{x:unit.x,y:unit.y}:null;zoom=1;panX=0;panY=0;document.getElementById('touchOverview').setAttribute('aria-pressed','false');draw()}
  function ensureBattleCamera(unit){if(!squareBattlefield||!unit)return;const p=iso(unit.x,unit.y);if(battleOverview||p.x<52||p.x>wrap.clientWidth-52||p.y<96||p.y>wrap.clientHeight-42){battleOverview=false;battleFocus={x:unit.x,y:unit.y};panX=0;panY=0;document.getElementById('touchOverview').setAttribute('aria-pressed','false');updateBgRect()}}
  function toggleBattleOverview(){battleOverview=!battleOverview;document.getElementById('touchOverview').setAttribute('aria-pressed',String(battleOverview));draw();flash(battleOverview?'全图：点击位置放大查看':'已返回作战视角')}
  function handleBattleTap(sx,sy){const q=screenToTile(sx,sy);if(battleOverview){if(q)resetBattleCamera(q);return}handleTileAction(q)}
  function iso(x,y){
    if(squareBattlefield)return level.id==='hulao-pass'?window.BATTLE_VIEW.hulaoTileCenter(bgRect,x,y):window.BATTLE_VIEW.squareTileCenter(bgRect,x,y,level);
    // The original 28 x 16 map is laid over the painted terrain with a
    // gentle row-dependent warp.  These anchors put the original river
    // cells on the visible river and cell (17,10) on the only bridge.
    const nx=.032*x-.164+.02987*y-.001787*y*y;
    const ny=.04+.018*y+.0028*y*y;
    return {x:bgRect.x+nx*bgRect.w,y:bgRect.y+ny*bgRect.h};
  }
  function screenToTile(sx,sy){if(squareBattlefield)return level.id==='hulao-pass'?window.BATTLE_VIEW.hulaoTileAt(bgRect,sx,sy,COLS,ROWS):window.BATTLE_VIEW.squareTileAt(bgRect,sx,sy,level);let best=null,bestD=Infinity;for(let y=0;y<ROWS;y++)for(let x=0;x<COLS;x++){const p=iso(x,y),d=(p.x-sx)**2+(p.y-sy)**2;if(d<bestD){bestD=d;best={x,y}}}const step=Math.max(26,Math.min(bgRect.w*.032,bgRect.h*.06));return bestD<Math.pow(step*.72,2)?best:null}
  function gridCell(x,y,fill,stroke){const p=iso(x,y),px=iso(x+.5,y),mx=iso(x-.5,y),py=iso(x,y+.5),my=iso(x,y-.5),w=Math.abs(px.x-mx.x)*(squareBattlefield?.92:.88),h=Math.abs(py.y-my.y)*(squareBattlefield?.92:.78),r=Math.max(2,3*bgRect.scale),left=p.x-w/2,top=p.y-h/2;ctx.beginPath();ctx.moveTo(left+r,top);ctx.lineTo(left+w-r,top);ctx.quadraticCurveTo(left+w,top,left+w,top+r);ctx.lineTo(left+w,top+h-r);ctx.quadraticCurveTo(left+w,top+h,left+w-r,top+h);ctx.lineTo(left+r,top+h);ctx.quadraticCurveTo(left,top+h,left,top+h-r);ctx.lineTo(left,top+r);ctx.quadraticCurveTo(left,top,left+r,top);ctx.closePath();if(fill){ctx.fillStyle=fill;ctx.fill()}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=Math.max(1,bgRect.scale);ctx.stroke()}}
  function shade(hex,amt){const n=parseInt(hex.slice(1),16),c=v=>Math.max(0,Math.min(255,v));return `rgb(${c((n>>16)+amt)},${c(((n>>8)&255)+amt)},${c((n&255)+amt)})`}
  function drawTile(x,y,t){gridCell(x,y,terrain[t].color,t==='water'?'#69aabc':'#294235');const p=iso(x,y),s=zoom;if(t==='grass'&&(x*13+y*7)%5===0){ctx.strokeStyle='#7d9956';ctx.beginPath();ctx.moveTo(p.x-8*s,p.y+3*s);ctx.lineTo(p.x-6*s,p.y-3*s);ctx.stroke()}if(t==='rough'){ctx.fillStyle='#afa56b';for(let i=0;i<3;i++)ctx.fillRect(p.x+(i*14-14)*s,p.y+(i%2?4:-4)*s,2*s,5*s)}if(t==='hill')drawRock(p.x,p.y-4*s,s);if(t==='forest')drawTree(p.x,p.y-8*s,s);if(t==='water'){ctx.strokeStyle='rgba(172,224,229,.45)';ctx.beginPath();ctx.moveTo(p.x-20*s,p.y-2*s);ctx.quadraticCurveTo(p.x,p.y-7*s,p.x+20*s,p.y-2*s);ctx.stroke()}if(t==='bridge')drawBridge(p.x,p.y,s);if(t==='fort')drawFort(p.x,p.y,s);if(t==='village')drawVillage(p.x,p.y,s);if(t==='treasure'||t==='supply')drawStore(p.x,p.y,s,t==='treasure'?'金':'豆')}
  function drawTree(x,y,s){ctx.fillStyle='#523f2a';ctx.fillRect(x-3*s,y-18*s,6*s,22*s);ctx.fillStyle='#173f2d';ctx.beginPath();ctx.arc(x,y-23*s,16*s,0,7);ctx.arc(x-10*s,y-18*s,12*s,0,7);ctx.arc(x+10*s,y-17*s,12*s,0,7);ctx.fill();ctx.fillStyle='#3d7441';ctx.beginPath();ctx.arc(x-3*s,y-28*s,10*s,0,7);ctx.fill()}
  function drawRock(x,y,s){ctx.fillStyle='#69736a';ctx.beginPath();ctx.moveTo(x-21*s,y+8*s);ctx.lineTo(x-12*s,y-14*s);ctx.lineTo(x+4*s,y-21*s);ctx.lineTo(x+21*s,y+7*s);ctx.closePath();ctx.fill();ctx.strokeStyle='#34463e';ctx.stroke()}
  function drawBridge(x,y,s){ctx.fillStyle='#59442e';ctx.fillRect(x-34*s,y-10*s,68*s,20*s);ctx.fillStyle='#9b7a4d';for(let i=-3;i<=3;i++)ctx.fillRect(x+i*10*s-4*s,y-9*s,8*s,18*s)}
  function drawFort(x,y,s){ctx.fillStyle='#65513d';ctx.fillRect(x-30*s,y-24*s,60*s,26*s);ctx.fillStyle='#a18a67';for(let i=-2;i<=2;i++)ctx.fillRect(x+i*12*s-4*s,y-31*s,8*s,10*s);ctx.fillStyle='#211b16';ctx.fillRect(x-9*s,y-15*s,18*s,17*s)}
  function drawVillage(x,y,s){ctx.fillStyle='#6b452e';ctx.fillRect(x-18*s,y-17*s,36*s,19*s);ctx.fillStyle='#c59b59';ctx.beginPath();ctx.moveTo(x-24*s,y-17*s);ctx.lineTo(x,y-35*s);ctx.lineTo(x+24*s,y-17*s);ctx.closePath();ctx.fill();ctx.strokeStyle='#4b3727';ctx.stroke()}
  function drawStore(x,y,s,label){ctx.fillStyle='#68523a';ctx.fillRect(x-17*s,y-19*s,34*s,21*s);ctx.fillStyle='#c2a365';ctx.font=`bold ${11*s}px serif`;ctx.textAlign='center';ctx.fillText(label,x,y-5*s);ctx.strokeStyle='#d4bd7b';ctx.strokeRect(x-17*s,y-19*s,34*s,21*s)}
  function drawStructureLabel(x,y,label,color,dimmed){const s=bgRect.scale,pad=6*s,h=17*s;ctx.save();ctx.font=`bold ${Math.max(9,10*s)}px "Microsoft YaHei"`;const w=ctx.measureText(label).width+pad*2,left=x-w/2,top=y;ctx.globalAlpha=dimmed?.72:.94;ctx.fillStyle='#07172ddd';ctx.strokeStyle=color;ctx.lineWidth=Math.max(1,s);ctx.beginPath();ctx.moveTo(left+3*s,top);ctx.lineTo(left+w-3*s,top);ctx.quadraticCurveTo(left+w,top,left+w,top+3*s);ctx.lineTo(left+w,top+h-3*s);ctx.quadraticCurveTo(left+w,top+h,left+w-3*s,top+h);ctx.lineTo(left+3*s,top+h);ctx.quadraticCurveTo(left,top+h,left,top+h-3*s);ctx.lineTo(left,top+3*s);ctx.quadraticCurveTo(left,top,left+3*s,top);ctx.closePath();ctx.fill();ctx.stroke();ctx.fillStyle='#fff0bd';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(label,x,top+h*.52);ctx.restore()}
  function drawMapStructures(){
    for(let y=0;y<ROWS;y++)for(let x=0;x<COLS;x++){
      const t=map[y][x];
      if(t==='fort'){const p=iso(x,y),s=bgRect.scale,img=terrainArt.fort;gridCell(x,y,'rgba(165,113,55,.2)','#d9ae63aa');if(!level.structuresBakedIntoArt){if(img?.complete&&img.naturalWidth){const h=146*s,w=h*img.naturalWidth/img.naturalHeight;ctx.drawImage(img,p.x-w/2,p.y-h+24*s,w,h)}else drawFort(p.x,p.y,s)}drawStructureLabel(p.x,p.y+14*s,'鹿砦','#d9ae63',false);continue}
      const base=t.startsWith('treasure')?'treasure':t.startsWith('supply')?'supply':t==='village'?'village':null;if(!base)continue;
      const p=iso(x,y),s=bgRect.scale,img=terrainArt[base],empty=t.endsWith('Empty'),styles={village:{h:136,label:'村庄',color:'#d9b85f'},treasure:{h:112,label:empty?'宝物库·已开启':'宝物库',color:'#e6bd58'},supply:{h:116,label:empty?'兵粮库·已取用':'兵粮库',color:'#8ec5c7'}},st=styles[base],h=st.h*s,w=h*((img?.naturalWidth||1)/(img?.naturalHeight||1));
      gridCell(x,y,base==='village'?'rgba(118,155,73,.18)':base==='treasure'?'rgba(208,158,54,.18)':'rgba(79,151,143,.18)',st.color+'aa');
      if(!level.structuresBakedIntoArt&&img?.complete&&img.naturalWidth){ctx.save();ctx.globalAlpha=empty?.58:1;if(empty)ctx.filter='grayscale(.42) saturate(.72)';ctx.drawImage(img,p.x-w/2,p.y-h+24*s,w,h);ctx.restore()}
      drawStructureLabel(p.x,p.y+14*s,st.label,st.color,empty);
    }
  }
  function unitAt(x,y){return units.find(u=>u.hp>0&&u.x===x&&u.y===y)}
  function hasXuandeAura(u){const liu=units.find(x=>x.id==='liu'&&x.hp>0),friendly=u&&(u.side==='ally'||u.side==='guest');return!!(liu&&friendly&&u!==liu&&u.hp>0&&Math.abs(u.x-liu.x)+Math.abs(u.y-liu.y)===1)}
  function originalDerivedStats(u){return BattleRules.derivedStats({troop:u.troop,level:u.level,wuli:u.wuli||0,zhili:u.zhili||0,tongyu:u.tongyu||0,morale:u.morale??100,attackBonus:u.weaponBonus||0,defenseBonus:u.armorBonus||0})}
  function effectiveStat(u,key){const derived=originalDerivedStats(u),source=key==='atk'?derived.attack:key==='def'?derived.defense:key==='move'?derived.move:u[key],base=Number.isFinite(source)?source:0;let value=base;if(u.containedUntil>=turn&&(key==='atk'||key==='move'))value*=.8;if(!hasXuandeAura(u))return key==='move'?Math.max(1,Math.ceil(value)):Math.round(value);return key==='move'?Math.ceil(value*1.1):Math.round(value*1.1)}
  function effectiveRate(u,key){const value=u[key]||0;return Math.min(.95,value*(hasXuandeAura(u)?1.1:1))}
  function playBrotherMergeDialogue(movedUnit){
    const liu=units.find(u=>u.id==='liu'&&u.hp>0);if(!liu||!['liu','guan','zhang'].includes(movedUnit.id))return Promise.resolve();
    let speaker=null;
    if(movedUnit.id==='liu')speaker=['guan','zhang'].map(id=>units.find(u=>u.id===id&&u.hp>0)).find(u=>u&&Math.abs(u.x-liu.x)+Math.abs(u.y-liu.y)===1&&!brotherMergeSpoken.has(u.id));
    else if(Math.abs(movedUnit.x-liu.x)+Math.abs(movedUnit.y-liu.y)===1&&!brotherMergeSpoken.has(movedUnit.id))speaker=movedUnit;
    if(!speaker)return Promise.resolve();brotherMergeSpoken.add(speaker.id);status(`${speaker.name}与刘备合兵一处`);return new Promise(resolve=>runDialogue([{speaker:speaker.name,text:'大哥我们合兵一处！'}],resolve));
  }
  // Friendly characters may reuse a troop sheet, but their skin, mount and
  // weapons must keep their natural colours.  Faction identity is shown by
  // flags, health bars and the ground marker.  Only clearly red cloth/armour
  // pixels are shifted to blue; orange skin, horses and weapons stay intact.
  function usesGenericFriendlyArt(u){return u.side!=='enemy'&&!art[u.id]}
  // Both Image and Canvas sources are accepted by the renderer.  Friendly
  // troop variants are now real WebP files, so browsers never need to retain
  // a large set of off-screen recolouring canvases during a long battle.
  function mediaWidth(source){return source?.naturalWidth||source?.videoWidth||source?.width||0}
  function mediaHeight(source){return source?.naturalHeight||source?.videoHeight||source?.height||0}
  function mediaReady(source){return!!(mediaWidth(source)&&mediaHeight(source))}
  function factionAssetFor(u,key,baseAssets,friendlyAssets){const source=baseAssets[key];if(!usesGenericFriendlyArt(u))return source;const friendly=friendlyAssets[key];return mediaReady(friendly)?friendly:source}
  // Unnamed cavalry still need a complete mounted visual set.  Reuse the
  // mounted officer geometry at troop scale, then apply the faction palette.
  function genericVisualKeyFor(u){if(u.troop==='cavalry')return'hua';if(u.troop==='archer')return'archer';if(u.troop==='martial')return'martial';if(u.troop==='bandit')return'bandit';if(u.troop==='support')return'support';if(u.role!=='前锋')return'officer';return'infantry'}
  function spriteFor(u){if(art[u.id])return art[u.id];const key=genericVisualKeyFor(u);return factionAssetFor(u,key,art,friendlyArt)}
  function attackKeyFor(u){if(attackArt[u.id])return u.id;if(art[u.id])return null;return genericVisualKeyFor(u)}
  function attackSpriteFor(u){const key=attackKeyFor(u);return key?factionAssetFor(u,key,attackArt,friendlyAttackArt):null}
  function walkKeyFor(u){if(walkArt[u.id])return u.id;if(art[u.id])return null;return genericVisualKeyFor(u)}
  function walkSpriteFor(u){const key=walkKeyFor(u);return key?factionAssetFor(u,key,walkArt,friendlyWalkArt):null}
  function hurtKeyFor(u){if(art[u.id])return null;const key=genericVisualKeyFor(u);return hurtArt[key]?key:null}
  function hurtSpriteFor(u){const key=hurtKeyFor(u);return key?factionAssetFor(u,key,hurtArt,friendlyHurtArt):null}
  function walkRowFor(direction){return({west:0,north:1,east:2,south:3})[direction]??0}
  function attackDirectionFor(attacker,target){const dx=target.x-attacker.x,dy=target.y-attacker.y;if(Math.abs(dx)>=Math.abs(dy))return dx>=0?'east':'west';return dy>=0?'south':'north'}
  function directionalAttackMotion(fx){const frames=[0,1,2,3,0],frame=frames[Math.max(0,Math.min(4,fx.attackFrame||0))];return{direction:attackDirectionFor(fx.attacker,fx.target),walkPhase:frame/4}}
  function defaultFacing(u){return u.side==='enemy'?1:-1}
  function idleFacingFor(u){
    const opponents=units.filter(target=>target.hp>0&&(u.side==='enemy'?(target.side==='ally'||target.side==='guest'):target.side==='enemy'));
    if(!opponents.length)return u.facing??defaultFacing(u);
    const target=opponents.reduce((best,candidate)=>Math.abs(candidate.x-u.x)+Math.abs(candidate.y-u.y)<Math.abs(best.x-u.x)+Math.abs(best.y-u.y)?candidate:best);
    // Compare the real projected screen positions.  This works for the
    // original isometric map and the newer square-grid maps, whose x axis is
    // not the old (x-y) projection.  Idle art always uses its front diagonal
    // row and is mirrored so each formation visibly faces the opposition.
    const from=iso(u.x,u.y),to=iso(target.x,target.y),screenDx=to.x-from.x;
    return Math.abs(screenDx)>.01?(screenDx>0?1:-1):(u.facing??defaultFacing(u))
  }
  function shouldFlipForFacing(u,facing){return (facing??defaultFacing(u))!==defaultFacing(u)}
  function isMountedUnit(u){return u.troop==='cavalry'||u.mountedVisual===true}
  function isCriticallyWounded(u){return u.hp>0&&u.maxHp>0&&u.hp/u.maxHp<=.3}
  function woundedKeyFor(u){
    if(woundedAtlasOrder.includes(u.id))return u.id;
    if(u.troop==='cavalry')return'hua';
    if(u.troop==='archer')return'archer';
    if(u.role!=='前锋')return'officer';
    return'infantry'
  }
  function idleMotionFor(u){
    const active=!anim&&!combatFx&&u.hp>0;
    if(!active)return{active:false,mounted:false,archer:false,phase:0,breath:0,idleFrame:0,idleNextFrame:0,idleBlend:0,direction:'west',facing:u.facing??defaultFacing(u),archerFrame:0,archerPoseAlpha:0};
    const seed=[...u.id].reduce((n,c)=>n+c.charCodeAt(0),0)*.173+u.x*.61+u.y*.37,t=performance.now()/1000,mounted=isMountedUnit(u),archer=u.troop==='archer',phase=t+seed;
    // The reference uses authored key poses instead of deforming the whole
    // bitmap.  Units spend most of the cycle still, then briefly shift their
    // stance; mounted poses change the horse's planted leg while the rider
    // compensates.  All frames share a fixed foot baseline.
    const duration=mounted?5.4:4.8,cycle=((phase+seed*.19)%duration+duration)%duration/duration,blend=(a,b,n)=>Math.max(0,Math.min(1,(n-a)/(b-a)));
    let idleFrame=0,idleNextFrame=0,idleBlend=0;
    if(cycle>=.54&&cycle<.66){idleNextFrame=1;idleBlend=blend(.54,.66,cycle)}
    else if(cycle>=.66&&cycle<.76){idleFrame=1;idleNextFrame=0;idleBlend=blend(.66,.76,cycle)}
    else if(cycle>=.84&&cycle<.92){idleNextFrame=3;idleBlend=blend(.84,.92,cycle)}
    else if(cycle>=.92){idleFrame=3;idleNextFrame=0;idleBlend=blend(.92,1,cycle)}
    const breath=(Math.sin(phase*2.05)+1)/2;
    const bowCycle=((phase+seed*.47)%5.8+5.8)%5.8,bowActive=archer&&bowCycle>.9&&bowCycle<3.75,bowP=bowActive?(bowCycle-.9)/2.85:0,archerFrame=!bowActive?0:bowP<.2?0:bowP<.42?1:bowP<.68?2:bowP<.86?1:0,archerPoseAlpha=bowActive?Math.min(1,(bowCycle-.9)/.28,(3.75-bowCycle)/.32):0;
    // Authored sheets are inconsistent about which numbered row represents
    // the two rear diagonals.  Row zero is the one invariant: every roster
    // sheet presents the face.  Use that front diagonal for idle, then mirror
    // it toward the nearest opponent.  Walking still uses all four rows.
    return{active:true,mounted,archer,phase,breath,idleFrame,idleNextFrame,idleBlend,direction:'west',facing:idleFacingFor(u),archerFrame,archerPoseAlpha};
  }
  function walkingMotionFor(u,phase){const wave=Math.sin(phase*Math.PI*2),mounted=isMountedUnit(u);return{active:true,walking:true,mounted,archer:false,phase,breath:.5,legLift:Math.abs(wave),legSide:wave>=0?1:-1,stepWave:wave,archerFrame:0,archerPoseAlpha:0}}
  function drawStaticUnitImage(u,img,targetW,targetH,idle){
    const s=bgRect.scale,imageW=mediaWidth(img),imageH=mediaHeight(img),x=-targetW/2,y=-targetH+10*s,drawSlice=(sx,sy,sw,sh,dx,dy,dw,dh)=>{
      if(u.id!=='liu'||sy>=128||sx+sw<=330){ctx.drawImage(img,sx,sy,sw,sh,dx,dy,dw,dh);return}
      const topEnd=Math.min(sy+sh,128),topH=Math.max(0,topEnd-sy),safeW=Math.max(0,Math.min(sw,330-sx));
      if(topH>0&&safeW>0)ctx.drawImage(img,sx,sy,safeW,topH,dx,dy,dw*(safeW/sw),dh*(topH/sh));
      const lowerStart=Math.max(sy,128),lowerH=Math.max(0,sy+sh-lowerStart),lowerOffset=(lowerStart-sy)/sh;
      if(lowerH>0)ctx.drawImage(img,sx,lowerStart,sw,lowerH,dx,dy+dh*lowerOffset,dw,dh*(lowerH/sh));
    };
    if(idle?.walking&&!idle.mounted){
      const cutY=Math.floor(imageH*.66),upperH=targetH*.66,lowerH=targetH-upperH,halfSrc=Math.floor(imageW/2),halfDst=targetW/2,step=idle.stepWave||0,lift=Math.abs(step)*3.4*s,reach=step*1.8*s;
      for(let i=0;i<2;i++){const side=i===0?-1:1,active=side===idle.legSide,pivotX=x+(i+.5)*halfDst;ctx.save();ctx.translate(pivotX+side*reach,y+upperH);ctx.rotate(active?side*.035*lift/(3.4*s):0);ctx.drawImage(img,i*halfSrc,cutY,i===1?imageW-halfSrc:halfSrc,imageH-cutY,-halfDst/2,active?-lift:0,halfDst,lowerH);ctx.restore()}
      ctx.save();ctx.translate(0,y+upperH);ctx.rotate(-step*.018);drawSlice(0,0,imageW,cutY,x,-upperH,targetW,upperH+1*s);ctx.restore();return
    }
    if(idle?.archer&&idle.archerPoseAlpha>0){
      // Crossfade into the authored bow-draw frames.  The image bounds keep
      // both feet on the same baseline while the arms and bow actually move.
      drawSlice(0,0,imageW,imageH,x,y,targetW,targetH);
      const sheet=attackSpriteFor(u),key=attackKeyFor(u),frame=idle.archerFrame,b=attackFrameBounds[key]?.[frame];
      if(mediaReady(sheet)&&b){const sourceW=Math.floor(mediaWidth(sheet)/5),pixelScale=targetH/imageH;ctx.save();ctx.globalAlpha=idle.archerPoseAlpha;ctx.drawImage(sheet,frame*sourceW+b[0],b[1],b[2],b[3],(b[0]-sourceW/2)*pixelScale,10*s-b[3]*pixelScale,b[2]*pixelScale,b[3]*pixelScale);ctx.restore()}
      return
    }
    drawSlice(0,0,imageW,imageH,x,y,targetW,targetH);
  }
  function drawAuthoredWalkFrame(u,sheet,targetH,motion){
    const key=walkKeyFor(u),row=walkRowFor(motion.direction),frame=((Math.floor(motion.walkPhase*4)%4)+4)%4,b=walkFrameBounds[key]?.[row]?.[frame];
    if(!b)return false;const sheetW=mediaWidth(sheet),sheetH=mediaHeight(sheet),cellX0=Math.floor(frame*sheetW/4),cellX1=Math.floor((frame+1)*sheetW/4),cellY0=Math.floor(row*sheetH/4),cellY1=Math.floor((row+1)*sheetH/4),cellW=cellX1-cellX0,cellH=cellY1-cellY0,scale=targetH/Math.max(...walkFrameBounds[key].flat().map(q=>q[3])),center=b[0]+b[2]/2,feet=b[1]+b[3];
    ctx.drawImage(sheet,cellX0,cellY0,cellW,cellH,-center*scale,10*bgRect.scale-feet*scale,cellW*scale,cellH*scale);return true
  }
  function drawAuthoredIdleFrame(u,sheet,targetH,idle){
    const key=walkKeyFor(u),row=walkRowFor(idle.direction),bounds=walkFrameBounds[key]?.[row];
    if(!bounds)return false;
    const scale=targetH/Math.max(...walkFrameBounds[key].flat().map(q=>q[3])),drawFrame=(frame,alpha)=>{
      if(alpha<=0)return;const b=bounds[frame],sheetW=mediaWidth(sheet),sheetH=mediaHeight(sheet),cellX0=Math.floor(frame*sheetW/4),cellX1=Math.floor((frame+1)*sheetW/4),cellY0=Math.floor(row*sheetH/4),cellY1=Math.floor((row+1)*sheetH/4),cellW=cellX1-cellX0,cellH=cellY1-cellY0,center=b[0]+b[2]/2,feet=b[1]+b[3];
      ctx.save();ctx.globalAlpha*=alpha;ctx.drawImage(sheet,cellX0,cellY0,cellW,cellH,-center*scale,10*bgRect.scale-feet*scale,cellW*scale,cellH*scale);ctx.restore()
    };
    drawFrame(idle.idleFrame,1-idle.idleBlend);drawFrame(idle.idleNextFrame,idle.idleBlend);return true
  }
  function drawAuthoredHurtFrame(u,sheet,targetH,frame){
    const key=hurtKeyFor(u),b=hurtFrameBounds[key]?.[frame];if(!b)return false;const sheetW=mediaWidth(sheet),sheetH=mediaHeight(sheet),sourceW=Math.floor(sheetW/5),cellX0=frame*sourceW,scale=targetH/Math.max(...hurtFrameBounds[key].map(q=>q[3])),center=b[0]+b[2]/2,feet=b[1]+b[3];ctx.drawImage(sheet,cellX0,0,sourceW,sheetH,-center*scale,10*bgRect.scale-feet*scale,sourceW*scale,sheetH*scale);return true
  }
  function hurtFrameFor(u,fx){const q=Math.max(0,Math.min(1,fx?.hitReaction||0));if(fx?.fatal||isCriticallyWounded(u))return q<.25?1:q<.55?2:3;return q<.36?1:q<.72?2:4}
  function drawWoundedUnit(u,targetH,idle){
    const dedicated=hurtSpriteFor(u);if(mediaReady(dedicated))return drawAuthoredHurtFrame(u,dedicated,targetH,3);
    if(u.troop==='support')return false;
    const woundedSheet=usesGenericFriendlyArt(u)&&mediaReady(friendlyWoundedArt)?friendlyWoundedArt:woundedArt;if(!mediaReady(woundedSheet))return false;
    const key=woundedKeyFor(u),index=woundedAtlasOrder.indexOf(key),b=woundedFrameBounds[key];if(index<0||!b)return false;
    const woundedW=mediaWidth(woundedSheet),woundedH=mediaHeight(woundedSheet),column=index%4,row=Math.floor(index/4),cellX0=Math.round(column*woundedW/4),cellX1=Math.round((column+1)*woundedW/4),cellY0=Math.round(row*woundedH/4),cellY1=Math.round((row+1)*woundedH/4),cellW=cellX1-cellX0,cellH=cellY1-cellY0,scale=targetH*.79/b[3],center=b[0]+b[2]/2,feet=b[1]+b[3],breath=((idle?.breath??.5)-.5)*.006;
    ctx.save();ctx.translate(0,10*bgRect.scale-feet*scale);ctx.scale((idle?.facing??u.facing??defaultFacing(u))>0?-1:1,1+breath);ctx.drawImage(woundedSheet,cellX0,cellY0,cellW,cellH,-center*scale,0,cellW*scale,cellH*scale);ctx.restore();return true
  }
  function deathKeyFor(u){return deathArt[u.id]?u.id:u.troop==='cavalry'?'hua':null}
  function drawAuthoredDeathFrame(u,sheet,targetH,fx){
    const key=deathKeyFor(u),progress=Math.max(0,Math.min(1,fx.deathProgress||0)),frame=progress<.18?0:progress<.38?1:progress<.58?2:progress<.8?3:4,b=deathFrameBounds[key]?.[frame],standing=deathFrameBounds[key]?.[0];
    if(!b||!standing)return false;const sheetW=mediaWidth(sheet),sheetH=mediaHeight(sheet),cellX0=Math.floor(frame*sheetW/5),cellX1=Math.floor((frame+1)*sheetW/5),cellW=cellX1-cellX0,scale=targetH/standing[3],center=b[0]+b[2]/2,feet=b[1]+b[3];
    ctx.drawImage(sheet,cellX0,0,cellW,sheetH,-center*scale,10*bgRect.scale-feet*scale,cellW*scale,sheetH*scale);return true
  }
  function attackSheetScale(key,targetH,staticImg,sheet){
    const authored=level02AnimationBounds.attack?.[key]||(['martial','bandit','support'].includes(key)?attackFrameBounds[key]:null);
    return authored?targetH/Math.max(...authored.map(bounds=>bounds[3])):targetH/(mediaHeight(staticImg)||mediaHeight(sheet))
  }
  function drawIdleGroundFx(u,base,idle,isMounted){
    if(!idle.active)return;const s=bgRect.scale;
    ctx.save();ctx.globalAlpha=isMounted?.18:.12;ctx.fillStyle='#07141a';ctx.beginPath();ctx.ellipse(base.x,base.y+5*s,(isMounted?28:19)*s,(isMounted?7:5)*s,0,0,Math.PI*2);ctx.fill();
    ctx.restore();
  }
  function drawFactionGroundMarker(u,pos,isMounted,dimmed,fade=1){
    if(u.side==='enemy')return;const s=bgRect.scale,color=u.side==='guest'?'#85dff1':'#45c9dd';
    ctx.save();ctx.globalAlpha=(dimmed?.2:.52)*fade;ctx.strokeStyle=color;ctx.lineWidth=Math.max(1.2,1.65*s);ctx.shadowColor=color;ctx.shadowBlur=5*s;ctx.beginPath();ctx.ellipse(pos.x,pos.y+5*s,(isMounted?31:23)*s,(isMounted?9:7)*s,0,0,Math.PI*2);ctx.stroke();ctx.restore();
  }
  function drawUnitFlag(u,pos,targetH,dimmed,fade=1){
    const s=bgRect.scale,named=(u.originalId??999)<256,dir=u.side==='enemy'?-1:1,colors={liu:'#2f78b5',guan:'#287b4d',zhang:'#a93c31',gongsun:'#d8e3df',tao:'#456ea0',hua:'#8e2925',lvbu:'#741f2d',zhangliao:'#8d2f37',houcheng:'#8d2f37',songxian:'#8d2f37',weixu:'#8d2f37',hu:'#9b332d',zhao:'#9b332d',li:'#9b332d'},cloth=colors[u.id]||(u.side==='enemy'?'#9b332d':'#3a7e9d'),phase=performance.now()/310+u.x*.73+u.y*.41,wave=Math.sin(phase),wave2=Math.sin(phase+1.25),poleX=pos.x-dir*(named?15:11)*s,poleTop=pos.y-targetH*(named?.78:.68),poleBottom=pos.y+3*s,length=(named?31:22)*s,height=(named?28:20)*s;
    ctx.save();ctx.globalAlpha=(dimmed?.48:.9)*fade;ctx.strokeStyle='#59411f';ctx.lineWidth=Math.max(1,1.7*s);ctx.beginPath();ctx.moveTo(poleX,poleBottom);ctx.lineTo(poleX,poleTop-5*s);ctx.stroke();ctx.strokeStyle='#d0a555';ctx.lineWidth=Math.max(.7,.8*s);ctx.beginPath();ctx.moveTo(poleX+dir*s,poleBottom);ctx.lineTo(poleX+dir*s,poleTop-5*s);ctx.stroke();
    const tipX=poleX+dir*length,topY=poleTop+wave*2.2*s,bottomY=poleTop+height+wave2*2.4*s;ctx.beginPath();ctx.moveTo(poleX,poleTop);ctx.bezierCurveTo(poleX+dir*length*.34,poleTop-wave*4*s,poleX+dir*length*.67,topY+wave2*3*s,tipX,topY);ctx.lineTo(tipX-dir*2*s,bottomY);ctx.bezierCurveTo(poleX+dir*length*.66,bottomY-wave*3*s,poleX+dir*length*.32,poleTop+height+wave2*2*s,poleX,poleTop+height);ctx.closePath();ctx.fillStyle=cloth;ctx.fill();ctx.strokeStyle='#e5bf68';ctx.lineWidth=Math.max(.7,.85*s);ctx.stroke();
    ctx.globalAlpha=(dimmed?.22:.28)*fade;ctx.strokeStyle='#fff4c5';ctx.beginPath();ctx.moveTo(poleX+dir*length*.38,poleTop+3*s);ctx.quadraticCurveTo(poleX+dir*length*.55,poleTop+height*.48+wave*3*s,poleX+dir*length*.8,bottomY-3*s);ctx.stroke();ctx.globalAlpha=(dimmed?.42:.88)*fade;ctx.fillStyle=u.id==='gongsun'?'#234a67':'#f2d17d';ctx.font=`bold ${Math.max(8,(named?11:8)*s)}px serif`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(named?u.name[0]:'军',poleX+dir*length*.48,poleTop+height*.51+wave*s);ctx.restore();
  }
  function drawUnit(u){
    const walking=anim&&anim.unit===u?anim:null,base=walking?walking.pos:iso(u.x,u.y),offset=combatFx?(u===combatFx.attacker?combatFx.attackerOffset:u===combatFx.target?combatFx.targetOffset:null):null;
    const attackFx=combatFx&&u===combatFx.attacker?combatFx:null,attackDirection=attackFx?attackDirectionFor(u,attackFx.target):null,directionalSheet=attackFx&&u.troop!=='archer'&&!['martial','bandit','support'].includes(u.troop)&&(attackDirection==='north'||attackDirection==='south')?walkSpriteFor(u):null,authoredDirectionalAttack=!!(attackFx?.showAttackSprite!==false&&mediaReady(directionalSheet)),attackMotion=authoredDirectionalAttack?directionalAttackMotion(attackFx):null;
    const walkSheet=walkSpriteFor(u),authoredWalk=!!(walking&&mediaReady(walkSheet)),isMounted=isMountedUnit(u),idle=walking?walkingMotionFor(u,walking.walkPhase):idleMotionFor(u),idleSheet=!walking?walkSheet:null,authoredIdle=!!(!walking&&!attackFx&&mediaReady(idleSheet)),stepWave=walking?Math.sin(walking.walkPhase*Math.PI*2):0,banditGait=walking&&authoredWalk&&u.troop==='bandit',lift=walking?-Math.abs(stepWave)*(authoredWalk?(banditGait?2.6:0):(isMounted?4:5.5))*bgRect.scale:0,pos={x:base.x+(offset?.x||0),y:base.y+(offset?.y||0)+lift};
    const deathFx=combatFx&&u===combatFx.target&&combatFx.fatal&&combatFx.deathProgress>0?combatFx:null,deathKey=deathFx?deathKeyFor(u):null,deathSheet=deathKey?factionAssetFor(u,deathKey,deathArt,friendlyDeathArt):null,authoredDeath=mediaReady(deathSheet),hitFx=combatFx&&u===combatFx.target&&combatFx.hitReaction>0?combatFx:null,hitSheet=hitFx?hurtSpriteFor(u):null,authoredHit=mediaReady(hitSheet);
    const staticImg=spriteFor(u),attackKey=attackKeyFor(u),sheet=attackFx&&attackFx.showAttackSprite!==false&&!authoredDirectionalAttack?attackSpriteFor(u):null,img=mediaReady(sheet)?sheet:staticImg,done=u.acted&&u.side==='ally'&&!attackFx&&!deathFx,commander=(u.originalId??999)<256;
    const wounded=!walking&&!attackFx&&!deathFx&&isCriticallyWounded(u),targetH=(u.boss?108:commander?(isMounted?102:91):(isMounted?87:78))*bgRect.scale*(u.id==='guan'?588/497:1)*(['martial','bandit'].includes(u.troop)?1.16:1),displayH=wounded?targetH*.79:targetH,frameCount=sheet===img?5:1,sourceW=Math.floor((mediaWidth(img)||1)/frameCount),targetW=targetH*sourceW/(mediaHeight(img)||1),hurt=combatFx&&u===combatFx.target,targetFade=hurt?(combatFx.targetAlpha??1):1,flagFade=targetFade*(hurt&&combatFx.fatal?Math.max(0,1-(combatFx.deathProgress||0)*2.4):1);
    if(walking){ctx.save();ctx.globalAlpha=.28;ctx.fillStyle='#08141b';ctx.beginPath();ctx.ellipse(base.x,base.y+5*bgRect.scale,(isMounted?28:21)*bgRect.scale*(1-.08*Math.abs(stepWave)),(isMounted?8:6)*bgRect.scale,0,0,Math.PI*2);ctx.fill();ctx.restore()}else drawIdleGroundFx(u,base,idle,isMounted);
    drawFactionGroundMarker(u,pos,isMounted,done,flagFade);
    drawUnitFlag(u,pos,targetH,done,flagFade);
    ctx.save();ctx.globalAlpha=(done?.62:1)*targetFade;if(hurt&&combatFx.hitFlash)ctx.filter=`brightness(${1+combatFx.hitFlash*2.4}) saturate(${1-combatFx.hitFlash*.65})`;
    ctx.translate(pos.x,pos.y);if(walking&&!authoredWalk){ctx.rotate(stepWave*(isMounted?.012:.026));ctx.scale(shouldFlipForFacing(u,walking.facing)?-1:1,1-Math.abs(stepWave)*(isMounted?.018:.03))}else if(banditGait){ctx.rotate(stepWave*.012)}else if(!walking&&sheet===img){if(combatFx.target.x<u.x)ctx.scale(-1,1)}else if(!walking&&authoredIdle&&!wounded&&(idle.facing??defaultFacing(u))>0)ctx.scale(-1,1);else if(!walking&&!authoredIdle&&!authoredDirectionalAttack&&!authoredDeath&&shouldFlipForFacing(u,idle.facing??u.facing))ctx.scale(-1,1);if(hurt&&!authoredDeath){ctx.rotate(combatFx.targetRotation||0);ctx.scale(combatFx.targetScaleX||1,combatFx.targetScaleY||1)}if(wounded&&drawWoundedUnit(u,targetH,idle)){}else if(authoredWalk)drawAuthoredWalkFrame(u,walkSheet,targetH,walking);else if(authoredDirectionalAttack)drawAuthoredWalkFrame(u,directionalSheet,targetH,attackMotion);else if(authoredDeath)drawAuthoredDeathFrame(u,deathSheet,targetH,deathFx);else if(authoredHit)drawAuthoredHurtFrame(u,hitSheet,targetH,hurtFrameFor(u,hitFx));else if(authoredIdle)drawAuthoredIdleFrame(u,idleSheet,targetH,idle);else if(mediaReady(img)){if(frameCount===5){const frame=Math.max(0,Math.min(4,combatFx.attackFrame||0)),b=attackFrameBounds[attackKey]?.[frame],pixelScale=attackSheetScale(attackKey,targetH,staticImg,img);if(b){ctx.drawImage(img,frame*sourceW+b[0],b[1],b[2],b[3],(b[0]-sourceW/2)*pixelScale,10*bgRect.scale-b[3]*pixelScale,b[2]*pixelScale,b[3]*pixelScale)}else ctx.drawImage(img,frame*sourceW,0,sourceW,mediaHeight(img),-targetW/2,-targetH+10*bgRect.scale,targetW,targetH)}else drawStaticUnitImage(u,img,targetW,targetH,{active:false})}ctx.restore();
    ctx.save();ctx.globalAlpha=(done?.62:1)*targetFade;
    const bw=(isMounted?48:42)*bgRect.scale,barY=pos.y-displayH+2*bgRect.scale,morale=Math.max(0,Math.min(100,u.morale??100));ctx.fillStyle='#071a2ddd';ctx.fillRect(pos.x-bw/2,barY,bw,4*bgRect.scale);ctx.fillStyle=wounded?'#e0594d':u.side==='enemy'?'#d74a3f':u.side==='guest'?'#79d9ee':'#48c7d8';ctx.fillRect(pos.x-bw/2,barY,bw*(u.hp/u.maxHp),4*bgRect.scale);ctx.fillStyle='#071a2ddd';ctx.fillRect(pos.x-bw/2,barY+5*bgRect.scale,bw,2.5*bgRect.scale);ctx.fillStyle=morale<30?'#e45b56':'#e3b955';ctx.fillRect(pos.x-bw/2,barY+5*bgRect.scale,bw*(morale/100),2.5*bgRect.scale);
    if(u.id!=='e1'&&u.id!=='e2'&&u.id!=='e3'){ctx.font=`bold ${Math.max(9,9*bgRect.scale)}px "Microsoft YaHei"`;ctx.textAlign='center';ctx.fillStyle='#fff4ce';ctx.strokeStyle='#07182a';ctx.lineWidth=3;ctx.strokeText(u.name,pos.x,barY-4*bgRect.scale);ctx.fillText(u.name,pos.x,barY-4*bgRect.scale)}if(u.confused){const r=9*bgRect.scale,cx=pos.x+bw*.48,cy=barY-r*.25;ctx.globalAlpha=.95;ctx.fillStyle='#5b348d';ctx.strokeStyle='#e4c3ff';ctx.lineWidth=Math.max(1,1.2*bgRect.scale);ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.fillStyle='#fff4ff';ctx.font=`bold ${Math.max(8,9*bgRect.scale)}px "Microsoft YaHei"`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('乱',cx,cy+.4*bgRect.scale)}if(u.boss){ctx.strokeStyle='#e3b557';ctx.lineWidth=1.5;ctx.beginPath();ctx.ellipse(pos.x,pos.y+3*bgRect.scale,24*bgRect.scale,9*bgRect.scale,0,0,7);ctx.stroke()}ctx.restore();
  }
  function drawGuardWeapon(u,x,y,attackAngle,alpha,s){
    const weapon=u.weapon||'',pole=/矛|槊|枪|偃月/.test(weapon),bow=/弓/.test(weapon),guardAngle=attackAngle+Math.PI*.52;
    ctx.save();ctx.translate(x,y);ctx.rotate(guardAngle);ctx.globalAlpha=alpha;ctx.lineCap='round';ctx.lineJoin='round';ctx.shadowColor='#fff0a4';ctx.shadowBlur=8*s;
    if(bow){
      ctx.strokeStyle='#e1bd72';ctx.lineWidth=3.2*s;ctx.beginPath();ctx.arc(0,0,28*s,-1.1,1.1);ctx.stroke();ctx.strokeStyle='#f7eed2';ctx.lineWidth=.9*s;ctx.beginPath();ctx.moveTo(12*s,-25*s);ctx.lineTo(12*s,25*s);ctx.stroke();
    }else if(pole){
      ctx.strokeStyle='#5d351f';ctx.lineWidth=5*s;ctx.beginPath();ctx.moveTo(-39*s,0);ctx.lineTo(29*s,0);ctx.stroke();ctx.strokeStyle='#d7b35f';ctx.lineWidth=1.6*s;ctx.beginPath();ctx.moveTo(-39*s,-1*s);ctx.lineTo(29*s,-1*s);ctx.stroke();ctx.fillStyle='#f5e7c2';ctx.beginPath();ctx.moveTo(42*s,0);ctx.lineTo(27*s,-7*s);ctx.lineTo(29*s,0);ctx.lineTo(27*s,7*s);ctx.closePath();ctx.fill();
    }else{
      ctx.strokeStyle='#f3ead0';ctx.lineWidth=6*s;ctx.beginPath();ctx.moveTo(-25*s,0);ctx.lineTo(30*s,0);ctx.stroke();ctx.strokeStyle='#94a8b2';ctx.lineWidth=2*s;ctx.beginPath();ctx.moveTo(-25*s,-1*s);ctx.lineTo(30*s,-1*s);ctx.stroke();ctx.strokeStyle='#d8a84e';ctx.lineWidth=5*s;ctx.beginPath();ctx.moveTo(-27*s,-9*s);ctx.lineTo(-27*s,9*s);ctx.stroke();ctx.strokeStyle='#6d3c22';ctx.lineWidth=6*s;ctx.beginPath();ctx.moveTo(-29*s,0);ctx.lineTo(-40*s,0);ctx.stroke();
    }
    ctx.restore();
  }
  function drawCombatFx(){
    if(!combatFx)return;
    const fx=combatFx,s=bgRect.scale,from=iso(fx.attacker.x,fx.attacker.y),to=iso(fx.target.x,fx.target.y),angle=Math.atan2(to.y-from.y,to.x-from.x),now=performance.now()/1000;
    if(fx.criticalCharge>0){
      const q=fx.criticalCharge,pulse=.72+.28*Math.sin(now*18),cx=from.x+(fx.attackerOffset?.x||0),cy=from.y-35*s+(fx.attackerOffset?.y||0),radius=(25+19*q)*s;
      ctx.save();ctx.globalCompositeOperation='screen';
      const glow=ctx.createRadialGradient(cx,cy,3*s,cx,cy,radius*1.4);glow.addColorStop(0,`rgba(255,248,190,${.28*q*pulse})`);glow.addColorStop(.42,`rgba(255,190,54,${.19*q})`);glow.addColorStop(1,'rgba(255,118,10,0)');ctx.fillStyle=glow;ctx.beginPath();ctx.arc(cx,cy,radius*1.4,0,Math.PI*2);ctx.fill();
      ctx.strokeStyle='#ffe89a';ctx.lineWidth=Math.max(1,2*s);ctx.globalAlpha=.35+.5*q;for(let i=0;i<2;i++){ctx.beginPath();ctx.arc(cx,cy,(18+q*23+i*8)*s,now*(i?2.2:-2.7),now*(i?2.2:-2.7)+Math.PI*1.25);ctx.stroke()}
      ctx.fillStyle='#fff1a8';for(let i=0;i<9;i++){const a=i*2.17+now*(i%2?1.3:-1),r=(12+(i%4)*8+q*9)*s,py=cy+Math.sin(a)*r+(1-q)*18*s;ctx.globalAlpha=(.25+.55*q)*(1-(i%3)*.13);ctx.beginPath();ctx.arc(cx+Math.cos(a)*r,py,(1.2+i%2)*s,0,Math.PI*2);ctx.fill()}ctx.restore();
      ctx.save();ctx.globalAlpha=Math.max(0,Math.min(1,(q-.18)*2.8))*(.8+.2*pulse);ctx.textAlign='center';ctx.font=`bold ${Math.max(15,18*s)}px "Microsoft YaHei"`;ctx.lineWidth=5;ctx.strokeStyle='#5d1909';ctx.fillStyle='#ffe49a';ctx.strokeText('会心蓄力',cx,cy-58*s);ctx.fillText('会心蓄力',cx,cy-58*s);ctx.restore();
    }
    if(fx.projectile!==null){const p=fx.projectile,x=from.x+(to.x-from.x)*p,y=from.y-35*s+(to.y-from.y)*p;ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.strokeStyle=fx.critical?'#fff2a0':'#fff1b0';ctx.shadowColor=fx.critical?'#ff9b2f':'transparent';ctx.shadowBlur=fx.critical?13*s:0;ctx.lineWidth=(fx.critical?3.1:2.2)*s;ctx.beginPath();ctx.moveTo(-13*s,0);ctx.lineTo(10*s,0);ctx.stroke();ctx.fillStyle='#f3d277';ctx.beginPath();ctx.moveTo(13*s,0);ctx.lineTo(5*s,-4*s);ctx.lineTo(5*s,4*s);ctx.closePath();ctx.fill();ctx.restore()}
    if(fx.slashAlpha>0){ctx.save();ctx.translate(to.x,to.y-28*s);ctx.rotate(angle);ctx.globalAlpha=fx.slashAlpha;ctx.strokeStyle='#fff8cf';ctx.shadowColor=fx.critical?'#ff842f':'#ffd059';ctx.shadowBlur=(fx.critical?24:14)*s;ctx.lineCap='round';ctx.lineWidth=(fx.critical?10:7)*s;ctx.beginPath();ctx.arc(0,0,(fx.critical?41:34)*s,-2.35,.45);ctx.stroke();ctx.strokeStyle=fx.critical?'#ff7a28':'#ffbf46';ctx.lineWidth=2*s;ctx.beginPath();ctx.arc(0,0,(fx.critical?50:42)*s,-2.35,.35);ctx.stroke();ctx.restore()}
    if(fx.blockPose>0)drawGuardWeapon(fx.target,to.x,to.y-34*s,angle,fx.blockPose,s);
    if(fx.impact>0){ctx.save();ctx.translate(to.x,to.y-23*s);ctx.globalAlpha=fx.impact;ctx.strokeStyle=fx.blocked?'#fff5d1':'#fff4b0';ctx.lineWidth=3*s;const rays=fx.blocked?14:10;for(let i=0;i<rays;i++){const a=i*Math.PI*2/rays+.17,r1=9*s,r2=(fx.blocked?18:26)+(i%3)*(fx.blocked?6:9);ctx.beginPath();ctx.moveTo(Math.cos(a)*r1,Math.sin(a)*r1);ctx.lineTo(Math.cos(a)*r2*s,Math.sin(a)*r2*s);ctx.stroke()}ctx.strokeStyle=fx.blocked?'#b9d6df':'#ff8b3d';ctx.lineWidth=2*s;ctx.beginPath();ctx.arc(0,0,(35-fx.impact*18)*s,0,Math.PI*2);ctx.stroke();ctx.restore()}
    if(fx.blockImpact>0){ctx.save();ctx.translate(to.x,to.y-31*s);ctx.globalAlpha=fx.blockImpact;ctx.fillStyle='#fff4b0';for(let i=0;i<12;i++){const a=i*2.39+now*3,r=(15+(i%4)*7)*s;ctx.beginPath();ctx.arc(Math.cos(a)*r,Math.sin(a)*r,(1+i%2)*s,0,Math.PI*2);ctx.fill()}ctx.textAlign='center';ctx.font=`bold ${Math.max(17,21*s)}px "Microsoft YaHei"`;ctx.lineWidth=5;ctx.strokeStyle='#173140';ctx.fillStyle='#eefcff';ctx.strokeText('格挡！',0,-50*s);ctx.fillText('格挡！',0,-50*s);ctx.restore()}
    if(fx.damageAlpha>0){ctx.save();ctx.globalAlpha=fx.damageAlpha;ctx.textAlign='center';ctx.font=`bold ${Math.max(17,22*s)}px "Microsoft YaHei"`;ctx.lineWidth=5;ctx.strokeStyle=fx.missed?'#18334a':fx.blocked?'#15323d':'#5a160c';ctx.fillStyle=fx.missed?'#e5f5ff':fx.blocked?'#d9f6ff':fx.critical?'#fff1a0':'#ffe08a';const y=to.y-66*s-(1-fx.damageAlpha)*18*s,text=fx.missed?'闪避':`-${fx.damage}`;ctx.strokeText(text,to.x,y);ctx.fillText(text,to.x,y);if(fx.critical&&!fx.blocked&&!fx.missed){ctx.font=`bold ${Math.max(11,13*s)}px "Microsoft YaHei"`;ctx.strokeStyle='#63180a';ctx.fillStyle='#ffba47';ctx.strokeText('会心一击',to.x,y-22*s);ctx.fillText('会心一击',to.x,y-22*s)}ctx.restore()}
  }
  function drawDeathFx(){
    if(!combatFx?.fatal||combatFx.deathProgress<=.05)return;
    const d=combatFx.deathProgress,s=bgRect.scale,to=iso(combatFx.target.x,combatFx.target.y),q=Math.max(0,Math.min(1,(d-.05)/.82)),alpha=Math.sin(Math.PI*q)*.34;
    ctx.save();ctx.globalAlpha=alpha;ctx.fillStyle='#d8c18a';
    for(let i=0;i<6;i++){const a=i*1.83+.4,x=to.x+Math.cos(a)*(8+q*24)*s,y=to.y+4*s+Math.sin(a)*(2+q*7)*s,r=(3+i%3+q*4)*s;ctx.beginPath();ctx.ellipse(x,y,r,r*.52,a*.18,0,Math.PI*2);ctx.fill()}
    ctx.globalAlpha=alpha*.55;ctx.strokeStyle='#f0d9a2';ctx.lineWidth=Math.max(1,1.2*s);ctx.beginPath();ctx.ellipse(to.x,to.y+5*s,(16+q*34)*s,(4+q*8)*s,0,0,Math.PI*2);ctx.stroke();ctx.restore();
  }
  function drawXuandeAura(){
    const liu=units.find(u=>u.id==='liu'&&u.hp>0);if(!liu)return;
    const p=iso(liu.x,liu.y),s=bgRect.scale,stepX=bgRect.w*.94/(COLS-1),stepY=bgRect.h*.86/(ROWS-1),t=performance.now()/1000,pulse=(Math.sin(t*2.7)+1)/2,rx=stepX*.7,ry=stepY*.48;
    ctx.save();ctx.globalCompositeOperation='screen';
    const glow=ctx.createRadialGradient(p.x,p.y,2*s,p.x,p.y,rx*1.7);glow.addColorStop(0,`rgba(255,223,112,${.08+.04*pulse})`);glow.addColorStop(.58,`rgba(67,174,219,${.07+.03*pulse})`);glow.addColorStop(1,'rgba(21,105,159,0)');ctx.fillStyle=glow;ctx.beginPath();ctx.ellipse(p.x,p.y,rx*1.7,ry*2.2,0,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle='#f4d879';ctx.lineWidth=Math.max(1,1.7*s);ctx.globalAlpha=.5+.28*pulse;ctx.beginPath();ctx.ellipse(p.x,p.y+3*s,rx*(1+.05*pulse),ry*(1+.05*pulse),0,0,Math.PI*2);ctx.stroke();
    ctx.strokeStyle='#68c6df';ctx.lineWidth=Math.max(1,.9*s);ctx.globalAlpha=.34+.18*(1-pulse);ctx.beginPath();ctx.ellipse(p.x,p.y+3*s,rx*1.28,ry*1.35,0,0,Math.PI*2);ctx.stroke();
    ctx.fillStyle='#ffe99b';for(let i=0;i<6;i++){const a=t*(i%2?-.55:.48)+i*Math.PI/3,r=rx*(.78+(i%2)*.27),x=p.x+Math.cos(a)*r,y=p.y+Math.sin(a)*ry*.85-6*s-(i%3)*4*s;ctx.globalAlpha=.35+.25*Math.sin(t*2+i);ctx.beginPath();ctx.arc(x,y,(1.1+i%2*.7)*s,0,Math.PI*2);ctx.fill()}ctx.restore();
    for(const u of units.filter(hasXuandeAura)){const q=iso(u.x,u.y);ctx.save();ctx.globalAlpha=.52+.22*pulse;ctx.strokeStyle='#ffe18a';ctx.lineWidth=Math.max(1,1.5*s);ctx.beginPath();ctx.ellipse(q.x,q.y+4*s,23*s,7*s,0,0,Math.PI*2);ctx.stroke();ctx.fillStyle='#f5d36c';ctx.font=`bold ${Math.max(8,9*s)}px "Microsoft YaHei"`;ctx.textAlign='center';ctx.fillText('仁德 +10%',q.x,q.y-52*s);ctx.restore()}
  }
  function drawEnvironmentFx(t){
    if(!art.battlefield.complete||!art.battlefield.naturalWidth)return;
    const environmentFx=level.environmentFx||{},s=bgRect.scale,forestZones=environmentFx.forestZones||[
      [.18,.14,.20,.12,0],[.43,.10,.13,.09,1.7],[.86,.12,.14,.11,3.1],[.82,.40,.10,.12,4.4],[.74,.86,.19,.12,5.6]
    ];
    ctx.save();
    for(const [nx,ny,nrx,nry,phase] of forestZones){
      const swayX=Math.sin(t*.85+phase)*1.8*s,swayY=Math.cos(t*.62+phase)*.7*s,cx=bgRect.x+nx*bgRect.w,cy=bgRect.y+ny*bgRect.h,rx=nrx*bgRect.w,ry=nry*bgRect.h;
      ctx.save();ctx.beginPath();ctx.ellipse(cx,cy,rx,ry,0,0,Math.PI*2);ctx.clip();ctx.globalAlpha=.11;ctx.globalCompositeOperation='soft-light';ctx.drawImage(art.battlefield,bgRect.x+swayX,bgRect.y+swayY,bgRect.w,bgRect.h);ctx.restore();
      ctx.save();ctx.globalAlpha=.22;ctx.fillStyle='#b6c76d';for(let i=0;i<5;i++){const a=phase+i*1.91,x=cx+Math.sin(a*2.3)*rx*.72+Math.sin(t*.9+a)*3*s,y=cy+Math.cos(a*1.7)*ry*.55+((t*7+i*11)%18)*s*.12;ctx.beginPath();ctx.ellipse(x,y,1.4*s,3*s,Math.sin(t+a)*.55,0,Math.PI*2);ctx.fill()}ctx.restore();
    }
    ctx.globalCompositeOperation='screen';ctx.lineCap='round';
    if(environmentFx.waterBands?.length){
      for(const [bandIndex,band] of environmentFx.waterBands.entries())for(let i=0;i<18;i++){
        const v=(i/18+t*(band.speed||.04)+bandIndex*.21)%1;if((band.gaps||[]).some(([a,b])=>v>=a&&v<=b))continue;
        const [x1,y1]=band.from,[x2,y2]=band.to,dx=x2-x1,dy=y2-y1,len=Math.hypot(dx,dy)||1,nx=-dy/len,ny=dx/len,bend=Math.sin(Math.PI*v)*(band.bend||0),ripple=Math.sin(t*1.8+i*1.47+bandIndex)*.006;
        const x=bgRect.x+(x1+dx*v+nx*(bend+ripple))*bgRect.w,y=bgRect.y+(y1+dy*v+ny*(bend+ripple))*bgRect.h,w=(12+(i%5)*4)*s,tx=dx/len,ty=dy/len,px=-ty,py=tx;
        ctx.globalAlpha=.13+(i%3)*.035;ctx.strokeStyle='#c4f2f4';ctx.lineWidth=(.7+(i%2)*.38)*s;ctx.beginPath();ctx.moveTo(x-tx*w,y-ty*w);ctx.quadraticCurveTo(x+px*3*s,y+py*3*s,x+tx*w,y+ty*w);ctx.stroke();
        if(i%5===0){ctx.globalAlpha=.10;ctx.beginPath();ctx.arc(x+tx*w*.45,y+ty*w*.45,(2.5+i%3)*s,0,Math.PI*2);ctx.stroke()}
      }
    }else for(let i=0;i<15;i++){
      const v=(i/15+t*.032)%1;if(v>.43&&v<.57)continue;
      const center=.66-.31*v+.016*Math.sin(v*10),x=bgRect.x+center*bgRect.w,y=bgRect.y+v*bgRect.h,w=(14+(i%5)*5)*s,drift=Math.sin(t*1.5+i)*5*s;
      ctx.globalAlpha=.14+(i%3)*.035;ctx.strokeStyle='#b5edf2';ctx.lineWidth=(.75+(i%2)*.45)*s;ctx.beginPath();ctx.moveTo(x-w+drift,y);ctx.quadraticCurveTo(x+drift,y-3*s,x+w+drift,y);ctx.stroke();
      if(i%4===0){ctx.globalAlpha=.12;ctx.beginPath();ctx.arc(x+w*.45,y+4*s,(3+i%3)*s,0,Math.PI*2);ctx.stroke()}
    }
    ctx.restore();
  }
  function drawStrategyFx(){
    if(!strategyFx)return;const fx=strategyFx,p=iso(fx.target.x,fx.target.y),s=bgRect.scale,q=fx.progress,t=performance.now()/1000;ctx.save();ctx.globalCompositeOperation='screen';
    if(fx.type==='fire'){
      ctx.globalAlpha=fx.success?Math.sin(Math.PI*q):.32*(1-q);for(let i=0;i<9;i++){const a=i*.74+t*1.4,r=(9+(i%3)*8)*s*(.4+q),x=p.x+Math.cos(a)*r*.65,y=p.y-8*s-Math.abs(Math.sin(a))*34*s*q;ctx.fillStyle=i%2?'#ffb33f':'#ff592b';ctx.beginPath();ctx.moveTo(x-5*s,y+12*s);ctx.quadraticCurveTo(x-11*s,y,x,y-16*s*(.5+q));ctx.quadraticCurveTo(x+11*s,y,x+5*s,y+12*s);ctx.fill()}
    }else if(fx.type==='recover'){
      ctx.globalAlpha=Math.sin(Math.PI*q);ctx.strokeStyle='#9bffe0';ctx.lineWidth=2*s;for(let i=0;i<3;i++){ctx.beginPath();ctx.ellipse(p.x,p.y-18*s,(18+i*12+q*18)*s,(6+i*4+q*5)*s,0,0,Math.PI*2);ctx.stroke()}ctx.fillStyle='#fff1a5';ctx.font=`bold ${Math.max(18,24*s)}px serif`;ctx.textAlign='center';ctx.fillText('＋',p.x,p.y-(35+q*30)*s);
    }else{
      ctx.globalAlpha=(fx.success?1:.38)*Math.sin(Math.PI*q);ctx.strokeStyle='#c4a3ff';ctx.lineWidth=2.5*s;for(let i=0;i<4;i++){const a=i*Math.PI/2+t;ctx.beginPath();ctx.arc(p.x+Math.cos(a)*18*s,p.y-18*s+Math.sin(a)*8*s,(8+q*12)*s,0,Math.PI*1.35);ctx.stroke()}
    }
    if(!fx.success&&q>.42){ctx.globalAlpha=Math.max(0,1-q);ctx.font=`bold ${Math.max(13,17*s)}px "Microsoft YaHei"`;ctx.textAlign='center';ctx.fillStyle='#e6edf0';ctx.fillText('失败',p.x,p.y-58*s)}ctx.restore();
  }
  function rebuildDangerTiles(){const keys=new Set();for(const e of units.filter(u=>u.side==='enemy'&&u.hp>0&&!u.confused)){const mobile=e.aiType===1||e.aiType===3||e.aiType===4,cells=mobile?calcReach(e):new Map([[keyOf(e.x,e.y),0]]);for(const k of cells.keys()){const [x,y]=k.split(',').map(Number),range=e.troop==='archer'?2:1;for(let yy=0;yy<ROWS;yy++)for(let xx=0;xx<COLS;xx++)if(Math.abs(xx-x)+Math.abs(yy-y)===range)keys.add(keyOf(xx,yy))}if((knowsStrategy(e,'fire')||knowsStrategy(e,'contain'))&&(e.strategy||0)>=4){for(let yy=Math.max(0,e.y-3);yy<=Math.min(ROWS-1,e.y+3);yy++)for(let xx=Math.max(0,e.x-3);xx<=Math.min(COLS-1,e.x+3);xx++){const d=Math.abs(xx-e.x)+Math.abs(yy-e.y);if(d>0&&d<=3)keys.add(keyOf(xx,yy))}}}dangerTiles=[...keys].map(k=>{const[x,y]=k.split(',').map(Number);return{x,y}})}
  function drawMovementPath(){if(hoverPath.length<2)return;const s=bgRect.scale;ctx.save();ctx.strokeStyle='#ffe38a';ctx.lineWidth=Math.max(2,3*s);ctx.setLineDash([8*s,6*s]);ctx.beginPath();hoverPath.forEach((q,i)=>{const p=iso(q.x,q.y);if(i)ctx.lineTo(p.x,p.y);else ctx.moveTo(p.x,p.y)});ctx.stroke();ctx.setLineDash([]);let spent=0;hoverPath.forEach((q,i)=>{if(i===0)return;spent+=tileCost(selected,q.x,q.y);const p=iso(q.x,q.y);ctx.fillStyle='#0a2338dd';ctx.strokeStyle='#ffe38a';ctx.lineWidth=1;ctx.beginPath();ctx.arc(p.x,p.y,8*s,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.fillStyle='#fff0ad';ctx.font=`bold ${Math.max(8,9*s)}px sans-serif`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(spent,p.x,p.y+.5*s)});ctx.restore()}
  function draw(redrawMini=true){const W=wrap.clientWidth,H=wrap.clientHeight;ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,canvas.width,canvas.height);ctx.restore();const g=ctx.createLinearGradient(0,0,0,H);g.addColorStop(0,'#102a2e');g.addColorStop(1,'#061519');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);ctx.save();if(combatFx){ctx.translate(combatFx.shakeX||0,combatFx.shakeY||0)}updateBgRect();if(art.battlefield.complete&&art.battlefield.naturalWidth)ctx.drawImage(art.battlefield,bgRect.x,bgRect.y,bgRect.w,bgRect.h);drawEnvironmentFx(performance.now()/1000);drawMapStructures();if(dangerVisible)for(const q of dangerTiles)gridCell(q.x,q.y,'rgba(165,28,35,.13)','rgba(226,72,67,.34)');if(reachable.size)for(const key of reachable.keys()){const [x,y]=key.split(',').map(Number);gridCell(x,y,'rgba(25,190,207,.27)','rgba(112,242,236,.9)')}drawMovementPath();for(const q of attackable){const friendly=(phase==='strategy'&&activeStrategy==='recover')||(phase==='item'&&activeItem!=='fireScroll');gridCell(q.x,q.y,friendly?'rgba(56,190,130,.3)':'rgba(210,49,37,.3)',friendly?'rgba(139,255,208,.94)':'rgba(255,120,89,.92)')}if(hover)gridCell(hover.x,hover.y,'rgba(255,255,255,.09)','rgba(255,229,162,.85)');if(keyboardCursor)gridCell(keyboardCursor.x,keyboardCursor.y,'rgba(255,232,134,.08)','#ffe58d');if(selected&&selected.hp>0){gridCell(selected.x,selected.y,'rgba(241,200,92,.12)','#f3cc6b')}drawXuandeAura();[...units].filter(u=>u.side!=='reserve'&&(u.hp>0||(combatFx&&u===combatFx.target))).sort((a,b)=>iso(a.x,a.y).y-iso(b.x,b.y).y).forEach(drawUnit);drawCombatFx();drawDeathFx();drawStrategyFx();ctx.restore();if(redrawMini)drawMini()}
  const keyOf=(x,y)=>`${x},${y}`;
  function neighbors(x,y){return [[x+1,y],[x-1,y],[x,y+1],[x,y-1]].filter(([a,b])=>a>=0&&b>=0&&a<COLS&&b<ROWS)}
  function movementClass(u){if(u.troop==='cavalry')return 1;if(u.troop==='bandit'||u.troop==='martial')return 3;if(u.troop==='support')return 2;return 0}
  function isSpecialPassable(u,x,y){return!!level.specialPassable?.some(cell=>cell.unitId===u.id&&cell.x===x&&cell.y===y)}
  function tileCost(u,x,y){if(isSpecialPassable(u,x,y))return 1;const rule=terrain[map[y][x]],cost=rule.move?.[movementClass(u)]??rule.cost;return Number.isFinite(cost)?cost:Infinity}
  function movementCostLabel(cost){return Number.isFinite(cost)?String(cost):'不可进入'}
  function terrainEventEffect(type){
    const event=type==='treasure'?level.events?.treasure:type==='supply'?level.events?.supply:null;if(!event)return terrain[type]?.effect||'';
    if(event.gold)return`首次进入获得金${event.gold}`;
    if(event.item){const name=shopItems[event.item]?.name||event.item;return`首次进入获得${name}×${event.amount||1}`}
    return terrain[type]?.effect||''
  }
  function updateTerrainInfo(q){
    if(!q)return;const type=map[q.y][q.x],t=terrain[type],actor=selected||inspected,eventEffect=terrainEventEffect(type),effect=eventEffect?` · ${eventEffect}`:'',routeCost=selected&&phase==='move'?reachable.get(keyOf(q.x,q.y)):null;
    const moveText=actor?`${actor.name} ${movementCostLabel(tileCost(actor,q.x,q.y))}`:`步兵 ${movementCostLabel(t.move?.[0]??t.cost)} · 骑兵 ${movementCostLabel(t.move?.[1]??t.cost)}`;
    document.getElementById('terrainInfo').textContent=`${t.name} · 移动 ${moveText} · 防御 +${t.def}%${routeCost!==undefined&&routeCost!==null?` · 路径消耗 ${routeCost}`:''}${effect}`;
    if(routeCost!==undefined&&routeCost!==null)hoverPath=findPath(selected,q.x,q.y)
  }
  function passable(u,x,y){return Number.isFinite(tileCost(u,x,y))&&(!unitAt(x,y)||unitAt(x,y)===u)}
  function calcReach(u){const move=effectiveStat(u,'move'),dist=new Map([[keyOf(u.x,u.y),0]]),q=[[u.x,u.y]];while(q.length){const [x,y]=q.shift(),d=dist.get(keyOf(x,y));for(const [nx,ny] of neighbors(x,y)){const nd=d+tileCost(u,nx,ny),k=keyOf(nx,ny);if(nd<=move&&passable(u,nx,ny)&&(!dist.has(k)||nd<dist.get(k))){dist.set(k,nd);q.push([nx,ny])}}}return dist}
  function findPath(u,tx,ty){const start=keyOf(u.x,u.y),goal=keyOf(tx,ty),dist=new Map([[start,0]]),prev=new Map(),open=[[u.x,u.y]];while(open.length){open.sort((a,b)=>dist.get(keyOf(a[0],a[1]))-dist.get(keyOf(b[0],b[1])));const [x,y]=open.shift(),k=keyOf(x,y);if(k===goal)break;for(const [nx,ny] of neighbors(x,y)){if(!passable(u,nx,ny)&&keyOf(nx,ny)!==goal)continue;const nk=keyOf(nx,ny),nd=dist.get(k)+tileCost(u,nx,ny);if(nd<(dist.get(nk)??Infinity)){dist.set(nk,nd);prev.set(nk,k);open.push([nx,ny])}}}if(!dist.has(goal))return [{x:u.x,y:u.y}];const path=[];let k=goal;while(k){const [x,y]=k.split(',').map(Number);path.push({x,y});if(k===start)break;k=prev.get(k)}return path.reverse()}
  function animateUnitMove(u,tx,ty){ensureBattleCamera(u);const path=findPath(u,tx,ty);if(path.length<2)return Promise.resolve();return new Promise(resolve=>{let segment=0,segmentStart=performance.now(),lastStep=-1;function frame(now){const fromTile=path[segment],toTile=path[segment+1],from=iso(fromTile.x,fromTile.y),to=iso(toTile.x,toTile.y),terrainType=map[toTile.y][toTile.x],terrainFactor=['forest','hill','rough'].includes(terrainType)?1.22:1,mounted=isMountedUnit(u),duration=(mounted?250:285)*terrainFactor/animationSpeed,p=Math.min(1,(now-segmentStart)/duration),ease=p<.5?2*p*p:1-Math.pow(-2*p+2,2)/2,travel=u.troop==='bandit'?p:ease,dx=to.x-from.x,tileDx=toTile.x-fromTile.x,tileDy=toTile.y-fromTile.y,direction=tileDx>0?'east':tileDx<0?'west':tileDy>0?'south':'north',facing=Math.abs(dx)>.2?(dx>0?1:-1):(u.facing??defaultFacing(u)),step=Math.floor((segment+p)*2);if(step!==lastStep){lastStep=step;battleSfx('movementStep',u,{mounted,alternate:step%2===1,terrain:terrainType})}anim={unit:u,pos:{x:from.x+dx*travel,y:from.y+(to.y-from.y)*travel},walkPhase:segment+p,facing,direction};draw();if(p<1){requestAnimationFrame(frame);return}u.x=toTile.x;u.y=toTile.y;u.facing=facing;segment++;if(segment<path.length-1){segmentStart=now;requestAnimationFrame(frame)}else{anim=null;draw();resolve()}}requestAnimationFrame(frame)})}
  function attackTiles(u){const out=[];for(let y=0;y<ROWS;y++)for(let x=0;x<COLS;x++){const d=Math.abs(x-u.x)+Math.abs(y-u.y);if(u.troop==='archer'?(d===2):(d===1))out.push({x,y})}return out}
  function inAttackRange(a,t){return attackTiles(a).some(q=>q.x===t.x&&q.y===t.y)}
  function selectUnit(u){if(dialogue||!playerTurn)return;ensureBattleCamera(u);if(u.side!=='ally'){if(phase!=='select'||selected)return;inspected=u;reachable.clear();attackable=[];moveOrigin=null;keyboardCursor={x:u.x,y:u.y};syncUI();status(`${u.name} · ${u.role} · ${u.className}${u.confused?' · 混乱中':''}`);draw();return}if(u.confused){flash(`${u.name}混乱中，无法行动`);status(`${u.name}本回合因混乱而无法行动`);return}if(u.acted)return;inspected=null;selected=u;phase='move';reachable=calcReach(u);attackable=[];hoverPath=[];moveOrigin={x:u.x,y:u.y};keyboardCursor={x:u.x,y:u.y};syncUI();status(`${u.name}：请选择移动位置`);draw()}
  function beginAttack(){if(!selected||selected.acted||!playerTurn)return;phase='attack';reachable.clear();attackable=attackTiles(selected);syncUI();status(`${selected.name}：请选择红色范围内的敌军，或点击待机`);draw()}
  function isOpponent(a,b){return(a.side==='enemy')!==(b.side==='enemy')}
  function strategyTiles(u,type){const rule=strategies[type],out=[];for(let y=0;y<ROWS;y++)for(let x=0;x<COLS;x++){const d=Math.abs(x-u.x)+Math.abs(y-u.y);if(d>rule.range||(type!=='recover'&&d===0))continue;const target=unitAt(x,y);if(!target)continue;const valid=rule.target==='enemy'?isOpponent(u,target):!isOpponent(u,target)&&target.hp<target.maxHp;if(valid)out.push({x,y})}return out}
  function toggleStrategyMenu(){if(!selected||selected.acted||!playerTurn)return;if(!learnedStrategyIds(selected).length){flash(`${selected.name}当前尚未习得策略`);return}document.getElementById('itemMenu').classList.add('hidden');document.getElementById('strategyMenu').classList.toggle('hidden')}
  function beginStrategy(type){if(!selected||selected.acted||!playerTurn||!knowsStrategy(selected,type))return;const rule=strategies[type];if((selected.strategy||0)<rule.cost){flash('策略值不足');return}activeStrategy=type;phase='strategy';reachable.clear();attackable=strategyTiles(selected,type);document.getElementById('strategyMenu').classList.add('hidden');syncUI();status(`${selected.name}：请选择${rule.name}目标（射程${rule.range}）`);if(!attackable.length)flash('范围内没有可用目标');draw()}
  function playStrategyAnimation(type,target,success){return new Promise(resolve=>{const start=performance.now(),duration=900/animationSpeed;function frame(now){strategyFx={type,target,success,progress:Math.min(1,(now-start)/duration)};draw();if(strategyFx.progress<1)requestAnimationFrame(frame);else{strategyFx=null;draw();resolve()}}requestAnimationFrame(frame)})}
  function gainStrategyExp(u,amount){u.exp+=amount;addLog(`${u.name}施展策略，获得 ${amount} 经验`,true);while(u.exp>=100){u.exp-=100;levelUp(u)}}
  async function useStrategy(target){
    if(!selected||!activeStrategy||phase!=='strategy')return;const caster=selected,type=activeStrategy,rule=strategies[type];if(!attackable.some(q=>q.x===target.x&&q.y===target.y))return;
    caster.strategy=Math.max(0,(caster.strategy||0)-rule.cost);caster.acted=true;phase='animating';attackable=[];activeStrategy=null;hideForecast();syncUI();const success=Math.random()<rule.hit;status(`${caster.name}施展${rule.name}`);await playStrategyAnimation(type,target,success);
    if(success&&type==='fire'){const damage=Math.min(target.hp,Math.max(35,Math.round(effectiveStat(caster,'atk')*.22+caster.level*10)));target.hp=Math.max(0,target.hp-damage);flash(`火攻 -${damage}`);addLog(`${caster.name}火攻命中${target.name}，造成${damage}兵力伤害`,true)}
    else if(success&&type==='recover'){const amount=Math.min(150,target.maxHp-target.hp);target.hp+=amount;flash(`兵力 +${amount}`);addLog(`${caster.name}为${target.name}恢复${amount}兵力`,true)}
    else if(success){target.containedUntil=turn+1;applyMoraleLoss(target,Math.max(1,20+Math.floor(caster.level/10)-Math.floor(target.level/10)));flash('牵制成功');addLog(`${target.name}受到牵制：攻击与移动下降20%`,true)}
    else{flash(`${rule.name}失败`);addLog(`${caster.name}对${target.name}施展${rule.name}失败`)}
    gainStrategyExp(caster,success?8:4);phase='select';selected=null;syncUI();draw();scheduleAutoSave();
    if(target.hp<=0){addLog(`${target.name}撤退`,true);await playDefeatQuote(target);if(target.id===objectiveUnitId){victory();return}}
    if(playerTurn&&units.filter(u=>u.side==='ally'&&u.hp>0).every(u=>u.acted))queueEndPlayerTurn(360)
  }
  function chooseAiStrategy(caster,physicalPlan=null){
    const learned=new Set(learnedStrategyIds(caster));if(!learned.size)return null;
    const friendly=units.filter(u=>u.hp>0&&!isOpponent(caster,u)&&Math.abs(caster.x-u.x)+Math.abs(caster.y-u.y)<=strategies.recover.range&&u.hp<u.maxHp*.35);
    const decision=BattleRules.aiStrategyDecision({turn,lastStrategyTurn:caster.lastStrategyTurn,cooldown:level.ai?.strategyCooldown??3,hasPhysicalAttack:!!physicalPlan?.target,emergencyHeal:learned.has('recover')&&(caster.strategy||0)>=strategies.recover.cost&&friendly.length>0,role:caster.role,zhili:caster.zhili||0});
    if(decision==='recover'){friendly.sort((a,b)=>(a.hp/a.maxHp)-(b.hp/b.maxHp)||a.spawnOrder-b.spawnOrder);return{type:'recover',target:friendly[0]}}
    if(decision!=='offensive'||(caster.strategy||0)<4)return null;
    const targets=units.filter(u=>u.hp>0&&isOpponent(caster,u)&&Math.abs(caster.x-u.x)+Math.abs(caster.y-u.y)<=3&&!inAttackRange(caster,u)).sort((a,b)=>{const score=t=>(t.hp/t.maxHp)*40-effectiveStat(t,'atk')/30+(map[t.y][t.x]==='forest'?-12:0);return score(a)-score(b)});
    if(!targets.length)return null;const target=targets[0],preferFire=(caster.zhili||0)>=55||map[target.y][target.x]==='forest';
    if(learned.has('fire')&&preferFire)return{type:'fire',target};if(learned.has('contain')&&(target.containedUntil||0)<turn)return{type:'contain',target};return null
  }
  async function useStrategyNpc(caster,type,target){
    if(!knowsStrategy(caster,type))return false;
    const rule=strategies[type],previousPhase=phase,bossProtected=caster.side==='guest'&&target.id===objectiveUnitId;caster.strategy=Math.max(0,(caster.strategy||0)-rule.cost);caster.lastStrategyTurn=turn;phase='animating';status(`${caster.name}施展${rule.name}`);syncUI();const success=Math.random()<rule.hit;await playStrategyAnimation(type,target,success);
    if(success&&type==='fire'){let damage=Math.min(target.hp,Math.max(35,Math.round(effectiveStat(caster,'atk')*.22+caster.level*10)));if(bossProtected)damage=Math.min(damage,Math.max(0,target.hp-1));target.hp=Math.max(bossProtected?1:0,target.hp-damage);flash(`火攻 -${damage}`);addLog(`${caster.name}火攻命中${target.name}，造成${damage}兵力伤害`,true)}
    else if(success&&type==='recover'){const amount=Math.min(150,target.maxHp-target.hp);target.hp+=amount;flash(`兵力 +${amount}`);addLog(`${caster.name}为${target.name}恢复${amount}兵力`,true)}
    else if(success){target.containedUntil=turn+1;applyMoraleLoss(target,Math.max(1,20+Math.floor(caster.level/10)-Math.floor(target.level/10)),{preventRout:bossProtected});flash('牵制成功');addLog(`${target.name}受到牵制：攻击与移动下降20%`,true)}
    else{flash(`${rule.name}失败`);addLog(`${caster.name}对${target.name}施展${rule.name}失败`)}
    if(caster.side==='guest')gainStrategyExp(caster,success?8:4);draw();syncUI();
    if(target.hp<=0){phase=previousPhase;addLog(`${target.name}撤退`,true);await playDefeatQuote(target);if(target.id===objectiveUnitId)victory();else if(target.id==='liu')defeat('刘备撤退');return true}
    phase=previousPhase;syncUI();draw();return false
  }
  function checkAlternateVictory(u){const rule=level.alternateVictory;if(!rule||u.id!==rule.unitId||u.x!==rule.x||u.y!==rule.y)return false;const amount=Math.max(0,Number(rule.exp)||0);for(const ally of units.filter(q=>q.side==='ally'&&q.hp>0)){ally.exp=(ally.exp||0)+amount;while(ally.exp>=100){ally.exp-=100;levelUp(ally)}}addLog(rule.log||`${u.name}抵达目标，全体存活我军获得经验${amount}`,true);victory(false,'alternate');return true}
  async function triggerAreaEvents(u){for(const event of level.areaEvents||[]){if(event.unitId&&event.unitId!==u.id)continue;const r=event.rect;if(!r||u.x<r.x1||u.x>r.x2||u.y<r.y1||u.y>r.y2||timedEventsFired.has(event.id))continue;timedEventsFired.add(event.id);for(const update of event.aiUpdates||[]){const target=units.find(x=>x.id===update.unitId);if(!target)continue;if(Number.isInteger(update.aiType)){target.aiType=update.aiType;target.stationary=update.aiType===2}if(Number.isInteger(update.aiTarget))target.aiTarget=update.aiTarget}if(event.dialogue?.length)await new Promise(resolve=>runDialogue(event.dialogue,resolve));addLog('刘备进入巨鹿中部，张郃军开始追击',true);if(dangerVisible)rebuildDangerTiles();draw()}}
  async function moveSelected(x,y){const k=keyOf(x,y);if(!reachable.has(k)||unitAt(x,y))return;const u=selected;reachable.clear();hoverPath=[];phase='animating';syncUI();status(`${u.name} 行进中`);await animateUnitMove(u,x,y);keyboardCursor={x,y};collectTile(u);if(checkAlternateVictory(u))return;await triggerAreaEvents(u);await playBrotherMergeDialogue(u);if(tryDuel())return;phase='attack';attackable=attackTiles(u);syncUI();status(`${u.name}：选择敌军攻击，或点击待机`);draw()}
  function collectTile(u){const t=map[u.y][u.x],loot=level.events?.loot?.[`${u.x},${u.y}`],treasure=loot||level.events?.treasure||{gold:100},supplyItem=loot?.item??level.events?.supply?.item??'bean';if(t==='treasure'){if(treasure.item){if(carriedCount(u)>=8){flash(`${u.name}的道具栏已满`);return}for(let i=0;i<(treasure.amount||1);i++)u.inventory.push(treasure.item);flash(`获得${shopItems[treasure.item].name} × ${treasure.amount||1}`);addLog(`${u.name}打开宝物库，获得${shopItems[treasure.item].name}`,true)}else{const amount=treasure.gold??100;gold+=amount;flash(`获得金 ${amount}`);addLog(`${u.name}打开宝物库，获得金${amount}`,true)}map[u.y][u.x]='treasureEmpty';syncItems()}if(t==='supply'){if(carriedCount(u)<8){u.inventory.push(supplyItem);flash(`获得${shopItems[supplyItem].name} × 1`);addLog(`${u.name}在兵粮库获得${shopItems[supplyItem].name}`,true);map[u.y][u.x]='supplyEmpty';syncItems()}else{flash(`${u.name}的道具栏已满`);addLog(`兵粮库中有${shopItems[supplyItem].name}，但${u.name}无法携带`,true)}}}
  function recoverFromTerrain(side){for(const u of units.filter(x=>x.side===side&&x.hp>0)){const t=terrain[map[u.y][u.x]];if(!t.recoverHp&&!t.recoverMorale)continue;const result=BattleRules.terrainRecovery({hp:u.hp,maxHp:u.maxHp,morale:u.morale??100,tongyu:u.tongyu||0,recoverHp:!!t.recoverHp,recoverMorale:!!t.recoverMorale,hpRoll:Math.floor(Math.random()*11),moraleRoll:Math.floor(Math.random()*5)});u.hp=result.hp;u.morale=result.morale;if(result.hpGain<=0&&result.moraleGain<=0)continue;addLog(`${u.name}在${t.name}休整，恢复${result.hpGain}兵力${result.moraleGain?`、${result.moraleGain}士气`:''}`,true);if(side==='ally')flash(`${u.name} ${t.name}休整 +${result.hpGain}`)}}
  function physicalMoraleDamage(target,damage){return BattleRules.physicalMoraleDamage(damage,target.level,target.morale??100)}
  function applyMoraleLoss(target,amount,{preventRout=false}={}){if(target.hp<=0||amount<=0)return{loss:0,routed:false,confused:false};const result=BattleRules.applyMoraleLoss(target.morale??100,amount,preventRout);target.morale=result.morale;if(result.loss>0)addLog(`${target.name}士气下降${result.loss}`,false);if(result.routed){target.hp=0;target.confused=false;addLog(`${target.name}士气崩溃，被迫撤退`,true);return{loss:result.loss,routed:true,confused:false}}if(target.morale<30&&!target.confused&&Math.random()<.60){target.confused=true;addLog(`${target.name}因士气低落陷入混乱`,true);flash(`${target.name}混乱！`);return{loss:result.loss,routed:false,confused:true}}return{loss:result.loss,routed:false,confused:false}}
  function recoverConfusion(side){for(const u of units.filter(x=>x.side===side&&x.hp>0&&x.confused)){const chance=BattleRules.confusionRecoveryChance(u.tongyu||0,u.morale??0);if(Math.random()<chance){u.confused=false;addLog(`${u.name}恢复镇定，解除混乱`,true);if(side==='ally')flash(`${u.name}恢复镇定`)}else{u.acted=true;addLog(`${u.name}仍处于混乱，本阶段无法行动`,false)}}}
  function recoverFromMilitaryBands(side){
    for(const u of units.filter(x=>x.side===side&&x.hp>0&&x.maxStrategy>0)){
      const available=Math.max(0,u.maxStrategy-(u.strategy||0));if(!available)continue;
      const recovery=BattleRules.adjacentMilitaryBandRecovery({x:u.x,y:u.y,id:u.id,units}),gain=Math.min(available,recovery);if(!gain)continue;
      u.strategy=(u.strategy||0)+gain;addLog(`${u.name}受到邻近军乐鼓舞，策略值恢复${gain}`,true);if(side==='ally')flash(`${u.name} 策略值 +${gain}`)
    }
  }
  function beginSidePhase(side){recoverFromTerrain(side);recoverFromMilitaryBands(side);recoverConfusion(side)}
  function isWeakened(u){return u.hp<u.maxHp*.4||(u.morale??100)<40}
  function aiTurnOrder(side){return units.filter(u=>u.side===side&&u.hp>0&&!u.confused).sort((a,b)=>{const priority=u=>terrain[map[u.y][u.x]].recoverHp?0:isWeakened(u)?1:2;return priority(a)-priority(b)||a.spawnOrder-b.spawnOrder})}
  function affinity(a,b){const percent=BattleRules.affinityPercent(a,b);return percent<100?1.25:percent>100?.75:1}
  function damageOf(a,t,{counter=false}={}){return BattleRules.physicalDamage({attack:effectiveStat(a,'atk'),defense:effectiveStat(t,'def'),attackerTroop:a.troop,targetTroop:t.troop,terrainDefense:terrain[map[t.y][t.x]].def,targetHp:t.hp,counter})}
  function hitRate(attacker,target){return BattleRules.hitRate(attacker.morale??100,target.morale??100,terrain[map[target.y][target.x]].def,{archer:attacker.troop==='archer',targetInForest:map[target.y][target.x]==='forest'})}
  function canCounterUnit(defender,attacker){return['bandit','martial'].includes(defender.troop)&&['cavalry','bandit','beast','martial','tribal'].includes(attacker.troop)}
  function counterRate(defender,attacker){return canCounterUnit(defender,attacker)?Math.max(0,Math.min(1,(defender.wuli||0)/150)):0}
  function canAttackFrom(u,x,y,target){const d=Math.abs(x-target.x)+Math.abs(y-target.y);return u.troop==='archer'?d===2:d===1}
  function attackDirectionRank(u,x,y,target){const dx=target.x-x,dy=target.y-y,order=u.troop==='archer'?[[1,-1],[1,1],[-1,1],[-1,-1],[2,0],[-2,0],[0,2],[0,-2]]:[[0,-1],[1,0],[0,1],[-1,0]];const rank=order.findIndex(([ox,oy])=>ox===dx&&oy===dy);return rank<0?99:rank}
  function physicalActionValue(actor,target,x,y){const basic=damageOf(actor,target)+Math.floor(actor.hp/6),attackValue=Math.max(1,Math.floor(basic/16));return attackValue+Math.floor((terrain[map[y][x]].def||0)/5)}
  function bestAiAction(actor,candidates,mobile=true){const cells=mobile?calcReach(actor):new Map([[keyOf(actor.x,actor.y),0]]);let best=null;for(const [key,cost] of cells){const [x,y]=key.split(',').map(Number),occupant=unitAt(x,y);if(occupant&&occupant!==actor)continue;const ground=terrain[map[y][x]];if(isWeakened(actor)&&ground.recoverHp){const value=50+Math.floor((ground.def||0)/5);if(!best||value>best.value||(value===best.value&&cost<best.cost))best={x,y,target:null,value,cost,dirRank:99,kind:'recover'}}for(const target of candidates){if(!canAttackFrom(actor,x,y,target))continue;const value=physicalActionValue(actor,target,x,y),dirRank=attackDirectionRank(actor,x,y,target);if(!best||value>best.value||(value===best.value&&(dirRank<best.dirRank||(dirRank===best.dirRank&&cost<best.cost))))best={x,y,target,value,cost,dirRank,kind:'attack'}}}return best}
  function bestSupportMove(actor){
    const friends=units.filter(u=>u!==actor&&u.hp>0&&u.side===actor.side);if(!friends.length)return null;
    let best=null;for(const [key,cost] of calcReach(actor)){const[x,y]=key.split(',').map(Number),occupant=unitAt(x,y);if(occupant&&occupant!==actor)continue;let score=(terrain[map[y][x]].def||0)*.5-cost*.6;
      for(const friend of friends){const d=Math.abs(friend.x-x)+Math.abs(friend.y-y),missing=Math.max(0,(friend.maxStrategy||0)-(friend.strategy||0));if(d===1)score+=90+(missing?70+Math.min(40,missing):0);else if(d===2)score+=18;score-=Math.min(d,8)*.5}
      const nearestEnemy=units.filter(u=>u.hp>0&&u.side!==actor.side).reduce((d,u)=>Math.min(d,Math.abs(u.x-x)+Math.abs(u.y-y)),99);if(nearestEnemy<=1)score-=95;else if(nearestEnemy===2)score-=28;
      if(!best||score>best.score||(score===best.score&&cost<best.cost))best={x,y,score,cost,target:null,kind:'support'}
    }return best
  }
  function rollCombatOutcome(attacker,target,forced={}){const baseDamage=damageOf(attacker,target,{counter:!!forced.counter}),missed=forced.missed??(Math.random()>=hitRate(attacker,target)),critical=!missed&&(forced.critical??(Math.random()<effectiveRate(attacker,'critRate'))),blocked=!missed&&(forced.blocked??(Math.random()<effectiveRate(target,'blockRate')));let damage=baseDamage;if(critical)damage*=1.65;if(blocked)damage*=.42;return{critical,blocked,missed,counter:!!forced.counter,baseDamage,damage:missed?0:Math.max(1,Math.round(damage))}}
  function combatResultLabel(outcome){if(outcome.missed)return'闪避！';if(outcome.critical&&outcome.blocked)return'会心一击被格挡！';if(outcome.critical)return'会心一击！';if(outcome.blocked)return'格挡！';return''}
  function combatLogText(attacker,target,outcome){const prefix=outcome.counter?'反击：':'',result=combatResultLabel(outcome),detail=result?`（${result.replace('！','')}）`:'';return outcome.missed?`${prefix}${target.name}闪避了${attacker.name}的攻击`:`${prefix}${attacker.name}攻击${target.name}${detail}，造成${outcome.damage}兵力伤害`}
  function audio(){try{if(!audioCtx){audioCtx=new (window.AudioContext||window.webkitAudioContext)();sfxBus=audioCtx.createGain();applySfxMix();sfxBus.connect(audioCtx.destination)}if(audioCtx.state==='suspended')audioCtx.resume();return audioCtx}catch{return null}}
  function sfxPanFor(u){const p=iso(u.x,u.y),screenX=bgRect.x+p.x*bgRect.scale,center=Math.max(1,wrap.clientWidth/2);return Math.max(-.82,Math.min(.82,(screenX-center)/center))}
  function battleSfx(name,u,options={}){const a=audio(),fn=window.BattleSfx?.[name];if(!a||!sfxBus||typeof fn!=='function')return;duckMusicForSfx(name);fn(a,sfxBus,{pan:sfxPanFor(u),...options})}
  function weaponSfxType(u){return window.BattleSfx?.weaponType?.(u)||'saber'}
  function updateMusicUI(){const btn=document.getElementById('musicBtn');btn.classList.toggle('muted',!musicEnabled);btn.setAttribute('aria-pressed',String(musicEnabled));document.getElementById('musicState').textContent=musicEnabled?'音乐':'静音'}
  function startTitleMusic(){if(!musicEnabled||!titleMusic.paused)return;storyMusic.pause();battleMusic.pause();titleMusic.volume=mixedMusicVolume();const playback=titleMusic.play();if(playback)playback.then(()=>{musicStarted=true}).catch(()=>{musicStarted=false});updateMusicUI()}
  function startStoryMusic(id=storyMusicId){
    if(storyMusicId!==id){storyMusic.pause();storyMusicId=id;storyMusic.src=`assets/audio/original-music-${id}.wav`;storyMusic.load()}
    titleMusic.pause();battleMusic.pause();if(!musicEnabled||!storyMusic.paused)return;storyMusic.volume=mixedMusicVolume();musicStarted=true;const playback=storyMusic.play();if(playback)playback.catch(()=>{musicStarted=false});updateMusicUI()
  }
  function startBattleMusic(){storyMusic.pause();titleMusic.pause();if(!musicEnabled||!battleMusic.paused)return;battleMusic.volume=mixedMusicVolume();musicStarted=true;const playback=battleMusic.play();if(playback)playback.catch(()=>{musicStarted=false});updateMusicUI()}
  function startActiveMusic(){if(titleIntroActive||titleVisible())startTitleMusic();else if(storyActive||(!battleStarted&&!document.getElementById('shopOverlay').classList.contains('hidden')))startStoryMusic();else startBattleMusic()}
  function setMusicEnabled(enabled){musicEnabled=enabled;if(enabled)startActiveMusic();else{titleMusic.pause();storyMusic.pause();battleMusic.pause()}updateMusicUI()}
  function playCharge(u){battleSfx('charge',u,{critical:true})}
  function playCombatAnimation(attacker,target,damage,onImpact,outcome={}){
    ensureBattleCamera(target);
    const motionKey=`${attacker.troop}:${attackKeyFor(attacker)}`,repeatBoost=compactRepeatedAnimations&&seenCombatMotions.has(motionKey)?1.65:1,motionSpeed=animationSpeed*repeatBoost,critical=!!outcome.critical,blocked=!!outcome.blocked,missed=!!outcome.missed,ranged=attacker.troop==='archer',weaponType=weaponSfxType(attacker),from=iso(attacker.x,attacker.y),to=iso(target.x,target.y),dx=to.x-from.x,dy=to.y-from.y,dist=Math.max(1,Math.hypot(dx,dy)),ux=dx/dist,uy=dy/dist,chargeDuration=(critical?650:0)/motionSpeed,strikeDuration=(ranged?920:860)/motionSpeed,hitAt=ranged?.56:.43,impactAt=chargeDuration+strikeDuration*hitAt,fatal=!missed&&(damage>=target.hp||outcome.rout),authoredFatal=!!(fatal&&(deathPaths[target.id]||hurtPaths[target.troop])),deathStartAt=impactAt+strikeDuration*.08,deathDuration=(authoredFatal?980:620)/motionSpeed,duration=fatal?Math.max(chargeDuration+strikeDuration,deathStartAt+deathDuration):chargeDuration+strikeDuration;let struck=false,released=!critical,fallSound=false;if(critical)playCharge(attacker);else battleSfx('attack',attacker,{kind:weaponType,critical});
    return new Promise(resolve=>{
      const start=performance.now();
      function frame(now){
        const elapsed=now-start,inCharge=elapsed<chargeDuration,strikeElapsed=Math.max(0,elapsed-chargeDuration),p=Math.min(1,strikeElapsed/strikeDuration),totalP=Math.min(1,elapsed/duration),chargeProgress=critical?Math.min(1,elapsed/chargeDuration):0,fx={attacker,target,damage,fatal,authoredDeath:authoredFatal,critical,blocked,missed,criticalCharge:critical?(inCharge?chargeProgress:Math.max(0,1-p*5)):0,blockPose:0,blockImpact:0,deathProgress:0,targetAlpha:1,showAttackSprite:!inCharge&&p<.9,attackFrame:0,attackerOffset:{x:0,y:0},targetOffset:{x:0,y:0},targetRotation:0,targetScaleX:1,targetScaleY:1,projectile:null,slashAlpha:0,impact:0,damageAlpha:0,hitFlash:0,hitReaction:0,shakeX:0,shakeY:0};
        if(inCharge){
          const crouch=Math.sin(chargeProgress*Math.PI*.5),tremble=Math.sin(elapsed*.055)*1.2*chargeProgress;fx.attackerOffset={x:-ux*5*crouch+tremble,y:-uy*5*crouch};fx.showAttackSprite=false;
        }else if(ranged){
          fx.attackFrame=p<.12?0:p<.28?1:p<.45?2:p<.62?3:4;
          fx.projectile=p<.63?Math.max(0,Math.min(1,(p-.28)/.32)):null;
          const recoil=Math.sin(Math.min(1,p/.65)*Math.PI);
          fx.attackerOffset={x:-ux*5*recoil,y:-uy*5*recoil};
        }else{
          fx.attackFrame=p<.13?0:p<.27?1:p<.41?2:p<.59?3:4;
          if(p<.2){const e=Math.sin(p/.2*Math.PI/2);fx.attackerOffset={x:-ux*8*e,y:-uy*8*e}}
          else if(p<hitAt){const e=1-Math.pow(1-(p-.2)/(hitAt-.2),3);fx.attackerOffset={x:ux*(5+30*e),y:uy*(5+30*e)}}
          else if(p<.58){fx.attackerOffset={x:ux*35,y:uy*35};fx.slashAlpha=Math.max(0,.28-(p-hitAt)*1.5)}
          else{const e=Math.min(1,(p-.58)/.38),back=(1-e)*(1-e);fx.attackerOffset={x:ux*35*back,y:uy*35*back}}
        }
        if(!released&&!inCharge){released=true;battleSfx('attack',attacker,{kind:weaponType,critical})}
        if(blocked&&!inCharge){const rise=Math.max(0,Math.min(1,(p-(hitAt-.2))/.12)),fall=p<hitAt+.2?1:Math.max(0,1-(p-hitAt-.2)/.28);fx.blockPose=rise*fall}
        if(!struck&&elapsed>=impactAt){struck=true;onImpact();if(blocked)battleSfx('block',target,{heavy:critical});else if(!missed)battleSfx('impact',target,{kind:weaponType,critical,fatal})}
        if(struck){
          const q=Math.min(1,(p-hitAt)/.46),kick=Math.sin(Math.PI*q)*(blocked?6:18),twist=Math.sin(Math.PI*q);
          if(fatal){
            const d=Math.max(0,Math.min(1,(elapsed-deathStartAt)/deathDuration)),fallRaw=Math.max(0,Math.min(1,(d-.12)/.66)),fall=1-Math.pow(1-fallRaw,3),stagger=Math.sin(Math.min(1,d/.34)*Math.PI)*14;
            fx.deathProgress=d;if(!fallSound&&d>=.58){fallSound=true;battleSfx('fall',target,{mounted:isMountedUnit(target)})}if(authoredFatal){fx.targetOffset={x:ux*stagger*.28,y:uy*stagger*.28};fx.targetAlpha=d<.88?1:Math.max(0,1-(d-.88)/.12)}else{fx.targetOffset={x:ux*(stagger+fall*9),y:uy*stagger+fall*11};fx.targetRotation=(ux>=0?1:-1)*-1.34*fall;fx.targetScaleX=1+.1*(1-fall)*Math.sin(Math.PI*d);fx.targetScaleY=1-.32*fall;fx.targetAlpha=d<.76?1:Math.max(0,1-(d-.76)/.24)}
          }else if(missed){
            fx.targetOffset={x:-uy*17*twist,y:ux*8*twist};fx.targetRotation=(ux>=0?1:-1)*.06*twist;
          }else{
            fx.targetOffset={x:ux*kick,y:uy*kick};fx.targetRotation=(ux>=0?1:-1)*(blocked?-.035:-.16)*twist;fx.targetScaleX=1+(blocked?.025:.12)*twist;fx.targetScaleY=1-(blocked?.04:.2)*twist;
          }
          fx.hitReaction=q;fx.hitFlash=missed?0:Math.max(0,(blocked?.45:1)-q*2.7);fx.impact=missed?0:Math.max(0,1-q*(blocked?2.8:2));fx.blockImpact=blocked?Math.max(0,1-q*1.7):0;fx.damageAlpha=q<.14?q/.14:Math.max(0,1-(q-.14)/.86);
          const shake=Math.max(0,1-q*3),power=blocked?3:critical?9:6;fx.shakeX=Math.sin(p*210)*power*shake;fx.shakeY=Math.cos(p*175)*power*.66*shake;
        }
        combatFx=fx;draw();
        if(totalP<1)requestAnimationFrame(frame);else{seenCombatMotions.add(motionKey);combatFx=null;draw();resolve()}
      }
      requestAnimationFrame(frame);
    })
  }
  function levelUp(u){const oldMaxHp=u.maxHp,oldMaxStrategy=u.maxStrategy||0,oldStrategy=u.strategy||0;u.level++;const derived=originalDerivedStats(u),hpGrowth=derived.maxHp-oldMaxHp;u.maxHp=derived.maxHp;u.hp=Math.min(u.maxHp,u.hp+Math.max(0,hpGrowth));u.atk=derived.attack;u.def=derived.defense;u.move=derived.move;u.maxStrategy=derived.maxStrategy;u.strategy=Math.min(u.maxStrategy,oldStrategy+Math.max(0,u.maxStrategy-oldMaxStrategy));flash(`${u.name}升至 Lv.${u.level}`);addLog(`${u.name}等级上升，兵力上限+${hpGrowth}`,true)}
  function gainExp(u,target,killed){const gain=BattleRules.experienceGain(u.level,target.level,killed,!!target.boss);u.exp+=gain;addLog(`${u.name}获得 ${gain} 经验`,true);flash(`经验 +${gain}`);while(u.exp>=100){u.exp-=100;levelUp(u)}syncUI();return gain}
  const duelNativeFacing={
    liu:'left',guan:'left',zhang:'left',gongsun:'left',tao:'left',
    hua:'right',lvbu:'right',officer:'right',infantry:'right',archer:'right',support:'right'
  };
  function duelVisualKeyFor(u){return art[u.id]?u.id:genericVisualKeyFor(u)}
  function duelFacingScale(u,direction){const native=duelNativeFacing[duelVisualKeyFor(u)]||(u.side==='enemy'?'right':'left');return native===direction?1:-1}
  // Resolve facing from the illustration actually drawn. Named recruits and
  // enemy officers often reuse a generic cavalry/infantry sheet whose native
  // direction differs from their unit id, so id-only facing turns them away.
  function drawDuelUnit(u,x,y,flipX,attackProgress=null,fall=0,alpha=1,options={}){
    const c=duelCtx,staticImg=spriteFor(u),baseH=Math.min(340,duelCanvas.clientHeight*.54),h=baseH*(options.scale||1),key=attackKeyFor(u),sheet=attackSpriteFor(u),squash=options.squash||0;
    c.save();c.globalAlpha=alpha;c.translate(x,y);c.rotate((options.rotation||0)-flipX*fall*1.22);c.scale(flipX,(1-fall*.22)*(1-squash));
    if(attackProgress!==null&&mediaReady(sheet)){const frame=Math.max(0,Math.min(4,Math.floor(Math.min(.999,attackProgress)*5))),sourceW=Math.floor(mediaWidth(sheet)/5),b=attackFrameBounds[key]?.[frame],scale=attackSheetScale(key,h,staticImg,sheet);if(b)c.drawImage(sheet,frame*sourceW+b[0],b[1],b[2],b[3],(b[0]-sourceW/2)*scale,-b[3]*scale,b[2]*scale,b[3]*scale)}
    else if(mediaReady(staticImg)){const staticW=mediaWidth(staticImg),staticH=mediaHeight(staticImg),cropTop=u.id==='liu'?Math.round(staticH*.15):0,sourceH=staticH-cropTop,w=h*staticW/sourceH;c.drawImage(staticImg,0,cropTop,staticW,sourceH,-w/2,-h,w,h)}c.restore()
  }
  function drawDuelShadow(c,x,y,scale=1,alpha=.34){c.save();c.globalAlpha=alpha;c.fillStyle='#020509';c.filter='blur(6px)';c.beginPath();c.ellipse(x,y+5,86*scale,17*scale,0,0,Math.PI*2);c.fill();c.restore()}
  function drawDuelDust(c,x,y,amount,dir=1){if(amount<=0)return;c.save();c.globalCompositeOperation='screen';for(let i=0;i<9;i++){const life=Math.max(0,amount-i*.055),r=7+(i%4)*5;c.globalAlpha=life*.2;c.fillStyle=i%2?'#d9b876':'#806848';c.beginPath();c.arc(x-dir*(18+i*15)*amount,y-3-(i%3)*8,r*life,0,Math.PI*2);c.fill()}c.restore()}
  function drawDuelSlash(c,x,y,r,angle,life,color='#ffe8a2'){
    if(life<=0)return;c.save();c.translate(x,y);c.rotate(angle);c.globalCompositeOperation='screen';c.lineCap='round';
    for(let i=0;i<3;i++){c.globalAlpha=life*(.9-i*.22);c.strokeStyle=i===0?'#fffbe3':color;c.lineWidth=(10-i*3)*life;c.beginPath();c.arc(0,0,r+i*8,-1.05,.55);c.stroke()}c.restore()
  }
  function drawDuelImpact(c,x,y,power,ms){if(power<=0)return;c.save();c.translate(x,y);c.globalCompositeOperation='screen';for(let i=0;i<26;i++){const a=i*2.399+ms*.008,r=(28+(i%7)*16)*power;c.strokeStyle=i%3?'#ffd267':'#ffffff';c.globalAlpha=power*(.95-(i%4)*.12);c.lineWidth=i%5===0?4:2;c.beginPath();c.moveTo(Math.cos(a)*8,Math.sin(a)*8);c.lineTo(Math.cos(a)*r,Math.sin(a)*r);c.stroke()}c.fillStyle='#fffbe6';c.globalAlpha=power;c.beginPath();c.arc(0,0,24*power,0,Math.PI*2);c.fill();c.restore()}
  function drawDuelBackdrop(c,W,H){if(art.battlefield.complete){c.globalAlpha=.38;c.filter='blur(2px) saturate(.72) brightness(.7)';c.drawImage(art.battlefield,-W*.06,-H*.12,W*1.12,H*1.22)}c.filter='none';c.globalAlpha=1;const mist=c.createLinearGradient(0,H*.42,0,H);mist.addColorStop(0,'#0b182200');mist.addColorStop(.66,'#17292665');mist.addColorStop(1,'#03080eea');c.fillStyle=mist;c.fillRect(0,0,W,H)}
  function drawDuelName(c,name,x,y,color){c.save();c.font=`700 ${Math.max(12,Math.min(18,duelCanvas.clientWidth/62))}px serif`;c.textAlign='center';c.textBaseline='middle';const w=c.measureText(name).width+26;c.fillStyle='#040a10c9';c.strokeStyle=color;c.lineWidth=1.5;c.beginPath();c.roundRect(x-w/2,y-13,w,26,13);c.fill();c.stroke();c.fillStyle='#f7e4b0';c.fillText(name,x,y+1);c.restore()}
  function playThreeHeroesDuel(zhang,lvbu){
    const script=level.events.duel,liu=units.find(u=>u.id==='liu'),guan=units.find(u=>u.id==='guan'),overlay=document.getElementById('duelOverlay'),title=document.getElementById('duelHeading'),captionNode=document.getElementById('duelCaption');document.getElementById('duelKicker').textContent=script.kicker;title.textContent=script.title;captionNode.textContent=script.caption;overlay.classList.remove('hidden');const dpr=Math.min(devicePixelRatio||1,2),W=overlay.clientWidth,H=overlay.clientHeight;duelCanvas.width=Math.round(W*dpr);duelCanvas.height=Math.round(H*dpr);duelCanvas.style.width=W+'px';duelCanvas.style.height=H+'px';duelCtx.setTransform(dpr,0,0,dpr,0,0);
    const duration=9600,marks=new Set(),clamp=n=>Math.max(0,Math.min(1,n)),ease=n=>1-Math.pow(1-clamp(n),3),smooth=n=>{n=clamp(n);return n*n*(3-2*n)},pulse=(ms,at,width)=>Math.max(0,1-Math.abs(ms-at)/width),attack=(ms,at,len)=>ms>=at&&ms<at+len?clamp((ms-at)/len):null,heroScale=W<900?.7:.82,luScale=W<900?.76:.9;
    return new Promise(resolve=>{const started=performance.now();function frame(now){const ms=(now-started)*animationSpeed,t=Math.min(1,ms/duration),c=duelCtx,ground=H*.82;let shake=0;for(const at of [1750,3020,5100,6900,7540,8160])shake=Math.max(shake,pulse(ms,at,135));c.setTransform(dpr,0,0,dpr,0,0);c.clearRect(0,0,W,H);c.save();c.translate(Math.sin(ms*.18)*shake*11,Math.cos(ms*.22)*shake*6);drawDuelBackdrop(c,W,H);
      const approach=ease(ms/900),counter=smooth((ms-2200)/1050),guanEntry=ease((ms-3400)/900),liuEntry=ease((ms-5450)/900),finale=smooth((ms-6400)/1900),retreat=ease((ms-8200)/1200);
      let zx=W*(.12+.22*approach),zy=ground,lx=W*(.88-.24*approach),ly=ground,gx=W*(-.12+.4*guanEntry),gy=ground-H*.025,ux=W*(-.12+.22*liuEntry),uy=ground+H*.045;
      const za1=attack(ms,900,1250),la1=attack(ms,2150,1150),ga=attack(ms,4150,1250),ua=attack(ms,5850,1250),za2=attack(ms,6500,1250),ga2=attack(ms,7150,1200),lb=attack(ms,7000,1300);
      if(za1!==null)zx+=Math.sin(Math.PI*za1)*W*.12;if(la1!==null){lx-=Math.sin(Math.PI*la1)*W*.11;zx-=Math.sin(Math.PI*counter)*W*.035}
      if(ga!==null)gx+=Math.sin(Math.PI*ga)*W*.16;if(ua!==null)ux+=Math.sin(Math.PI*ua)*W*.13;
      if(ms>=6400&&ms<8350){zx=W*(.42+.08*finale)+(za2!==null?Math.sin(Math.PI*za2)*W*.055:0);gx=W*(.27+.1*finale)+(ga2!==null?Math.sin(Math.PI*ga2)*W*.06:0);ux=W*(.1+.12*finale);lx=W*(.64+.035*finale)}
      if(ms>=8200){zx=W*.5;gx=W*.38;ux=W*.26;lx=W*(.675+.43*retreat);ly-=Math.sin(Math.PI*retreat)*H*.025}
      const zAlpha=1,gAlpha=clamp((ms-3250)/420),uAlpha=clamp((ms-5300)/420),lAlpha=ms<9250?1:Math.max(0,1-(ms-9250)/350),impactAt=ms<2100?1750:ms<3600?3020:ms<5700?5100:ms<7200?6900:ms<7850?7540:8160,impact=pulse(ms,impactAt,120),impactX=ms<2100?(zx+lx)/2:ms<3600?(zx+lx)/2:ms<5700?(gx+lx)/2:ms<7200?(ux+lx)/2:ms<7850?(zx+lx)/2:(gx+lx)/2;
      let caption='张飞挺矛 · 吕布迎战';if(ms>=2100)caption='方天戟反压 · 张飞寸步不退';if(ms>=3350)caption='关羽策马加入战阵';if(ms>=5350)caption='刘备拔双股剑 · 三兄弟合兵';if(ms>=6400)caption='三英齐攻 · 吕布独战三将';if(ms>=8200)caption='吕布拨马突围 · 三英合力追击';
      drawDuelShadow(c,ux,ground,heroScale,uAlpha*.3);drawDuelShadow(c,gx,ground,heroScale,gAlpha*.34);drawDuelShadow(c,zx,ground,heroScale,zAlpha*.35);drawDuelShadow(c,lx,ground,luScale,lAlpha*.38);drawDuelDust(c,gx,ground,ms>3350&&ms<4300?1-guanEntry:0,-1);drawDuelDust(c,ux,ground,ms>5450&&ms<6400?1-liuEntry:0,-1);drawDuelDust(c,lx,ground,retreat,1);
      drawDuelUnit(guan,gx,gy,duelFacingScale(guan,'right'),ga2??ga,0,gAlpha,{scale:heroScale});drawDuelUnit(zhang,zx,zy,duelFacingScale(zhang,'right'),za2??za1,0,zAlpha,{scale:heroScale});drawDuelUnit(liu,ux,uy,duelFacingScale(liu,'right'),ua,0,uAlpha,{scale:heroScale});drawDuelUnit(lvbu,lx,ly,duelFacingScale(lvbu,ms>=8400?'right':'left'),lb??la1,0,lAlpha,{scale:luScale,rotation:ms>=8200?-.035*retreat:0});
      if(ms<8200){if(ms>5200)drawDuelName(c,'刘备',ux,ground-H*.49*heroScale,'#87b8e8');if(ms>3200)drawDuelName(c,'关羽',gx,ground-H*.49*heroScale,'#6ec68c');drawDuelName(c,'张飞',zx,ground-H*.49*heroScale,'#e47a65');drawDuelName(c,'吕布',lx,ground-H*.51*luScale,'#e35d68')}
      drawDuelSlash(c,impactX,ground-H*.23,Math.min(W,H)*.2,-.2,Math.max(0,impact*.92));drawDuelImpact(c,impactX,ground-H*.22,impact,ms);if(impact>.58){c.fillStyle=`rgba(255,245,205,${(impact-.58)*.5})`;c.fillRect(-20,-20,W+40,H+40)}c.restore();captionNode.textContent=caption;
      for(const [at,name,kind,actor] of [[720,'zhang-charge','charge',zhang],[1750,'zhang-clash','block',lvbu],[3020,'lvbu-counter','block',zhang],[3820,'guan-charge','charge',guan],[5100,'guan-clash','block',lvbu],[5750,'liu-charge','charge',liu],[6900,'liu-clash','block',lvbu],[7540,'zhang-final','block',lvbu],[8160,'three-final','impact',lvbu],[8560,'lvbu-retreat','charge',lvbu]])if(ms>=at&&!marks.has(name)){marks.add(name);if(kind==='charge')playCharge(actor);else if(kind==='impact')battleSfx('impact',lvbu,{kind:'saber',critical:true});else battleSfx('block',actor,{heavy:true})}
      if(t<1)requestAnimationFrame(frame);else{overlay.classList.add('hidden');resolve()}}requestAnimationFrame(frame)})
  }
  function playDuelCinematic(g,h,scriptOverride=null){
    if(level.id==='hulao-pass')return playThreeHeroesDuel(g,h);
    const script=scriptOverride||level.events.duel,classic=level.id==='sishui-pass'&&!scriptOverride,overlay=document.getElementById('duelOverlay'),title=document.getElementById('duelHeading'),captionNode=document.getElementById('duelCaption');document.getElementById('duelKicker').textContent=script.kicker||'阵前单挑';title.textContent=script.title||`${g.name}　VS　${h.name}`;captionNode.textContent=script.caption||'两军阵前，一决胜负';overlay.classList.remove('hidden');const dpr=Math.min(devicePixelRatio||1,2),W=overlay.clientWidth,H=overlay.clientHeight;duelCanvas.width=Math.round(W*dpr);duelCanvas.height=Math.round(H*dpr);duelCanvas.style.width=W+'px';duelCanvas.style.height=H+'px';duelCtx.setTransform(dpr,0,0,dpr,0,0);const duration=7200,marks=new Set(),clamp=n=>Math.max(0,Math.min(1,n)),ease=n=>1-Math.pow(1-clamp(n),3),pulse=(at,width)=>Math.max(0,1-Math.abs(msCache-at)/width);let msCache=0;
    return new Promise(resolve=>{const start=performance.now();function frame(now){const ms=(now-start)*animationSpeed,t=Math.min(1,ms/duration),c=duelCtx;msCache=ms;let shake=0;for(const at of [1450,2360,3150,5230])shake=Math.max(shake,pulse(at,145));const sx=Math.sin(ms*.17)*shake*13,sy=Math.cos(ms*.21)*shake*7;c.setTransform(dpr,0,0,dpr,0,0);c.clearRect(0,0,W,H);c.save();c.translate(sx,sy);
      drawDuelBackdrop(c,W,H);
      const ground=H*.79,approach=ease(ms/850),duelGap=Math.min(W*.19,300),leftReady=W*.5-duelGap*.5,rightReady=W*.5+duelGap*.5,baseGX=W*.18+(leftReady-W*.18)*approach,baseHX=W*.82+(rightReady-W*.82)*approach;let gx=baseGX,hx=baseHX,gy=ground,hy=ground,gp=null,hp=null,fall=0,hAlpha=1,gFlip=duelFacingScale(g,'right'),hFlip=duelFacingScale(h,'left'),gRot=0,hRot=0,slash=0,slashAngle=-.24,impact=0,impactX=W*.5,impactY=ground-H*.22,caption='策马交锋';
      const first=clamp((ms-850)/850),second=clamp((ms-1700)/820),cross=clamp((ms-2600)/950),reset=clamp((ms-3550)/500),final=clamp((ms-4050)/1450),after=clamp((ms-5500)/700),fallP=clamp((ms-6040)/850);
      if(ms<850){gx+=Math.sin(ms*.045)*2;hx-=Math.sin(ms*.041)*2;gy-=Math.sin(ms*.035)*3;hy-=Math.sin(ms*.032)*3;caption='催马 · 迎锋'}
      else if(ms<1700){gp=first;hp=first>.35&&first<.79?.43:null;gx+=Math.sin(Math.PI*first)*52;hx-=Math.sin(Math.PI*first)*15;gRot=-.035*Math.sin(Math.PI*first);hRot=.045*Math.sin(Math.PI*first);slash=pulse(1390,210);impact=pulse(1450,115);impactX=(gx+hx)/2;caption=classic?'第一合 · 青龙刀破风':`第一合 · ${g.name}抢攻`}
      else if(ms<2600){hp=second;gp=second>.28&&second<.78?.46:null;hx-=Math.sin(Math.PI*second)*52;gx+=Math.sin(Math.PI*second)*13;hRot=.04*Math.sin(Math.PI*second);gRot=-.035*Math.sin(Math.PI*second);slash=pulse(2260,220);slashAngle=Math.PI+.18;impact=pulse(2360,115);impactX=(gx+hx)/2;caption=classic?'第二合 · 华雄反扑':`第二合 · ${h.name}反扑`}
      else if(ms<3550){gp=cross;hp=clamp((ms-2730)/790);gx+=Math.sin(Math.PI*cross)*38;hx-=Math.sin(Math.PI*cross)*38;gy-=Math.sin(Math.PI*cross)*7;hy-=Math.sin(Math.PI*cross)*7;slash=pulse(3040,250);impact=pulse(3150,125);impactX=(gx+hx)/2;caption='第三合 · 双刀相抵'}
      else if(ms<4050){gx-=reset*W*.035;hx+=reset*W*.035;caption='各退半步 · 胜负将分'}
      else if(ms<5500){const charge=ease(final);gp=clamp((final-.18)/.68);gx=W*(.37+.18*charge);hx=W*.595;gy-=Math.sin(Math.PI*final)*9;slash=pulse(5100,300);impact=pulse(5230,150);impactX=W*.535;caption=classic?(final<.52?'关羽蓄势 · 青龙偃月':'青龙一闪 · 拖刀绝杀'):(final<.52?`${g.name}蓄势`:`${g.name}与${h.name}兵刃再交`)}
      else if(ms<6040){gx=W*(.55+.105*ease(after));hx=W*.595;gFlip=duelFacingScale(g,'left');gRot=.018;hRot=-.035*after;slash=Math.max(0,1-after*1.8);caption='刀光已过 · 胜负已定'}
      else if(classic){gx=W*.655;hx=W*.595;gFlip=duelFacingScale(g,'left');fall=ease(fallP);hAlpha=fallP<.76?1:1-(fallP-.76)/.24;hx-=fall*18;caption=fallP<.55?'华雄中刀':'华雄败北'}
      else{gx=W*.56;hx=W*(.60+.27*ease(fallP));gFlip=duelFacingScale(g,'right');hFlip=duelFacingScale(h,'right');fall=0;hAlpha=fallP<.82?1:1-(fallP-.82)/.18;caption=fallP<.48?`${h.name}拨马后撤`:`${h.name}退出战阵`}
      drawDuelShadow(c,gx,ground,1,Math.max(.18,.38-fall*.12));drawDuelShadow(c,hx,ground,1,hAlpha*.36);drawDuelDust(c,gx,ground,ms<850?1-approach:Math.max(0,1-final),-1);drawDuelDust(c,hx,ground,ms<850?1-approach:0,1);
      // Back-to-front order changes after Guan passes Hua on the final stroke.
      if(ms<5500){drawDuelUnit(h,hx,hy,hFlip,hp,fall,hAlpha,{rotation:hRot});drawDuelUnit(g,gx,gy,gFlip,gp,0,1,{rotation:gRot})}else{drawDuelUnit(g,gx,gy,gFlip,gp,0,1,{rotation:gRot});drawDuelUnit(h,hx,hy,hFlip,hp,fall,hAlpha,{rotation:hRot})}
      drawDuelSlash(c,impactX,impactY,Math.min(W,H)*.21,slashAngle,slash);drawDuelImpact(c,impactX,impactY,impact,ms);if(impact>.55){c.fillStyle=`rgba(255,245,205,${(impact-.55)*.48})`;c.fillRect(-20,-20,W+40,H+40)}
      c.restore();captionNode.textContent=caption;
      for(const [at,name,kind] of [[760,'charge','charge'],[1450,'clash1','block'],[2360,'clash2','block'],[3150,'clash3','block'],[5230,'final','impact'],[6380,'fall','fall']])if(ms>=at&&!marks.has(name)){marks.add(name);if(kind==='impact')battleSfx('impact',h,{kind:'saber',critical:true,fatal:true});else if(kind==='charge')playCharge(g);else if(kind==='fall')battleSfx('fall',h,{mounted:true});else battleSfx('block',h,{heavy:true})}
      if(t<1)requestAnimationFrame(frame);else{overlay.classList.add('hidden');resolve()}}requestAnimationFrame(frame)})
  }
  function playWarmWineCinematic(g){
    const overlay=document.getElementById('duelOverlay'),kicker=document.getElementById('duelKicker'),heading=document.getElementById('duelHeading'),caption=document.getElementById('duelCaption');kicker.textContent='温酒斩华雄';heading.textContent='酒尚温　将已还';caption.textContent='青龙刀归鞘，帐中温酒未冷';overlay.classList.remove('hidden');const previousMusicSceneMultiplier=musicSceneMultiplier;musicSceneMultiplier=.28;applyMusicMix();const dpr=Math.min(devicePixelRatio||1,2),W=overlay.clientWidth,H=overlay.clientHeight;duelCanvas.width=Math.round(W*dpr);duelCanvas.height=Math.round(H*dpr);duelCanvas.style.width=W+'px';duelCanvas.style.height=H+'px';duelCtx.setTransform(dpr,0,0,dpr,0,0);const duration=2200;let chimed=false;
    return new Promise(resolve=>{const start=performance.now();function frame(now){const ms=(now-start)*animationSpeed,t=Math.min(1,ms/duration),c=duelCtx,fade=Math.min(1,ms/420)*Math.min(1,(duration-ms)/360);c.clearRect(0,0,W,H);const glow=c.createRadialGradient(W*.5,H*.5,20,W*.5,H*.5,W*.55);glow.addColorStop(0,'#704113');glow.addColorStop(.45,'#192a2b');glow.addColorStop(1,'#050c16');c.fillStyle=glow;c.fillRect(0,0,W,H);c.save();c.globalAlpha=fade*.8;c.fillStyle='#d6a34e';c.beginPath();c.arc(W*.5,H*.44,Math.min(W,H)*.23,0,Math.PI*2);c.fill();c.globalCompositeOperation='destination-out';c.beginPath();c.arc(W*.5,H*.44,Math.min(W,H)*.21,0,Math.PI*2);c.fill();c.restore();drawDuelUnit(g,W*.47,H*.79,-1,null,0,fade);const cupX=W*.68,cupY=H*.67;c.save();c.globalAlpha=fade;c.strokeStyle='#e9c878';c.fillStyle='#744318';c.lineWidth=3;c.beginPath();c.moveTo(cupX-28,cupY);c.lineTo(cupX-21,cupY+25);c.quadraticCurveTo(cupX,cupY+38,cupX+21,cupY+25);c.lineTo(cupX+28,cupY);c.closePath();c.fill();c.stroke();c.beginPath();c.ellipse(cupX,cupY,28,8,0,0,Math.PI*2);c.fillStyle='#d58b35';c.fill();c.stroke();for(let i=0;i<3;i++){const sway=Math.sin(ms*.004+i)*7;c.globalAlpha=fade*(.55-i*.12);c.beginPath();c.moveTo(cupX-12+i*12,cupY-8);c.bezierCurveTo(cupX-18+i*12+sway,cupY-35,cupX+i*10-sway,cupY-48,cupX-7+i*9,cupY-66);c.strokeStyle='#fff2cf';c.lineWidth=2;c.stroke()}c.restore();if(ms>700&&!chimed){chimed=true;playCharge(g)}if(t<1)requestAnimationFrame(frame);else{overlay.classList.add('hidden');musicSceneMultiplier=previousMusicSceneMultiplier;applyMusicMix();resolve()}}requestAnimationFrame(frame)})
  }
  const criticalQuotes={
    liu:'汉室正统在此，破敌！',
    guan:'尝尝我青龙偃月刀的厉害！',
    zhang:'吃俺老张一矛！',
    jian:'此箭，正中要害！'
  };
  function playCriticalQuote(attacker,outcome){
    if(!outcome?.critical||attacker.side!=='ally')return Promise.resolve();
    const text=attacker.criticalQuote||criticalQuotes[attacker.id]||'胜负，就在此一击！';
    addLog(`${attacker.name}会心一击：${text}`,true);status(`${attacker.name}发动会心一击`);
    return new Promise(resolve=>runDialogue([{speaker:attacker.name,text}],resolve))
  }
  async function performCounter(defender,attacker){
    if(defender.hp<=0||attacker.hp<=0||defender.confused||!canCounterUnit(defender,attacker)||!inAttackRange(defender,attacker)||Math.random()>=counterRate(defender,attacker))return false;
    const outcome=rollCombatOutcome(defender,attacker,{counter:true}),label=combatResultLabel(outcome);outcome.rout=!outcome.missed&&physicalMoraleDamage(attacker,outcome.damage)>=(attacker.morale??100);status(`${defender.name}反击 ${attacker.name}`);await playCriticalQuote(defender,outcome);await playCombatAnimation(defender,attacker,outcome.damage,()=>{attacker.hp=Math.max(0,attacker.hp-outcome.damage);if(!outcome.missed)applyMoraleLoss(attacker,physicalMoraleDamage(attacker,outcome.damage));if(label)flash(label);syncUI()},outcome);addLog(combatLogText(defender,attacker,outcome),!!label);if(defender.side==='ally')gainExp(defender,attacker,attacker.hp<=0);draw();return attacker.hp<=0
  }
  async function attack(attacker,target){
    const duel=level.events?.duel;if(attacker.id===duel?.attackerId&&target.id===duel?.defenderId&&Math.abs(attacker.x-target.x)+Math.abs(attacker.y-target.y)===1){attacker.acted=true;startDuel();return}
    if(phase==='animating')return;const outcome=rollCombatOutcome(attacker,target),dmg=outcome.damage,label=combatResultLabel(outcome);outcome.rout=!outcome.missed&&physicalMoraleDamage(target,dmg)>=(target.morale??100);attacker.acted=true;phase='animating';attackable=[];reachable.clear();selected=attacker;hideForecast();status(outcome.critical?`${attacker.name} 正在凝聚会心一击`:`${attacker.name} 攻击 ${target.name}`);syncUI();
    await playCriticalQuote(attacker,outcome);
    await playCombatAnimation(attacker,target,dmg,()=>{target.hp=Math.max(0,target.hp-dmg);if(!outcome.missed)applyMoraleLoss(target,physicalMoraleDamage(target,dmg));if(label)flash(label);syncUI()},outcome);
    const killed=target.hp<=0;addLog(combatLogText(attacker,target,outcome),!!label);gainExp(attacker,target,killed);draw();
    if(killed){addLog(`${target.name}撤退`,true);await playDefeatQuote(target);if(target.id===objectiveUnitId){victory();return}}
    if(attacker.id===duel?.attackerId&&target.id===duel?.defenderId&&target.hp>0){startDuel();return}
    if(!killed&&await performCounter(target,attacker)){addLog(`${attacker.name}撤退`,true);await playDefeatQuote(attacker);if(attacker.id==='liu'){defeat('刘备撤退');return}}
    phase='select';syncUI();draw();scheduleAutoSave();if(playerTurn&&units.filter(u=>u.side==='ally'&&u.hp>0).every(u=>u.acted))queueEndPlayerTurn(360)
  }
  function tryDuel(){const script=level.events?.duel,g=units.find(u=>u.id===script?.attackerId),h=units.find(u=>u.id===script?.defenderId);if(g&&h&&g.hp>0&&h.hp>0&&Math.abs(g.x-h.x)+Math.abs(g.y-h.y)===1){startDuel();return true}return false}
  async function startDuel(){
    const script=level.events.duel,g=units.find(u=>u.id===script.attackerId),h=units.find(u=>u.id===script.defenderId);
    await new Promise(resolve=>runDialogue(script.challenge,resolve));
    if(script.reinforcement?.length)await new Promise(resolve=>runDialogue(script.reinforcement,resolve));
    phase='animating';status(level.id==='hulao-pass'?'三英战吕布':`${g.name} 单挑 ${h.name}`);
    await playDuelCinematic(g,h);h.hp=0;flash(level.id==='sishui-pass'?'关羽斩华雄！':level.id==='hulao-pass'?'三英合力，吕布败退！':`${g.name}逼退${h.name}！`);syncUI();draw();
    const exchange=script.exchange||script.aftermath||[];if(exchange.length)await new Promise(resolve=>runDialogue(exchange,resolve));
    levelUp(g);addLog(level.id==='hulao-pass'?'刘备、关羽、张飞合力击退吕布':`${g.name}单挑击退${h.name}`,true);syncUI();draw();
    await new Promise(resolve=>runDialogue([script.levelUp],resolve));
    if(level.id==='sishui-pass'){await playWarmWineCinematic(g);if(script.report)await new Promise(resolve=>runDialogue([script.report],resolve))}
    else if(script.aftermath?.length)await new Promise(resolve=>runDialogue(script.aftermath,resolve));
    const duelEndsBattle=script.endsBattle??(h.id===objectiveUnitId);
    if(duelEndsBattle){victory(true);return}
    if(script.confirmation)await new Promise(resolve=>runDialogue([script.confirmation],resolve));
    phase='select';selected=null;inspected=g;reachable.clear();attackable=[];status(`${h.name}败退，继续击退${units.find(u=>u.id===objectiveUnitId)?.name||'敌军主将'}`);syncUI();draw();scheduleAutoSave();
    if(playerTurn&&units.filter(u=>u.side==='ally'&&u.hp>0).every(u=>u.acted))queueEndPlayerTurn(360)
  }
  function waitSelected(){if(!selected||selected.side!=='ally'||selected.acted||turnTransitionPending)return;const who=selected;who.acted=true;selected=null;inspected=who;phase='select';moveOrigin=null;activeStrategy=null;activeItem=null;reachable.clear();attackable=[];hoverPath=[];hideForecast();document.getElementById('itemMenu').classList.add('hidden');document.getElementById('strategyMenu').classList.add('hidden');syncUI();status(`${who.name} 已待机，请选择下一名武将`);draw();scheduleAutoSave();if(tryDuel())return;if(units.filter(u=>u.side==='ally'&&u.hp>0).every(u=>u.acted))queueEndPlayerTurn(260)}
  function inventoryCount(u,type){return u?u.inventory.filter(x=>x===type).length:0}
  function carriedCount(u){return u?u.inventory.length+(u.treasureItems?.length||0):0}
  function removeInventoryItem(u,type){const i=u.inventory.indexOf(type);if(i>=0)u.inventory.splice(i,1)}
  function strategyAbility(u){return BattleRules.strategyAbility(u.zhili||0,u.level)}
  function fireScrollDamage(target){let base=Math.max(1,200-strategyAbility(target));if(['support','transport','sorcerer'].includes(target.troop))base=Math.floor(base/2);if(map[target.y][target.x]==='forest')base+=Math.floor(base/4);const randomRoll=Math.floor(Math.random()*(Math.floor(base/50)+1));return BattleRules.fireScrollDamage({targetZhili:target.zhili||0,targetLevel:target.level,targetTroop:target.troop,targetInForest:map[target.y][target.x]==='forest',randomRoll,targetHp:target.hp})}
  function treasureLabel(id){const item=treasureCatalog[id];return item?`${item.name}（${item.effect==='defense'?'防御':'攻击'}+${item.bonus}%）`:id}
  function inventoryLabel(u){const parts=(u.treasureItems||[]).map(treasureLabel);for(const type of ['bean','wheat','wine','fireScroll']){const count=inventoryCount(u,type);if(count)parts.push(`${shopItems[type].name}×${count}`)}return parts.length?parts.join('　'):'尚未携带道具'}
  function syncShop(){
    document.getElementById('shopGold').textContent=gold;
    document.getElementById('shopFundingHint').textContent=`本关当前可用军资金${gold}。宝物和消耗品均占携带栏，可在我军间转交，每人最多8件。`;
    const allies=units.filter(u=>u.side==='ally');
    document.getElementById('shopInventory').innerHTML=allies.map(u=>`<div><b>${u.name}</b><span>${inventoryLabel(u)}</span><em>${carriedCount(u)}/8</em></div>`).join('');
    document.querySelectorAll('[data-shop-item]').forEach(row=>{
      const type=row.dataset.shopItem,select=row.querySelector('select'),previous=select.value;
      select.innerHTML=allies.map(u=>`<option value="${u.id}">${u.name}（${carriedCount(u)}/8）</option>`).join('');
      select.value=allies.some(u=>u.id===previous)?previous:(allies[0]?.id||'');
      const holder=allies.find(u=>u.id===select.value),button=row.querySelector('button');
      button.disabled=!holder||gold<shopItems[type].price||carriedCount(holder)>=8;
      button.title=holder&&carriedCount(holder)>=8?`${holder.name}的携带栏已满`:''
    });
    syncTransfer()
  }
  function transferChoices(u){const out=(u.treasureItems||[]).map(id=>({value:`treasure:${id}`,label:treasureLabel(id)}));for(const type of ['bean','wheat','wine','fireScroll']){const count=inventoryCount(u,type);if(count)out.push({value:`item:${type}`,label:`${shopItems[type].name} ×${count}`})}return out}
  function syncTransfer(){const allies=units.filter(u=>u.side==='ally'),fromEl=document.getElementById('transferFrom'),itemEl=document.getElementById('transferItem'),toEl=document.getElementById('transferTo'),button=document.getElementById('transferBtn'),oldFrom=fromEl.value||allies[0]?.id,oldItem=itemEl.value,oldTo=toEl.value;fromEl.innerHTML=allies.map(u=>`<option value="${u.id}">${u.name}</option>`).join('');fromEl.value=allies.some(u=>u.id===oldFrom)?oldFrom:allies[0]?.id;const from=units.find(u=>u.id===fromEl.value),choices=transferChoices(from);itemEl.innerHTML=choices.length?choices.map(item=>`<option value="${item.value}">${item.label}</option>`).join(''):'<option value="">无可转交物品</option>';if(choices.some(item=>item.value===oldItem))itemEl.value=oldItem;const receivers=allies.filter(u=>u!==from);toEl.innerHTML=receivers.map(u=>`<option value="${u.id}">${u.name}（${carriedCount(u)}/8）</option>`).join('');if(receivers.some(u=>u.id===oldTo))toEl.value=oldTo;const to=units.find(u=>u.id===toEl.value);button.disabled=!itemEl.value||!to||carriedCount(to)>=8}
  function transferInventoryItem(){const from=units.find(u=>u.id===document.getElementById('transferFrom').value),to=units.find(u=>u.id===document.getElementById('transferTo').value),token=document.getElementById('transferItem').value;if(!from||!to||!token||carriedCount(to)>=8)return;const[kind,type]=token.split(':');let name='';if(kind==='treasure'){const i=from.treasureItems.indexOf(type);if(i<0)return;from.treasureItems.splice(i,1);to.treasureItems.push(type);refreshPassiveTreasures(from);refreshPassiveTreasures(to);name=treasureCatalog[type].name}else{if(inventoryCount(from,type)<=0)return;removeInventoryItem(from,type);to.inventory.push(type);name=shopItems[type].name}addLog(`${from.name}将${name}转交给${to.name}`);syncShop();syncUI();flash(`${name}已交给${to.name}`)}
  function purchaseShopItem(row){const type=row.dataset.shopItem,item=shopItems[type],holder=units.find(u=>u.side==='ally'&&u.id===row.querySelector('select').value);if(!holder||gold<item.price||carriedCount(holder)>=8)return;gold-=item.price;holder.inventory.push(type);addLog(`${holder.name}购入${item.name}`,false);syncShop();syncUI();flash(`${holder.name}获得${item.name}`)}
  function resetShop(){if(!prepBaseline)capturePrepBaseline();gold=prepBaseline.gold;units.filter(u=>u.side==='ally').forEach(u=>{const base=prepBaseline.units[u.id]||{inventory:[],treasureItems:treasureIdsFor(level.units.find(source=>source.id===u.id)||{})};u.inventory=[...base.inventory];u.treasureItems=[...base.treasureItems];refreshPassiveTreasures(u)});for(let i=logs.length-1;i>=0;i--)if(logs[i].msg.includes('购入')||logs[i].msg.includes('转交'))logs.splice(i,1);addLog('战前整备已重置');syncShop();syncUI();flash('已恢复进入本关时的军需与宝物')}
  function toggleItemMenu(){if(!selected||selected.acted||!playerTurn)return;document.getElementById('strategyMenu').classList.add('hidden');document.getElementById('itemMenu').classList.toggle('hidden')}
  function syncItems(){for(const type of ['bean','wheat','wine','fireScroll']){const count=inventoryCount(selected,type),id=type==='bean'?'beanCount':type==='wheat'?'wheatCount':type==='wine'?'wineCount':'fireScrollCount';document.getElementById(id).textContent=`×${count}`;document.querySelector(`[data-item="${type}"]`).disabled=count<=0}}
  function itemTargetTiles(u,type){const out=[],validFireTerrain=new Set(['plain','grass','forest','city']);for(let y=0;y<ROWS;y++)for(let x=0;x<COLS;x++){const d=Math.abs(x-u.x)+Math.abs(y-u.y);if(d>3)continue;const target=unitAt(x,y);if(!target)continue;if(type==='fireScroll'){if(d>0&&target.side==='enemy'&&validFireTerrain.has(map[y][x]))out.push({x,y})}else if(target.side!=='enemy'&&d<=2&&(['bean','wheat'].includes(type)?target.hp<target.maxHp:(target.morale??100)<100))out.push({x,y})}return out}
  function beginItemUse(type){if(!selected||selected.acted||!playerTurn||inventoryCount(selected,type)<=0)return;activeItem=type;phase='item';reachable.clear();attackable=itemTargetTiles(selected,type);document.getElementById('itemMenu').classList.add('hidden');syncUI();status(`${selected.name}：请选择${shopItems[type].name}的使用目标`);if(!attackable.length)flash('范围内没有可用目标');draw()}
  async function useItem(target){if(!selected||!activeItem||phase!=='item'||!attackable.some(q=>q.x===target.x&&q.y===target.y))return;const caster=selected,type=activeItem;removeInventoryItem(caster,type);caster.acted=true;phase='animating';activeItem=null;attackable=[];if(type==='fireScroll'){const damage=fireScrollDamage(target);status(`${caster.name}使用焦热书`);await playStrategyAnimation('fire',target,true);target.hp=Math.max(0,target.hp-damage);flash(`焦热 -${damage}`);addLog(`${caster.name}使用焦热书命中${target.name}，造成${damage}兵力伤害`,true);gainExp(caster,target,target.hp<=0);if(target.hp<=0){addLog(`${target.name}撤退`,true);await playDefeatQuote(target);if(target.id===objectiveUnitId){victory();return}}}else if(type==='bean'||type==='wheat'){const item=shopItems[type],amount=Math.min(item.recoverHp,target.maxHp-target.hp);target.hp=Math.min(target.maxHp,target.hp+amount);flash(`兵力 +${amount}`);addLog(`${caster.name}对${target.name}使用${item.name}，恢复${amount}兵力`,true)}else{const amount=Math.min(100-(target.morale??100),50);target.morale=(target.morale??100)+amount;flash(`士气 +${amount}`);addLog(`${caster.name}对${target.name}使用酒，恢复${amount}士气`,true)}phase='select';selected=null;inspected=target;syncItems();syncUI();draw();scheduleAutoSave();if(playerTurn&&units.filter(u=>u.side==='ally'&&u.hp>0).every(u=>u.acted))queueEndPlayerTurn(360)}
  function cancelAction(){document.getElementById('itemMenu').classList.add('hidden');document.getElementById('strategyMenu').classList.add('hidden');activeStrategy=null;activeItem=null;hoverPath=[];hideForecast();if(!selected||selected.acted)return;if(moveOrigin&&(selected.x!==moveOrigin.x||selected.y!==moveOrigin.y)){selected.x=moveOrigin.x;selected.y=moveOrigin.y}selected=null;phase='select';reachable.clear();attackable=[];syncUI();status('请选择我军单位');draw()}
  const delay=ms=>new Promise(r=>setTimeout(r,ms));
  function queueEndPlayerTurn(delayMs=0){if(turnTransitionPending||!playerTurn||ending)return;turnTransitionPending=true;selected=null;phase='turnEnding';reachable.clear();attackable=[];syncUI();status('我军行动完毕');draw();setTimeout(()=>endPlayerTurn(true),delayMs)}
  async function endPlayerTurn(fromQueue=false){if((turnTransitionPending&&!fromQueue)||!playerTurn||dialogue||phase==='animating')return;turnTransitionPending=false;document.getElementById('itemMenu').classList.add('hidden');document.getElementById('strategyMenu').classList.add('hidden');activeStrategy=null;activeItem=null;hideForecast();units.filter(u=>u.side==='ally').forEach(u=>u.acted=true);playerTurn=false;selected=null;reachable.clear();attackable=[];const guests=aiTurnOrder('guest');if(guests.length){phase='guest';beginSidePhase('guest');document.getElementById('sideLabel').textContent='盟军阶段';syncUI();flash('盟军阶段');draw();await guestPhase();if(ending||phase==='ended')return}phase='enemy';beginSidePhase('enemy');document.getElementById('sideLabel').textContent='敌军阶段';syncUI();flash('敌军阶段');draw();await enemyPhase()}
  function aiRouteDistance(actor,startX,startY,target){
    const desired=actor.troop==='archer'?2:1,start=keyOf(startX,startY),dist=new Map([[start,0]]),open=[[startX,startY]];
    while(open.length){
      open.sort((a,b)=>dist.get(keyOf(a[0],a[1]))-dist.get(keyOf(b[0],b[1])));
      const [x,y]=open.shift(),current=dist.get(keyOf(x,y));
      if(Math.abs(x-target.x)+Math.abs(y-target.y)===desired)return current;
      for(const [nx,ny] of neighbors(x,y)){
        const step=tileCost(actor,nx,ny);if(!Number.isFinite(step))continue;
        const occupant=unitAt(nx,ny);if(occupant&&occupant!==actor&&isOpponent(actor,occupant))continue;
        const next=current+step,k=keyOf(nx,ny);if(next<(dist.get(k)??Infinity)){dist.set(k,next);open.push([nx,ny])}
      }
    }
    return Infinity
  }
  function chooseAiTarget(actor,candidates){return [...candidates].sort((a,b)=>{const score=t=>{const route=aiRouteDistance(actor,actor.x,actor.y,t),distanceScore=Number.isFinite(route)?route:10000,kill=damageOf(actor,t)>=t.hp?-120:0,range=inAttackRange(actor,t)?-70:0,leader=actor.side==='enemy'&&t.id==='liu'?-12:0,wounded=t.hp/t.maxHp*24;return distanceScore*12+range+kill+leader+wounded};return score(a)-score(b)})[0]}
  function bestEnemyMove(e,target){const cells=calcReach(e),boss=units.find(u=>u.id===objectiveUnitId&&u.hp>0);let best={x:e.x,y:e.y,score:Infinity};for(const k of cells.keys()){const [x,y]=k.split(',').map(Number),occupant=unitAt(x,y);if(occupant&&occupant!==e)continue;const route=aiRouteDistance(e,x,y,target),routePenalty=Number.isFinite(route)?route*100:100000,rule=terrain[map[y][x]],terrainReward=-(rule.def||0)*.8-(rule.recoverHp&&e.hp<e.maxHp?35:0),crowd=neighbors(x,y).filter(([nx,ny])=>{const u=unitAt(nx,ny);return u&&u.side===e.side}).length*9,guards=level.id==='sishui-pass'?['li','hu','zhao']:['zhangliao','houcheng','songxian'],guardPenalty=boss&&guards.includes(e.id)?Math.max(0,Math.abs(x-boss.x)+Math.abs(y-boss.y)-5)*22:0,score=routePenalty+terrainReward+crowd+guardPenalty;if(score<best.score)best={x,y,score}}return best}
  function bestMoveToPoint(e,targetX,targetY){const cells=calcReach(e);let best={x:e.x,y:e.y,score:Infinity};for(const [k,cost] of cells){const[x,y]=k.split(',').map(Number),occupant=unitAt(x,y);if(occupant&&occupant!==e)continue;const rule=terrain[map[y][x]],distance=Math.abs(x-targetX)+Math.abs(y-targetY),score=distance*100+cost-(rule.def||0)*.45;if(score<best.score)best={x,y,score}}return best}
  async function guestPhase(){for(const g of aiTurnOrder('guest')){const enemies=units.filter(u=>u.side==='enemy'&&u.hp>0);if(!enemies.length)return;const mobile=g.aiType!==2&&!g.stationary;let plan=bestAiAction(g,enemies,mobile&&g.troop!=='support');const tactic=chooseAiStrategy(g,plan);if(tactic){if(await useStrategyNpc(g,tactic.type,tactic.target)||ending)return;await delay(100);continue}if(!plan&&mobile&&g.troop==='support')plan=bestSupportMove(g);if(!plan&&mobile){const target=chooseAiTarget(g,enemies),to=bestEnemyMove(g,target);plan={x:to.x,y:to.y,target:null,kind:'advance'}}if(!plan)continue;if(plan.x!==g.x||plan.y!==g.y){status(`${g.name} 行进中`);await animateUnitMove(g,plan.x,plan.y)}if(plan.target&&plan.target.hp>0&&inAttackRange(g,plan.target)){await attackNpc(g,plan.target);if(ending)return}await delay(100)}if(dangerVisible)rebuildDangerTiles()}
  async function triggerTimedEvents(){for(const event of level.timedEvents||[]){const key=event.once||`turn-${event.turn}-${event.unitId||''}`;if(event.turn!==turn||timedEventsFired.has(key))continue;timedEventsFired.add(key);const unit=units.find(u=>u.id===event.unitId);if(unit&&Number.isInteger(event.setAiType)){unit.aiType=event.setAiType;unit.stationary=event.setAiType===2}for(const spawn of event.spawns||[]){const arriving=units.find(u=>u.id===spawn.unitId);if(!arriving)continue;arriving.side=spawn.side||arriving.side;arriving.x=spawn.x;arriving.y=spawn.y;arriving.acted=false;if(Number.isInteger(spawn.aiType))arriving.aiType=spawn.aiType}if(event.spawns?.length){draw();addLog(`第${turn}回合：战场援军出现`,true)}if(event.dialogue?.length)await new Promise(resolve=>runDialogue(event.dialogue,resolve));if(unit)addLog(`第${turn}回合事件：${unit.name}开始主动出击`,true)}}
  async function enemyPhase(){for(const e of aiTurnOrder('enemy')){const allies=units.filter(u=>(u.side==='ally'||u.side==='guest')&&u.hp>0);if(!allies.length){defeat();return}const mobile=e.aiType===1||e.aiType===3||e.aiType===4||e.aiType===6,canAttack=e.aiType!==6;let plan=canAttack?bestAiAction(e,allies,mobile&&e.troop!=='support'):null;const tactic=canAttack?chooseAiStrategy(e,plan):null;if(tactic){if(await useStrategyNpc(e,tactic.type,tactic.target)||ending)return;await delay(100);continue}if(!plan&&mobile&&e.troop==='support')plan=bestSupportMove(e);if(!plan&&mobile&&e.troop!=='support'){let to;if((e.aiType===4||e.aiType===6)&&Number.isInteger(e.aiTarget)){to=bestMoveToPoint(e,e.aiTarget&255,e.aiTarget>>>8)}else{const target=e.aiType===3&&Number.isInteger(e.aiTarget)?units.find(u=>u.originalId===e.aiTarget&&u.hp>0):chooseAiTarget(e,allies);if(target)to=bestEnemyMove(e,target)}if(to)plan={x:to.x,y:to.y,target:null,kind:'advance'}}if(!plan)continue;if(plan.x!==e.x||plan.y!==e.y){status(`${e.name} 行进中`);await animateUnitMove(e,plan.x,plan.y)}if(plan.target&&plan.target.hp>0&&inAttackRange(e,plan.target))await attackNpc(e,plan.target);if(ending)return;await delay(100)}turn++;if(turn>level.maxTurns){defeat('超过回合限制');return}playerTurn=true;turnTransitionPending=false;units.forEach(u=>u.acted=false);beginSidePhase('ally');units.filter(u=>u.side==='ally'&&u.confused).forEach(u=>u.acted=true);await triggerTimedEvents();if(dangerVisible)rebuildDangerTiles();document.getElementById('sideLabel').textContent='我军阶段';document.getElementById('turnNumber').textContent=turn;phase='select';syncUI();flash('我军阶段');status('请选择我军单位');draw();scheduleAutoSave()}
  async function attackNpc(a,t){
    const outcome=rollCombatOutcome(a,t),previousPhase=phase,bossProtected=a.side==='guest'&&t.id===objectiveUnitId;if(bossProtected&&t.hp<=1){status(`${a.name}按兵不动，等待刘备军迎战${t.name}`);return}const dmg=bossProtected?Math.min(outcome.damage,Math.max(0,t.hp-1)):outcome.damage;outcome.damage=dmg;outcome.rout=!bossProtected&&!outcome.missed&&physicalMoraleDamage(t,dmg)>=(t.morale??100);const label=combatResultLabel(outcome);phase='animating';status(outcome.critical?`${a.name} 正在凝聚会心一击`:`${a.name} 攻击 ${t.name}`);syncUI();
    await playCriticalQuote(a,outcome);
    await playCombatAnimation(a,t,dmg,()=>{t.hp=Math.max(bossProtected?1:0,t.hp-dmg);if(!outcome.missed)applyMoraleLoss(t,physicalMoraleDamage(t,dmg),{preventRout:bossProtected});if(label)flash(label);syncUI()},outcome);
    const killed=t.hp<=0;addLog(combatLogText(a,t,outcome),!!label);if(bossProtected&&t.hp===1)addLog(`${a.name}重创${t.name}，最后一击留待刘备军`,true);if(a.side==='guest')gainExp(a,t,killed);draw();
    if(killed){phase=previousPhase;addLog(`${t.name}撤退`,true);await playDefeatQuote(t);if(t.id===objectiveUnitId)victory();else if(t.id==='liu')defeat('刘备撤退');return}
    if(await performCounter(t,a)){addLog(`${a.name}撤退`,true);await playDefeatQuote(a);if(a.id===objectiveUnitId)victory();else if(a.id==='liu')defeat('刘备撤退')}
    phase=previousPhase;syncUI();draw()
  }
  function nextLevelUrl(){const nextIndex=level.nextLevelId==='qinghe'?'6':level.nextLevelId==='julu'?'5':level.nextLevelId==='guangchuan'?'3':level.nextLevelId==='hulao-pass'?'2':null;if(!nextIndex)return null;const params=new URLSearchParams();params.set('level',nextIndex);params.set('build',RUNTIME_BUILD);if(level.id==='hulao-pass')params.set('routeChoice','1');if(['guangchuan','xindu'].includes(level.id))params.set('secondRouteChoice','1');return`${location.pathname}?${params}`}
  function continueCampaign(){const url=nextLevelUrl();if(!url){restartBattle();return}writeCampaignTransfer();location.href=url}
  function victory(duel=false,variant='normal'){if(ending)return;ending=true;playerTurn=false;turnTransitionPending=false;phase='ending';const alternate=variant==='alternate';campaignVictoryType=duel?'duel':variant;window.ZhaolieLeaderboard?.finish?.({level,turns:turn,units,victoryType:campaignVictoryType});const reward=alternate?(level.alternateVictory?.goldReward??0):(level.events?.battleReward??100),alternateExp=Math.max(0,Number(level.alternateVictory?.exp)||0),alternateLines=level.events?.alternateVictory||[],occupation=alternate?(alternateLines.at(-1)||{speaker:'军报',text:'目标达成。'}):level.events?.duel?.occupation??{speaker:'军报',text:`刘备军占领${level.name.replace('之战','')}。`},boss=units.find(u=>u.id===objectiveUnitId),duelist=units.find(u=>u.id===level.events?.duel?.attackerId);gold+=reward;if(level.nextLevelId)writeCampaignTransfer(campaignVictoryType);syncUI();flash(alternate?(level.alternateVictory?.label||'目标达成'):`${boss?.name||'敌军主将'}败退`);status(occupation.text.replace(/[。．]$/,''));const duelLines=[level.events?.duel?.confirmation,occupation].filter(Boolean),rawBaseLines=alternate?alternateLines:duel?duelLines:level.events?.normalVictory??[{speaker:'刘备',text:'我军胜利了。'},occupation],baseLines=boss?.defeatQuotePlayed?rawBaseLines.filter(line=>!(line.speaker===boss.name&&line.text===boss.defeatQuote)):rawBaseLines,lines=[...baseLines,...(level.events?.postVictory||[])],rewardText=alternate&&alternateExp?`全体存活我军获得经验${alternateExp}`:reward?`战后获得金${reward}`:'无额外战利金';runDialogue(lines,()=>{scheduleAutoSave(0);phase='ended';showOutcome('胜利',`${occupation.text.replace(/[。．]$/,'')} · ${rewardText} · 当前金${gold}${duel?` · ${duelist?.name||'单挑武将'}升1级`:''}${level.nextBattle?`。下一战：${level.nextBattle}。`:''}`,level.nextLevelId?'next':level.nextBattle?'pending':'replay')})}
  function defeat(reason='刘备败退'){if(ending)return;ending=true;playerTurn=false;selected=null;phase='ended';reachable.clear();attackable=[];hideForecast();flash('战斗失败');status(reason);syncUI();draw();showOutcome('败北',`${reason}。整备部队后再度挑战。`)}
  function showOutcome(title,text,action='replay'){const button=document.getElementById('restartBtn');document.getElementById('outcomeTitle').textContent=title;document.getElementById('outcomeText').textContent=text;if(title!=='胜利')document.getElementById('battleScoreCard')?.classList.add('hidden');if(action==='next'){button.textContent=['hulao-pass','guangchuan','xindu'].includes(level.id)?'继续剧情 · 选择路线':`进入${level.nextBattle}`;outcomeAction=continueCampaign}else if(action==='pending'){button.textContent='返回开始画面';outcomeAction=returnToTitleAfterBattle}else{button.textContent='重新挑战';outcomeAction=restartBattle}document.getElementById('outcomeOverlay').classList.remove('hidden')}
  function runDialogue(lines,onDone){dialogue={lines,onDone};dialogIndex=0;showDialogLine()}
  function playDefeatQuote(unit){if(unit.defeatQuotePlayed)return Promise.resolve();const named=(unit.originalId??999)<256,text=unit.defeatQuote||(named?(unit.side==='enemy'?'胜负已分……暂且撤退！':'主公……我先退下了！'):'');if(!text)return Promise.resolve();unit.defeatQuotePlayed=true;unit.defeatQuote=text;return new Promise(resolve=>runDialogue([{speaker:unit.name,text}],resolve))}
  const dialoguePortraits={...storyPortraits,...Object.fromEntries(units.filter(u=>portraitPaths[u.id]).map(u=>[u.name,portraitPaths[u.id]]))};
  Object.values(dialoguePortraits).forEach(src=>{const portrait=new Image();portrait.src=src});
  function showDialogLine(){const line=dialogue.lines[dialogIndex],portrait=document.getElementById('dialogPortrait'),img=document.getElementById('dialogPortraitImage'),mark=document.getElementById('dialogPortraitMark'),src=dialoguePortraits[line.speaker];dialogueHistory.push({...line});document.getElementById('dialogSpeaker').textContent=line.speaker;portrait.dataset.speaker=line.speaker;if(src){img.src=src;img.alt=`${line.speaker}立绘`;img.classList.remove('hidden');mark.classList.add('hidden')}else{mark.textContent=line.speaker[0];mark.classList.remove('hidden');img.classList.add('hidden')}document.getElementById('dialogText').textContent=line.text;document.getElementById('dialogOverlay').classList.remove('hidden')}
  function nextDialog(){if(!dialogue)return;dialogIndex++;if(dialogIndex<dialogue.lines.length){showDialogLine();return}const done=dialogue.onDone;dialogue=null;document.getElementById('dialogOverlay').classList.add('hidden');if(done)done()}
  function skipDialogue(){if(!dialogue)return;dialogIndex=dialogue.lines.length-1;nextDialog()}
  function showDialogueHistory(){document.getElementById('historyList').innerHTML=dialogueHistory.map(x=>`<div class="history-line"><b>${x.speaker}</b><span>${x.text}</span></div>`).join('')||'<div class="history-line">暂无记录</div>';document.getElementById('historyOverlay').classList.remove('hidden')}
  function flash(msg){const el=document.getElementById('toast');el.textContent=msg;el.classList.add('show');clearTimeout(flash.t);flash.t=setTimeout(()=>el.classList.remove('show'),1200)}
  function status(msg){document.getElementById('statusText').textContent=msg}
  function showForecast(target){if(!selected||!target){hideForecast();return}const factor=affinity(selected.troop,target.troop),label=factor>1?'兵种优势':factor<1?'兵种劣势':'兵种相当',t=terrain[map[target.y][target.x]],base=damageOf(selected,target),low=Math.max(1,Math.round(base*.42)),high=Math.max(1,Math.round(base*1.65)),moraleLow=physicalMoraleDamage(target,low),moraleHigh=physicalMoraleDamage(target,high),routRisk=moraleHigh>=(target.morale??100),hit=Math.round(hitRate(selected,target)*100),crit=Math.round(effectiveRate(selected,'critRate')*100),block=Math.round(effectiveRate(target,'blockRate')*100),canCounter=canCounterUnit(target,selected)&&inAttackRange(target,selected),counter=canCounter?damageOf(target,selected,{counter:true}):0,counterChance=canCounter?Math.round(counterRate(target,selected)*100):0,aura=hasXuandeAura(selected)?' · 仁德光环+10%':'';document.getElementById('forecastAttacker').textContent=selected.name;document.getElementById('forecastTarget').textContent=target.name;document.getElementById('forecastDamage').textContent=`伤害 ${low}–${high} · 士气 -${moraleLow}${moraleHigh!==moraleLow?`–${moraleHigh}`:''}${routRisk?' · 可能溃退':''}`;document.getElementById('forecastDetail').textContent=`命中${hit}% · ${t.name} 防御+${t.def}% · ${label} · 会心${crit}% / 敌格挡${block}%${canCounter?` / 反击${counterChance}% 约${counter}伤害`:' / 不会反击'}${aura}`;document.getElementById('forecast').classList.remove('hidden')}
  function hideForecast(){document.getElementById('forecast').classList.add('hidden')}
  function addLog(msg,important=false){logs.push({msg,important});if(logs.length>8)logs.shift();document.getElementById('battleLog').innerHTML=[...logs].reverse().map(x=>`<div class="log-entry ${x.important?'important':''}">${x.msg}</div>`).join('')}
  function syncUI(){
    const u=selected||inspected||units.find(x=>x.side==='ally'&&x.hp>0)||units[0],aura=hasXuandeAura(u);
    const morale=Math.max(0,Math.min(100,u.morale??100)),moraleRow=document.querySelector('.morale-row');document.getElementById('unitName').textContent=u.name;document.getElementById('unitRole').textContent=`${u.role} · Lv.${u.level}${aura?' · 仁德光环':''}${u.containedUntil>=turn?' · 牵制':''}`;document.getElementById('hpText').textContent=`${u.hp} / ${u.maxHp}`;document.getElementById('hpBar').style.width=(u.hp/u.maxHp*100)+'%';document.getElementById('moraleText').textContent=`${morale} / 100`;document.getElementById('moraleBar').style.width=`${morale}%`;moraleRow.classList.toggle('low',morale<30);document.getElementById('expText').textContent=`${u.exp} / 100`;document.getElementById('expBar').style.width=`${u.exp}%`;document.getElementById('spText').textContent=`${u.strategy||0} / ${u.maxStrategy||0}`;document.getElementById('spBar').style.width=`${u.maxStrategy?Math.round((u.strategy||0)/u.maxStrategy*100):0}%`;document.getElementById('equipmentText').textContent=(u.treasureItems||[]).length?(u.treasureItems||[]).map(treasureLabel).join(' · '):'无宝物';document.getElementById('fundsText').textContent=`金 ${gold} · 携带 ${carriedCount(u)}/8 · 豆 ${inventoryCount(u,'bean')} · 麦 ${inventoryCount(u,'wheat')} · 酒 ${inventoryCount(u,'wine')} · 焦热书 ${inventoryCount(u,'fireScroll')}`;document.getElementById('atkStat').textContent=effectiveStat(u,'atk');document.getElementById('defStat').textContent=effectiveStat(u,'def');document.getElementById('movStat').textContent=effectiveStat(u,'move');document.getElementById('classStat').textContent=u.className;document.getElementById('critStat').textContent=`${Math.round(effectiveRate(u,'critRate')*100)}%`;document.getElementById('blockStat').textContent=`${Math.round(effectiveRate(u,'blockRate')*100)}%`;['atkStat','defStat','movStat','critStat','blockStat'].forEach(id=>document.getElementById(id).classList.toggle('buffed',aura));const portraitImage=document.getElementById('portraitImage');portraitImage.src=portraitPaths[u.id]||assetPaths[u.id]||assetPaths[genericVisualKeyFor(u)];portraitImage.style.filter='';
    const duelHint=level.id==='hulao-pass'&&u.id===level.events?.duel?.attackerId,strategyInspect=!!inspected,bandInspect=u.troop==='support',originalLearned=BattleRules.learnedStrategies({troop:u.troop,level:u.level,override:level.strategyAccess?.[u.id]}),passive=document.getElementById('passiveSkill'),passiveName=document.getElementById('passiveSkillName'),passiveText=document.getElementById('passiveSkillText');passive.classList.toggle('hidden',u.id!=='liu'&&!aura&&!duelHint&&!strategyInspect&&!bandInspect);passive.classList.toggle('aura-active',aura);if(u.id==='liu'){passiveName.textContent='被动 · 仁德号令';passiveText.textContent='相邻友方单位攻击、防御、移动、会心与格挡提高10%（敌军无效）'}else if(aura){passiveName.textContent='增益 · 仁德光环 +10%';passiveText.textContent='与刘备相邻：当前全部战斗属性提高10%'}else if(duelHint){passiveName.textContent='事件 · 三英战吕布';passiveText.textContent='张飞与吕布相邻时攻击或待机触发；关羽、刘备随后加入，合力逼退吕布，张飞升1级'}else if(bandInspect){const amount=BattleRules.militaryBandStrategyRecovery(u.level);passiveName.textContent='兵种特性 · 军乐';passiveText.textContent=`相邻部队在各自阶段开始时恢复${amount}点策略值；多支军乐队效果叠加。自身攻击力很低，但按原作仍可普通攻击。`}else if(strategyInspect){passiveName.textContent=originalLearned.length?`原作策略 · ${originalLearned.map(id=>originalStrategyNames[id]||id).join('、')}`:'原作策略 · 未习得';passiveText.textContent=originalLearned.length?'AI只会使用当前兵种和等级已经习得的原作策略；能够普通攻击时优先攻击。':`${u.className} Lv.${u.level} 尚未达到本兵种首个策略等级，AI不会施展策略。`}
    if(u.confused)document.getElementById('unitRole').textContent+=' · 混乱';
    const canAct=!!selected&&!selected.acted&&!selected.confused&&playerTurn&&!turnTransitionPending,hasTarget=selected&&attackTiles(selected).some(q=>{const x=unitAt(q.x,q.y);return x&&x.side==='enemy'}),learned=selected?learnedStrategyIds(selected):[],waitBtn=document.getElementById('waitBtn'),waitReminder=canAct&&phase==='attack';waitBtn.disabled=!canAct;waitBtn.classList.toggle('wait-reminder',waitReminder);waitBtn.title=waitReminder?'行动尚未结束：攻击、使用策略或点击待机':'待机并结束当前武将行动';waitBtn.setAttribute('aria-label',waitReminder?'行动尚未结束，点击待机':'待机');document.getElementById('itemBtn').disabled=!canAct;document.getElementById('strategyBtn').disabled=!canAct||!learned.length;document.getElementById('strategyBtn').title=learned.length?`已习得：${learned.map(id=>strategies[id].name).join('、')}`:'当前兵种与等级尚未习得策略';document.getElementById('attackBtn').disabled=!canAct||!hasTarget;document.getElementById('undoBtn').disabled=!canAct;document.getElementById('endTurnBtn').disabled=!playerTurn||phase==='animating'||turnTransitionPending;document.getElementById('dangerBtn').classList.toggle('active',dangerVisible);document.getElementById('dangerBtn').innerHTML=`<span>危</span>${dangerVisible?'隐藏':'显示'}敌军危险区`;document.querySelectorAll('#strategyMenu [data-strategy]').forEach(btn=>{const available=selected&&learned.includes(btn.dataset.strategy);btn.classList.toggle('hidden',!available);btn.disabled=!available||(selected.strategy||0)<strategies[btn.dataset.strategy].cost});
    const allies=units.filter(x=>x.side==='ally'),guests=units.filter(x=>x.side==='guest');document.getElementById('unitCount').textContent=`我军 ${allies.filter(x=>x.hp>0).length}/${allies.length} · 盟军 ${guests.filter(x=>x.hp>0).length}/${guests.length}`;
    const card=x=>`<div class="roster-item ${x.side==='guest'?'guest':''} ${selected===x||inspected===x?'active':''} ${x.acted?'done':''} ${(x.morale??100)<30?'low-morale':''}" data-id="${x.id}"><span class="mark"></span><span class="avatar ${!portraitPaths[x.id]&&usesGenericFriendlyArt(x)?'ally-generic':''}" style="background-image:url('${portraitPaths[x.id]||assetPaths[x.id]||assetPaths[genericVisualKeyFor(x)]}')"></span><span class="name"><b>${x.name}</b><small>Lv.${x.level} ${x.className} · EXP ${x.exp}</small></span><span class="hp">${x.hp}/${x.maxHp}<small>士气 ${x.morale??100}</small></span></div>`;
    document.getElementById('roster').innerHTML=allies.map(card).join('')+`<div class="roster-divider">盟军 · 自动行动</div>`+guests.map(card).join('');document.querySelectorAll('.roster-item').forEach(el=>el.onclick=()=>selectUnit(units.find(x=>x.id===el.dataset.id)));syncItems()
  }
  function drawMini(){const w=mini.width,h=mini.height,cw=w/COLS,ch=h/ROWS;mctx.clearRect(0,0,w,h);for(let y=0;y<ROWS;y++)for(let x=0;x<COLS;x++){const t=map[y][x];mctx.fillStyle=t==='water'?'#2f7890':t==='forest'?'#244e35':t==='fort'?'#9b784c':t==='hill'||t==='cliff'?'#3f4841':t==='wall'?'#74746f':t==='bridge'?'#b08a52':t==='rough'?'#8b7651':t==='village'?'#d3b45b':t.startsWith('treasure')?'#e0a84b':t.startsWith('supply')?'#74b6ad':t==='grass'?'#70964c':'#55763f';mctx.fillRect(x*cw,y*ch,cw+.5,ch+.5)}for(const u of units.filter(x=>x.side!=='reserve'&&x.hp>0)){mctx.fillStyle=u.side==='enemy'?'#e55347':u.side==='guest'?'#86d8ee':'#44d2d0';mctx.fillRect(u.x*cw+1,u.y*ch+1,Math.max(3,cw-2),Math.max(3,ch-2))}}
  function handleTileAction(q){if(dialogue||!playerTurn||phase==='ended'||!q)return;keyboardCursor={x:q.x,y:q.y};updateTerrainInfo(q);const u=unitAt(q.x,q.y);if(phase==='select'){if(u)selectUnit(u)}else if(phase==='move'){if(u===selected)beginAttack();else if(u&&u.side==='ally')selectUnit(u);else moveSelected(q.x,q.y)}else if(phase==='attack'){if(u&&u.side==='enemy'&&attackable.some(a=>a.x===q.x&&a.y===q.y))attack(selected,u);else if(!u)status('请选择红色范围内的敌军，或点击待机')}else if(phase==='strategy'){if(u&&attackable.some(a=>a.x===q.x&&a.y===q.y))useStrategy(u);else status('请选择高亮范围内的策略目标')}else if(phase==='item'){if(u&&attackable.some(a=>a.x===q.x&&a.y===q.y))useItem(u);else status('请选择高亮范围内的道具目标')}}
  function toggleDanger(){dangerVisible=!dangerVisible;if(dangerVisible)rebuildDangerTiles();syncUI();draw()}
  canvas.addEventListener('mousemove',e=>{const r=canvas.getBoundingClientRect();if(drag&&lastMouse){panX+=e.clientX-lastMouse.x;panY+=e.clientY-lastMouse.y;lastMouse={x:e.clientX,y:e.clientY};draw();return}hover=screenToTile(e.clientX-r.left,e.clientY-r.top);hoverPath=[];if(hover){updateTerrainInfo(hover);const u=unitAt(hover.x,hover.y);if(phase==='attack'&&u&&u.side==='enemy'&&attackable.some(a=>a.x===hover.x&&a.y===hover.y))showForecast(u);else hideForecast()}else hideForecast();draw()});canvas.addEventListener('mouseleave',()=>{hoverPath=[];hideForecast()});canvas.addEventListener('mousedown',e=>{if(e.button===1){drag=true;lastMouse={x:e.clientX,y:e.clientY};e.preventDefault()}});window.addEventListener('mouseup',()=>{drag=false;lastMouse=null});canvas.addEventListener('wheel',e=>{e.preventDefault();battleOverview=false;document.getElementById('touchOverview').setAttribute('aria-pressed','false');if(e.ctrlKey){zoom=Math.max(MIN_ZOOM,Math.min(MAX_ZOOM,zoom-e.deltaY*.004))}else if(Math.abs(e.deltaX)>0||Math.abs(e.deltaY)<60){panX-=e.deltaX;panY-=e.deltaY}else{zoom=Math.max(MIN_ZOOM,Math.min(MAX_ZOOM,zoom+(e.deltaY<0?.1:-.1)))}draw()},{passive:false});
  function touchPair(){const p=[...touchPoints.values()];if(p.length<2)return null;return{cx:(p[0].x+p[1].x)/2,cy:(p[0].y+p[1].y)/2,d:Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y)}}
  canvas.addEventListener('pointerdown',e=>{if(e.pointerType==='mouse')return;e.preventDefault();e.stopPropagation?.();if(!touchPoints.size){updateBgRect();panX=bgRect.x-(wrap.clientWidth*.62-(.09+(battleFocus?.x??13)*.0535)*bgRect.w);panY=bgRect.y-(wrap.clientHeight*.63-(.105+(battleFocus?.y??19)*.0335)*bgRect.h);if(!squareBattlefield){panX=bgRect.x-(wrap.clientWidth-bgRect.w)/2;panY=bgRect.y-(wrap.clientHeight-bgRect.h)/2}}try{canvas.setPointerCapture?.(e.pointerId)}catch{}touchPoints.set(e.pointerId,{x:e.clientX,y:e.clientY});if(touchPoints.size===1){touchGesture={startX:e.clientX,startY:e.clientY,basePanX:panX,basePanY:panY,moved:false,multi:false}}else{const p=touchPair();touchGesture={...touchGesture,multi:true,moved:true,pinchDistance:Math.max(1,p.d),pinchZoom:zoom,pinchCenterX:p.cx,pinchCenterY:p.cy,pinchPanX:panX,pinchPanY:panY}}},{passive:false});
  canvas.addEventListener('pointermove',e=>{if(e.pointerType==='mouse'||!touchPoints.has(e.pointerId))return;e.preventDefault();e.stopPropagation?.();touchPoints.set(e.pointerId,{x:e.clientX,y:e.clientY});if(touchPoints.size>=2){battleOverview=false;document.getElementById('touchOverview').setAttribute('aria-pressed','false');const p=touchPair();if(!touchGesture.pinchDistance){touchGesture.pinchDistance=Math.max(1,p.d);touchGesture.pinchZoom=zoom;touchGesture.pinchCenterX=p.cx;touchGesture.pinchCenterY=p.cy;touchGesture.pinchPanX=panX;touchGesture.pinchPanY=panY}zoom=Math.max(MIN_ZOOM,Math.min(MAX_ZOOM,touchGesture.pinchZoom*p.d/touchGesture.pinchDistance));panX=touchGesture.pinchPanX+p.cx-touchGesture.pinchCenterX;panY=touchGesture.pinchPanY+p.cy-touchGesture.pinchCenterY;draw();return}if(!touchGesture)return;const dx=e.clientX-touchGesture.startX,dy=e.clientY-touchGesture.startY;if(Math.hypot(dx,dy)>9)touchGesture.moved=true;if(touchGesture.moved){panX=touchGesture.basePanX+dx;panY=touchGesture.basePanY+dy;draw()}},{passive:false});
  function finishTouch(e){if(e.pointerType==='mouse'||!touchPoints.has(e.pointerId))return;e.preventDefault();e.stopPropagation?.();const wasLast=touchPoints.size===1,gesture=touchGesture;touchPoints.delete(e.pointerId);ignoreClickUntil=Date.now()+700;if(e.type!=='pointercancel'&&wasLast&&gesture&&!gesture.moved&&!gesture.multi){const r=canvas.getBoundingClientRect();handleBattleTap(e.clientX-r.left,e.clientY-r.top)}if(touchPoints.size===1){const p=[...touchPoints.values()][0];touchGesture={startX:p.x,startY:p.y,basePanX:panX,basePanY:panY,moved:true,multi:true}}else if(!touchPoints.size)touchGesture=null}
  canvas.addEventListener('pointerup',finishTouch,{passive:false});canvas.addEventListener('pointercancel',finishTouch,{passive:false});canvas.addEventListener('click',e=>{if(Date.now()<ignoreClickUntil)return;const r=canvas.getBoundingClientRect();handleBattleTap(e.clientX-r.left,e.clientY-r.top)});canvas.addEventListener('contextmenu',e=>{e.preventDefault();cancelAction()});
  document.getElementById('waitBtn').onclick=waitSelected;document.getElementById('itemBtn').onclick=toggleItemMenu;document.getElementById('strategyBtn').onclick=toggleStrategyMenu;document.getElementById('dangerBtn').onclick=toggleDanger;document.querySelectorAll('#strategyMenu [data-strategy]').forEach(btn=>btn.onclick=()=>beginStrategy(btn.dataset.strategy));document.querySelectorAll('#itemMenu [data-item]').forEach(btn=>btn.onclick=()=>beginItemUse(btn.dataset.item));document.querySelectorAll('[data-shop-item]').forEach(row=>{row.querySelector('button').onclick=()=>purchaseShopItem(row);row.querySelector('select').onchange=syncShop});document.getElementById('transferFrom').onchange=syncTransfer;document.getElementById('transferItem').onchange=syncTransfer;document.getElementById('transferTo').onchange=syncTransfer;document.getElementById('transferBtn').onclick=transferInventoryItem;document.getElementById('shopResetBtn').onclick=resetShop;
  document.getElementById('shopStartBtn').onclick=commenceBattle;
  document.getElementById('undoBtn').onclick=cancelAction;document.getElementById('attackBtn').onclick=beginAttack;document.getElementById('endTurnBtn').onclick=endPlayerTurn;document.getElementById('dialogOverlay').onclick=nextDialog;document.getElementById('restartBtn').onclick=()=>outcomeAction();
  document.getElementById('newGameBtn').onclick=startNewGame;document.getElementById('continueGameBtn').onclick=()=>{requestGameFullscreen();const entry=latestSaveEntry();if(entry)openStoredSnapshot(entry.save,entry.token)};document.getElementById('titleLoadBtn').onclick=()=>openGameMenu('load','title');document.getElementById('titleLevelSelectBtn').onclick=()=>document.getElementById('levelSelectOverlay').classList.remove('hidden');document.getElementById('levelSelectCloseBtn').onclick=()=>document.getElementById('levelSelectOverlay').classList.add('hidden');document.querySelectorAll('[data-select-level]').forEach(button=>button.onclick=()=>{const params=new URLSearchParams();params.set('level',button.dataset.selectLevel);params.set('storySelect','1');params.set('levelSelect','1');location.href=`${location.pathname}?${params}`});
  document.getElementById('titleIntroVideo').onended=finishTitleIntro;document.getElementById('titleIntroVideo').onerror=finishTitleIntro;document.getElementById('titleIntro').onclick=finishTitleIntro;document.getElementById('titleIntroSkipBtn').onclick=e=>{e.stopPropagation();finishTitleIntro()};
  document.getElementById('titleExportSaveBtn').onclick=exportPortableSave;document.getElementById('titleImportSaveBtn').onclick=choosePortableSaveFile;document.getElementById('titleUndoImportBtn').onclick=undoPortableImport;document.getElementById('menuExportSaveBtn').onclick=exportPortableSave;document.getElementById('menuImportSaveBtn').onclick=choosePortableSaveFile;document.getElementById('saveImportInput').onchange=e=>importPortableSaveFile(e.target.files?.[0]);
  document.getElementById('openingVideo').onended=finishOpeningMovie;document.getElementById('openingVideo').onerror=finishOpeningMovie;document.getElementById('openingOverlay').onclick=finishOpeningMovie;document.getElementById('openingSkipBtn').onclick=e=>{e.stopPropagation();finishOpeningMovie()};
  document.getElementById('storyOverlay').onclick=e=>{if(e.target.closest('.story-controls,.story-route-choices,.story-actor'))return;if(storyInteraction){nextStoryLine();return}if(storyFreeRoam){if(e.target.closest('.story-dialogue')||storyAdvanceLocked)return;const stage=document.getElementById('storyCast'),rect=stage.getBoundingClientRect();if(e.clientX>=rect.left&&e.clientX<=rect.right&&e.clientY>=rect.top&&e.clientY<=rect.bottom){const x=Math.round((e.clientX-rect.left)/rect.width*32),y=Math.round((e.clientY-rect.top)/rect.height*20);walkFreeRoamLiuTo(x,y)}return}nextStoryLine()};document.getElementById('storyAutoBtn').onclick=e=>{e.stopPropagation();if(storyFreeRoam||storyRouteChoicePending)return;storyAuto=!storyAuto;e.currentTarget.classList.toggle('active',storyAuto);clearTimeout(storyTimer);if(storyAuto&&!storyAdvanceLocked){const line=preBattleStory[storyIndex];storyTimer=setTimeout(nextStoryLine,Math.max(2300,900+line.text.length*72))}};document.getElementById('storySkipBtn').onclick=e=>{e.stopPropagation();finishPreBattleStory()};document.querySelectorAll('[data-story-route]').forEach(button=>button.onclick=e=>{e.stopPropagation();chooseStoryRoute(button.dataset.storyRoute)});
  document.getElementById('storySaveBtn').onclick=e=>{e.stopPropagation();openGameMenu('save','story')};
  document.getElementById('menuBtn').onclick=()=>openGameMenu('save','game');document.getElementById('gameMenuCloseBtn').onclick=closeGameMenu;document.getElementById('resumeGameBtn').onclick=closeGameMenu;document.getElementById('battlePrepBtn').onclick=openBattlePrep;document.getElementById('returnTitleBtn').onclick=showTitle;document.getElementById('saveTabBtn').onclick=()=>openGameMenu('save',saveMenuOrigin);document.getElementById('loadTabBtn').onclick=()=>openGameMenu('load',saveMenuOrigin);
  document.getElementById('titleSettingsBtn').onclick=()=>{const panel=document.getElementById('settingsPanel');panel.classList.add('title-open');panel.classList.remove('hidden')};
  const touchControls=document.getElementById('touchControls'),touchToolsToggle=document.getElementById('touchToolsToggle');
  function setTouchToolsOpen(open){touchControls.classList.toggle('collapsed',!open);touchToolsToggle.setAttribute('aria-expanded',String(open));touchToolsToggle.setAttribute('aria-label',open?'收起视角工具':'展开视角工具');touchToolsToggle.textContent=open?'收起':'视角'}
  setTouchToolsOpen(false);touchToolsToggle.onclick=e=>{e.stopPropagation();setTouchToolsOpen(touchControls.classList.contains('collapsed'))};document.addEventListener('pointerdown',e=>{if(!touchControls.classList.contains('collapsed')&&!touchControls.contains(e.target))setTouchToolsOpen(false)},true);
  wrap.addEventListener('touchmove',e=>{if(e.target===canvas)e.preventDefault()},{passive:false});wrap.addEventListener('gesturestart',e=>e.preventDefault(),{passive:false});wrap.addEventListener('gesturechange',e=>e.preventDefault(),{passive:false});wrap.addEventListener('dragstart',e=>e.preventDefault());
  document.getElementById('touchZoomIn').onclick=()=>{battleOverview=false;document.getElementById('touchOverview').setAttribute('aria-pressed','false');zoom=Math.min(MAX_ZOOM,zoom+.2);draw();flash(`战场缩放 ${Math.round(zoom*100)}%`)};document.getElementById('touchZoomOut').onclick=()=>{battleOverview=false;document.getElementById('touchOverview').setAttribute('aria-pressed','false');zoom=Math.max(MIN_ZOOM,zoom-.2);draw();flash(`战场缩放 ${Math.round(zoom*100)}%`)};document.getElementById('touchCenter').onclick=()=>{resetBattleCamera(selected||units.find(u=>u.id==='liu'&&u.hp>0));flash('已回到我军位置')};document.getElementById('touchCancel').onclick=cancelAction;document.getElementById('touchOverview').onclick=toggleBattleOverview;document.getElementById('touchOverview').classList.toggle('hidden',!squareBattlefield);wrap.classList.toggle('square-battlefield',squareBattlefield);
  document.addEventListener('keydown',e=>{if(titleIntroActive){e.preventDefault();finishTitleIntro();return}if(openingActive){e.preventDefault();finishOpeningMovie();return}if(storyActive){if(!document.getElementById('gameMenuOverlay').classList.contains('hidden')){if(e.key==='Escape')closeGameMenu();return}handleStoryKey(e);return}if(e.target.matches('input,select,textarea'))return;if(dialogue){e.preventDefault();nextDialog();return}if(!document.getElementById('gameMenuOverlay').classList.contains('hidden')){if(e.key==='Escape')closeGameMenu();return}if(!document.getElementById('titleScreen').classList.contains('hidden')||!document.getElementById('shopOverlay').classList.contains('hidden')||phase==='animating')return;const dirs={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]};if(dirs[e.key]){e.preventDefault();const start=keyboardCursor||{x:units.find(u=>u.id==='liu').x,y:units.find(u=>u.id==='liu').y},[dx,dy]=dirs[e.key];keyboardCursor={x:Math.max(0,Math.min(COLS-1,start.x+dx)),y:Math.max(0,Math.min(ROWS-1,start.y+dy))};hover=keyboardCursor;hoverPath=[];updateTerrainInfo(hover);draw();return}if(e.key==='Enter'){handleTileAction(keyboardCursor);return}if(e.key==='Escape'){cancelAction();return}if(e.key.toLowerCase()==='a')beginAttack();else if(e.key.toLowerCase()==='s')toggleStrategyMenu();else if(e.key.toLowerCase()==='w')waitSelected();else if(e.key.toLowerCase()==='d')toggleDanger();else if(e.key.toLowerCase()==='m')openGameMenu('save','game');else if(e.code==='Space'){e.preventDefault();endPlayerTurn()}});
  document.getElementById('musicBtn').onclick=()=>setMusicEnabled(!musicEnabled);
  document.getElementById('musicVolume').oninput=e=>{musicVolume=Number(e.target.value)/100;clearTimeout(musicDuckTimer);applyMusicMix()};
  document.getElementById('settingsBtn').onclick=()=>document.getElementById('settingsPanel').classList.toggle('hidden');
  document.getElementById('settingsCloseBtn').onclick=()=>{document.getElementById('settingsPanel').classList.add('hidden');document.getElementById('settingsPanel').classList.remove('title-open')};
  document.getElementById('animationSpeed').onchange=e=>{animationSpeed=Number(e.target.value);flash(`动画速度 ${animationSpeed}×`)};
  document.getElementById('compactAnimations').onchange=e=>{compactRepeatedAnimations=e.target.checked;flash(compactRepeatedAnimations?'重复战斗动画自动加速':'重复战斗动画保持完整')};
  document.getElementById('sfxVolume').oninput=e=>{sfxVolume=Number(e.target.value)/100;applySfxMix()};
  document.getElementById('uiScale').onchange=e=>{document.body.classList.remove('ui-90','ui-110');if(e.target.value==='0.9')document.body.classList.add('ui-90');if(e.target.value==='1.1')document.body.classList.add('ui-110');resize()};
  function fullscreenElement(){return document.fullscreenElement||document.webkitFullscreenElement||null}
  async function requestGameFullscreen(notify=false){if(fullscreenElement())return true;const root=document.documentElement,request=root.requestFullscreen||root.webkitRequestFullscreen||root.msRequestFullscreen;if(!request){if(notify)flash('当前浏览器不支持网页全屏');return false}try{await request.call(root);if(matchMedia('(pointer:coarse)').matches&&screen.orientation?.lock)try{await screen.orientation.lock('landscape')}catch{}resize();return true}catch{if(notify)flash('请在浏览器菜单中允许全屏');return false}}
  async function toggleGameFullscreen(){if(!fullscreenElement()){await requestGameFullscreen(true);return}const exit=document.exitFullscreen||document.webkitExitFullscreen||document.msExitFullscreen;try{if(exit)await exit.call(document)}catch{flash('当前浏览器无法退出全屏')}}
  document.getElementById('fullscreenBtn').onclick=toggleGameFullscreen;
  const syncFullscreen=()=>{document.getElementById('fullscreenBtn').textContent=fullscreenElement()?'退出全屏':'切换全屏';resize()};document.addEventListener('fullscreenchange',syncFullscreen);document.addEventListener('webkitfullscreenchange',syncFullscreen);
  const orientationPrompt=document.getElementById('orientationPrompt'),orientationText=document.getElementById('orientationText');let portraitAllowed=false;
  function syncOrientationPrompt(){const portrait=window.matchMedia('(max-width:900px) and (orientation:portrait)').matches;orientationPrompt.classList.toggle('dismissed',!portrait||portraitAllowed)}
  document.getElementById('landscapeBtn').onclick=async()=>{orientationText.textContent='正在切换横屏…';await requestGameFullscreen();if(screen.orientation?.lock)try{await screen.orientation.lock('landscape')}catch{}setTimeout(()=>{if(innerWidth>=innerHeight){syncOrientationPrompt();resize()}else orientationText.textContent='当前浏览器不能自动旋转，请把手机或平板横过来。'},350)};
  document.getElementById('portraitContinueBtn').onclick=()=>{portraitAllowed=true;syncOrientationPrompt()};window.addEventListener('orientationchange',()=>{if(innerWidth>=innerHeight)orientationText.textContent='横屏可以同时看到完整战场与全部指令。';syncOrientationPrompt();resize()});syncOrientationPrompt();
  const unlockMusic=e=>{if(e.target.closest?.('.music-control'))return;startActiveMusic();if(!titleMusic.paused||musicStarted){document.removeEventListener('pointerdown',unlockMusic,true);document.removeEventListener('touchstart',unlockMusic,true);document.removeEventListener('keydown',unlockMusic,true)}};
  document.addEventListener('pointerdown',unlockMusic,true);document.addEventListener('touchstart',unlockMusic,{capture:true,passive:true});document.addEventListener('keydown',unlockMusic,true);
  [...Object.values(art),...Object.values(friendlyArt),...Object.values(attackArt),...Object.values(friendlyAttackArt),...Object.values(walkArt),...Object.values(friendlyWalkArt),...Object.values(deathArt),...Object.values(friendlyDeathArt),...Object.values(hurtArt),...Object.values(friendlyHurtArt),woundedArt,friendlyWoundedArt,...Object.values(terrainArt)].forEach(img=>img.addEventListener('load',draw));
  let lastEnvironmentFrame=0;function animateEnvironment(now){if(now-lastEnvironmentFrame>42&&!combatFx){lastEnvironmentFrame=now;draw(false)}requestAnimationFrame(animateEnvironment)}
  window.addEventListener('resize',resize);resize();syncUI();syncShop();updateMusicUI();refreshContinueButton();addLog(`胜利条件：${level.objective}`,true);addLog(`败北条件：${level.defeat}`);requestAnimationFrame(animateEnvironment);status('请先完成战前军需整备');
  // Query-only preview for visual regression checks; it never runs in normal play.
  const previewParams=bootParams;
  if([...previewParams.keys()].length)document.getElementById('titleScreen').classList.add('hidden');
  if(previewParams.has('loadSlot'))setTimeout(()=>{const token=previewParams.get('loadSlot'),store=readSaveStore(),save=token==='auto'?store.auto:store.manual[Number(token)];if(validSnapshot(save)){requestGameFullscreen();loadSnapshot(save)}else showTitle()},180);
  else if(previewParams.has('routeChoice')||previewParams.has('secondRouteChoice'))setTimeout(()=>{resetBattleState();hideTitle(false);if(preBattleStory.length)playPreBattleStory(openBattlePrep);else openBattlePrep()},180);
  else if(previewParams.has('routeResume'))setTimeout(()=>{resetBattleState();hideTitle(false);const routeStart=['julu','qinghe'].includes(level.id)?5:14;if(preBattleStory.length)playPreBattleStory(openBattlePrep,Math.min(routeStart,preBattleStory.length-1));else openBattlePrep()},180);
  else if(previewParams.has('storySelect'))setTimeout(()=>{resetBattleState();hideTitle(false);if(level.id==='sishui-pass'){clearCampaignTransfer();playOpeningMovie(()=>playPreBattleStory(openBattlePrep))}else if(preBattleStory.length)playPreBattleStory(openBattlePrep);else openBattlePrep()},180);
  else if(previewParams.has('battleSelect'))setTimeout(()=>{resetBattleState();hideTitle(false);openBattlePrep()},180);
  else if(previewParams.get('level')==='2'&&previewParams.has('duelEventPreview'))setTimeout(()=>{resetBattleState();hideTitle(false);animationSpeed=4;document.getElementById('shopOverlay').classList.add('hidden');startDuel()},320);
  else if(previewParams.has('duelPreview'))setTimeout(()=>{resetBattleState();hideTitle(false);animationSpeed=.65;document.getElementById('shopOverlay').classList.add('hidden');const script=level.events.duel;playDuelCinematic(units.find(u=>u.id===script.attackerId),units.find(u=>u.id===script.defenderId))},320);
  else if(previewParams.get('level')==='2'&&previewParams.has('turnEventPreview'))setTimeout(()=>{resetBattleState();hideTitle(false);document.getElementById('shopOverlay').classList.add('hidden');battleStarted=true;turn=Number(previewParams.get('turnEventPreview'))||18;document.getElementById('turnNumber').textContent=turn;triggerTimedEvents();draw()},320);
  else if(previewParams.has('victoryPreview'))setTimeout(()=>{resetBattleState();hideTitle(false);document.getElementById('shopOverlay').classList.add('hidden');battleStarted=true;victory(previewParams.get('victoryPreview')==='duel')},260);
  else if(previewParams.has('areaEventPreview')&&level.areaEvents?.length)setTimeout(()=>{resetBattleState();hideTitle(false);document.getElementById('shopOverlay').classList.add('hidden');battleStarted=true;const event=level.areaEvents[0],u=units.find(q=>q.id===(event.unitId||'liu'));u.x=event.rect.x1;u.y=event.rect.y1;triggerAreaEvents(u);draw()},260);
  else if(previewParams.has('alternateVictoryPreview')&&level.alternateVictory)setTimeout(()=>{resetBattleState();hideTitle(false);document.getElementById('shopOverlay').classList.add('hidden');battleStarted=true;const u=units.find(q=>q.id===level.alternateVictory.unitId),target=level.alternateVictory;u.x=Math.min(COLS-1,target.x+1);u.y=target.y;selected=u;phase='move';reachable=calcReach(u);moveSelected(target.x,target.y)},260);
  else if(previewParams.get('level')==='2'&&![...previewParams.keys()].some(key=>key!=='level'))setTimeout(()=>{resetBattleState();hideTitle(false);if(preBattleStory.length)playPreBattleStory(openBattlePrep);else openBattlePrep()},180);
  else if(previewParams.has('storyPreview'))setTimeout(()=>{resetBattleState();hideTitle(false);const target=Math.max(1,Math.min(preBattleStory.length,Number(previewParams.get('storyPreview'))||1));playPreBattleStory(openBattlePrep);storyIndex=target-1;showStoryLine()},150);
  else if(previewParams.has('longBattleAudit'))setTimeout(()=>{animationSpeed=20;compactRepeatedAnimations=true;battleStarted=true;document.getElementById('shopOverlay').classList.add('hidden');phase='select';playerTurn=true;syncUI();status('长局回归验证：可连续结束回合');draw()},200);
  else if(previewParams.has('defeatQuotePreview'))setTimeout(()=>{resetBattleState();hideTitle(false);document.getElementById('shopOverlay').classList.add('hidden');battleStarted=true;const id=previewParams.get('defeatQuotePreview')||objectiveUnitId,u=units.find(q=>q.id===id)||units.find(q=>(q.originalId??999)<256);u.hp=0;playDefeatQuote(u).then(()=>{if(u.id===objectiveUnitId)victory()})},300);
  else if(previewParams.has('defeatPreview'))setTimeout(()=>{document.getElementById('shopOverlay').classList.add('hidden');defeat('刘备撤退')},300);
  else if(previewParams.has('forecastPreview'))setTimeout(()=>{const liu=units.find(u=>u.id==='liu'),target=units.find(u=>u.id==='e1');document.getElementById('shopOverlay').classList.add('hidden');liu.x=12;liu.y=8;if(previewParams.get('forecastPreview')==='rout')target.morale=5;selected=liu;phase='attack';attackable=attackTiles(liu);syncUI();showForecast(target);draw()},300);
  else if(previewParams.has('aiStrategyPreview'))setTimeout(()=>{const mode=previewParams.get('aiStrategyPreview'),li=units.find(u=>u.id==='li'),hu=units.find(u=>u.id==='hu'),liu=units.find(u=>u.id==='liu');document.getElementById('shopOverlay').classList.add('hidden');liu.x=20;liu.y=9;if(mode==='recover'){li.x=17;li.y=9;li.hp=180}else if(mode==='contain'){li.strategy=0;hu.x=17;hu.y=9}else{li.x=17;li.y=9}playerTurn=false;phase='enemy';document.getElementById('sideLabel').textContent='敌军阶段';enemyPhase()},300);
  else if(previewParams.has('duelContactPreview'))setTimeout(()=>{const g=units.find(u=>u.id==='guan'),h=units.find(u=>u.id==='hua');g.x=h.x+1;g.y=h.y;selected=g;phase='attack';document.getElementById('shopOverlay').classList.add('hidden');attack(g,h)},300);
  else if(previewParams.has('duelEventPreview'))setTimeout(()=>{animationSpeed=4;document.getElementById('shopOverlay').classList.add('hidden');startDuel()},500);
  else if(previewParams.has('duelPreview'))setTimeout(()=>{animationSpeed=.65;document.getElementById('shopOverlay').classList.add('hidden');playDuelCinematic(units.find(u=>u.id==='guan'),units.find(u=>u.id==='hua')).then(()=>document.getElementById('shopOverlay').classList.remove('hidden'))},500);
  else if(previewParams.has('woundedPreview'))setTimeout(()=>{resetBattleState();hideTitle(false);document.getElementById('shopOverlay').classList.add('hidden');battleStarted=true;const sample=units.slice(0,Math.min(units.length,10)),startX=Math.max(2,Math.floor(COLS/2)-2),startY=Math.max(2,Math.floor(ROWS/2)-2);sample.forEach((u,i)=>{u.x=Math.min(COLS-2,startX+i%5);u.y=Math.min(ROWS-2,startY+Math.floor(i/5)*2);u.hp=Math.max(1,Math.floor(u.maxHp*.25));u.facing=i%2?1:-1});phase='select';status('濒死姿态预览 · 兵力低于30%');syncUI();draw()},320);
  else if(previewParams.has('mountedDeathPreview'))setTimeout(()=>{const id=previewParams.get('mountedDeathPreview')||'guan',target=units.find(q=>q.id===id)||units.find(q=>q.id==='guan'),attacker=units.find(q=>q.side!==target.side&&q.side!=='guest')||units.find(q=>q.side!==target.side);target.x=Math.min(COLS-3,Math.max(2,Math.floor(COLS*.55)));target.y=Math.min(ROWS-3,Math.max(2,Math.floor(ROWS*.55)));target.hp=60;attacker.x=target.x-1;attacker.y=target.y;animationSpeed=.65;battleStarted=true;document.getElementById('shopOverlay').classList.add('hidden');playCombatAnimation(attacker,target,60,()=>{target.hp=0},{critical:false,blocked:false,missed:false})},450);
  else if(previewParams.has('criticalQuotePreview'))setTimeout(()=>{const id=previewParams.get('criticalQuotePreview')||'guan',u=units.find(q=>q.id===id)||units.find(q=>q.id==='guan'),target=units.find(q=>q.side==='enemy')||units.find(q=>q!==u);u.x=Math.min(COLS-3,Math.max(2,Math.floor(COLS*.55)));u.y=Math.min(ROWS-3,Math.max(2,Math.floor(ROWS*.55)));target.x=u.x+1;target.y=u.y;target.hp=target.maxHp;animationSpeed=.65;battleStarted=true;phase='animating';document.getElementById('shopOverlay').classList.add('hidden');const outcome={critical:true,blocked:false,missed:false};playCriticalQuote(u,outcome).then(()=>playCombatAnimation(u,target,60,()=>{target.hp=Math.max(0,target.hp-60)},outcome))},450);
  else if(previewParams.has('directionalAttackPreview'))setTimeout(()=>{const id=previewParams.get('directionalAttackPreview')||'liu',u=units.find(q=>q.id===id)||units.find(q=>q.id==='liu'),target=units.find(q=>q.side!==u.side&&!(u.side==='ally'&&q.side==='guest'))||units.find(q=>q!==u),direction=previewParams.get('attackDirection')||'north',delta={east:[1,0],west:[-1,0],south:[0,1],north:[0,-1]}[direction]||[0,-1];u.x=Math.min(COLS-3,Math.max(2,Math.floor(COLS*.55)));u.y=Math.min(ROWS-3,Math.max(2,Math.floor(ROWS*.55)));target.x=u.x+delta[0];target.y=u.y+delta[1];target.hp=target.maxHp;animationSpeed=.65;battleStarted=true;document.getElementById('shopOverlay').classList.add('hidden');playCombatAnimation(u,target,60,()=>{target.hp=Math.max(0,target.hp-60)},{critical:false,blocked:false,missed:false})},450);
  else if(previewParams.has('walkPreview'))setTimeout(()=>{const id=previewParams.get('walkPreview')||'guan',u=units.find(q=>q.id===id)||units.find(q=>q.id==='guan'),direction=previewParams.get('walkDirection')||'east',delta={east:[1,0],west:[-1,0],south:[0,1],north:[0,-1]}[direction]||[1,0];if(u.side==='reserve')u.side='guest';u.x=Math.min(COLS-3,Math.max(2,Math.floor(COLS*.55)));u.y=Math.min(ROWS-3,Math.max(2,Math.floor(ROWS*.55)));const target=[u.x+delta[0],u.y+delta[1]];animationSpeed=.18;battleStarted=true;document.getElementById('shopOverlay').classList.add('hidden');if(passable(u,target[0],target[1]))animateUnitMove(u,target[0],target[1])},450);
  else playTitleIntro();
})();






