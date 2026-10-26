(async () => {
  'use strict';
  if(window.ZhaolieCloud)await window.ZhaolieCloud.ready;
  const saveStorage=window.ZhaolieStorage||localStorage;
  window.refreshJieqiaoLevel?.();
  const bootParams = new URLSearchParams(location.search);
  const RUNTIME_BUILD='20261026-all-defeat-lines-v264';
  function preserveDialogueMode(params){if(bootParams.get('dialogue')==='original')params.set('dialogue','original');return params}
  const touchCapable=matchMedia('(pointer:coarse)').matches||navigator.maxTouchPoints>0||bootParams.has('tabletAudit');
  document.documentElement.classList.toggle('touch-capable',touchCapable);
  const levelIndex=bootParams.get('level');
  const level = levelIndex==='12' ? window.LEVEL_10_HUAINAN : levelIndex==='11' ? window.LEVEL_09_TAISHAN : levelIndex==='10' ? window.LEVEL_08_XIAOPEI : levelIndex==='9' ? window.LEVEL_07_XUZHOU : levelIndex==='8' ? window.LEVEL_06_BEIHAI : levelIndex==='7' ? window.LEVEL_05_JIEQIAO : levelIndex==='6' ? window.LEVEL_04_QINGHE : levelIndex==='5' ? window.LEVEL_04_JULU : levelIndex==='4' ? window.LEVEL_03_XINDU : levelIndex==='3' ? window.LEVEL_03_GUANGCHUAN : levelIndex==='2' ? window.LEVEL_02 : window.LEVEL_01;
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
    const migratedStates=[];
    for(const migration of level.paintedTerrainMigrations||[]){
      const source=runtime[migration.fromY]?.[migration.fromX];
      if(source===`${migration.type}Empty`)migratedStates.push({...migration,state:source});
    }
    for(const override of level.paintedTerrainOverrides||[]){
      if(runtime[override.y]?.[override.x]===undefined)continue;
      const current=runtime[override.y][override.x];
      if((override.type==='treasure'||override.type==='supply')&&current===`${override.type}Empty`)continue;
      runtime[override.y][override.x]=override.type;
    }
    for(const migration of migratedStates)runtime[migration.y][migration.x]=migration.state;
    return runtime
  }
  function buildRuntimeMap(){return applyPaintedTerrainOverrides(level.terrain.map(r=>[...r]))}
  const map = buildRuntimeMap();
  function preloadImage(src){const image=new Image();if(window.ZhaolieStartup?.trackImage)return window.ZhaolieStartup.trackImage(image,src);image.src=src;return image}
  const assetPaths = {
    battlefield:level.battlefieldArt||'assets/sishui-remaster-v3.webp', liu:'assets/liu-squad.webp', guan:'assets/guan-squad-v2.webp',
    zhang:'assets/zhang-squad.webp', gongsun:'assets/gongsun-squad.webp', tao:'assets/level-07-xuzhou/units/tao-unit-v1.webp',
    hua:'assets/hua-squad.webp', lvbu:'assets/lvbu-squad-v1.webp', zhangliao:'assets/zhangliao-squad-v1.webp',
    houcheng:'assets/houcheng-squad-v1.webp', songxian:'assets/songxian-squad-v1.webp', weixu:'assets/weixu-squad-v1.webp',
    caocao:'assets/level-08-xiaopei/units/caocao-unit-v1.webp',xiahoudun:'assets/level-08-xiaopei/units/xiahoudun-unit-v1.webp',xunyu:'assets/level-08-xiaopei/units/xunyu-unit-v1.webp',
    yanliang:'assets/level-04-julu/units/yan-liang-mounted-v1.webp', zhanghe:'assets/level-04-julu/units/zhang-he-mounted-v1.webp',
    quyi:'assets/level-04-qinghe/qu-yi-mounted-v2.webp', yangang:'assets/level-04-qinghe/yan-gang-mounted-v1.webp',
    zhaoyun:'assets/level-05-jieqiao/zhao-yun-mounted-v1.webp',wenchou:'assets/level-05-jieqiao/wen-chou-mounted-v1.webp',
    guanhai:'assets/level-06-beihai/guan-hai-unit-v1.webp',kongrong:'assets/level-06-beihai/kong-rong-unit-v1.webp',
    taishici:'assets/level-06-beihai/taishi-ci-unit-v1.webp',mengsu:'assets/level-06-beihai/meng-su-unit-v1.webp',beast:'assets/level-06-beihai/beast-unit-v1.webp',liming:'assets/level-09-taishan/units/li-ming-unit-v1.webp',
    jiling:'assets/level-10-huainan/units/ji-ling-unit-v1.webp',lejiu:'assets/level-10-huainan/units/le-jiu-unit-v1.webp',chenji:'assets/level-10-huainan/units/chen-ji-unit-v1.webp',
    yujin:'assets/level-07-xuzhou/units/yujin-unit-v1.webp',yuejin:'assets/level-07-xuzhou/units/yuejin-unit-v1.webp',lidian:'assets/level-07-xuzhou/units/lidian-unit-v1.webp',guojia:'assets/level-07-xuzhou/units/guojia-unit-v1.webp',caohong:'assets/level-07-xuzhou/units/caohong-unit-v1.webp',xiahouyuan:'assets/level-07-xuzhou/units/xiahouyuan-unit-v1.webp',mifang:'assets/level-07-xuzhou/units/mifang-unit-v1.webp',sunqian:'assets/level-07-xuzhou/units/sunqian-transport-unit-v2.webp',transport:'assets/level-07-xuzhou/units/transport-unit-v1.webp',
    infantry:'assets/xiliang-infantry-squad.webp', archer:'assets/xiliang-archer-squad.webp', officer:'assets/xiliang-officer-squad.webp',
    martial:'assets/troops/martial-artist-v2.webp', bandit:'assets/troops/bandit-v2.webp',
    support:'assets/military-band-remaster-v1.webp'
  };
  const art = Object.fromEntries(Object.entries(assetPaths).map(([key,src])=>[key,preloadImage(src)]));
  const friendlyAssetPaths={
    hua:'assets/friendly/hua-squad-friendly-v1.webp',infantry:'assets/friendly/infantry-squad-friendly-v1.webp',
    archer:'assets/friendly/archer-squad-friendly-v1.webp',officer:'assets/friendly/officer-squad-friendly-v1.webp',
    support:'assets/friendly/support-friendly-v1.webp',martial:'assets/friendly/martial-artist-friendly-v2.webp',
    bandit:'assets/friendly/bandit-friendly-v2.webp'
  };
  const friendlyArt=Object.fromEntries(Object.entries(friendlyAssetPaths).map(([key,src])=>[key,preloadImage(src)]));
  const terrainArtPaths={village:'assets/tile-village.webp',treasure:'assets/tile-treasure-depot.webp',supply:'assets/tile-supply-depot.webp',fort:'assets/level-04-julu/fort-v1.webp'};
  const terrainArt=Object.fromEntries(Object.entries(terrainArtPaths).map(([key,src])=>[key,preloadImage(src)]));
  const attackPaths = {
    liu:'assets/liu-attack.webp', guan:'assets/guan-attack.webp', zhang:'assets/zhang-attack.webp',
    gongsun:'assets/gongsun-attack.webp', tao:'assets/level-07-xuzhou/units/tao-action-v1.webp', hua:'assets/hua-attack.webp',
    lvbu:'assets/lvbu-attack-v1.webp', zhangliao:'assets/zhangliao-attack-v1.webp',
    houcheng:'assets/houcheng-attack-v1.webp', songxian:'assets/songxian-attack-v1.webp', weixu:'assets/weixu-attack-v1.webp',
    caocao:'assets/level-08-xiaopei/units/caocao-action-v1.webp',xiahoudun:'assets/level-08-xiaopei/units/xiahoudun-action-v1.webp',xunyu:'assets/level-08-xiaopei/units/xunyu-action-v1.webp',
    infantry:'assets/infantry-attack.webp', archer:'assets/archer-attack.webp', officer:'assets/officer-attack.webp',
    martial:'assets/troops/martial-artist-attack-v2.webp',bandit:'assets/troops/bandit-combat-v3/attack.webp',
    support:'assets/troops/military-band-attack-v1.webp',zhaoyun:'assets/level-05-jieqiao/zhao-yun-animation/zhao-yun-attack-v2.webp',
    wenchou:'assets/level-05-jieqiao/wen-chou-animation/wen-chou-attack-v1.webp',
    yanliang:'assets/level-05-jieqiao/core-animation/yanliang/yanliang-attack-v1.webp',zhanghe:'assets/level-05-jieqiao/core-animation/zhanghe/zhanghe-attack-v1.webp',quyi:'assets/level-05-jieqiao/core-animation/quyi/quyi-attack-v1.webp',jiling:'assets/level-10-huainan/animation/ji-ling/ji-ling-attack-v1.webp',
    guanhai:'assets/level-06-beihai/animation/guan-hai/guan-hai-attack-v2.webp',kongrong:'assets/level-06-beihai/animation/kong-rong/kong-rong-attack-v2.webp',taishici:'assets/level-06-beihai/animation/taishi-ci/taishi-ci-attack-v2.webp',mengsu:'assets/level-06-beihai/animation/meng-su/meng-su-attack-v2.webp',beast:'assets/level-06-beihai/animation/beast/beast-attack-v3.webp',liming:'assets/level-09-taishan/animation/li-ming/li-ming-attack-v1.webp',
    yujin:'assets/level-07-xuzhou/units/yujin-action-v1.webp',yuejin:'assets/level-07-xuzhou/units/yuejin-action-v1.webp',lidian:'assets/level-07-xuzhou/units/lidian-action-v1.webp',guojia:'assets/level-07-xuzhou/units/guojia-action-v1.webp',caohong:'assets/level-07-xuzhou/units/caohong-action-v1.webp',xiahouyuan:'assets/level-07-xuzhou/units/xiahouyuan-action-v1.webp',mifang:'assets/level-07-xuzhou/units/mifang-action-v1.webp',sunqian:'assets/level-07-xuzhou/units/sunqian-transport-action-v2.webp',transport:'assets/level-07-xuzhou/units/transport-action-v1.webp'
  };
  const mountedCombatAttackIds=['guan','zhang','gongsun','hua','lvbu','zhangliao','houcheng','zhaoyun','wenchou','yanliang','zhanghe','quyi','taishici','caocao','xiahoudun','xiahouyuan','yuejin'];
  const mountedDuelAttackOverrides={guan:'assets/mounted-combat-v1/guan-duel-attack-v2.webp',zhangliao:'assets/mounted-combat-v1/zhangliao-duel-attack-v2.webp'};
  for(const id of mountedCombatAttackIds)attackPaths[id]=`assets/mounted-combat-v1/${id}-attack.webp`;
  Object.assign(attackPaths,mountedDuelAttackOverrides);
  const attackArt = Object.fromEntries(Object.entries(attackPaths).map(([key,src])=>[key,preloadImage(src)]));
  const criticalPaths={zhaoyun:'assets/level-05-jieqiao/zhao-yun-animation/zhao-yun-critical-v2.webp',wenchou:'assets/level-05-jieqiao/wen-chou-animation/wen-chou-critical-v1.webp',yanliang:'assets/level-05-jieqiao/core-animation/yanliang/yanliang-critical-v1.webp',zhanghe:'assets/level-05-jieqiao/core-animation/zhanghe/zhanghe-critical-v1.webp',quyi:'assets/level-05-jieqiao/core-animation/quyi/quyi-critical-v1.webp',jiling:'assets/level-10-huainan/animation/ji-ling/ji-ling-critical-v1.webp',liming:'assets/level-09-taishan/animation/li-ming/li-ming-critical-v1.webp'};
  for(const id of ['yujin','yuejin','lidian','guojia','caohong','xiahouyuan','mifang','sunqian','tao','transport'])criticalPaths[id]=`assets/level-07-xuzhou/units/${id}-action-v1.webp`;
  criticalPaths.sunqian='assets/level-07-xuzhou/units/sunqian-transport-action-v2.webp';
  Object.assign(criticalPaths,{caocao:'assets/level-08-xiaopei/units/caocao-action-v1.webp',xiahoudun:'assets/level-08-xiaopei/units/xiahoudun-action-v1.webp',xunyu:'assets/level-08-xiaopei/units/xunyu-action-v1.webp'});
  Object.assign(criticalPaths,{zhaoyun:'assets/mounted-combat-v1/zhaoyun-critical.webp',wenchou:'assets/mounted-combat-v1/wenchou-critical.webp',yanliang:'assets/mounted-combat-v1/yanliang-critical.webp',zhanghe:'assets/mounted-combat-v1/zhanghe-critical.webp',quyi:'assets/mounted-combat-v1/quyi-critical.webp',caocao:'assets/mounted-combat-v1/caocao-attack.webp',xiahoudun:'assets/mounted-combat-v1/xiahoudun-attack.webp',xiahouyuan:'assets/mounted-combat-v1/xiahouyuan-attack.webp',yuejin:'assets/mounted-combat-v1/yuejin-attack.webp'});
  const criticalArt=Object.fromEntries(Object.entries(criticalPaths).map(([key,src])=>[key,preloadImage(src)]));
  const blockPaths={zhaoyun:'assets/level-05-jieqiao/zhao-yun-animation/zhao-yun-block-v2.webp',wenchou:'assets/level-05-jieqiao/wen-chou-animation/wen-chou-block-v1.webp',yanliang:'assets/level-05-jieqiao/core-animation/yanliang/yanliang-block-v1.webp',zhanghe:'assets/level-05-jieqiao/core-animation/zhanghe/zhanghe-block-v1.webp',quyi:'assets/level-05-jieqiao/core-animation/quyi/quyi-block-v1.webp',jiling:'assets/level-10-huainan/animation/ji-ling/ji-ling-block-v1.webp',liming:'assets/level-09-taishan/animation/li-ming/li-ming-block-v1.webp'};
  for(const id of ['yujin','yuejin','lidian','guojia','caohong','xiahouyuan','mifang','sunqian','tao','transport'])blockPaths[id]=`assets/level-07-xuzhou/units/${id}-action-v1.webp`;
  blockPaths.sunqian='assets/level-07-xuzhou/units/sunqian-transport-action-v2.webp';
  Object.assign(blockPaths,{caocao:'assets/level-08-xiaopei/units/caocao-action-v1.webp',xiahoudun:'assets/level-08-xiaopei/units/xiahoudun-action-v1.webp',xunyu:'assets/level-08-xiaopei/units/xunyu-action-v1.webp'});
  const blockArt=Object.fromEntries(Object.entries(blockPaths).map(([key,src])=>[key,preloadImage(src)]));
  const directionalAttackPaths={zhaoyun:'assets/mounted-combat-v1/zhaoyun-directional-attack.webp'};
  const directionalAttackArt=Object.fromEntries(Object.entries(directionalAttackPaths).map(([key,src])=>[key,preloadImage(src)]));
  const friendlyAttackPaths={hua:'assets/mounted-combat-v1/hua-attack-friendly.webp',infantry:'assets/friendly/infantry-attack-friendly-v1.webp',archer:'assets/friendly/archer-attack-friendly-v1.webp',officer:'assets/friendly/officer-attack-friendly-v1.webp',martial:'assets/friendly/martial-artist-attack-friendly-v2.webp',bandit:'assets/troops/bandit-combat-v3/friendlyAttack.webp',support:'assets/troops/military-band-attack-v1.webp'};
  const friendlyAttackArt=Object.fromEntries(Object.entries(friendlyAttackPaths).map(([key,src])=>[key,preloadImage(src)]));
  const walkPaths={liu:'assets/liu-walk-v1.webp',guan:'assets/guan-walk-v1.webp',zhang:'assets/zhang-walk-v1.webp',gongsun:'assets/gongsun-walk-v1.webp',tao:'assets/tao-walk-v1.webp',hua:'assets/hua-walk-v1.webp',lvbu:'assets/lvbu-walk-v1.webp',zhangliao:'assets/zhangliao-walk-v1.webp',houcheng:'assets/houcheng-walk-v1.webp',songxian:'assets/songxian-walk-v2.webp',weixu:'assets/weixu-walk-v1.webp',caocao:'assets/level-08-xiaopei/units/caocao-walk-v1.webp',xiahoudun:'assets/level-08-xiaopei/units/xiahoudun-walk-v1.webp',xunyu:'assets/level-08-xiaopei/units/xunyu-walk-v1.webp',zhaoyun:'assets/level-05-jieqiao/zhao-yun-animation/zhao-yun-walk-v2.webp',wenchou:'assets/level-05-jieqiao/wen-chou-animation/wen-chou-walk-v1.webp',yanliang:'assets/level-05-jieqiao/core-animation/yanliang/yanliang-walk-v1.webp',zhanghe:'assets/level-05-jieqiao/core-animation/zhanghe/zhanghe-walk-v1.webp',quyi:'assets/level-05-jieqiao/core-animation/quyi/quyi-walk-v1.webp',jiling:'assets/level-10-huainan/animation/ji-ling/ji-ling-walk-v1.webp',guanhai:'assets/level-06-beihai/animation/guan-hai/guan-hai-walk-v2.webp',kongrong:'assets/level-06-beihai/animation/kong-rong/kong-rong-walk-v2.webp',taishici:'assets/level-06-beihai/animation/taishi-ci/taishi-ci-walk-v2.webp',mengsu:'assets/level-06-beihai/animation/meng-su/meng-su-walk-v2.webp',beast:'assets/level-06-beihai/animation/beast/beast-walk-v2.webp',liming:'assets/level-09-taishan/animation/li-ming/li-ming-walk-v1.webp',officer:'assets/officer-walk-v1.webp',archer:'assets/archer-walk-v1.webp',infantry:'assets/infantry-walk-v1.webp',martial:'assets/troops/martial-artist-walk-v2.webp',bandit:'assets/troops/bandit-walk-v4.webp',support:'assets/troops/military-band-walk-v1.webp',mizhu:'assets/level-10-huainan/units/mi-zhu-military-band-walk-v1.webp'};
  for(const id of ['yujin','yuejin','lidian','guojia','caohong','xiahouyuan','mifang','sunqian','tao','transport'])walkPaths[id]=`assets/level-07-xuzhou/units/${id}-walk-v1.webp`;
  walkPaths.sunqian='assets/level-07-xuzhou/units/sunqian-transport-walk-v2.webp';
  const walkArt=Object.fromEntries(Object.entries(walkPaths).map(([key,src])=>[key,preloadImage(src)]));
  const friendlyWalkPaths={hua:'assets/friendly/hua-walk-friendly-v1.webp',officer:'assets/friendly/officer-walk-friendly-v1.webp',archer:'assets/friendly/archer-walk-friendly-v1.webp',infantry:'assets/friendly/infantry-walk-friendly-v1.webp',martial:'assets/friendly/martial-artist-walk-friendly-v2.webp',bandit:'assets/friendly/bandit-walk-friendly-v4.webp',support:'assets/troops/military-band-walk-v1.webp'};
  const friendlyWalkArt=Object.fromEntries(Object.entries(friendlyWalkPaths).map(([key,src])=>[key,preloadImage(src)]));
  const deathPaths={guan:'assets/guan-death-v1.webp',zhang:'assets/zhang-death-v1.webp',gongsun:'assets/gongsun-death-v1.webp',hua:'assets/hua-death-v1.webp',lvbu:'assets/lvbu-death-v1.webp',zhangliao:'assets/zhangliao-death-v1.webp',houcheng:'assets/houcheng-death-v1.webp',songxian:'assets/songxian-death-v1.webp',weixu:'assets/weixu-death-v1.webp',caocao:'assets/level-08-xiaopei/units/caocao-death-v1.webp',xiahoudun:'assets/level-08-xiaopei/units/xiahoudun-death-v1.webp',xunyu:'assets/level-08-xiaopei/units/xunyu-death-v1.webp',zhaoyun:'assets/level-05-jieqiao/zhao-yun-animation/zhao-yun-death-v2.webp',wenchou:'assets/level-05-jieqiao/wen-chou-animation/wen-chou-death-v1.webp',yanliang:'assets/level-05-jieqiao/core-animation/yanliang/yanliang-death-v1.webp',zhanghe:'assets/level-05-jieqiao/core-animation/zhanghe/zhanghe-death-v1.webp',quyi:'assets/level-05-jieqiao/core-animation/quyi/quyi-death-v1.webp',jiling:'assets/level-10-huainan/animation/ji-ling/ji-ling-death-v1.webp',guanhai:'assets/level-06-beihai/animation/guan-hai/guan-hai-death-v1.webp',kongrong:'assets/level-06-beihai/animation/kong-rong/kong-rong-death-v1.webp',taishici:'assets/level-06-beihai/animation/taishi-ci/taishi-ci-death-v1.webp',mengsu:'assets/level-06-beihai/animation/meng-su/meng-su-death-v1.webp',beast:'assets/level-06-beihai/animation/beast/beast-death-v1.webp',liming:'assets/level-09-taishan/animation/li-ming/li-ming-death-v1.webp'};
  for(const id of ['yujin','yuejin','lidian','guojia','caohong','xiahouyuan','mifang','sunqian','tao','transport'])deathPaths[id]=`assets/level-07-xuzhou/units/${id}-action-v1.webp`;
  deathPaths.sunqian='assets/level-07-xuzhou/units/sunqian-transport-action-v2.webp';
  const deathArt=Object.fromEntries(Object.entries(deathPaths).map(([key,src])=>[key,preloadImage(src)]));
  const friendlyDeathPaths={hua:'assets/friendly/hua-death-friendly-v1.webp'};
  const friendlyDeathArt=Object.fromEntries(Object.entries(friendlyDeathPaths).map(([key,src])=>[key,preloadImage(src)]));
  const hurtPaths={martial:'assets/troops/martial-artist-hurt-v2.webp',bandit:'assets/troops/bandit-combat-v3/hurt.webp',caocao:'assets/level-08-xiaopei/units/caocao-action-v1.webp',xiahoudun:'assets/level-08-xiaopei/units/xiahoudun-action-v1.webp',xunyu:'assets/level-08-xiaopei/units/xunyu-action-v1.webp',zhaoyun:'assets/level-05-jieqiao/zhao-yun-animation/zhao-yun-hurt-v2.webp',wenchou:'assets/level-05-jieqiao/wen-chou-animation/wen-chou-hurt-v1.webp',yanliang:'assets/level-05-jieqiao/core-animation/yanliang/yanliang-hurt-v1.webp',zhanghe:'assets/level-05-jieqiao/core-animation/zhanghe/zhanghe-hurt-v1.webp',quyi:'assets/level-05-jieqiao/core-animation/quyi/quyi-hurt-v1.webp',jiling:'assets/level-10-huainan/animation/ji-ling/ji-ling-hurt-v1.webp',guanhai:'assets/level-06-beihai/animation/guan-hai/guan-hai-hurt-v1.webp',kongrong:'assets/level-06-beihai/animation/kong-rong/kong-rong-hurt-v1.webp',taishici:'assets/level-06-beihai/animation/taishi-ci/taishi-ci-hurt-v1.webp',mengsu:'assets/level-06-beihai/animation/meng-su/meng-su-hurt-v1.webp',beast:'assets/level-06-beihai/animation/beast/beast-hurt-v1.webp',liming:'assets/level-09-taishan/animation/li-ming/li-ming-hurt-v1.webp'};
  for(const id of ['yujin','yuejin','lidian','guojia','caohong','xiahouyuan','mifang','sunqian','tao','transport'])hurtPaths[id]=`assets/level-07-xuzhou/units/${id}-action-v1.webp`;
  hurtPaths.sunqian='assets/level-07-xuzhou/units/sunqian-transport-action-v2.webp';
  const hurtArt=Object.fromEntries(Object.entries(hurtPaths).map(([key,src])=>[key,preloadImage(src)]));
  const friendlyHurtPaths={martial:'assets/friendly/martial-artist-hurt-friendly-v2.webp',bandit:'assets/troops/bandit-combat-v3/friendlyHurt.webp'};
  const friendlyHurtArt=Object.fromEntries(Object.entries(friendlyHurtPaths).map(([key,src])=>[key,preloadImage(src)]));
  // These three commanders reuse proven animation geometry, but keep a stable
  // character palette across idle, walk, attack, hurt and death frames.
  const unitPaletteFilters={};
  const woundedArt=preloadImage('assets/wounded-units-atlas-v1.webp');
  const friendlyWoundedArt=preloadImage('assets/friendly/wounded-units-atlas-friendly-v1.webp');
  const warmWineArt=preloadImage('assets/cinematics/warm-wine-slay-hua-xiong-v1.webp');
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
    bandit:[[[30,0,270,320],[0,0,300,320],[0,0,298,320],[1,0,285,320]],[[60,0,240,320],[1,0,299,320],[0,0,300,320],[1,0,287,320]],[[14,0,286,320],[1,0,299,320],[0,0,300,320],[0,0,300,320]],[[0,0,300,320],[0,0,300,304],[12,0,288,300],[0,0,262,303]]],
    mizhu:[[[65,2,228,305],[48,0,237,320],[48,2,228,307],[52,1,232,307]],[[70,1,216,319],[63,0,209,320],[54,1,223,319],[57,1,222,319]],[[47,0,243,320],[46,0,236,320],[50,0,238,320],[51,0,236,320]],[[49,0,240,297],[50,0,238,297],[45,0,233,297],[43,0,248,298]]],
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
  const zhaoYunAnimationBounds=window.ZHAO_YUN_ANIMATION_BOUNDS||{};
  if(zhaoYunAnimationBounds.walk)walkFrameBounds.zhaoyun=zhaoYunAnimationBounds.walk;
  if(zhaoYunAnimationBounds.attack)attackFrameBounds.zhaoyun=zhaoYunAnimationBounds.attack;
  if(zhaoYunAnimationBounds.hurt)hurtFrameBounds.zhaoyun=zhaoYunAnimationBounds.hurt;
  if(zhaoYunAnimationBounds.death)deathFrameBounds.zhaoyun=zhaoYunAnimationBounds.death;
  const criticalFrameBounds={zhaoyun:zhaoYunAnimationBounds.critical||[]};
  const blockFrameBounds={zhaoyun:zhaoYunAnimationBounds.block||[]};
  const directionalAttackFrameBounds={zhaoyun:zhaoYunAnimationBounds.directionalAttack||[]};
  const wenChouAnimationBounds=window.WEN_CHOU_ANIMATION_BOUNDS||{};
  if(wenChouAnimationBounds.walk)walkFrameBounds.wenchou=wenChouAnimationBounds.walk;
  if(wenChouAnimationBounds.attack)attackFrameBounds.wenchou=wenChouAnimationBounds.attack;
  if(wenChouAnimationBounds.hurt)hurtFrameBounds.wenchou=wenChouAnimationBounds.hurt;
  if(wenChouAnimationBounds.death)deathFrameBounds.wenchou=wenChouAnimationBounds.death;
  criticalFrameBounds.wenchou=wenChouAnimationBounds.critical||[];
  blockFrameBounds.wenchou=wenChouAnimationBounds.block||[];
  const jieqiaoCoreAnimationBounds=window.JIEQIAO_CORE_ANIMATION_BOUNDS||{};
  for(const id of ['yanliang','zhanghe','quyi']){
    const bounds=jieqiaoCoreAnimationBounds[id]||{};
    if(bounds.walk)walkFrameBounds[id]=bounds.walk;
    if(bounds.attack)attackFrameBounds[id]=bounds.attack;
    if(bounds.hurt)hurtFrameBounds[id]=bounds.hurt;
    if(bounds.death)deathFrameBounds[id]=bounds.death;
    criticalFrameBounds[id]=bounds.critical||[];
    blockFrameBounds[id]=bounds.block||[];
  }
  const beihaiAnimationBounds=window.BEIHAI_ANIMATION_BOUNDS||{};
  for(const [id,sourceId] of [['guanhai','guan-hai'],['kongrong','kong-rong'],['mengsu','meng-su'],['taishici','taishi-ci'],['beast','beast']]){
    const bounds=beihaiAnimationBounds[sourceId]||{};
    if(bounds.walk)walkFrameBounds[id]=bounds.walk;
    if(bounds.attack)attackFrameBounds[id]=bounds.attack;
    if(bounds.hurt)hurtFrameBounds[id]=bounds.hurt;
    if(bounds.death)deathFrameBounds[id]=bounds.death;
  }
  const xuzhouAnimationBounds=window.XUZHOU_ANIMATION_BOUNDS||{};
  const xuzhouAuthoredCombatIds=new Set(['yujin','yuejin','lidian','guojia','caohong','xiahouyuan','mifang','sunqian','tao','transport']);
  for(const id of xuzhouAuthoredCombatIds){
    const bounds=xuzhouAnimationBounds[id]||{};
    if(bounds.walk)walkFrameBounds[id]=bounds.walk;
    if(bounds.action){attackFrameBounds[id]=bounds.action;hurtFrameBounds[id]=bounds.action;deathFrameBounds[id]=bounds.action;criticalFrameBounds[id]=bounds.action;blockFrameBounds[id]=bounds.action}
  }
  const xiaopeiAnimationBounds=window.XIAOPEI_ANIMATION_BOUNDS||{};
  const xiaopeiCommanderCombatIds=new Set(['caocao','xiahoudun','xunyu']);
  for(const id of xiaopeiCommanderCombatIds){
    const bounds=xiaopeiAnimationBounds[id]||{};
    if(bounds.walk)walkFrameBounds[id]=bounds.walk;
    if(bounds.attack)attackFrameBounds[id]=bounds.attack;
    if(bounds.hurt)hurtFrameBounds[id]=bounds.hurt;
    if(bounds.death)deathFrameBounds[id]=bounds.death;
    criticalFrameBounds[id]=bounds.critical||bounds.attack||[];
    blockFrameBounds[id]=bounds.block||bounds.attack||[];
  }
  const taishanAnimationBounds=window.TAISHAN_ANIMATION_BOUNDS||{};
  const liMingBounds=taishanAnimationBounds.liming||{};
  if(liMingBounds.walk)walkFrameBounds.liming=liMingBounds.walk;
  if(liMingBounds.attack)attackFrameBounds.liming=liMingBounds.attack;
  if(liMingBounds.hurt)hurtFrameBounds.liming=liMingBounds.hurt;
  if(liMingBounds.death)deathFrameBounds.liming=liMingBounds.death;
  criticalFrameBounds.liming=liMingBounds.critical||liMingBounds.attack||[];
  const huainanAnimationBounds=window.HUAINAN_ANIMATION_BOUNDS||{};
  const jiLingBounds=huainanAnimationBounds.jiling||{};
  if(jiLingBounds.walk)walkFrameBounds.jiling=jiLingBounds.walk;
  if(jiLingBounds.attack)attackFrameBounds.jiling=jiLingBounds.attack;
  if(jiLingBounds.hurt)hurtFrameBounds.jiling=jiLingBounds.hurt;
  if(jiLingBounds.death)deathFrameBounds.jiling=jiLingBounds.death;
  criticalFrameBounds.jiling=jiLingBounds.critical||jiLingBounds.attack||[];
  blockFrameBounds.jiling=jiLingBounds.block||jiLingBounds.hurt||[];
  const mountedCombatCleanBounds=window.MOUNTED_COMBAT_CLEAN_BOUNDS||{};
  Object.assign(attackFrameBounds,mountedCombatCleanBounds.attack||{});
  Object.assign(criticalFrameBounds,mountedCombatCleanBounds.critical||{});
  if(mountedCombatCleanBounds.directionalAttack?.zhaoyun)directionalAttackFrameBounds.zhaoyun=mountedCombatCleanBounds.directionalAttack.zhaoyun;
  const banditCombatCleanBounds=window.BANDIT_COMBAT_CLEAN_BOUNDS||{};
  Object.assign(attackFrameBounds,banditCombatCleanBounds.attack||{});
  Object.assign(hurtFrameBounds,banditCombatCleanBounds.hurt||{});
  blockFrameBounds.liming=liMingBounds.block||liMingBounds.hurt||[];
  const portraitPaths = {
    liu:'assets/liu-bei-remaster-v2.webp', guan:'assets/guan-yu-remaster-v2.webp',
    zhang:'assets/zhang-fei-remaster-v2.webp', gongsun:'assets/gongsun-zan-remaster-v2.webp',
    tao:'assets/tao-qian-remaster-v2.webp', hua:'assets/hua-xiong-remaster-v2.webp',
    hu:'assets/hu-zhen-remaster-v2.webp', zhao:'assets/zhao-cen-remaster-v2.webp',
    li:'assets/li-su-remaster-v2.webp',
    lvbu:'assets/story-portraits/remaster-v6/lv-bu-v6.webp',
    zhangliao:'assets/zhang-liao-portrait-v1.webp',
    houcheng:'assets/hou-cheng-portrait-v1.webp',
    songxian:'assets/song-xian-portrait-v1.webp',
    weixu:'assets/wei-xu-portrait-v1.webp',
    jian:'assets/level-03/portraits/jian-yong-v1.webp', fengji:'assets/level-03/portraits/feng-ji-v1.webp',
    chunyu:'assets/level-03-xindu/portraits/chunyu-qiong-v1.webp',fagong:'assets/level-03-xindu/portraits/fan-gong-v1.webp',
    hanying:'assets/level-03/portraits/han-ying-v1.webp',guoshi:'assets/level-03/portraits/guo-shi-v1.webp',
    zhanghe:'assets/level-04-julu/portraits/zhang-he-v1.webp',yanliang:'assets/level-04-julu/portraits/yan-liang-v1.webp',
    quyi:'assets/level-04-qinghe/qu-yi-portrait-v1.webp',yangang:'assets/level-04-qinghe/yan-gang-portrait-v1.webp',
    zhaoyun:'assets/story-portraits/remaster-v6/zhao-yun-v6.webp',wenchou:'assets/level-05-jieqiao/wen-chou-portrait-v2.webp',
    yuanshao:'assets/story-portraits/remaster-v6/yuan-shao-v6.webp',tianfeng:'assets/level-05-jieqiao/portraits/tian-feng-v1.webp',
    chenlin:'assets/level-05-jieqiao/portraits/chen-lin-v1.webp',guotu:'assets/level-05-jieqiao/portraits/guo-tu-v1.webp',
    jushou:'assets/level-05-jieqiao/portraits/ju-shou-v1.webp',jiaochu:'assets/level-05-jieqiao/portraits/jiao-chu-v1.webp',
    zhangnan:'assets/level-05-jieqiao/portraits/zhang-nan-v1.webp',chenzhen:'assets/level-05-jieqiao/portraits/chen-zhen-v1.webp',
    xuyou:'assets/level-05-jieqiao/portraits/xu-you-v1.webp',zhoubi:'assets/level-05-jieqiao/portraits/zhou-bi-v1.webp',
    chenjiang:'assets/level-05-jieqiao/portraits/chen-jiang-v1.webp',
    guanhai:'assets/level-06-beihai/portraits/guan-hai-v1.webp',kongrong:'assets/level-06-beihai/portraits/kong-rong-v1.webp',
    taishici:'assets/level-06-beihai/portraits/taishi-ci-v1.webp',mengsu:'assets/level-06-beihai/portraits/meng-su-v1.webp',
    yujin:'assets/level-07-xuzhou/portraits/yu-jin-v1.webp',yuejin:'assets/level-07-xuzhou/portraits/yue-jin-v1.webp',
    lidian:'assets/level-07-xuzhou/portraits/li-dian-v1.webp',guojia:'assets/level-07-xuzhou/portraits/guo-jia-v1.webp',
    caohong:'assets/level-07-xuzhou/portraits/cao-hong-v1.webp',xiahouyuan:'assets/level-07-xuzhou/portraits/xiahou-yuan-v1.webp',
    xiahoudun:'assets/level-08-xiaopei/portraits/xiahou-dun-v1.webp',xunyu:'assets/level-08-xiaopei/portraits/xun-yu-v1.webp',
    mifang:'assets/level-07-xuzhou/portraits/mi-fang-v1.webp',sunqian:'assets/level-07-xuzhou/portraits/sun-qian-v1.webp',liming:'assets/level-09-taishan/portraits/li-ming-remaster-v1.webp',mizhu:'assets/level-06-beihai/portraits/mi-zhu-v1.webp',
    jiling:'assets/level-10-huainan/portraits/ji-ling-remaster-v2.webp',lejiu:'assets/level-10-huainan/portraits/le-jiu-remaster-v1.webp',chenji:'assets/level-10-huainan/portraits/chen-ji-remaster-v1.webp',chengong:'assets/level-10-huainan/portraits/chen-gong-remaster-v1.webp',
    gaolan:'assets/level-04-julu/portraits/gao-lan-v1.webp',shenpei:'assets/level-04-julu/portraits/shen-pei-v1.webp',
    gongsunyue:'assets/level-04-julu/portraits/gongsun-yue-v1.webp',guanchun:'assets/level-04-julu/portraits/guan-chun-v1.webp',
    gengwu:'assets/level-04-julu/portraits/geng-wu-v1.webp',yuze:'assets/level-04-julu/portraits/yu-ze-v1.webp'
  };
  const storyPortraitRoot='assets/story-portraits/remaster-v4/';
  const storyPortraits={
    刘备:portraitPaths.liu,关羽:portraitPaths.guan,张飞:portraitPaths.zhang,
    曹操:'assets/story-portraits/remaster-v6/cao-cao-v6.webp',袁绍:'assets/story-portraits/remaster-v6/yuan-shao-v6.webp',袁术:'assets/story-portraits/remaster-v6/yuan-shu-v6.webp',
    公孙瓒:portraitPaths.gongsun,陶谦:portraitPaths.tao,孔融:portraitPaths.kongrong,
    董卓:'assets/story-portraits/remaster-v6/dong-zhuo-v6.webp',吕布:portraitPaths.lvbu,华雄:portraitPaths.hua,
    李儒:storyPortraitRoot+'li-ru-v4.webp',李傕:storyPortraitRoot+'li-jue-v4.webp',郭汜:storyPortraitRoot+'guo-si-v4.webp',
    李肃:portraitPaths.li,胡轸:portraitPaths.hu,赵岑:portraitPaths.zhao,
    董承:storyPortraitRoot+'dong-cheng-v4.webp',献帝:storyPortraitRoot+'emperor-v4.webp',
    武官:storyPortraitRoot+'officer-v4.webp',道具屋:'assets/story-portraits/remaster-v6/shopkeeper-v6.webp',使者:storyPortraitRoot+'officer-v4.webp',
    简雍:'assets/level-03/portraits/jian-yong-v1.webp',逢纪:'assets/level-03/portraits/feng-ji-v1.webp',韩英:'assets/level-03/portraits/han-ying-v1.webp',郭适:'assets/level-03/portraits/guo-shi-v1.webp',李明:portraitPaths.liming,
    淳于琼:'assets/level-03-xindu/portraits/chunyu-qiong-v1.webp',藩宫:'assets/level-03-xindu/portraits/fan-gong-v1.webp',
    张郃:'assets/level-04-julu/portraits/zhang-he-v1.webp',颜良:'assets/level-04-julu/portraits/yan-liang-v1.webp',
    高览:'assets/level-04-julu/portraits/gao-lan-v1.webp',审配:'assets/level-04-julu/portraits/shen-pei-v1.webp',
    麴义:'assets/level-04-qinghe/qu-yi-portrait-v1.webp',严纲:'assets/level-04-qinghe/yan-gang-portrait-v1.webp',
    公孙越:'assets/level-04-julu/portraits/gongsun-yue-v1.webp',关纯:'assets/level-04-julu/portraits/guan-chun-v1.webp',
    耿武:'assets/level-04-julu/portraits/geng-wu-v1.webp',羽则:'assets/level-04-julu/portraits/yu-ze-v1.webp',
    赵云:'assets/story-portraits/remaster-v6/zhao-yun-v6.webp',文丑:'assets/level-05-jieqiao/wen-chou-portrait-v2.webp',
    田丰:'assets/level-05-jieqiao/portraits/tian-feng-v1.webp',陈琳:'assets/level-05-jieqiao/portraits/chen-lin-v1.webp',
    郭图:'assets/level-05-jieqiao/portraits/guo-tu-v1.webp',沮授:'assets/level-05-jieqiao/portraits/ju-shou-v1.webp',
    焦触:'assets/level-05-jieqiao/portraits/jiao-chu-v1.webp',张南:'assets/level-05-jieqiao/portraits/zhang-nan-v1.webp',
    陈震:'assets/level-05-jieqiao/portraits/chen-zhen-v1.webp',许攸:'assets/level-05-jieqiao/portraits/xu-you-v1.webp',
    周比:'assets/level-05-jieqiao/portraits/zhou-bi-v1.webp',陈蒋:'assets/level-05-jieqiao/portraits/chen-jiang-v1.webp',
    管亥:'assets/level-06-beihai/portraits/guan-hai-v1.webp',孔融:'assets/level-06-beihai/portraits/kong-rong-v1.webp',
    太史慈:'assets/level-06-beihai/portraits/taishi-ci-v1.webp',孟肃:'assets/level-06-beihai/portraits/meng-su-v1.webp',糜竺:'assets/level-06-beihai/portraits/mi-zhu-v1.webp',
    于禁:'assets/level-07-xuzhou/portraits/yu-jin-v1.webp',乐进:'assets/level-07-xuzhou/portraits/yue-jin-v1.webp',
    李典:'assets/level-07-xuzhou/portraits/li-dian-v1.webp',郭嘉:'assets/level-07-xuzhou/portraits/guo-jia-v1.webp',
    曹洪:'assets/level-07-xuzhou/portraits/cao-hong-v1.webp',夏侯渊:'assets/level-07-xuzhou/portraits/xiahou-yuan-v1.webp',
    夏侯惇:'assets/level-08-xiaopei/portraits/xiahou-dun-v1.webp',荀彧:'assets/level-08-xiaopei/portraits/xun-yu-v1.webp',
    糜芳:'assets/level-07-xuzhou/portraits/mi-fang-v1.webp',孙乾:'assets/level-07-xuzhou/portraits/sun-qian-v1.webp',
    陈登:'assets/level-07-xuzhou/portraits/chen-deng-v1.webp',文官:storyPortraitRoot+'officer-v4.webp',
    纪灵:portraitPaths.jiling,乐就:portraitPaths.lejiu,陈纪:portraitPaths.chenji,陈宫:portraitPaths.chengong,
    张辽:portraitPaths.zhangliao,魏续:portraitPaths.weixu,宋宪:portraitPaths.songxian,
    袁胤:'assets/level-10-huainan/portraits/yuan-yin-remaster-v1.webp',曹豹:'assets/level-10-huainan/portraits/cao-bao-remaster-v1.webp',
    董昭:'assets/level-10-huainan/portraits/dong-zhao-remaster-v1.webp',张绣:'assets/level-10-huainan/portraits/zhang-xiu-remaster-v1.webp'
  };
  function portraitForUnit(u){return portraitPaths[u.id]||storyPortraits[u.name]||assetPaths[u.id]||assetPaths[genericVisualKeyFor(u)]}
  const storyActorRoot='assets/story-actors/remaster-v3/';
  const huainanStoryActorRoot='assets/level-10-huainan/story-actors/';
  const storyActorAssets={
    刘备:storyActorRoot+'liu-bei-walk-sheet-v4.webp',关羽:storyActorRoot+'guan-yu-walk-sheet-v4.webp',张飞:storyActorRoot+'zhang-fei-walk-sheet-v4.webp',
    曹操:storyActorRoot+'cao-cao-walk-sheet-v4.webp',袁绍:storyActorRoot+'yuan-shao-walk-sheet-v4.webp',袁术:storyActorRoot+'yuan-shu-walk-sheet-v4.webp',
    公孙瓒:storyActorRoot+'gongsun-zan-walk-sheet-v4.webp',陶谦:storyActorRoot+'tao-qian-walk-sheet-v5.webp',孔融:storyActorRoot+'kong-rong-walk-sheet-v4.webp',
    董卓:storyActorRoot+'dong-zhuo-walk-sheet-v4.webp',吕布:huainanStoryActorRoot+'lv-bu-walk-sheet-v1.webp',华雄:storyActorRoot+'hua-xiong-walk-sheet-v4.webp',
    李儒:storyActorRoot+'li-ru-walk-sheet-v4.webp',李傕:storyActorRoot+'li-jue-walk-sheet-v4.webp',郭汜:storyActorRoot+'guo-si-walk-sheet-v4.webp',
    李肃:storyActorRoot+'li-su-walk-sheet-v4.webp',胡轸:storyActorRoot+'hu-zhen-walk-sheet-v4.webp',赵岑:storyActorRoot+'zhao-cen-walk-sheet-v4.webp',
    董承:storyActorRoot+'dong-cheng-walk-sheet-v4.webp',献帝:storyActorRoot+'emperor-walk-sheet-v4.webp',
    武官:storyActorRoot+'officer-walk-sheet-v4.webp',道具屋:storyActorRoot+'shopkeeper-walk-sheet-v4.webp',
    少女:storyActorRoot+'maiden-walk-sheet-v4.webp',夫人:storyActorRoot+'lady-walk-sheet-v4.webp',
    简雍:storyActorRoot+'officer-walk-sheet-v4.webp',逢纪:storyActorRoot+'officer-walk-sheet-v4.webp',韩英:storyActorRoot+'officer-walk-sheet-v4.webp',郭适:storyActorRoot+'officer-walk-sheet-v4.webp',使者:storyActorRoot+'officer-walk-sheet-v4.webp',
    淳于琼:storyActorRoot+'officer-walk-sheet-v4.webp',藩宫:storyActorRoot+'officer-walk-sheet-v4.webp',
    张郃:'assets/level-04-julu/story-actors/zhang-he-dismounted-walk-sheet-v1.webp',
    颜良:'assets/level-04-julu/story-actors/yan-liang-dismounted-walk-sheet-v1.webp',
    麴义:'assets/level-05-jieqiao/core-animation/quyi/quyi-walk-v1.webp',
    公孙越:storyActorRoot+'gongsun-zan-walk-sheet-v4.webp',严纲:storyActorRoot+'gongsun-zan-walk-sheet-v4.webp',
    赵云:storyActorRoot+'zhao-yun-walk-sheet-v1.webp',糜竺:storyActorRoot+'officer-walk-sheet-v4.webp',
    管亥:'assets/level-06-beihai/animation/guan-hai/guan-hai-walk-v2.webp',
    太史慈:'assets/level-06-beihai/animation/taishi-ci/taishi-ci-walk-v2.webp',
    孟肃:'assets/level-06-beihai/animation/meng-su/meng-su-walk-v2.webp',
    郭嘉:'assets/level-07-xuzhou/units/guojia-walk-v1.webp',于禁:'assets/level-07-xuzhou/units/yujin-walk-v1.webp',
    糜芳:'assets/level-07-xuzhou/units/mifang-walk-v1.webp',孙乾:'assets/level-07-xuzhou/units/sunqian-walk-v1.webp',
    张辽:huainanStoryActorRoot+'zhang-liao-walk-sheet-v1.webp',侯成:huainanStoryActorRoot+'hou-cheng-walk-sheet-v1.webp',魏续:huainanStoryActorRoot+'wei-xu-walk-sheet-v1.webp',宋宪:huainanStoryActorRoot+'song-xian-walk-sheet-v1.webp',
    陈登:storyActorRoot+'officer-walk-sheet-v4.webp',文官:storyActorRoot+'officer-walk-sheet-v4.webp',
    袁胤:storyActorRoot+'officer-walk-sheet-v4.webp',曹豹:storyActorRoot+'officer-walk-sheet-v4.webp',董昭:storyActorRoot+'officer-walk-sheet-v4.webp',
    纪灵:storyActorRoot+'officer-walk-sheet-v4.webp',张绣:storyActorRoot+'officer-walk-sheet-v4.webp',陈纪:storyActorRoot+'officer-walk-sheet-v4.webp',陈宫:huainanStoryActorRoot+'chen-gong-walk-sheet-v1.webp'
  };
  const storyWorldActorAssets={
    华雄:'assets/story-actors/world-v1/hua-xiong-march-sheet-v1.webp',
    吕布:'assets/story-actors/world-v1/lv-bu-march-sheet-v1.webp',
    赵云:storyActorRoot+'zhao-yun-walk-sheet-v1.webp',
    张郃:'assets/level-05-jieqiao/core-animation/zhanghe/zhanghe-walk-v1.webp',
    颜良:'assets/level-05-jieqiao/core-animation/yanliang/yanliang-walk-v1.webp',
    麴义:'assets/level-05-jieqiao/core-animation/quyi/quyi-walk-v1.webp',
    管亥:'assets/level-06-beihai/animation/guan-hai/guan-hai-walk-v2.webp',
    太史慈:'assets/level-06-beihai/animation/taishi-ci/taishi-ci-walk-v2.webp'
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
  const storyHd2dRoot='assets/story-scenes/chapter-1-hd2d/';
  const storyLocationProfiles=[
    {match:/^陈留(?:营帐)?/,key:'chenliu-coalition',art:storyHd2dRoot+'xiaopei-cao-camp-hd2d-v1.webp',nav:{minX:3,maxX:28,minY:9,maxY:17,obstacles:[{x1:19,y1:4,x2:29,y2:11},{x1:3,y1:9,x2:7,y2:11},{x1:27,y1:14,x2:28,y2:17}]},depth:{farY:10,nearY:17,farScale:.76,nearScale:1.18}},
    {match:/汜水关至虎牢关|进军虎牢关/,key:'hulao-road',art:storyHd2dRoot+'hulao-pursuit-road-hd2d-v1.webp'},
    {match:/袁绍军营|公孙瓒军营/,key:'warlord-camp',art:storyHd2dRoot+'warlord-command-tent-hd2d-v1.webp',nav:{minX:4,maxX:28,minY:7,maxY:17,obstacles:[{x1:23,y1:5,x2:28,y2:7}]}},
    {match:/平原议事厅/,key:'pingyuan-hall',art:storyHd2dRoot+'pingyuan-council-hall-hd2d-v1.webp',nav:{minX:5,maxX:28,minY:7,maxY:17,obstacles:[{x1:23,y1:5,x2:28,y2:8},{x1:5,y1:7,x2:8,y2:10}]}},
    {match:/北平议事厅/,key:'beiping-hall',art:storyHd2dRoot+'beiping-command-hall-hd2d-v1.webp'},
    {match:/北海议事厅/,key:'beihai-hall',art:storyHd2dRoot+'beihai-council-hall-hd2d-v1.webp',nav:{minX:4,maxX:28,minY:7,maxY:17,obstacles:[{x1:23,y1:5,x2:28,y2:8},{x1:4,y1:7,x2:8,y2:10}]}},
    {match:/淮南议事厅/,key:'huainan-hall',art:'assets/level-10-huainan/huainan-council-hall-v1.webp'},
    {match:/徐州议事厅|小沛议事厅|许昌议事厅/,key:'xuzhou-hall',art:storyHd2dRoot+'xuzhou-council-hall-hd2d-v1.webp'},
    {match:/曹操军营帐/,key:'cao-camp',art:storyHd2dRoot+'xiaopei-cao-camp-hd2d-v1.webp'},
    {match:/北海城外|北海近郊/,key:'beihai-siege',art:storyHd2dRoot+'beihai-siege-hd2d-v1.webp'},
    {match:/北海至徐州|徐州近郊|进军徐州|徐州至小沛|小沛近郊|进军淮南|徐州至淮南|淮南至许昌|淮南战后/,key:'eastern-map',art:storyHd2dRoot+'eastern-campaign-map-hd2d-v1.webp'},
    {match:/平原至界桥|广川路线|进军广川|信都路线|进军信都|袁绍军进军信都|巨鹿路线|进军巨鹿|清河路线|进军清河|巨鹿近郊|清河近郊|界桥近郊|进军界桥|前往徐州/,key:'jizhou-map',art:storyHd2dRoot+'jizhou-campaign-map-hd2d-v1.webp'}
  ];
  function storyLocationProfile(location=''){return storyLocationProfiles.find(profile=>profile.match.test(location))||null}
  let storyLocationKey='';
  const firstRouteChoiceFlow=bootParams.has('routeChoice')&&level.id==='guangchuan';
  const secondRouteChoiceFlow=bootParams.has('secondRouteChoice')&&level.id==='julu';
  const routeChoiceFlow=firstRouteChoiceFlow||secondRouteChoiceFlow;
  const pendingCampaignAtBoot=(()=>{try{return JSON.parse(saveStorage.getItem('sanguozhi-zhaolie-campaign-v1')||'null')}catch(error){console.error('Cannot read pending campaign',error);return null}})();
  const xiaopeiChoiceFlow=level.id==='xiaopei'&&levelSelectActive&&!bootParams.has('xiaopeiBranch');
  const xiaopeiBranch=level.id==='xiaopei'?(bootParams.get('xiaopeiBranch')||pendingCampaignAtBoot?.postBattleChoice||(xiaopeiChoiceFlow?null:'fight')):null;
  const levelStory=level.id==='huainan'&&pendingCampaignAtBoot?.fromLevelId==='taishan'?(window.HUAINAN_CONTINUOUS_STORY||[]):level.id==='xiaopei'&&xiaopeiBranch==='negotiate'?(window.XIAOPEI_NEGOTIATE_STORY||[]):window.STORY_BY_LEVEL?.[level.id]||window.PRE_BATTLE_STORY||[];
  let preBattleStory=xiaopeiChoiceFlow?(window.XIAOPEI_PRE_BATTLE_STORY||[]).slice(3,10).map((line,index,rows)=>index===rows.length-1?{...line,xiaopeiRouteChoice:true}:line):level.id==='xiaopei'&&bootParams.has('xiaopeiResume')?(xiaopeiBranch==='negotiate'?levelStory.slice(3):levelStory.slice(10)):firstRouteChoiceFlow?levelStory.slice(0,14).map((line,index)=>index===13?{...line,routeChoice:true}:line):secondRouteChoiceFlow?levelStory.slice(0,5).map((line,index)=>index===4?{...line,routeChoice:true}:line):levelStory;
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
    wuzi:{name:'吴子兵法',effect:'defense',bonus:20},
    longSpear:{name:'长枪',effect:'classUpgrade',requiredLevel:15,fromClass:'短兵',toClass:'长兵'},
    repeatingCrossbow:{name:'连弩',effect:'classUpgrade',requiredLevel:15,fromClass:'弓兵',toClass:'连弩兵'},
    horseArmor:{name:'马铠',effect:'classUpgrade',requiredLevel:15,fromClass:'轻骑兵',toClass:'重骑兵'},
    banditManual:{name:'无赖精神',effect:'classUpgrade',requiredLevel:15,fromClass:'山贼',toClass:'恶贼'}
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
  function normalizeCanonicalUnit(u){
    if(u?.id!=='sunqian'&&u?.originalId!==63)return u;
    const priorMax=Math.max(1,Number(u.maxHp)||1),priorHp=Math.max(0,Number(u.hp)||priorMax),hpRatio=Math.min(1,priorHp/priorMax);
    u.troop='transport';u.className='运输队';u.weapon='护身短刀';delete u.range;
    const derived=originalDerivedStats(u);u.maxHp=derived.maxHp;u.hp=Math.max(0,Math.min(u.maxHp,Math.round(u.maxHp*hpRatio)));u.atk=derived.attack;u.def=derived.defense;u.move=derived.move;u.maxStrategy=derived.maxStrategy;u.strategy=Math.min(u.maxStrategy,Math.max(0,Number(u.strategy)||u.maxStrategy));
    return u
  }
  function createRuntimeUnit(u,spawnOrder,inventory=[]){return refreshPassiveTreasures(normalizeCanonicalUnit(applyPaintedDeploymentOverride({...u,acted:false,exp:0,turnMoveDistance:0,spawnOrder,inventory:[...inventory],treasureItems:treasureIdsFor(u)})))}
  let units = level.units.map((u,spawnOrder) => createRuntimeUnit(u,spawnOrder));
  let selected=null, inspected=null, phase='select', reachable=new Map(), attackable=[], moveOrigin=null, activeStrategy=null, activeItem=null, strategyFx=null, healFx=[], hoverPath=[], dangerVisible=false, dangerTiles=[], keyboardCursor=null;
  let playerTurn=true, turn=1, hover=null, gold=500, dialogue=null, dialogIndex=0, ending=false, battleStarted=false, introPlayed=false, prepBaseline=null,turnTransitionPending=false,duelInProgress=false;
  const timedEventsFired=new Set();
  const objectiveUnitId=level.objectiveUnitId||level.events?.duel?.defenderId||'hua';
  const MIN_ZOOM=.48,MAX_ZOOM=2.4;
  let tileW=72,tileH=36,originX=0,originY=90,zoom=1,panX=0,panY=0,drag=false,lastMouse=null,anim=null,combatFx=null,audioCtx=null,sfxBus=null,sfxLimiter=null,bgRect={x:0,y:0,w:1,h:1,scale:1};
  const touchPoints=new Map();let touchGesture=null,ignoreClickUntil=0;
  let battleOverview=false,battleFocus={x:units.find(u=>u.id==='liu')?.x??Math.floor(COLS/2),y:units.find(u=>u.id==='liu')?.y??Math.floor(ROWS/2)};
  const MUSIC_MIX_GAIN=.44,SFX_MIX_GAIN=2.1,SHOP_MUSIC_VOLUME_MULTIPLIER=1.3,TENT_MUSIC_VOLUME_MULTIPLIER=2.2,LUOYANG_MUSIC_VOLUME_MULTIPLIER=2,WORLD_MUSIC_VOLUME_MULTIPLIER=1.5,LEON_BATTLE_VOLUME_MULTIPLIER=1.3;
  const GLOBAL_MOVEMENT_SPEED=1.5;
  let musicEnabled=true,musicStarted=false,musicVolume=.34,sfxVolume=.85,musicSceneMultiplier=1,musicDuckTimer=null,animationSpeed=1,compactRepeatedAnimations=true;
  const seenCombatMotions=new Set();
  const brotherMergeSpoken=new Set();
  // Implemented subset of the original strategy system.  Unit access is
  // always filtered through the original troop-type and level table below.
  const strategies={
    fire:{name:'焦热',cost:4,range:3,hit:.70,target:'enemy'},
    recover:{name:'援助',cost:6,range:2,hit:1,target:'friendly'},
    encourage:{name:'激励',cost:4,range:2,hit:1,target:'friendly',morale:30}
  };
  const originalStrategyNames={fire:'焦热',falseReport:'虚言',encourage:'激励',whirlwind:'旋风',vortex:'漩涡',fortify:'坚固',recover:'援助'};
  function learnedStrategyIds(u){
    // The rule table contains the original progression, including tactics not
    // yet represented by this prototype.  Only implemented original tactics
    // can enter the command menu or either NPC AI.
    return BattleRules.learnedStrategies({troop:u.troop,level:u.level,override:level.strategyAccess?.[u.id]}).filter(id=>strategies[id])
  }
  function knowsStrategy(u,type){return learnedStrategyIds(u).includes(type)}
  const shopItems={
    bean:{name:'豆',price:100,recoverHp:200,detail:'恢复单体200兵力'},
    wheat:{name:'麦',price:200,recoverHp:400,detail:'恢复单体400兵力'},
    wine:{name:'酒',price:50,recoverMorale:50,detail:'恢复单体50士气'},
    premiumWine:{name:'特级酒',price:100,recoverMorale:100,detail:'恢复单体100士气'},
    moraleScroll:{name:'平气书',price:250,recoverMorale:25,detail:'恢复单体25士气'},
    injuryMedicine:{name:'伤药',price:300,recoverStrategy:30,detail:'恢复单体30策略'},
    supportScroll:{name:'援队书',price:500,recoverHp:300,detail:'恢复单体300兵力'},
    fireScroll:{name:'焦热书',price:50,detail:'必中单体火攻，树林伤害增加25%'},
    vortexScroll:{name:'漩涡书',price:80,detail:'必中单体水攻，河流与桥梁伤害增加25%'},
    rockScroll:{name:'落石书',price:100,detail:'必中单体落石'},
    fogScroll:{name:'浓雾书',price:50,detail:'降低敌军30士气，可能使其混乱'},
    bomb:{name:'炸弹',price:500,detail:'削减目标25%最大兵力'},
    longSpear:{name:'长枪',price:300,treasureId:'longSpear',detail:'短兵Lv.15以上的转职道具'},
    repeatingCrossbow:{name:'连弩',price:350,treasureId:'repeatingCrossbow',detail:'弓兵Lv.15以上的转职道具'},
    horseArmor:{name:'马铠',price:400,treasureId:'horseArmor',detail:'轻骑兵Lv.15以上的转职道具'},
    banditManual:{name:'无赖精神',price:200,treasureId:'banditManual',detail:'山贼Lv.15以上的转职道具'}
  };
  const consumableItemTypes=['bean','wheat','wine','premiumWine','moraleScroll','injuryMedicine','supportScroll','fireScroll','vortexScroll','rockScroll','fogScroll','bomb'];
  const shopPlans={
    chenliu:{location:'陈留幕舍',items:['fireScroll','wine','bean']},
    guangchuan:{location:'广川',items:['wine','bean','injuryMedicine']},
    xindu:{location:'信都',items:['wine','bean','injuryMedicine','fireScroll','vortexScroll','rockScroll']},
    beiping:{location:'北平',items:['wine','bean','fogScroll']},
    beihai:{location:'北海',items:['wine','bean','injuryMedicine','fireScroll','vortexScroll','rockScroll','bomb']},
    xuzhou:{location:'徐州',items:['wine','bean','injuryMedicine','moraleScroll','supportScroll']},
    xiaopei:{location:'小沛',items:['longSpear','repeatingCrossbow','horseArmor','banditManual','fireScroll','vortexScroll','rockScroll']}
  };
  function currentShopPlan(){
    if(level.id==='hulao-pass')return{location:'虎牢关追击途中',items:[],note:'原作两关连续作战，此处没有新的道具屋；可转交汜水关前购入的军需。'};
    const planId=level.id==='sishui-pass'?'chenliu':level.id==='guangchuan'?'guangchuan':level.id==='xindu'?'xindu':['julu','qinghe','jieqiao','beihai'].includes(level.id)?'beiping':level.id==='xuzhou'?'beihai':['xiaopei','taishan'].includes(level.id)?'xuzhou':'xiaopei';
    return shopPlans[planId]
  }
  const titleMusic=document.getElementById('titleMusic'),storyMusic=document.getElementById('storyMusic'),battleMusic=document.getElementById('battleMusic');
  const configuredBattleTrack=level.battleTrack||window.GAME_AUDIO_CONFIG?.battles?.[level.id];
  let activeBattleTrack=configuredBattleTrack||battleMusic.getAttribute('src')||'';
  const configuredShopTrack=window.GAME_AUDIO_CONFIG?.shop;
  if(activeBattleTrack)battleMusic.src=activeBattleTrack;
  let storyMusicId=2,storyMusicMode='story';
  const storyTrackByScene={prologue:2,palace:2,tent:14,luoyang:13,world:17};
  const storyMusicAssets={2:'assets/audio/original-music-2.opus',3:'assets/audio/original-music-3.opus',10:'assets/audio/original-music-10.opus',11:'assets/audio/original-music-11.opus',12:'assets/audio/original-music-12.opus',13:'assets/audio/romance-of-the-three-kingdoms-11-eternity.opus',14:'assets/audio/romance-of-the-three-kingdoms-11-spring-buds.opus',15:window.GAME_AUDIO_CONFIG?.events?.['xuzhou-taishici-turn5']||'assets/audio/langrisser-ii-ones-side.opus',16:window.GAME_AUDIO_CONFIG?.victory||'assets/audio/romance-of-the-three-kingdoms-13-emperors-theme-taoyuan-oath.opus',17:window.GAME_AUDIO_CONFIG?.stories?.world||'assets/audio/romance-of-the-three-kingdoms-11-prologue.opus'};
  const DEFAULT_CAMPAIGN_VICTORY_MUSIC_ID=16;
  function mixedMusicVolume(multiplier=musicSceneMultiplier){return Math.max(0,Math.min(1,musicVolume*MUSIC_MIX_GAIN*multiplier))}
  function storyMusicVolume(multiplier=musicSceneMultiplier){const sceneGain=storyMusicMode==='shop'?SHOP_MUSIC_VOLUME_MULTIPLIER:storyMusicId===14?TENT_MUSIC_VOLUME_MULTIPLIER:storyMusicId===13?LUOYANG_MUSIC_VOLUME_MULTIPLIER:storyMusicId===17?WORLD_MUSIC_VOLUME_MULTIPLIER:1;return mixedMusicVolume(multiplier*sceneGain)}
  function battleMusicVolume(multiplier=musicSceneMultiplier){const trackGain=activeBattleTrack===window.GAME_AUDIO_CONFIG?.events?.['huainan-lvbu-turn6']?LEON_BATTLE_VOLUME_MULTIPLIER:1;return mixedMusicVolume(multiplier*trackGain)}
  function applyMusicMix(multiplier=musicSceneMultiplier){const volume=mixedMusicVolume(multiplier);titleMusic.volume=volume;storyMusic.volume=storyMusicVolume(multiplier);battleMusic.volume=battleMusicVolume(multiplier)}
  function applySfxMix(){if(sfxBus)sfxBus.gain.value=Math.max(0,Math.min(2.4,sfxVolume*SFX_MIX_GAIN))}
  function duckMusicForSfx(name){
    if(!musicEnabled)return;
    const movement=['movementStep','hoofStep','footStep'].includes(name),heavy=['block','duelClash','duelFinish','impact','fall'].includes(name),strike=['attack','charge'].includes(name);
    clearTimeout(musicDuckTimer);applyMusicMix(musicSceneMultiplier*(heavy?.32:strike?.44:movement?.62:.5));
    musicDuckTimer=setTimeout(()=>applyMusicMix(),heavy?520:movement?190:360)
  }
  applyMusicMix();
  const logs=[],dialogueHistory=[];
  const SAVE_KEY='sanguozhi-zhaolie-save-v1',SAVE_SCHEMA=1,MANUAL_SLOT_COUNT=6,CAMPAIGN_KEY='sanguozhi-zhaolie-campaign-v1',CAMPAIGN_SCHEMA=1,CLEARED_LEVELS_KEY='sanguozhi-zhaolie-cleared-levels-v1',PORTABLE_SAVE_KIND='sanguozhi-zhaolie-portable-save',PORTABLE_SAVE_VERSION=1,IMPORT_BACKUP_KEY='sanguozhi-zhaolie-import-backup-v1',MAX_IMPORT_BYTES=10*1024*1024;
  const LEVEL_SELECT_IDS=['sishui-pass','hulao-pass','guangchuan','xindu','julu','qinghe','jieqiao','beihai','xuzhou','xiaopei','taishan','huainan'];
  let developerLevelsUnlocked=false;
  let saveMenuMode='save',saveMenuOrigin='game',autoSaveTimer=null,titleIntroActive=false,titleIntroFadeTimer=null,openingActive=false,openingDone=null,storyActive=false,storyIndex=0,storyDone=null,storyAuto=false,storyTimer=null,storyRouteChoicePending=false;
  let outcomeAction=restartBattle,campaignVictoryType=null;
  const initialPreBattleStory=preBattleStory;
  let huainanAftermathState=null;
  let storyScene='',storyActors=new Map(),storyFreeRoam=false,storyInteraction=null,storyInteractionIndex=0,storyInteractionDone=null,storyAdvanceLocked=false,storyMomentToken=0;
  function emptySaveStore(){return{schema:SAVE_SCHEMA,auto:null,manual:Array(MANUAL_SLOT_COUNT).fill(null)}}
  function readSaveStore(){try{const raw=saveStorage.getItem(SAVE_KEY);if(!raw)return emptySaveStore();const data=JSON.parse(raw);if(data?.schema!==SAVE_SCHEMA)return emptySaveStore();return{schema:SAVE_SCHEMA,auto:data.auto||null,manual:Array.from({length:MANUAL_SLOT_COUNT},(_,i)=>data.manual?.[i]||null)}}catch(error){console.error('Cannot read save store',error);return emptySaveStore()}}
  function writeSaveStore(store){try{saveStorage.setItem(SAVE_KEY,JSON.stringify(store));return true}catch(error){flash(error.message||'浏览器无法写入存档');return false}}
  function readCampaignTransferRaw(){try{const data=JSON.parse(saveStorage.getItem(CAMPAIGN_KEY)||'null');return data?.schema===CAMPAIGN_SCHEMA?data:null}catch(error){console.error('Cannot read campaign transfer',error);return null}}
  function normalizeClearedLevels(value){return[...new Set((Array.isArray(value)?value:[]).filter(id=>LEVEL_SELECT_IDS.includes(id)))]}
  function readClearedLevels(){let cleared=[];try{cleared=normalizeClearedLevels(JSON.parse(saveStorage.getItem(CLEARED_LEVELS_KEY)||'[]'))}catch(error){console.error('Cannot read cleared levels',error)}const store=readSaveStore();for(const save of [store.auto,...store.manual])if(save?.phaseType==='postbattle'&&LEVEL_SELECT_IDS.includes(save.levelId))cleared.push(save.levelId);const transfer=readCampaignTransferRaw();if(LEVEL_SELECT_IDS.includes(transfer?.fromLevelId))cleared.push(transfer.fromLevelId);return normalizeClearedLevels(cleared)}
  function writeClearedLevels(cleared){saveStorage.setItem(CLEARED_LEVELS_KEY,JSON.stringify(normalizeClearedLevels(cleared)))}
  function markLevelCleared(levelId=level.id){if(!LEVEL_SELECT_IDS.includes(levelId))return false;try{const cleared=readClearedLevels();if(cleared.includes(levelId))return true;cleared.push(levelId);writeClearedLevels(cleared);return true}catch(error){flash(error.message||'无法保存通关记录');return false}}
  function portableChecksum(text){let hash=2166136261;for(let i=0;i<text.length;i++)hash=Math.imul(hash^text.charCodeAt(i),16777619);return(hash>>>0).toString(16).padStart(8,'0')}
  function portablePayload(){return{saveStore:readSaveStore(),campaignTransfer:readCampaignTransferRaw(),clearedLevels:readClearedLevels()}}
  function portableSaveCount(store=readSaveStore()){return[store.auto,...store.manual].filter(storedSnapshot).length}
  function normalizePortableStore(store){if(!store||store.schema!==SAVE_SCHEMA||!Array.isArray(store.manual))throw new Error('存档版本不受支持');const normalized={schema:SAVE_SCHEMA,auto:store.auto||null,manual:Array.from({length:MANUAL_SLOT_COUNT},(_,i)=>store.manual[i]||null)};if(normalized.auto&&!storedSnapshot(normalized.auto))throw new Error('自动存档数据损坏');normalized.manual.forEach((save,i)=>{if(save&&!storedSnapshot(save))throw new Error(`档位 ${i+1} 数据损坏`)});return normalized}
  function normalizeCampaignTransfer(transfer){if(transfer===null||transfer===undefined)return null;if(transfer.schema!==CAMPAIGN_SCHEMA||!Array.isArray(transfer.units)||!transfer.fromLevelId||!transfer.toLevelId)throw new Error('关卡继承数据损坏');return transfer}
  function titleTransferNotice(message,error=false){const notice=document.getElementById('titleNotice'),hint=document.getElementById('saveMenuHint');if(notice){if(!('defaultText' in notice.dataset))notice.dataset.defaultText='';notice.textContent=message;notice.classList.toggle('transfer-error',error);notice.classList.toggle('transfer-ok',!error)}if(hint&&!document.getElementById('gameMenuOverlay').classList.contains('hidden'))hint.textContent=message;clearTimeout(titleTransferNotice.timer);titleTransferNotice.timer=setTimeout(()=>{if(notice){notice.textContent=notice.dataset.defaultText??'';notice.classList.remove('transfer-error','transfer-ok')}},7000)}
  function refreshPortableSaveButtons(){const hasData=portableSaveCount()>0||!!readCampaignTransferRaw();for(const id of ['titleExportSaveBtn','menuExportSaveBtn']){const button=document.getElementById(id);if(button)button.disabled=!hasData}let hasBackup=false;try{hasBackup=!!saveStorage.getItem(IMPORT_BACKUP_KEY)}catch(error){console.error('Cannot read import backup',error)}const undo=document.getElementById('titleUndoImportBtn');if(undo)undo.classList.toggle('hidden',!hasBackup)}
  function portableFilename(){const d=new Date(),pad=n=>String(n).padStart(2,'0');return`三国志昭烈传-存档-${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}.zhaolie-save.json`}
  async function exportPortableSave(){const payload=portablePayload(),count=portableSaveCount(payload.saveStore);if(!count&&!payload.campaignTransfer){titleTransferNotice('目前还没有可以导出的存档',true);return}const payloadText=JSON.stringify(payload),bundle={kind:PORTABLE_SAVE_KIND,formatVersion:PORTABLE_SAVE_VERSION,game:'三国志昭烈传',exportedAt:Date.now(),saveCount:count,payload,checksum:portableChecksum(payloadText)},text=JSON.stringify(bundle,null,2),filename=portableFilename(),file=new File([text],filename,{type:'application/json'});if(navigator.share&&navigator.canShare?.({files:[file]})){try{await navigator.share({title:'三国志昭烈传存档',text:`全部进度，共 ${count} 个存档`,files:[file]});titleTransferNotice(`已分享 ${count} 个存档`);return}catch(error){if(error?.name==='AbortError')return}}
    const url=URL.createObjectURL(file),link=document.createElement('a');link.href=url;link.download=filename;document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);titleTransferNotice(`已导出 ${count} 个存档，请妥善保存文件`)
  }
  function applyPortablePayload(payload,{createBackup=true}={}){const saveStore=normalizePortableStore(payload?.saveStore),campaignTransfer=normalizeCampaignTransfer(payload?.campaignTransfer),clearedLevels=normalizeClearedLevels(payload?.clearedLevels),previous={saveStore:readSaveStore(),campaignTransfer:readCampaignTransferRaw(),clearedLevels:readClearedLevels()};if(window.ZhaolieCloud?.account()){window.ZhaolieCloud.replacePayload({saveStore,campaignTransfer,clearedLevels},{createBackup});return portableSaveCount(saveStore)}if(createBackup)saveStorage.setItem(IMPORT_BACKUP_KEY,JSON.stringify({kind:PORTABLE_SAVE_KIND,savedAt:Date.now(),payload:previous}));try{saveStorage.setItem(SAVE_KEY,JSON.stringify(saveStore));if(campaignTransfer)saveStorage.setItem(CAMPAIGN_KEY,JSON.stringify(campaignTransfer));else saveStorage.removeItem(CAMPAIGN_KEY);writeClearedLevels(clearedLevels)}catch(error){saveStorage.setItem(SAVE_KEY,JSON.stringify(previous.saveStore));if(previous.campaignTransfer)saveStorage.setItem(CAMPAIGN_KEY,JSON.stringify(previous.campaignTransfer));else saveStorage.removeItem(CAMPAIGN_KEY);writeClearedLevels(previous.clearedLevels);throw error}return portableSaveCount(saveStore)}
  async function importPortableSaveFile(file){try{if(!file)throw new Error('没有选择存档文件');if(file.size>MAX_IMPORT_BYTES)throw new Error('存档文件过大，无法导入');const bundle=JSON.parse(await file.text());if(bundle?.kind!==PORTABLE_SAVE_KIND||bundle.formatVersion!==PORTABLE_SAVE_VERSION||!bundle.payload)throw new Error('这不是《三国志昭烈传》的存档文件');if(bundle.checksum!==portableChecksum(JSON.stringify(bundle.payload)))throw new Error('存档校验失败，文件可能已损坏');const count=applyPortablePayload(bundle.payload);refreshContinueButton();renderSaveSlots();refreshPortableSaveButtons();titleTransferNotice(`导入成功：恢复 ${count} 个存档；原存档已自动备份`)}catch(error){titleTransferNotice(error?.message||'存档导入失败',true)}finally{const input=document.getElementById('saveImportInput');if(input)input.value=''}}
  function choosePortableSaveFile(){const input=document.getElementById('saveImportInput');input.value='';input.click()}
  function undoPortableImport(){try{const backup=JSON.parse(saveStorage.getItem(IMPORT_BACKUP_KEY)||'null');if(backup?.kind!==PORTABLE_SAVE_KIND||!backup.payload)throw new Error('没有可恢复的导入前存档');const count=applyPortablePayload(backup.payload,{createBackup:false});saveStorage.removeItem(IMPORT_BACKUP_KEY);refreshContinueButton();renderSaveSlots();refreshPortableSaveButtons();titleTransferNotice(`已恢复导入前的 ${count} 个存档`)}catch(error){titleTransferNotice(error?.message||'无法撤销导入',true)}}
  function clearCampaignTransfer(){try{saveStorage.removeItem(CAMPAIGN_KEY)}catch(error){flash(error.message||'无法清除跨关进度')}}
  function readCampaignTransfer(){try{const data=JSON.parse(saveStorage.getItem(CAMPAIGN_KEY)||'null'),firstBranch=data?.fromLevelId==='hulao-pass'&&['guangchuan','xindu'].includes(data?.toLevelId)&&['guangchuan','xindu'].includes(level.id),secondBranch=['guangchuan','xindu'].includes(data?.fromLevelId)&&['julu','qinghe'].includes(data?.toLevelId)&&['julu','qinghe'].includes(level.id),jieqiaoMerge=['julu','qinghe'].includes(data?.fromLevelId)&&data?.toLevelId==='jieqiao'&&level.id==='jieqiao',beihaiContinue=data?.fromLevelId==='jieqiao'&&data?.toLevelId==='beihai'&&level.id==='beihai',xuzhouContinue=data?.fromLevelId==='beihai'&&data?.toLevelId==='xuzhou'&&level.id==='xuzhou',xiaopeiContinue=data?.fromLevelId==='xuzhou'&&data?.toLevelId==='xuzhou-postbattle'&&level.id==='xiaopei',taishanContinue=['xiaopei','xiaopei-negotiate'].includes(data?.fromLevelId)&&['xiaopei-postbattle','taishan'].includes(data?.toLevelId)&&level.id==='taishan';return data?.schema===CAMPAIGN_SCHEMA&&(data.toLevelId===level.id||firstBranch||secondBranch||jieqiaoMerge||beihaiContinue||xuzhouContinue||xiaopeiContinue||taishanContinue)?data:null}catch(error){console.error('Cannot read campaign transfer',error);return null}}
  function resolvedNextLevelId(){
    if(level.nextLevelId)return level.nextLevelId;
    const transfer=readCampaignTransferRaw();
    if(transfer?.schema===CAMPAIGN_SCHEMA&&transfer.fromLevelId===level.id&&transfer.toLevelId!=='xuzhou-postbattle')return transfer.toLevelId;
    // A Taishan battle opened before Huainan shipped can still finish after the update.
    return level.id==='taishan'&&window.LEVEL_10_HUAINAN?'huainan':null
  }
  function writeCampaignTransfer(victoryType=campaignVictoryType){
    markLevelCleared();
    const nextLevelId=resolvedNextLevelId();if(!nextLevelId)return false;
    const nextLevel=nextLevelId==='hulao-pass'?window.LEVEL_02:nextLevelId==='guangchuan'?window.LEVEL_03_GUANGCHUAN:nextLevelId==='julu'?window.LEVEL_04_JULU:nextLevelId==='qinghe'?window.LEVEL_04_QINGHE:nextLevelId==='jieqiao'?window.LEVEL_05_JIEQIAO:nextLevelId==='beihai'?window.LEVEL_06_BEIHAI:nextLevelId==='xuzhou'?window.LEVEL_07_XUZHOU:nextLevelId==='xiaopei'?window.LEVEL_08_XIAOPEI:nextLevelId==='taishan'?window.LEVEL_09_TAISHAN:nextLevelId==='huainan'?window.LEVEL_10_HUAINAN:null;if(!nextLevel)return false;
    const carryIds=new Set(nextLevel.units.filter(u=>u.carryover).map(u=>u.id));
    const payload={schema:CAMPAIGN_SCHEMA,fromLevelId:level.id,toLevelId:nextLevelId,savedAt:Date.now(),victoryType:victoryType||'normal',gold:gold+(level.id==='beihai'&&nextLevelId==='xuzhou'?500:0),units:units.filter(u=>carryIds.has(u.id)).map(u=>({id:u.id,level:u.level,exp:u.exp||0,inventory:[...(u.inventory||[])],treasureItems:[...(u.treasureItems||[])]}))};
    try{saveStorage.setItem(CAMPAIGN_KEY,JSON.stringify(payload));return true}catch(error){flash(error.message||'无法保存跨关进度');return false}
  }
  function applyCampaignTransfer(runtimeUnits){
    if(levelSelectActive)return applyLevelSelectBalance(runtimeUnits);
    const transfer=readCampaignTransfer();if(!transfer)return{units:runtimeUnits,gold:500,applied:false};
    const carried=new Map((transfer.units||[]).map(u=>[u.id,u]));
    runtimeUnits.forEach(u=>{if(u.requiredCampaignFlag&&transfer[u.requiredCampaignFlag]!==true){u.side='reserve';return}const saved=u.carryover?carried.get(u.id):null;if(!saved)return;u.level=Math.max(u.level,Number(saved.level)||u.level);u.exp=Math.max(0,Math.min(99,Number(saved.exp)||0));u.inventory=Array.isArray(saved.inventory)?[...saved.inventory]:[];u.treasureItems=Array.isArray(saved.treasureItems)?[...saved.treasureItems]:treasureIdsFor(u);const derived=originalDerivedStats(u);u.maxHp=derived.maxHp;u.hp=u.maxHp;u.maxStrategy=derived.maxStrategy;u.strategy=u.maxStrategy;u.morale=100;refreshPassiveTreasures(u)});
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
  function snapshotLevelId(save){if(save?.levelId)return save.levelId;return save?.levelName==='淮南之战'?'huainan':save?.levelName==='泰山之战'?'taishan':save?.levelName==='小沛之战'?'xiaopei':save?.levelName==='徐州之战'?'xuzhou':save?.levelName==='北海之战'?'beihai':save?.levelName==='界桥之战'?'jieqiao':save?.levelName==='清河之战'?'qinghe':save?.levelName==='巨鹿之战'?'julu':save?.levelName==='信都之战'?'xindu':save?.levelName==='广川之战'?'guangchuan':save?.levelName==='虎牢关之战'?'hulao-pass':save?.levelName==='汜水关之战'?'sishui-pass':null}
  function storedSnapshot(save){if(!save||save.schema!==SAVE_SCHEMA||!snapshotLevelId(save))return false;if(save.phaseType==='story')return Number.isInteger(save.storyIndex)&&Array.isArray(save.storyActors);if(save.phaseType==='prep')return true;return!!(Array.isArray(save.units)&&Array.isArray(save.map)&&save.map.every(row=>Array.isArray(row)))}
  function validSnapshot(save){if(!storedSnapshot(save)||snapshotLevelId(save)!==level.id)return false;if(save.phaseType==='story')return save.storyIndex>=0&&save.storyIndex<(level.id==='huainan'?(save.huainanStoryEntry==='continuous'?window.HUAINAN_CONTINUOUS_STORY:window.HUAINAN_LEVEL_SELECT_STORY).length:preBattleStory.length);if(save.phaseType==='prep')return true;return save.units.length===level.units.length&&save.map.length===ROWS&&save.map.every(row=>row.length===COLS)}
  function makeSnapshot(kind,slot=null){return{schema:SAVE_SCHEMA,levelId:level.id,levelName:level.name,chapter:level.chapter,kind,slot,savedAt:Date.now(),turn,side:playerTurn?'我军阶段':'敌军阶段',gold,playerTurn,phase:'select',battleStarted:true,dangerVisible,levelSelectBalanced:levelSelectActive,balanceLevel:selectedBalanceLevel,leaderboardClock:window.ZhaolieLeaderboard?.snapshotClock?.()||null,units:JSON.parse(JSON.stringify(units)),map:map.map(row=>[...row]),logs:logs.slice(-8),brotherMergeSpoken:[...brotherMergeSpoken],timedEventsFired:[...timedEventsFired],battleMusicTrack:activeBattleTrack}}
  function makeStorySnapshot(kind,slot=null,phaseType='story'){
    if(huainanAftermathState)return {...makeSnapshot(kind,slot),phaseType:'postbattle',side:'战后剧情',postBattleTitle:'淮南战后',postBattleText:huainanAftermathState.summary,postBattleAction:'pending',huainanAftermath:{...huainanAftermathState,index:storyIndex,actors:[...storyActors.values()].map(({name,x,y,dir,sprite})=>({name,x,y,dir,sprite}))}};
    return{schema:SAVE_SCHEMA,levelId:level.id,levelName:level.name,chapter:level.chapter,kind,slot,savedAt:Date.now(),turn:0,side:phaseType==='prep'?'战前整备':'剧情',gold,phaseType,huainanStoryRevision:level.id==='huainan'?2:undefined,huainanStoryEntry:level.id==='huainan'?(preBattleStory===window.HUAINAN_CONTINUOUS_STORY?'continuous':'select'):undefined,storyIndex,storyScene,storyActors:[...storyActors.values()].map(({name,x,y,dir,sprite})=>({name,x,y,dir,sprite})),campaignTransfer:readCampaignTransferRaw(),routeChoiceFlow:routeChoiceFlow||undefined,levelSelectBalanced:levelSelectActive,balanceLevel:selectedBalanceLevel}
  }
  function saveGame(kind='auto',slot=null,{quiet=false}={}){
    if(!storyActive&&(!battleStarted||ending||dialogue||phase==='animating'||!playerTurn)){if(!quiet)flash('当前状态暂时不能存档');return false}
    const store=readSaveStore(),snapshot=storyActive?makeStorySnapshot(kind,slot):makeSnapshot(kind,slot);
    if(kind==='auto')store.auto=snapshot;else if(Number.isInteger(slot)&&slot>=0&&slot<MANUAL_SLOT_COUNT)store.manual[slot]=snapshot;else return false;
    if(!writeSaveStore(store))return false;refreshContinueButton();if(!quiet){flash(kind==='auto'?'已自动存档':`已保存到档位 ${slot+1}`);status(kind==='auto'?'自动存档完成':`进度已保存到档位 ${slot+1}`)}renderSaveSlots();if(kind==='manual')window.ZhaolieCloud?.flush().catch(error=>flash(error.message));return true
  }
  function scheduleAutoSave(delayMs=120){clearTimeout(autoSaveTimer);autoSaveTimer=setTimeout(()=>saveGame('auto',null,{quiet:true}),delayMs)}
  function latestSaveEntry(){const store=readSaveStore(),all=[{save:store.auto,token:'auto'},...store.manual.map((save,index)=>({save,token:String(index)}))].filter(entry=>storedSnapshot(entry.save));return all.sort((a,b)=>b.save.savedAt-a.save.savedAt)[0]||null}
  function latestSave(){return latestSaveEntry()?.save||null}
  function openStoredSnapshot(save,token){if(!storedSnapshot(save))return false;const targetId=snapshotLevelId(save),needsRouteFlow=!!save.routeChoiceFlow&&!routeChoiceFlow;if(targetId!==level.id||needsRouteFlow){const params=new URLSearchParams();params.set('level',targetId==='huainan'?'12':targetId==='taishan'?'11':targetId==='xiaopei'?'10':targetId==='xuzhou'?'9':targetId==='beihai'?'8':targetId==='jieqiao'?'7':targetId==='qinghe'?'6':targetId==='julu'?'5':targetId==='xindu'?'4':targetId==='guangchuan'?'3':targetId==='hulao-pass'?'2':'1');params.set('loadSlot',token);if(save.routeChoiceFlow)params.set(['julu','qinghe'].includes(targetId)?'secondRouteChoice':'routeChoice','1');if(save.levelSelectBalanced)params.set('levelSelect','1');preserveDialogueMode(params);location.href=`${location.pathname}?${params}`;return true}return loadSnapshot(save)}
  function formatSaveTime(timestamp){if(!timestamp)return'';try{return new Intl.DateTimeFormat('zh-CN',{month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date(timestamp))}catch{return new Date(timestamp).toLocaleString()}}
  function refreshContinueButton(){const hasSave=!!latestSave();document.getElementById('continueGameBtn').disabled=!hasSave;refreshPortableSaveButtons()}
  window.addEventListener('zhaolie-saves-changed',()=>{refreshContinueButton();renderSaveSlots()});
  function renderSaveSlots(){
    const root=document.getElementById('saveSlots');if(!root)return;const store=readSaveStore(),entries=[{label:'自动存档',save:store.auto,auto:true},...store.manual.map((save,i)=>({label:`档位 ${i+1}`,save,index:i}))];
    root.innerHTML=entries.map(entry=>{const save=storedSnapshot(entry.save)?entry.save:null,disabled=saveMenuMode==='load'&&!save||saveMenuMode==='save'&&entry.auto,progress=save?.phaseType==='story'?`剧情 ${save.storyIndex+1}/${preBattleStory.length}`:save?.phaseType==='prep'?'战前整备':save?.phaseType==='postbattle'?(save.huainanAftermath&&!save.huainanAftermath.complete?`战后剧情 ${save.huainanAftermath.index+1}/9`:'战后已结算'):`第 ${save?.turn} 回合`;return`<button class="save-slot ${entry.auto?'auto':''} ${save?'':'empty'}" data-slot="${entry.auto?'auto':entry.index}" ${disabled?'disabled':''}><span class="slot-label">${entry.label}</span><span class="slot-meta">${save?`<b>${save.chapter} · ${save.levelName}</b><small>${progress} · ${save.side} · 金 ${save.gold}</small>`:'<b>空档位</b><small>'+(entry.auto?'系统将在关键节点自动保存':'点击此处保存当前进度')+'</small>'}</span>${save?`<time>${formatSaveTime(save.savedAt)}</time>`:''}</button>`}).join('');
    root.querySelectorAll('.save-slot').forEach(button=>button.onclick=()=>{const token=button.dataset.slot;if(saveMenuMode==='save'){if(token==='auto')return;saveGame('manual',Number(token));return}const save=token==='auto'?readSaveStore().auto:readSaveStore().manual[Number(token)];if(storedSnapshot(save)){if(saveMenuOrigin==='title')requestGameFullscreen();openStoredSnapshot(save,token)}})
  }
  function openGameMenu(mode='save',origin='game'){
    if(origin==='game'&&(dialogue||phase==='animating'||ending)){flash('请等待当前演出结束');return}
    if(origin==='game')cancelAction();saveMenuMode=mode;saveMenuOrigin=origin;const overlay=document.getElementById('gameMenuOverlay');overlay.classList.toggle('from-title',origin==='title');overlay.classList.toggle('from-story',origin==='story');overlay.classList.remove('hidden');document.getElementById('gameMenuTitle').textContent=mode==='save'?'保存进度':'读取进度';document.getElementById('saveTabBtn').classList.toggle('active',mode==='save');document.getElementById('loadTabBtn').classList.toggle('active',mode==='load');document.getElementById('saveTabBtn').disabled=origin==='title'||(!battleStarted&&!storyActive);document.getElementById('resumeGameBtn').textContent=origin==='title'?'返回开始画面':origin==='story'?'返回剧情':'返回游戏';const prepButton=document.getElementById('battlePrepBtn');prepButton.classList.toggle('hidden',origin==='title'||origin==='story');prepButton.disabled=origin!=='game';prepButton.textContent=battleStarted?'重新整备本关':'战前整备';document.getElementById('returnTitleBtn').classList.toggle('hidden',origin==='title'||origin==='story');document.getElementById('saveMenuHint').textContent=mode==='save'?(storyActive?'选择手动档位保存当前剧情位置；重要节点会自动保存。':battleStarted?'选择手动档位保存；自动存档由系统维护。':'开始战斗后才能保存。'):'选择已有进度继续游戏。';renderSaveSlots()
  }
  function closeGameMenu(){const overlay=document.getElementById('gameMenuOverlay');overlay.classList.add('hidden');overlay.classList.remove('from-story','from-title')}
  function titleVisible(){return!document.getElementById('titleScreen').classList.contains('hidden')}
  function revealTitleMenu(animate=false){
    const screen=document.getElementById('titleScreen'),overlay=document.getElementById('titleIntro'),video=document.getElementById('titleIntroVideo');
    titleIntroActive=false;clearTimeout(titleIntroFadeTimer);video.pause();screen.classList.remove('intro-playing');overlay.classList.toggle('finishing',animate);overlay.classList.toggle('hidden',!animate);
    if(animate)titleIntroFadeTimer=setTimeout(()=>{overlay.classList.add('hidden');overlay.classList.remove('finishing')},620)
  }
  function showTitle(){closeGameMenu();revealTitleMenu(false);document.getElementById('settingsPanel').classList.add('hidden');document.getElementById('settingsPanel').classList.remove('title-open');document.getElementById('titleScreen').classList.remove('hidden');window.dispatchEvent(new Event('zhaolie-gameplay-stop'));refreshContinueButton();storyMusic.pause();battleMusic.pause();startTitleMusic()}
  function hideTitle(playMusic=true){document.getElementById('titleScreen').classList.add('hidden');window.dispatchEvent(new Event('zhaolie-gameplay-start'));titleMusic.pause();titleMusic.volume=mixedMusicVolume();if(playMusic)startBattleMusic()}
  function finishTitleIntro(){
    if(!titleIntroActive)return;revealTitleMenu(true);startTitleMusic()
  }
  function playTitleIntro(){
    const screen=document.getElementById('titleScreen'),overlay=document.getElementById('titleIntro'),video=document.getElementById('titleIntroVideo');titleIntroActive=true;screen.classList.add('intro-playing');overlay.classList.remove('hidden','finishing');storyMusic.pause();battleMusic.pause();titleMusic.currentTime=0;startTitleMusic();video.currentTime=0;video.muted=true;const playback=video.play();if(playback)playback.catch(finishTitleIntro)
  }
  function clearStoryPlayback(){
    storyMomentToken++;clearTimeout(storyTimer);storyActive=false;storyAuto=false;storyFreeRoam=false;storyAdvanceLocked=false;storyInteraction=null;storyInteractionDone=null;storyRouteChoicePending=false;storyDone=null;
    storyActors.forEach(actor=>{stopStoryGesture(actor,false);stopStoryWalk(actor);actor.el?.remove()});storyActors.clear();
    document.getElementById('storyOverlay').classList.add('hidden');document.getElementById('storyAutoBtn').classList.remove('active');
    preBattleStory=initialPreBattleStory;huainanAftermathState=null;
  }
  function resetBattleState(){
    clearStoryPlayback();
    battleOverview=false;battleFocus=null;zoom=1;panX=0;panY=0;clearTimeout(autoSaveTimer);autoSaveTimer=null;anim=null;combatFx=null;stalledAnimationSince=0;document.getElementById('touchOverview').setAttribute('aria-pressed','false');
    window.ZhaolieLeaderboard?.reset?.(level);
    const transfer=applyCampaignTransfer(level.units.map((u,spawnOrder)=>createRuntimeUnit(u,spawnOrder)));units=transfer.units;const focusUnit=units.find(u=>u.id==='liu');battleFocus=focusUnit?{x:focusUnit.x,y:focusUnit.y}:null;map.splice(0,map.length,...buildRuntimeMap());selected=null;inspected=null;phase='select';reachable.clear();attackable=[];moveOrigin=null;activeStrategy=null;activeItem=null;strategyFx=null;healFx=[];hoverPath=[];dangerVisible=false;dangerTiles=[];keyboardCursor=null;playerTurn=true;turnTransitionPending=false;duelInProgress=false;turn=1;hover=null;gold=transfer.gold;capturePrepBaseline();dialogue=null;dialogIndex=0;ending=false;battleStarted=false;introPlayed=false;outcomeAction=restartBattle;logs.splice(0);brotherMergeSpoken.clear();timedEventsFired.clear();setBattleMusicTrack(configuredBattleTrack,{play:false});document.getElementById('turnNumber').textContent=turn;document.getElementById('sideLabel').textContent='我军阶段';syncLevelBalanceBadge(!!transfer.balanced,transfer.balanceLevel);document.getElementById('dialogOverlay').classList.add('hidden');document.getElementById('outcomeOverlay').classList.add('hidden');document.getElementById('shopOverlay').classList.add('hidden');document.getElementById('restartBtn').textContent='重新挑战';syncShop();syncUI();draw();status(transfer.balanced?`${level.name}已载入 · 选关均衡等级 Lv.${transfer.balanceLevel}`:transfer.applied?`${level.name}已载入 · 上一战部队已整补继承`:`${level.name}已载入`)
  }
  async function commenceBattle(){
    battleStarted=true;window.ZhaolieLeaderboard?.start?.(level);storyMusic.pause();startBattleMusic();document.getElementById('shopOverlay').classList.add('hidden');closeGameMenu();addLog(`战前整备完成 · 余金${gold} · 盟军${units.filter(u=>u.side==='guest').length}人`,true);syncUI();draw();
    if(introPlayed){status('请选择我军单位');scheduleAutoSave(0);return}
    introPlayed=true;
    const beginBattleIntro=()=>runDialogue(level.intro,()=>{phase='select';flash(`${level.name} · 我军阶段`);status('请选择我军单位');scheduleAutoSave(0)});
    const openings=level.openingDuelSequence||(level.openingDuel?[level.openingDuel]:[]);
    for(const opening of openings){const winner=units.find(u=>u.id===opening.winnerId),loser=units.find(u=>u.id===opening.loserId);if(!winner||!loser||loser.hp<=0)continue;if(opening.spawnWinner){winner.side=opening.spawnWinner.side||'guest';winner.x=opening.spawnWinner.x;winner.y=opening.spawnWinner.y;winner.hp=winner.maxHp;draw()}await new Promise(resolve=>runDialogue(opening.challenge||[],resolve));phase='animating';status(`${winner.name} 单挑 ${loser.name}`);await playDuelCinematic(winner,loser,opening);if(opening.loserDefeated){loser.hp=0;loser.side='defeated'}else if(opening.moveLoser){loser.x=opening.moveLoser.x;loser.y=opening.moveLoser.y}syncUI();draw();await new Promise(resolve=>runDialogue(opening.exchange||[],resolve));addLog(`${winner.name}阵前${opening.loserDefeated?'击败':'逼退'}${loser.name}`,true)}
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
    const el=actor.el||storyActorElement(actor),profile=storyLocationProfiles.find(item=>item.key===storyLocationKey),perspective=profile?.depth,progress=perspective?Math.max(0,Math.min(1,(actor.y-perspective.farY)/Math.max(1,perspective.nearY-perspective.farY))):Math.max(0,Math.min(1,(actor.y-6)/12)),depth=perspective?perspective.farScale+(perspective.nearScale-perspective.farScale)*progress:.86+progress*.18;el.style.left=`${actor.x/32*100}%`;el.style.top=`${actor.y/20*100}%`;el.style.zIndex=String(100+Math.round(actor.y*10));el.style.setProperty('--story-depth',depth.toFixed(3));el.style.setProperty('--story-move-ms',`${moveMs}ms`);renderStoryActorFrame(actor);if(animate)startStoryWalk(actor)
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
    const nav=storyLocationProfiles.find(profile=>profile.key===storyLocationKey)?.nav||storySceneNavigation[storyScene];if(nav&&(x<nav.minX||x>nav.maxX||y<nav.minY||y>nav.maxY))return true;
    if(nav?.obstacles.some(o=>x>=o.x1&&x<=o.x2&&y>=o.y1&&y<=o.y2))return true;
    if(ignoreActors)return false;return[...storyActors.values()].some(other=>other!==actor&&other.name!==allowName&&Math.round(other.x)===x&&Math.round(other.y)===y)
  }
  function nearestStoryWalkable(actor,targetX,targetY,options={}){
    const nav=storyLocationProfiles.find(profile=>profile.key===storyLocationKey)?.nav||storySceneNavigation[storyScene],rawX=Math.round(targetX),rawY=Math.round(targetY),minX=nav?.minX??0,maxX=nav?.maxX??32,minY=nav?.minY??0,maxY=nav?.maxY??20;
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
    let stepIndex=0;for(const [x,y] of path){if(!storyActive||storyActors.get(actor.name)!==actor)break;const dx=x-actor.x,dy=y-actor.y;actor.dir=storyDirection(dx,dy,actor.dir);actor.x=x;actor.y=y;positionStoryActor(actor,false,stepMs);if(stepIndex++%2===0)battleSfx('footStep',actor,{alternate:stepIndex%4>1,terrain:'grass'});await storyWait(stepMs)}
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
  function setStoryCamera(speaker,line={}){
    const stage=document.getElementById('storyStage');if(!stage)return;const actor=storyActors.get(speaker),wide=storyScene==='prologue'||storyScene==='world'||storyFreeRoam||!actor||['史官','军报','提示'].includes(speaker),zoom=wide?1:1.025;
    const x=wide?0:Math.max(-1.8,Math.min(1.8,(16-actor.x)*.13)),y=wide?0:Math.max(-1.05,Math.min(1.05,(10.5-actor.y)*.09));stage.style.setProperty('--story-camera-x',`${x.toFixed(2)}%`);stage.style.setProperty('--story-camera-y',`${y.toFixed(2)}%`);stage.style.setProperty('--story-camera-zoom',String(zoom));stage.dataset.cameraTarget=wide?'wide':speaker
  }
  function setStoryScene(scene,location=''){
    storyScene=scene;const profile=storyLocationProfile(location),overlay=document.getElementById('storyOverlay'),backdrop=document.getElementById('storyBackdrop'),stage=document.getElementById('storyStage');storyLocationKey=profile?.key||'';overlay.dataset.scene=scene;overlay.dataset.storyArt=profile?'custom':'base';overlay.classList.toggle('prologue',scene==='prologue');backdrop.dataset.scene=scene;backdrop.dataset.art=storyLocationKey;if(profile?.art){backdrop.style.backgroundImage=`linear-gradient(#08111b12,#03060c2e),url('${profile.art}')`;backdrop.style.backgroundSize='cover';backdrop.style.backgroundPosition='center'}else{backdrop.style.backgroundImage='';backdrop.style.backgroundSize='';backdrop.style.backgroundPosition=''}backdrop.classList.remove('scene-enter');void backdrop.offsetWidth;backdrop.classList.add('scene-enter');if(stage){stage.style.setProperty('--story-camera-x','0%');stage.style.setProperty('--story-camera-y','0%');stage.style.setProperty('--story-camera-zoom','1');stage.classList.remove('camera-cut');void stage.offsetWidth;stage.classList.add('camera-cut')}startStoryMusic(storyTrackByScene[scene]||2)
  }
  function primeStoryDialogue(speaker,text){
    const portrait=document.getElementById('storyPortrait'),img=document.getElementById('storyPortraitImage'),mark=document.getElementById('storyPortraitMark'),src=storyPortraits[speaker],styledText=window.ZhaolieDialogue?.romance?.(text,speaker)||text;portrait.dataset.speaker=speaker;document.getElementById('storySpeaker').textContent=speaker;document.getElementById('storyText').textContent=styledText;
    if(src){img.src=src;img.alt=`${speaker}立绘`;img.classList.remove('hidden');mark.classList.add('hidden')}else{img.classList.add('hidden');mark.classList.remove('hidden');mark.textContent=speaker==='史官'?'史':speaker==='提示'?'令':speaker[0]||'军'}
  }
  function setStoryDialogue(speaker,text,gesture='talk'){
    primeStoryDialogue(speaker,text);
    storyActors.forEach(actor=>{const speaking=actor.name===speaker;actor.el?.classList.toggle('speaking',speaking);stopStoryGesture(actor);if(speaking)startStoryGesture(actor,gesture)});setStoryCamera(speaker)
  }
  function syncStoryRouteChoice(line){
    const conversation=line?.conversationChoices||null,xiaopeiRoute=!!line?.xiaopeiRouteChoice;storyRouteChoicePending=!!line?.routeChoice||xiaopeiRoute||!!conversation;const overlay=document.getElementById('storyOverlay'),choices=document.getElementById('storyRouteChoices'),autoButton=document.getElementById('storyAutoBtn'),skipButton=document.getElementById('storySkipBtn');overlay.classList.toggle('route-choice',storyRouteChoicePending);choices.classList.toggle('hidden',!storyRouteChoicePending);autoButton.disabled=storyFreeRoam||storyRouteChoicePending;skipButton.disabled=storyRouteChoicePending;skipButton.textContent=conversation?'请选择交谈对象':storyRouteChoicePending?'请选择路线':routeChoiceFlow?'前往路线选择':'跳过剧情';
    if(storyRouteChoicePending){const buttons=[...choices.querySelectorAll('[data-story-route]')],second=secondRouteChoiceFlow,definitions=conversation?conversation.map(item=>[String(item.target),item.title,item.description||'']):xiaopeiRoute?[['fight','正面迎战曹操','进入小沛之战，提前击退曹军可获金300'],['negotiate','派张飞前往议和','跳过战斗，不生成战绩和战斗奖励']]:second?[['5','第四战A · 巨鹿路线','驰援公孙越，迎战张郃'],['6','第四战B · 清河路线','驰援严纲，迎战麴义']]:[['3','第三战A · 广川路线','路程较短，迎战逢纪'],['4','第三战B · 信都路线','驰援信都，迎战淳于琼']];buttons.forEach((button,index)=>{const item=definitions[index];button.classList.toggle('hidden',!item);button.dataset.storyTarget='';button.dataset.storyRoute='';button.dataset.xiaopeiBranch='';if(!item)return;const [target,title,description]=item;if(conversation)button.dataset.storyTarget=target;else if(xiaopeiRoute)button.dataset.xiaopeiBranch=target;else button.dataset.storyRoute=target;button.querySelector('b').textContent=title;button.querySelector('span').textContent=description});storyAuto=false;autoButton.classList.remove('active');clearTimeout(storyTimer);status(conversation?'请选择孔融、太史慈或关羽交谈':xiaopeiRoute?'请选择正面迎战或派张飞议和':second?'请选择巨鹿路线或清河路线':'请选择广川路线或信都路线')}
  }
  function chooseStoryOption(button){const target=Number(button.dataset.storyTarget);if(Number.isInteger(target)&&button.dataset.storyTarget!==''){storyRouteChoicePending=false;document.getElementById('storyRouteChoices').classList.add('hidden');document.getElementById('storyOverlay').classList.remove('route-choice');storyIndex=Math.max(0,Math.min(preBattleStory.length-1,target));showStoryLine();return}if(button.dataset.xiaopeiBranch){chooseXiaopeiStoryBranch(button.dataset.xiaopeiBranch);return}chooseStoryRoute(button.dataset.storyRoute)}
  function chooseXiaopeiStoryBranch(branch){if(!storyRouteChoicePending||!['fight','negotiate'].includes(branch))return;storyRouteChoicePending=false;const params=preserveDialogueMode(new URLSearchParams({level:'10',storySelect:'1',levelSelect:'1',xiaopeiBranch:branch,xiaopeiResume:'1',build:RUNTIME_BUILD}));location.href=`${location.pathname}?${params}`}
  function chooseStoryRoute(levelNumber){
    const allowed=secondRouteChoiceFlow?['5','6']:['3','4'];if(!storyRouteChoicePending||!allowed.includes(String(levelNumber)))return;const targetId=String(levelNumber)==='6'?'qinghe':String(levelNumber)==='5'?'julu':String(levelNumber)==='4'?'xindu':'guangchuan',transfer=readCampaignTransferRaw();if(transfer&&(transfer.fromLevelId==='hulao-pass'||['guangchuan','xindu'].includes(transfer.fromLevelId))){transfer.toLevelId=targetId;transfer.savedAt=Date.now();try{saveStorage.setItem(CAMPAIGN_KEY,JSON.stringify(transfer))}catch(error){flash(error.message||'无法保存路线');return}}
    storyRouteChoicePending=false;const params=new URLSearchParams();params.set('level',String(levelNumber));params.set('routeResume','1');params.set('build',RUNTIME_BUILD);preserveDialogueMode(params);location.href=`${location.pathname}?${params}`
  }
  async function applyStoryMoment(line){
    const nextProfile=storyLocationProfile(line.location);if(line.scene!==storyScene||(nextProfile?.key||'')!==storyLocationKey)setStoryScene(line.scene,line.location);if(line.setup)resetStoryActors(line.setup);await Promise.all((line.remove||[]).map(name=>removeStoryActor(name)));(line.spawn||[]).forEach(spec=>addStoryActor(spec));
    await Promise.all(Object.entries(line.move||{}).map(([name,target])=>moveStoryActor(name,target)));await Promise.all(Object.entries(line.thenMove||{}).map(([name,target])=>moveStoryActor(name,target,80)));await Promise.all(Object.entries(line.route||{}).map(([name,waypoints])=>routeStoryActor(name,waypoints)));
    Object.entries(line.turn||{}).forEach(([name,dir])=>{const actor=storyActors.get(name);if(actor){actor.dir=dir;positionStoryActor(actor)}});Object.entries(line.face||{}).forEach(([name,target])=>faceStoryActor(name,target));await Promise.all((line.removeAfter||[]).map(name=>removeStoryActor(name,100)));
  }
  async function showStoryLine(){
    const line=preBattleStory[storyIndex];if(!line){finishPreBattleStory();return}const token=++storyMomentToken;storyAdvanceLocked=true;clearTimeout(storyTimer);storyActors.forEach(actor=>{actor.el?.classList.remove('speaking');stopStoryGesture(actor)});storyFreeRoam=!!line.freeRoam;const overlay=document.getElementById('storyOverlay');overlay.classList.toggle('free-roam',storyFreeRoam);document.getElementById('storyObjective').classList.toggle('hidden',!storyFreeRoam);document.getElementById('storyChapter').textContent=(line.chapter||level.chapter||'序章').split('·')[0].trim();document.getElementById('storyLocation').textContent=line.location;document.getElementById('storyProgress').textContent=storyFreeRoam?'自由行动':`${storyIndex+1} / ${preBattleStory.length}`;document.getElementById('storyAutoBtn').disabled=storyFreeRoam;primeStoryDialogue(line.speaker,line.text);await applyStoryMoment(line);if(token!==storyMomentToken||!storyActive)return;setStoryDialogue(line.speaker,line.text,line.gesture);storyAdvanceLocked=false;syncStoryRouteChoice(line);
    if(!storyFreeRoam)saveStoryAutoCheckpoint();if(storyAuto&&!storyFreeRoam&&!storyRouteChoicePending)storyTimer=setTimeout(nextStoryLine,Math.max(2300,900+line.text.length*72))
  }
  function saveStoryAutoCheckpoint(phaseType='story'){
    const store=readSaveStore();store.auto=makeStorySnapshot('auto',null,phaseType);writeSaveStore(store);refreshContinueButton();renderSaveSlots()
  }
  function finishPreBattleStory(){if(!storyActive)return;if(routeChoiceFlow){storyIndex=preBattleStory.length-1;showStoryLine();return}if(huainanAftermathState){huainanAftermathState.complete=true;saveStoryAutoCheckpoint('postbattle')}else if(level.id==='xiaopei'&&xiaopeiBranch==='negotiate')saveStoryAutoCheckpoint('story');else saveStoryAutoCheckpoint('prep');storyMomentToken++;storyActive=false;storyActors.forEach(actor=>{stopStoryGesture(actor,false);stopStoryWalk(actor);actor.el?.remove()});storyActors.clear();storyAuto=false;storyFreeRoam=false;storyAdvanceLocked=false;storyInteraction=null;storyRouteChoicePending=false;clearTimeout(storyTimer);const overlay=document.getElementById('storyOverlay');overlay.classList.add('hidden');overlay.classList.remove('free-roam','route-choice');document.getElementById('storyRouteChoices').classList.add('hidden');document.getElementById('storyObjective').classList.add('hidden');document.getElementById('storyAutoBtn').classList.remove('active');document.getElementById('storySkipBtn').disabled=false;document.getElementById('storySkipBtn').textContent='跳过剧情';const done=storyDone;storyDone=null;if(level.id==='xiaopei'&&xiaopeiBranch==='negotiate'){completeXiaopeiNegotiation();return}if(done)done()}
  function leaveStoryFreeRoam(){if(storyIndex>=preBattleStory.length-1){finishPreBattleStory();return}storyFreeRoam=false;const overlay=document.getElementById('storyOverlay');overlay.classList.remove('free-roam');document.getElementById('storyObjective').classList.add('hidden');storyIndex++;showStoryLine()}
  function nextStoryLine(){
    if(!storyActive||storyAdvanceLocked||storyRouteChoicePending)return;if(storyInteraction){storyInteractionIndex++;if(storyInteractionIndex<storyInteraction.length){const item=storyInteraction[storyInteractionIndex];setStoryDialogue(item.speaker,item.text);return}const done=storyInteractionDone;storyInteraction=null;storyInteractionDone=null;if(done)done();return}
    if(storyFreeRoam)return;storyIndex++;if(storyIndex>=preBattleStory.length){finishPreBattleStory();return}showStoryLine()
  }
  function beginStoryInteraction(name,lines,onDone){storyInteraction=(lines||[]).map(text=>({speaker:name,text}));storyInteractionIndex=0;storyInteractionDone=onDone||null;if(storyInteraction.length)setStoryDialogue(name,storyInteraction[0].text);else if(onDone)onDone()}
  async function walkFreeRoamLiuTo(x,y,allowName=null){if(!storyFreeRoam||storyInteraction||storyAdvanceLocked)return false;const liu=storyActors.get('刘备');if(!liu)return false;const path=findStoryPath(liu,x,y,{allowName});if(!path.length)return false;storyAdvanceLocked=true;await animateStoryPath(liu,path,{stepMs:115});storyAdvanceLocked=false;return true}
  async function interactStoryActor(name){
    if(!storyFreeRoam||name==='刘备'||storyInteraction||storyAdvanceLocked)return;const liu=storyActors.get('刘备'),target=storyActors.get(name);if(!liu||!target)return;const candidates=[[target.x-2,target.y],[target.x+2,target.y],[target.x,target.y-2],[target.x,target.y+2],[target.x-1,target.y],[target.x+1,target.y],[target.x,target.y-1],[target.x,target.y+1]].map(([x,y])=>({x,y,path:findStoryPath(liu,x,y,{allowName:name})})).filter(x=>x.path.length||Math.round(liu.x)===x.x&&Math.round(liu.y)===x.y).sort((a,b)=>(Math.abs(a.x-target.x)+Math.abs(a.y-target.y)===2?-1:0)-(Math.abs(b.x-target.x)+Math.abs(b.y-target.y)===2?-1:0)||a.path.length-b.path.length);const best=candidates[0];if(!best)return;storyAdvanceLocked=true;if(best.path.length)await animateStoryPath(liu,best.path,{stepMs:115});liu.dir=storyDirection(target.x-liu.x,target.y-liu.y,liu.dir);target.dir=storyDirection(liu.x-target.x,liu.y-target.y,target.dir);positionStoryActor(liu);positionStoryActor(target);storyAdvanceLocked=false;const leave=name==='关羽'||name==='道具屋';beginStoryInteraction(name,preBattleNpcDialogue[name]||['……'],leave?leaveStoryFreeRoam:null)
  }
  async function moveFreeRoamLiu(dx,dy){if(!storyFreeRoam||storyInteraction||storyAdvanceLocked)return;const liu=storyActors.get('刘备');if(!liu)return;const x=Math.round(liu.x+dx),y=Math.round(liu.y+dy);if(storyCellBlocked(x,y,liu))return;await walkFreeRoamLiuTo(x,y)}
  function nearestStoryNpc(){const liu=storyActors.get('刘备');if(!liu)return null;return[...storyActors.values()].filter(a=>a.name!=='刘备').sort((a,b)=>(Math.abs(a.x-liu.x)+Math.abs(a.y-liu.y))-(Math.abs(b.x-liu.x)+Math.abs(b.y-liu.y)))[0]||null}
  function handleStoryKey(e){
    if(storyRouteChoicePending){if(e.target.closest?.('[data-story-route]'))return;const buttons=[...document.querySelectorAll('#storyRouteChoices [data-story-route]:not(.hidden)')];const index=e.key==='1'||e.key==='ArrowLeft'?0:e.key==='2'||e.key==='ArrowRight'?1:e.key==='3'?2:-1;e.preventDefault();if(index>=0&&buttons[index])chooseStoryOption(buttons[index]);return}if(storyInteraction){e.preventDefault();nextStoryLine();return}if(storyAdvanceLocked){e.preventDefault();return}if(!storyFreeRoam){e.preventDefault();nextStoryLine();return}const dirs={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]};if(dirs[e.key]){e.preventDefault();moveFreeRoamLiu(...dirs[e.key]);return}if(e.key==='Enter'||e.code==='Space'){e.preventDefault();const npc=nearestStoryNpc();if(npc&&Math.abs(npc.x-storyActors.get('刘备').x)+Math.abs(npc.y-storyActors.get('刘备').y)<=3)interactStoryActor(npc.name)}
  }
  function playPreBattleStory(onDone,startIndex=0){storyDone=onDone;storyIndex=Math.max(0,Math.min(preBattleStory.length-1,startIndex));storyActive=true;storyAuto=false;storyFreeRoam=false;storyAdvanceLocked=false;storyInteraction=null;storyRouteChoicePending=false;storyScene='';const stage=document.getElementById('storyStage');if(stage){stage.style.setProperty('--story-camera-x','0%');stage.style.setProperty('--story-camera-y','0%');stage.style.setProperty('--story-camera-zoom','1');stage.dataset.cameraTarget='wide'}document.getElementById('storyOverlay').classList.remove('hidden');showStoryLine();setTimeout(()=>{if(storyActive&&storyIndex===startIndex)saveStoryAutoCheckpoint()},0)}
  function fadeOutTitleMusic(onDone){if(titleMusic.paused){onDone();return}const from=titleMusic.volume,start=performance.now(),duration=360;function frame(now){const p=Math.min(1,(now-start)/duration);titleMusic.volume=from*(1-p);if(p<1)requestAnimationFrame(frame);else{titleMusic.pause();titleMusic.volume=mixedMusicVolume();onDone()}}requestAnimationFrame(frame)}
  function launchFirstChapterNewGame(){
    clearCampaignTransfer();levelSelectActive=false;selectedBalanceLevel=null;resetBattleState();fadeOutTitleMusic(()=>{hideTitle(false);playOpeningMovie(()=>playPreBattleStory(openBattlePrep))})
  }
  function startNewGame(){
    requestGameFullscreen();
    const mustReloadFirstChapter=level.id!=='sishui-pass'||levelSelectActive||bootParams.has('level')||bootParams.has('storySelect')||bootParams.has('battleSelect')||bootParams.has('loadSlot');
    if(mustReloadFirstChapter){clearCampaignTransfer();const params=preserveDialogueMode(new URLSearchParams({newGame:'1',build:RUNTIME_BUILD}));location.href=`${location.pathname}?${params}`;return}
    launchFirstChapterNewGame()
  }
  function restartBattle(){closeGameMenu();resetBattleState();hideTitle();openBattlePrep()}
  function returnToTitleAfterBattle(){resetBattleState();showTitle()}
  function canOpenBattlePrep(){return turn===1&&playerTurn&&!ending&&phase==='select'&&units.filter(u=>u.side==='ally').every(u=>!u.acted)}
  function openBattlePrep(){if(!canOpenBattlePrep()){flash('只能在第一回合行动前整备');return}closeGameMenu();document.getElementById('shopOverlay').classList.remove('hidden');startShopMusic();syncShop();status('战前整备：购买或转交道具后出征')}
  function loadStorySnapshot(save){
    try{if(save.campaignTransfer)saveStorage.setItem(CAMPAIGN_KEY,JSON.stringify(save.campaignTransfer))}catch(error){flash(error.message||'无法恢复跨关进度');return false}
    levelSelectActive=!!save.levelSelectBalanced;selectedBalanceLevel=levelSelectActive?(Number(save.balanceLevel)||levelSelectRecommendedLevel()):null;
    resetBattleState();hideTitle(false);closeGameMenu();gold=Number.isFinite(Number(save.gold))?Number(save.gold):gold;if(level.id==='huainan'){preBattleStory=save.huainanStoryEntry==='continuous'?window.HUAINAN_CONTINUOUS_STORY:window.HUAINAN_LEVEL_SELECT_STORY;if(save.phaseType==='story'&&save.huainanStoryRevision!==2){playPreBattleStory(openBattlePrep);flash('淮南剧情已更新，从本关开场接续');return true}}if(save.phaseType==='prep'){openBattlePrep();status('已恢复虎牢关战前整备');flash('读取进度完成');return true}
    storyDone=openBattlePrep;storyIndex=save.storyIndex;storyActive=true;storyAuto=false;storyFreeRoam=!!preBattleStory[storyIndex]?.freeRoam;storyAdvanceLocked=false;storyInteraction=null;storyScene='';const overlay=document.getElementById('storyOverlay');overlay.classList.remove('hidden');overlay.classList.toggle('free-roam',storyFreeRoam);const line=preBattleStory[storyIndex];setStoryScene(save.storyScene||line.scene,line.location);resetStoryActors(save.storyActors||[]);document.getElementById('storyObjective').classList.toggle('hidden',!storyFreeRoam);document.getElementById('storyChapter').textContent=(line.chapter||level.chapter||'序章').split('·')[0].trim();document.getElementById('storyLocation').textContent=line.location;document.getElementById('storyProgress').textContent=storyFreeRoam?'自由行动':`${storyIndex+1} / ${preBattleStory.length}`;document.getElementById('storyAutoBtn').disabled=storyFreeRoam;setStoryDialogue(line.speaker,line.text,line.gesture);syncStoryRouteChoice(line);status(storyRouteChoicePending?(secondRouteChoiceFlow?'请选择巨鹿路线或清河路线':'请选择广川路线或信都路线'):'已恢复剧情进度');flash('读取进度完成');return true
  }
  function loadSnapshot(save){
    if(!validSnapshot(save)){flash('存档数据无效');return false}if(save.phaseType==='story'||save.phaseType==='prep')return loadStorySnapshot(save);clearStoryPlayback();levelSelectActive=!!save.levelSelectBalanced;selectedBalanceLevel=levelSelectActive?(Number(save.balanceLevel)||levelSelectRecommendedLevel()):null;units=save.units.map((u,i)=>refreshPassiveTreasures(normalizeCanonicalUnit(applyPaintedDeploymentOverride({...u,spawnOrder:u.spawnOrder??i,inventory:Array.isArray(u.inventory)?[...u.inventory]:[],treasureItems:treasureIdsFor(u)}))));const loadedMap=applyPaintedTerrainOverrides(save.map.map(row=>[...row]));map.splice(0,map.length,...loadedMap);turn=Math.max(1,Number(save.turn)||1);gold=Number(save.gold)||0;capturePrepBaseline();playerTurn=save.playerTurn!==false;turnTransitionPending=false;duelInProgress=false;phase='select';battleStarted=true;window.ZhaolieLeaderboard?.restoreClock?.(save.leaderboardClock,level);introPlayed=true;ending=false;selected=null;inspected=null;dialogue=null;reachable.clear();attackable=[];moveOrigin=null;activeStrategy=null;activeItem=null;healFx=[];hoverPath=[];dangerVisible=!!save.dangerVisible;dangerTiles=[];keyboardCursor=null;logs.splice(0,logs.length,...(Array.isArray(save.logs)?save.logs.slice(-8):[]));brotherMergeSpoken.clear();(save.brotherMergeSpoken||[]).forEach(id=>brotherMergeSpoken.add(id));timedEventsFired.clear();(save.timedEventsFired||[]).forEach(id=>timedEventsFired.add(id));const restoredBattleTrack=save.battleMusicTrack||(level.timedEvents||[]).reduce((track,event)=>{const key=event.once||['turn',event.turn,event.unitId||''].join('-');return event.battleMusicAfter&&timedEventsFired.has(key)?event.battleMusicAfter:track},configuredBattleTrack);setBattleMusicTrack(restoredBattleTrack,{play:false});document.getElementById('turnNumber').textContent=turn;document.getElementById('sideLabel').textContent=playerTurn?'我军阶段':'敌军阶段';syncLevelBalanceBadge();document.getElementById('shopOverlay').classList.add('hidden');document.getElementById('dialogOverlay').classList.add('hidden');document.getElementById('outcomeOverlay').classList.add('hidden');hideTitle();closeGameMenu();if(dangerVisible)rebuildDangerTiles();syncUI();draw();if(save.phaseType==='postbattle'){ending=true;playerTurn=false;phase='ended';document.getElementById('sideLabel').textContent='战后已结算';if(level.id==='huainan'&&save.huainanAftermath&&!save.huainanAftermath.complete){playHuainanAftermath(save.huainanAftermath.variant,save.huainanAftermath.summary,save.huainanAftermath);return true}const title=save.postBattleTitle||'战斗结束',text=save.postBattleText||'本关已经结算，后续进度已经保存。';showOutcome(title,text,save.postBattleAction||'pending');status('已恢复战后进度');flash('读取战后存档完成');return true}status(`已读取第 ${turn} 回合进度${levelSelectActive?` · 选关均衡 Lv.${selectedBalanceLevel}`:''}`);flash('读取进度完成');return true
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
  function handleBattleTap(sx,sy){const q=battleOverview?screenToTile(sx,sy):actionTileAt(sx,sy);if(battleOverview){if(q)resetBattleCamera(q);return}handleTileAction(q)}
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
  function structureTileAt(sx,sy,coreOnly=false){
    let hit=null;
    for(let y=0;y<ROWS;y++)for(let x=0;x<COLS;x++){
      const type=map[y][x],base=type.startsWith('treasure')?'treasure':type.startsWith('supply')?'supply':type==='village'?'village':type==='fort'?'fort':null;
      if(!base)continue;
      const visualScale=Number(level.structureScaleByType?.[base]??1),p=iso(x,y),s=bgRect.scale,img=terrainArt[base],height={village:136,treasure:112,supply:116,fort:146}[base]*s*visualScale,width=height*((img?.naturalWidth||1)/(img?.naturalHeight||1));
      const horizontalInset=coreOnly?width*.18:0,verticalInset=coreOnly?height*.06:0,left=p.x-width/2+horizontalInset,right=p.x+width/2-horizontalInset,top=p.y-height+24*s+verticalInset,bottom=p.y+34*s-verticalInset;
      if(sx>=left&&sx<=right&&sy>=top&&sy<=bottom)hit={x,y};
    }
    return hit&&{x:hit.x,y:hit.y}
  }
  function unitSpriteTileAt(sx,sy){
    const canTarget=u=>{
      if(u.side==='reserve'||u.hp<=0)return false;
      const highlighted=attackable.some(q=>q.x===u.x&&q.y===u.y);
      if(phase==='attack')return u.side==='enemy'&&highlighted;
      if(phase==='strategy'||phase==='item')return highlighted;
      return true
    };
    let best=null,bestScore=Infinity;
    for(const u of units.filter(canTarget)){
      const p=iso(u.x,u.y),s=bgRect.scale,mounted=isMountedUnit(u),commander=(u.originalId??999)<256;
      const height=(u.boss?108:commander?(mounted?102:91):(mounted?87:78))*s*(u.id==='guan'?588/497:1)*(u.id==='zhaoyun'?1.08:1)*(u.id==='caocao'?1.05:1)*(['martial','bandit'].includes(u.troop)?1.16:1);
      const halfWidth=(u.troop==='transport'?48:mounted?45:35)*s*(['martial','bandit'].includes(u.troop)?1.1:1),top=p.y-height-8*s,bottom=p.y+18*s;
      if(sx<p.x-halfWidth||sx>p.x+halfWidth||sy<top||sy>bottom)continue;
      const centerY=p.y-height*.43,nx=(sx-p.x)/halfWidth,ny=(sy-centerY)/(height*.62),score=nx*nx+ny*ny;
      if(score<bestScore){bestScore=score;best={x:u.x,y:u.y}}
    }
    return best
  }
  function reachableTileAt(sx,sy){
    if(phase!=='move'||!reachable.size)return null;
    let best=null,bestDistance=Infinity;
    for(const key of reachable.keys()){
      const [x,y]=key.split(',').map(Number);if(unitAt(x,y))continue;
      const p=iso(x,y),px=iso(x+.5,y),mx=iso(x-.5,y),py=iso(x,y+.5),my=iso(x,y-.5),halfWidth=Math.abs(px.x-mx.x)*.46,halfHeight=Math.abs(py.y-my.y)*.46;
      if(sx<p.x-halfWidth||sx>p.x+halfWidth||sy<p.y-halfHeight||sy>p.y+halfHeight)continue;
      const distance=(sx-p.x)**2+(sy-p.y)**2;if(distance<bestDistance){bestDistance=distance;best={x,y}}
    }
    if(best)return best;
    // Every unit is anchored at its feet and may paint one to three rows above
    // its logical cell. Treat that upper-body artwork as click-through to the
    // nearest highlighted empty cell; keep only the foot band selectable as
    // the unit itself. This applies to infantry, cavalry and oversized named
    // officers alike, so no character can swallow the cell drawn above it.
    const spriteHit=unitSpriteTileAt(sx,sy),spriteUnit=spriteHit&&unitAt(spriteHit.x,spriteHit.y),cell=bgRect.cell||Math.min(bgRect.w/COLS,bgRect.h/ROWS);
    if(!spriteUnit)return null;
    const spriteCenter=iso(spriteUnit.x,spriteUnit.y);if(sy>=spriteCenter.y-cell*.32)return null;
    let fallback=null,fallbackDistance=Infinity;
    for(const key of reachable.keys()){
      const [x,y]=key.split(',').map(Number);if(unitAt(x,y)||y>=spriteUnit.y||spriteUnit.y-y>3||Math.abs(x-spriteUnit.x)>2)continue;
      const p=iso(x,y),distance=Math.hypot(sx-p.x,sy-p.y);if(distance<=cell*1.35&&distance<fallbackDistance){fallbackDistance=distance;fallback={x,y}}
    }
    return fallback
  }
  function actionTileAt(sx,sy){
    // Use the rectangles actually drawn on screen. A tall commander sprite may
    // overlap the row above, but it must never swallow a highlighted empty cell.
    const structureCore=phase==='move'?structureTileAt(sx,sy,true):null;
    if(structureCore&&reachable.has(keyOf(structureCore.x,structureCore.y))&&!unitAt(structureCore.x,structureCore.y))return structureCore;
    const movementHit=reachableTileAt(sx,sy);if(movementHit)return movementHit;
    const ground=screenToTile(sx,sy);
    if(phase==='move'&&ground&&reachable.has(keyOf(ground.x,ground.y))&&!unitAt(ground.x,ground.y))return ground;
    // A village or depot paints across several cells. If its own cell is a valid
    // destination, let the rest of the visible building select that destination
    // after exact highlighted ground has had priority. This keeps neighbouring
    // cells usable while preventing nearby unit art from swallowing the building.
    const reachableStructure=phase==='move'?structureTileAt(sx,sy):null;
    if(reachableStructure&&reachable.has(keyOf(reachableStructure.x,reachableStructure.y))&&!unitAt(reachableStructure.x,reachableStructure.y))return reachableStructure;
    // In every other case resolve the visible body first so a soldier's head or
    // torso remains easy to select, especially when two painted rows overlap.
    const unitHit=unitSpriteTileAt(sx,sy);
    if(unitHit)return unitHit;
    if(ground&&unitAt(ground.x,ground.y))return ground;
    if(phase!=='move')return ground;
    // Buildings are taller and wider than one grid cell.  Their old rectangular
    // hit box swallowed neighbouring open ground (most visibly the cell left of
    // the first battle's supply depot), so a valid highlighted cell could not be
    // selected.  A reachable ground cell now has priority; the enlarged building
    // hit area remains available when the pointer is outside a reachable cell.
    if(ground&&reachable.has(keyOf(ground.x,ground.y)))return ground;
    // A painted bridge is wider than its single logical cell.  On touch screens,
    // tapping its edge can resolve to the neighbouring river cell.  Prefer a
    // nearby reachable bridge in that case so the visible bridge remains usable.
    let nearestBridge=null,nearestBridgeDistance=Infinity;
    const bridgeRadius=(bgRect.cell||Math.min(bgRect.w/COLS,bgRect.h/ROWS))*.72;
    for(let y=0;y<ROWS;y++)for(let x=0;x<COLS;x++)if(map[y][x]==='bridge'&&reachable.has(keyOf(x,y))){const p=iso(x,y),distance=Math.hypot(sx-p.x,sy-p.y);if(distance<=bridgeRadius&&distance<nearestBridgeDistance){nearestBridge={x,y};nearestBridgeDistance=distance}}
    if(nearestBridge)return nearestBridge;
    const structure=structureTileAt(sx,sy);
    if(structure&&reachable.has(keyOf(structure.x,structure.y)))return structure;
    return ground||structure;
  }
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
  function alternateVictoryContains(x,y){const rule=level.alternateVictory;if(!rule||turn<(rule.minTurn||1))return false;const r=rule.rect;return r?x>=r.x1&&x<=r.x2&&y>=r.y1&&y<=r.y2:rule.x===x&&rule.y===y}
  function drawMapStructures(){
    for(let y=0;y<ROWS;y++)for(let x=0;x<COLS;x++){
      const t=map[y][x];
      if(t==='fort'){const p=iso(x,y),s=bgRect.scale,img=terrainArt.fort;gridCell(x,y,'rgba(165,113,55,.2)','#d9ae63aa');if(!level.structuresBakedIntoArt){if(img?.complete&&img.naturalWidth){const h=146*s,w=h*img.naturalWidth/img.naturalHeight;ctx.drawImage(img,p.x-w/2,p.y-h+24*s,w,h)}else drawFort(p.x,p.y,s)}drawStructureLabel(p.x,p.y+14*s,'鹿砦','#d9ae63',false);continue}
      const base=t.startsWith('treasure')?'treasure':t.startsWith('supply')?'supply':t==='village'?'village':null;if(!base)continue;
      const p=iso(x,y),s=bgRect.scale,img=terrainArt[base],empty=t.endsWith('Empty'),styles={village:{h:136,label:'村庄',color:'#d9b85f'},treasure:{h:112,label:empty?'宝物库·已开启':'宝物库',color:'#e6bd58'},supply:{h:116,label:empty?'兵粮库·已取用':'兵粮库',color:'#8ec5c7'}},st=styles[base],visualScale=Number(level.structureScaleByType?.[base]??1),h=st.h*s*visualScale,w=h*((img?.naturalWidth||1)/(img?.naturalHeight||1));
      gridCell(x,y,base==='village'?'rgba(118,155,73,.18)':base==='treasure'?'rgba(208,158,54,.18)':'rgba(79,151,143,.18)',st.color+'aa');
      const forceOverlay=level.structureOverlayTiles?.includes(`${x},${y}`);
      if((!level.structuresBakedIntoArt||forceOverlay)&&img?.complete&&img.naturalWidth){ctx.save();ctx.globalAlpha=empty?.58:1;if(empty)ctx.filter='grayscale(.42) saturate(.72)';ctx.drawImage(img,p.x-w/2,p.y-h+24*s,w,h);ctx.restore()}
      const objective=alternateVictoryContains(x,y);
      gridCell(x,y,objective?'rgba(255,211,91,.22)':null,objective?'#ffe18a':st.color+'cc');
      drawStructureLabel(p.x,p.y+14*s,st.label,st.color,empty);
    }
    if(level.alternateVictory?.rect){
      const r=level.alternateVictory.rect;
      for(let y=r.y1;y<=r.y2;y++)for(let x=r.x1;x<=r.x2;x++){
        gridCell(x,y,'rgba(255,211,91,.2)','#ffe18acc');
        const p=iso(x,y);ctx.save();ctx.fillStyle='#fff0a4';ctx.textAlign='center';ctx.font=`bold ${Math.max(8,9*bgRect.scale)}px "Microsoft YaHei"`;ctx.fillText('入城',p.x,p.y+4*bgRect.scale);ctx.restore()
      }
    }
  }
  // Reserve units keep authored spawn coordinates while waiting for their
  // timed event, but they are not on the battlefield yet. Counting them as
  // occupants creates invisible blockers on otherwise open ground.
  function unitAt(x,y){return units.find(u=>u.side!=='reserve'&&u.hp>0&&u.x===x&&u.y===y)}
  function hasXuandeAura(u){const liu=units.find(x=>x.id==='liu'&&x.hp>0),friendly=u&&(u.side==='ally'||u.side==='guest');return!!(liu&&friendly&&u!==liu&&u.hp>0&&Math.max(Math.abs(u.x-liu.x),Math.abs(u.y-liu.y))===1)}
  function hasMilitaryBandAura(u){return!!(u&&u.hp>0&&BattleRules.militaryBandAttackAura({x:u.x,y:u.y,id:u.id,side:u.side,units}))}
  function hasDanqi(u){return!!(u?.id==='zhaoyun'&&u.hp>0&&!units.some(friend=>friend!==u&&friend.hp>0&&(friend.side==='ally'||friend.side==='guest')&&Math.abs(friend.x-u.x)+Math.abs(friend.y-u.y)<=2))}
  function jianxiongSourceFor(u){const caocao=units.find(x=>x.id==='caocao'&&x.hp>0);return caocao&&u&&u!==caocao&&u.hp>0&&!isOpponent(caocao,u)&&Math.abs(u.x-caocao.x)+Math.abs(u.y-caocao.y)<=2?caocao:null}
  function hasJianxiongAura(u){return!!jianxiongSourceFor(u)}
  function jianxiongProtectors(caocao){return units.filter(u=>u!==caocao&&u.hp>0&&!isOpponent(caocao,u)&&Math.abs(u.x-caocao.x)+Math.abs(u.y-caocao.y)<=2).sort((a,b)=>(Math.abs(a.x-caocao.x)+Math.abs(a.y-caocao.y))-(Math.abs(b.x-caocao.x)+Math.abs(b.y-caocao.y))||b.hp-a.hp||a.spawnOrder-b.spawnOrder)}
  function jianxiongDamageSplit(target,damage){const raw=Math.max(0,Math.round(damage));if(target?.id!=='caocao'||raw<=0)return{targetDamage:raw,sharedDamage:0,protector:null};const protector=jianxiongProtectors(target)[0];if(!protector)return{targetDamage:raw,sharedDamage:0,protector:null};const sharedDamage=Math.min(protector.hp,Math.floor(raw*.2));return{targetDamage:raw-sharedDamage,sharedDamage,protector}}
  function applyJianxiongDamage(split){if(!split?.protector||split.sharedDamage<=0)return;split.protector.hp=Math.max(0,split.protector.hp-split.sharedDamage);addLog(`奸雄：${split.protector.name}替曹操承受${split.sharedDamage}兵力伤害`,true)}
  async function resolveJianxiongProtector(split,source){const protector=split?.protector;if(!protector||protector.hp>0)return false;addLog(`${protector.name}因护卫曹操而撤退`,true);if((source.side==='ally'||source.side==='guest')&&source.hp>0)gainExp(source,protector,true);await playDefeatQuote(protector);if(protector.id==='liu'){defeat('刘备撤退');return true}return false}
  function originalDerivedStats(u){return BattleRules.derivedStats({troop:u.troop,level:u.level,wuli:u.wuli||0,zhili:u.zhili||0,tongyu:u.tongyu||0,morale:u.morale??100,attackBonus:u.weaponBonus||0,defenseBonus:u.armorBonus||0})}
  function qianlixingAttackBonus(u){return u?.id==='guan'?Math.min(.1,Math.max(0,Number(u.turnMoveDistance)||0)*.02):0}
  function clearActionMoveBonus(u){if(u)u.turnMoveDistance=0}
  function effectiveStat(u,key){const derived=originalDerivedStats(u),source=key==='atk'?derived.attack:key==='def'?derived.defense:key==='move'?derived.move:u[key],base=Number.isFinite(source)?source:0;let value=base;if(u.containedUntil>=turn&&(key==='atk'||key==='move'))value*=.8;if(key==='atk')value*=1+qianlixingAttackBonus(u);if(key==='atk'&&hasMilitaryBandAura(u))value*=1.1;if(hasDanqi(u)&&(key==='atk'||key==='def'))value*=1.1;if(hasJianxiongAura(u)&&(key==='atk'||key==='def'))value*=1.08;if(hasXuandeAura(u))value*=1.1;return key==='move'?Math.max(1,Math.ceil(value)):Math.round(value)}
  function permanentRateBonus(u,key){if(u?.id==='zhang'&&key==='critRate')return .1;if(u?.id==='zhaoyun'&&key==='blockRate'&&hasDanqi(u))return .1;return 0}
  function effectiveRate(u,key){const value=(u[key]||0)+permanentRateBonus(u,key);return Math.min(.95,value*(hasXuandeAura(u)?1.1:1))}
  function effectiveStrategyHit(u,rule){return Math.min(1,Math.max(0,(rule?.hit||0)+(hasJianxiongAura(u)?.1:0)))}
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
  function genericVisualKeyFor(u){if(u.troop==='cavalry'||u.troop==='heavyCavalry')return'hua';if(u.troop==='archer')return'archer';if(u.troop==='martial')return'martial';if(u.troop==='bandit')return'bandit';if(u.troop==='beast')return'beast';if(u.troop==='support')return'support';if(u.troop==='transport')return'transport';if(u.role!=='前锋')return'officer';return'infantry'}
  function spriteFor(u){if(art[u.id])return art[u.id];const key=genericVisualKeyFor(u);return factionAssetFor(u,key,art,friendlyArt)}
  function attackKeyFor(u){if(attackArt[u.id])return u.id;const key=genericVisualKeyFor(u);return attackArt[key]?key:null}
  function attackSpriteFor(u){const key=attackKeyFor(u);return key?factionAssetFor(u,key,attackArt,friendlyAttackArt):null}
  function criticalSpriteFor(u){return criticalArt[u.id]||null}
  function blockSpriteFor(u){return blockArt[u.id]||null}
  function walkKeyFor(u){if(walkArt[u.id]&&walkFrameBounds[u.id])return u.id;const genericKey=genericVisualKeyFor(u);return walkArt[genericKey]&&walkFrameBounds[genericKey]?genericKey:null}
  function walkSpriteFor(u){const key=walkKeyFor(u);return key?factionAssetFor(u,key,walkArt,friendlyWalkArt):null}
  function hurtKeyFor(u){if(hurtArt[u.id])return u.id;const key=genericVisualKeyFor(u);return hurtArt[key]?key:null}
  function hurtSpriteFor(u){const key=hurtKeyFor(u);return key?factionAssetFor(u,key,hurtArt,friendlyHurtArt):null}
  function walkRowFor(direction){return({west:0,north:1,east:2,south:3})[direction]??0}
  function attackDirectionFor(attacker,target){const dx=target.x-attacker.x,dy=target.y-attacker.y;if(Math.abs(dx)>=Math.abs(dy))return dx>=0?'east':'west';return dy>=0?'south':'north'}
  function combatTargetFacesRight(attacker,target){
    const direction=attackDirectionFor(attacker,target);
    // Square-grid north/west share the left-facing diagonal, while
    // east/south share the right-facing diagonal.  This also gives a stable
    // answer when two tiles have the same projected screen x coordinate.
    return direction==='east'||direction==='south'
  }
  function attackSheetFacesLeft(u){return xuzhouAuthoredCombatIds.has(u.id)}
  function shouldMirrorCombatSheet(u,target){
    const wantsRight=combatTargetFacesRight(u,target),baseFacesRight=!attackSheetFacesLeft(u);
    return wantsRight!==baseFacesRight
  }
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
  function isMountedUnit(u){return u.troop==='cavalry'||u.troop==='heavyCavalry'||u.mountedVisual===true}
  function isCriticallyWounded(u){return u.hp>0&&u.maxHp>0&&u.hp/u.maxHp<=.3}
  const swornBrotherIds=new Set(['liu','guan','zhang']);
  function brotherGuardFor(target,attacker){
    if(!target||!attacker||target.side!=='ally'||!swornBrotherIds.has(target.id)||!isCriticallyWounded(target)||!isOpponent(target,attacker))return null;
    return units.filter(u=>u!==target&&u.side===target.side&&u.hp>0&&swornBrotherIds.has(u.id)&&Math.max(Math.abs(u.x-target.x),Math.abs(u.y-target.y))===1).sort((a,b)=>(b.hp/b.maxHp)-(a.hp/a.maxHp)||b.hp-a.hp||a.spawnOrder-b.spawnOrder)[0]||null
  }
  function announceBrotherGuard(guard,target){addLog(`${guard.name}发动桃园护援，替濒死的${target.name}承受攻击`,true);flash('桃园护援');status(`${guard.name}挺身护住${target.name}`)}
  async function playBrotherGuardCombatAnimation(attacker,protectedTarget,guard,damage,onImpact,outcome){
    if(!guard)return playCombatAnimation(attacker,protectedTarget,damage,onImpact,outcome);
    const protectedPosition={x:protectedTarget.x,y:protectedTarget.y},guardPosition={x:guard.x,y:guard.y};
    guard.x=protectedPosition.x;guard.y=protectedPosition.y;protectedTarget.x=guardPosition.x;protectedTarget.y=guardPosition.y;
    try{return await playCombatAnimation(attacker,guard,damage,onImpact,outcome)}finally{guard.x=guardPosition.x;guard.y=guardPosition.y;protectedTarget.x=protectedPosition.x;protectedTarget.y=protectedPosition.y;draw()}
  }
  function woundedKeyFor(u){
    if(woundedAtlasOrder.includes(u.id))return u.id;
    if(u.troop==='cavalry'||u.troop==='heavyCavalry')return'hua';
    if(u.troop==='archer')return'archer';
    if(u.role!=='前锋')return'officer';
    return'infantry'
  }
  function idleMotionFor(u){
    const active=!anim&&!combatFx&&u.hp>0;
    if(!active)return{active:false,mounted:false,archer:false,phase:0,breath:0,idleFrame:0,idleNextFrame:0,idleBlend:0,direction:'west',facing:u.facing??defaultFacing(u),archerFrame:0,archerPoseAlpha:0};
    if(u.acted)return{active:true,mounted:isMountedUnit(u),archer:false,phase:0,breath:.5,idleFrame:0,idleNextFrame:0,idleBlend:0,direction:'west',facing:idleFacingFor(u),archerFrame:0,archerPoseAlpha:0};
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
  function walkingMotionFor(u,phase,direction='west',facing=u.facing??defaultFacing(u)){const wave=Math.sin(phase*Math.PI*2),mounted=isMountedUnit(u);return{active:true,walking:true,mounted,archer:false,phase,direction,facing,breath:.5,legLift:Math.abs(wave),legSide:wave>=0?1:-1,stepWave:wave,archerFrame:0,archerPoseAlpha:0}}
  // Sun Qian's combined porter-and-cart art has a visually higher wheel/foot
  // contact line than the other 256px unit sheets. Keep the same correction
  // for idle, walking and combat frames so the cart stays planted and never
  // jumps vertically when its animation state changes.
  function unitGroundContactY(u){return(10+(u.id==='sunqian'?6:0))*bgRect.scale}
  function drawStaticUnitImage(u,img,targetW,targetH,idle){
    const s=bgRect.scale,imageW=mediaWidth(img),imageH=mediaHeight(img),x=-targetW/2,y=-targetH+unitGroundContactY(u),drawSlice=(sx,sy,sw,sh,dx,dy,dw,dh)=>{
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
      if(mediaReady(sheet)&&b){const sourceW=Math.floor(mediaWidth(sheet)/5),pixelScale=targetH/imageH;ctx.save();ctx.globalAlpha=idle.archerPoseAlpha;ctx.drawImage(sheet,frame*sourceW+b[0],b[1],b[2],b[3],(b[0]-sourceW/2)*pixelScale,unitGroundContactY(u)-b[3]*pixelScale,b[2]*pixelScale,b[3]*pixelScale);ctx.restore()}
      return
    }
    drawSlice(0,0,imageW,imageH,x,y,targetW,targetH);
  }
  function drawAuthoredWalkFrame(u,sheet,targetH,motion){
    const key=walkKeyFor(u),row=walkRowFor(motion.direction),frame=((Math.floor(motion.walkPhase*4)%4)+4)%4,b=walkFrameBounds[key]?.[row]?.[frame];
    if(!b)return false;const sheetW=mediaWidth(sheet),sheetH=mediaHeight(sheet),cellX0=Math.floor(frame*sheetW/4),cellX1=Math.floor((frame+1)*sheetW/4),cellY0=Math.floor(row*sheetH/4),cellY1=Math.floor((row+1)*sheetH/4),cellW=cellX1-cellX0,cellH=cellY1-cellY0,scale=targetH/Math.max(...walkFrameBounds[key].flat().map(q=>q[3])),center=b[0]+b[2]/2,feet=b[1]+b[3];
    // The authored sheet supplies the leg, hoof, wheel and body motion. Keep
    // the feet planted on one baseline instead of adding a synthetic hop.
    ctx.drawImage(sheet,cellX0,cellY0,cellW,cellH,-center*scale,unitGroundContactY(u)-feet*scale,cellW*scale,cellH*scale);return true
  }
  function drawAuthoredDirectionalAttackFrame(u,sheet,targetH,fx){
    const row=walkRowFor(attackDirectionFor(fx.attacker,fx.target)),frame=Math.max(0,Math.min(4,fx.attackFrame||0)),bounds=directionalAttackFrameBounds[u.id]?.[row],b=bounds?.[frame];
    if(!b)return false;const sheetW=mediaWidth(sheet),sheetH=mediaHeight(sheet),cellX0=Math.floor(frame*sheetW/5),cellX1=Math.floor((frame+1)*sheetW/5),cellY0=Math.floor(row*sheetH/4),cellY1=Math.floor((row+1)*sheetH/4),cellW=cellX1-cellX0,cellH=cellY1-cellY0,scale=targetH/Math.max(...directionalAttackFrameBounds[u.id].flat().map(q=>q[3])),center=b[0]+b[2]/2,feet=b[1]+b[3];
    ctx.drawImage(sheet,cellX0,cellY0,cellW,cellH,-center*scale,unitGroundContactY(u)-feet*scale,cellW*scale,cellH*scale);return true
  }
  function drawAuthoredIdleFrame(u,sheet,targetH,idle){
    const key=walkKeyFor(u),row=walkRowFor(idle.direction),bounds=walkFrameBounds[key]?.[row];
    if(!bounds)return false;
    const scale=targetH/Math.max(...walkFrameBounds[key].flat().map(q=>q[3])),drawFrame=(frame,alpha)=>{
      if(alpha<=0)return;const b=bounds[frame],sheetW=mediaWidth(sheet),sheetH=mediaHeight(sheet),cellX0=Math.floor(frame*sheetW/4),cellX1=Math.floor((frame+1)*sheetW/4),cellY0=Math.floor(row*sheetH/4),cellY1=Math.floor((row+1)*sheetH/4),cellW=cellX1-cellX0,cellH=cellY1-cellY0,center=b[0]+b[2]/2,feet=b[1]+b[3];
      ctx.save();ctx.globalAlpha*=alpha;ctx.drawImage(sheet,cellX0,cellY0,cellW,cellH,-center*scale,unitGroundContactY(u)-feet*scale,cellW*scale,cellH*scale);ctx.restore()
    };
    drawFrame(idle.idleFrame,1-idle.idleBlend);drawFrame(idle.idleNextFrame,idle.idleBlend);return true
  }
  function xuzhouCombatFrame(u,kind,frame){
    if(xiaopeiCommanderCombatIds.has(u.id)){
      const sequence={attack:[0,1,2,2,0],hurt:[0,4,4,4,4],block:[0,3,3,3,0],critical:[0,1,2,2,2],death:[0,1,2,3,4]}[kind]||[0,1,2,3,4];
      return sequence[Math.max(0,Math.min(sequence.length-1,frame))]
    }
    if(!xuzhouAuthoredCombatIds.has(u.id))return frame;
    const sequence={attack:[0,1,2,2,0],hurt:[0,3,3,3,3],block:[0,3,3,3,0],critical:[0,1,2,2,2],death:[0,3,3,4,4]}[kind]||[0,1,2,3,4];
    return sequence[Math.max(0,Math.min(sequence.length-1,frame))]
  }
  function drawAuthoredCombatStripFrame(u,sheet,targetH,frame,bounds,kind){
    const sourceFrame=xuzhouCombatFrame(u,kind,frame),b=bounds?.[sourceFrame];if(!b)return false;const sheetW=mediaWidth(sheet),sheetH=mediaHeight(sheet),sourceW=Math.floor(sheetW/5),cellX0=sourceFrame*sourceW,scale=targetH/Math.max(...bounds.map(q=>q[3])),center=b[0]+b[2]/2,feet=b[1]+b[3];ctx.drawImage(sheet,cellX0,0,sourceW,sheetH,-center*scale,unitGroundContactY(u)-feet*scale,sourceW*scale,sheetH*scale);return true
  }
  function drawAuthoredHurtFrame(u,sheet,targetH,frame){return drawAuthoredCombatStripFrame(u,sheet,targetH,frame,hurtFrameBounds[hurtKeyFor(u)],'hurt')}
  function drawAuthoredBlockFrame(u,sheet,targetH,frame){return drawAuthoredCombatStripFrame(u,sheet,targetH,frame,blockFrameBounds[u.id],'block')}
  function drawAuthoredCriticalFrame(u,sheet,targetH,frame){return drawAuthoredCombatStripFrame(u,sheet,targetH,frame,criticalFrameBounds[u.id],'critical')}
  function hurtFrameFor(u,fx){const q=Math.max(0,Math.min(1,fx?.hitReaction||0));if(fx?.fatal||isCriticallyWounded(u))return q<.25?1:q<.55?2:3;return q<.36?1:q<.72?2:4}
  function drawWoundedUnit(u,targetH,idle){
    const dedicated=hurtSpriteFor(u);if(mediaReady(dedicated))return drawAuthoredHurtFrame(u,dedicated,targetH,3);
    if(u.troop==='support')return false;
    const woundedSheet=usesGenericFriendlyArt(u)&&mediaReady(friendlyWoundedArt)?friendlyWoundedArt:woundedArt;if(!mediaReady(woundedSheet))return false;
    const key=woundedKeyFor(u),index=woundedAtlasOrder.indexOf(key),b=woundedFrameBounds[key];if(index<0||!b)return false;
    const woundedW=mediaWidth(woundedSheet),woundedH=mediaHeight(woundedSheet),column=index%4,row=Math.floor(index/4),cellX0=Math.round(column*woundedW/4),cellX1=Math.round((column+1)*woundedW/4),cellY0=Math.round(row*woundedH/4),cellY1=Math.round((row+1)*woundedH/4),cellW=cellX1-cellX0,cellH=cellY1-cellY0,scale=targetH*.79/b[3],center=b[0]+b[2]/2,feet=b[1]+b[3],breath=((idle?.breath??.5)-.5)*.006;
    ctx.save();ctx.translate(0,unitGroundContactY(u)-feet*scale);ctx.scale((idle?.facing??u.facing??defaultFacing(u))>0?-1:1,1+breath);ctx.drawImage(woundedSheet,cellX0,cellY0,cellW,cellH,-center*scale,0,cellW*scale,cellH*scale);ctx.restore();return true
  }
  function deathKeyFor(u){return deathArt[u.id]?u.id:((u.troop==='cavalry'||u.troop==='heavyCavalry')?'hua':null)}
  function drawAuthoredDeathFrame(u,sheet,targetH,fx){
    const key=deathKeyFor(u),progress=Math.max(0,Math.min(1,fx.deathProgress||0)),frame=progress<.18?0:progress<.38?1:progress<.58?2:progress<.8?3:4,sourceFrame=xuzhouCombatFrame(u,'death',frame),b=deathFrameBounds[key]?.[sourceFrame],standing=deathFrameBounds[key]?.[0];
    if(!b||!standing)return false;const sheetW=mediaWidth(sheet),sheetH=mediaHeight(sheet),cellX0=Math.floor(sourceFrame*sheetW/5),cellX1=Math.floor((sourceFrame+1)*sheetW/5),cellW=cellX1-cellX0,scale=targetH/standing[3],center=b[0]+b[2]/2,feet=b[1]+b[3];
    ctx.drawImage(sheet,cellX0,0,cellW,sheetH,-center*scale,unitGroundContactY(u)-feet*scale,cellW*scale,sheetH*scale);return true
  }
  function attackSheetScale(key,targetH,staticImg,sheet){
    const authored=level02AnimationBounds.attack?.[key]||(mountedCombatAttackIds.includes(key)||['martial','bandit','support','zhaoyun','wenchou','yanliang','zhanghe','quyi','guanhai','kongrong','taishici','mengsu','beast'].includes(key)||xiaopeiCommanderCombatIds.has(key)?attackFrameBounds[key]:null);
    return authored?targetH/Math.max(...authored.map(bounds=>bounds[3])):targetH/(mediaHeight(staticImg)||mediaHeight(sheet))
  }
  function combatAttackFrame(u,p,ranged=false){
    if(ranged)return p<.12?0:p<.28?1:p<.45?2:p<.62?3:4;
    // Guan Yu's five authored poses cover a full raise, chop and broad sweep.
    // Hold those key poses long enough for the blade movement to read clearly.
    if(u?.id==='guan')return p<.16?0:p<.34?1:p<.5?2:p<.72?3:4;
    return p<.13?0:p<.27?1:p<.41?2:p<.59?3:4
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
    const attackFx=combatFx&&u===combatFx.attacker?combatFx:null,attackDirection=attackFx?attackDirectionFor(u,attackFx.target):null,specialDirectionalSheet=attackFx&&(!attackFx.critical||attackDirection==='north'||attackDirection==='south')?directionalAttackArt[u.id]:null,directionalSheet=mediaReady(specialDirectionalSheet)?specialDirectionalSheet:null,specialDirectionalAttack=mediaReady(specialDirectionalSheet),authoredDirectionalAttack=!!(attackFx?.showAttackSprite!==false&&specialDirectionalAttack);
    const walkSheet=walkSpriteFor(u),authoredWalk=!!(walking&&mediaReady(walkSheet)),isMounted=isMountedUnit(u),idle=walking?walkingMotionFor(u,walking.walkPhase,walking.direction,walking.facing):idleMotionFor(u),idleSheet=!walking?walkSheet:null,authoredIdle=!!(!walking&&!attackFx&&mediaReady(idleSheet)),stepWave=walking?Math.sin(walking.walkPhase*Math.PI*2):0,pos={x:base.x+(offset?.x||0),y:base.y+(offset?.y||0)};
    const deathFx=combatFx&&u===combatFx.target&&combatFx.fatal&&combatFx.deathProgress>0?combatFx:null,deathKey=deathFx?deathKeyFor(u):null,deathSheet=deathKey?factionAssetFor(u,deathKey,deathArt,friendlyDeathArt):null,authoredDeath=mediaReady(deathSheet),blockFx=combatFx&&u===combatFx.target&&combatFx.blocked&&combatFx.blockPose>0?combatFx:null,blockSheet=blockFx?blockSpriteFor(u):null,authoredBlock=mediaReady(blockSheet),hitFx=combatFx&&u===combatFx.target&&combatFx.hitReaction>0?combatFx:null,hitSheet=hitFx?hurtSpriteFor(u):null,authoredHit=mediaReady(hitSheet);
    const staticImg=spriteFor(u),attackKey=attackKeyFor(u),criticalSheet=attackFx?.critical?criticalSpriteFor(u):null,chargeFx=attackFx&&attackFx.criticalCharge>0&&mediaReady(criticalSheet)?attackFx:null,sheet=attackFx&&attackFx.showAttackSprite!==false&&!authoredDirectionalAttack?(mediaReady(criticalSheet)?criticalSheet:attackSpriteFor(u)):null,img=mediaReady(sheet)?sheet:staticImg,activeAttackBounds=sheet===criticalSheet?criticalFrameBounds[u.id]:attackFrameBounds[attackKey],done=u.acted&&u.side==='ally'&&!attackFx&&!deathFx,commander=(u.originalId??999)<256;
    const wounded=!walking&&!attackFx&&!deathFx&&isCriticallyWounded(u),targetH=(u.boss?108:commander?(isMounted?102:91):(isMounted?87:78))*bgRect.scale*(u.id==='guan'?588/497:1)*(u.id==='zhaoyun'?1.08:1)*(u.id==='caocao'?1.05:1)*(['martial','bandit'].includes(u.troop)?1.16:1),displayH=wounded?targetH*.79:targetH,frameCount=sheet===img?5:1,sourceW=Math.floor((mediaWidth(img)||1)/frameCount),targetW=targetH*sourceW/(mediaHeight(img)||1),hurt=combatFx&&u===combatFx.target,targetFade=hurt?(combatFx.targetAlpha??1):1,flagFade=targetFade*(hurt&&combatFx.fatal?Math.max(0,1-(combatFx.deathProgress||0)*2.4):1);
    if(walking){ctx.save();ctx.globalAlpha=.28;ctx.fillStyle='#08141b';ctx.beginPath();ctx.ellipse(base.x,base.y+5*bgRect.scale,(isMounted?28:21)*bgRect.scale*(1-.08*Math.abs(stepWave)),(isMounted?8:6)*bgRect.scale,0,0,Math.PI*2);ctx.fill();ctx.restore()}else drawIdleGroundFx(u,base,idle,isMounted);
    drawFactionGroundMarker(u,pos,isMounted,done,flagFade);
    drawUnitFlag(u,pos,targetH,done,flagFade);
    ctx.save();ctx.globalAlpha=(done?.62:1)*targetFade;const paletteFilter=unitPaletteFilters[u.id]||'',hitFilter=hurt&&combatFx.hitFlash?`brightness(${1+combatFx.hitFlash*2.4}) saturate(${1-combatFx.hitFlash*.65})`:'';if(hitFilter||paletteFilter)ctx.filter=`${hitFilter} ${paletteFilter}`.trim();
    ctx.translate(pos.x,pos.y);if(!walking&&sheet===img&&shouldMirrorCombatSheet(u,combatFx.target))ctx.scale(-1,1);else if(!walking&&(authoredDeath||authoredBlock||authoredHit)&&combatFx&&shouldMirrorCombatSheet(u,combatFx.attacker))ctx.scale(-1,1);else if(!walking&&chargeFx&&shouldMirrorCombatSheet(u,chargeFx.target))ctx.scale(-1,1);else if(!walking&&authoredIdle&&!wounded&&(idle.facing??defaultFacing(u))>0)ctx.scale(-1,1);else if(!walking&&!authoredIdle&&!authoredDirectionalAttack&&!authoredDeath&&!authoredBlock&&!authoredHit&&shouldFlipForFacing(u,idle.facing??u.facing))ctx.scale(-1,1);if(hurt&&!authoredDeath&&!authoredBlock){ctx.rotate(combatFx.targetRotation||0);ctx.scale(combatFx.targetScaleX||1,combatFx.targetScaleY||1)}if(wounded&&drawWoundedUnit(u,targetH,idle)){}else if(authoredWalk)drawAuthoredWalkFrame(u,walkSheet,targetH,walking);else if(authoredDirectionalAttack)drawAuthoredDirectionalAttackFrame(u,directionalSheet,targetH,attackFx);else if(authoredDeath)drawAuthoredDeathFrame(u,deathSheet,targetH,deathFx);else if(authoredBlock)drawAuthoredBlockFrame(u,blockSheet,targetH,Math.max(0,Math.min(4,combatFx.blockFrame||0)));else if(authoredHit)drawAuthoredHurtFrame(u,hitSheet,targetH,hurtFrameFor(u,hitFx));else if(chargeFx)drawAuthoredCriticalFrame(u,criticalSheet,targetH,Math.min(3,Math.floor(chargeFx.criticalCharge*4)));else if(authoredIdle)drawAuthoredIdleFrame(u,idleSheet,targetH,idle);else if(mediaReady(img)){if(frameCount===5){const frame=Math.max(0,Math.min(4,combatFx.attackFrame||0)),sourceFrame=xuzhouCombatFrame(u,'attack',frame),b=activeAttackBounds?.[sourceFrame],pixelScale=activeAttackBounds?.length?targetH/Math.max(...activeAttackBounds.map(bounds=>bounds[3])):attackSheetScale(attackKey,targetH,staticImg,img);if(b){ctx.drawImage(img,sourceFrame*sourceW+b[0],b[1],b[2],b[3],(b[0]-sourceW/2)*pixelScale,unitGroundContactY(u)-b[3]*pixelScale,b[2]*pixelScale,b[3]*pixelScale)}else ctx.drawImage(img,sourceFrame*sourceW,0,sourceW,mediaHeight(img),-targetW/2,-targetH+unitGroundContactY(u),targetW,targetH)}else drawStaticUnitImage(u,img,targetW,targetH,{active:false})}ctx.restore();
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
    for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){if(dx===0&&dy===0)continue;const x=liu.x+dx,y=liu.y+dy;if(x>=0&&y>=0&&x<COLS&&y<ROWS)gridCell(x,y,'rgba(244,216,121,.055)','rgba(244,216,121,.36)')}
    ctx.save();ctx.globalCompositeOperation='screen';
    const glow=ctx.createRadialGradient(p.x,p.y,2*s,p.x,p.y,rx*1.7);glow.addColorStop(0,`rgba(255,223,112,${.08+.04*pulse})`);glow.addColorStop(.58,`rgba(67,174,219,${.07+.03*pulse})`);glow.addColorStop(1,'rgba(21,105,159,0)');ctx.fillStyle=glow;ctx.beginPath();ctx.ellipse(p.x,p.y,rx*1.7,ry*2.2,0,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle='#f4d879';ctx.lineWidth=Math.max(1,1.7*s);ctx.globalAlpha=.5+.28*pulse;ctx.beginPath();ctx.ellipse(p.x,p.y+3*s,rx*(1+.05*pulse),ry*(1+.05*pulse),0,0,Math.PI*2);ctx.stroke();
    ctx.strokeStyle='#68c6df';ctx.lineWidth=Math.max(1,.9*s);ctx.globalAlpha=.34+.18*(1-pulse);ctx.beginPath();ctx.ellipse(p.x,p.y+3*s,rx*1.28,ry*1.35,0,0,Math.PI*2);ctx.stroke();
    ctx.fillStyle='#ffe99b';for(let i=0;i<6;i++){const a=t*(i%2?-.55:.48)+i*Math.PI/3,r=rx*(.78+(i%2)*.27),x=p.x+Math.cos(a)*r,y=p.y+Math.sin(a)*ry*.85-6*s-(i%3)*4*s;ctx.globalAlpha=.35+.25*Math.sin(t*2+i);ctx.beginPath();ctx.arc(x,y,(1.1+i%2*.7)*s,0,Math.PI*2);ctx.fill()}ctx.restore();
    for(const u of units.filter(hasXuandeAura)){const q=iso(u.x,u.y);ctx.save();ctx.globalAlpha=.52+.22*pulse;ctx.strokeStyle='#ffe18a';ctx.lineWidth=Math.max(1,1.5*s);ctx.beginPath();ctx.ellipse(q.x,q.y+4*s,23*s,7*s,0,0,Math.PI*2);ctx.stroke();ctx.fillStyle='#f5d36c';ctx.font=`bold ${Math.max(8,9*s)}px "Microsoft YaHei"`;ctx.textAlign='center';ctx.fillText('仁德 +10%',q.x,q.y-52*s);ctx.restore()}
  }
  const eightTileAuraOffsets=[[-1,-1],[0,-1],[1,-1],[-1,0],[1,0],[-1,1],[0,1],[1,1]];
  const adjacentSupplyOffsets=[[0,-1],[-1,0],[1,0],[0,1]];
  function drawSupportAuraSource(source,{offsets,fill,stroke,glow,label,symbol}){
    const s=bgRect.scale,t=performance.now()/1000,pulse=(Math.sin(t*2.8+source.x*.37+source.y*.19)+1)/2,q=iso(source.x,source.y);
    for(const [dx,dy] of offsets){const x=source.x+dx,y=source.y+dy;if(x<0||y<0||x>=COLS||y>=ROWS)continue;gridCell(x,y,fill,stroke)}
    ctx.save();ctx.globalCompositeOperation='screen';const radius=34*s,gradient=ctx.createRadialGradient(q.x,q.y+4*s,2*s,q.x,q.y+4*s,radius);gradient.addColorStop(0,glow);gradient.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=gradient;ctx.globalAlpha=.72+.18*pulse;ctx.beginPath();ctx.ellipse(q.x,q.y+4*s,radius,radius*.35,0,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle=stroke;ctx.lineWidth=Math.max(1,1.6*s);ctx.globalAlpha=.62+.25*pulse;ctx.beginPath();ctx.ellipse(q.x,q.y+5*s,25*s*(1+.05*pulse),8*s*(1+.05*pulse),0,0,Math.PI*2);ctx.stroke();
    ctx.fillStyle=stroke;ctx.font=`bold ${Math.max(9,11*s)}px "Microsoft YaHei"`;ctx.textAlign='center';ctx.textBaseline='middle';for(let i=0;i<4;i++){const a=t*(i%2?.7:-.62)+i*Math.PI/2,r=(19+i%2*7)*s;ctx.globalAlpha=.42+.28*Math.sin(t*2+i);ctx.fillText(symbol,q.x+Math.cos(a)*r,q.y-13*s+Math.sin(a)*5*s)}
    ctx.globalAlpha=.9;ctx.lineWidth=Math.max(2,3*s);ctx.strokeStyle='rgba(4,27,35,.88)';ctx.fillStyle=stroke;ctx.font=`bold ${Math.max(8,9*s)}px "Microsoft YaHei"`;ctx.strokeText(label,q.x,q.y-70*s);ctx.fillText(label,q.x,q.y-70*s);ctx.restore()
  }
  function drawMilitaryBandAuras(){
    const s=bgRect.scale,pulse=(Math.sin(performance.now()/420)+1)/2,bands=units.filter(u=>u.side!=='reserve'&&u.hp>0&&u.troop==='support');
    for(const band of bands)drawSupportAuraSource(band,{offsets:eightTileAuraOffsets,fill:'rgba(74,220,183,.07)',stroke:'rgba(117,226,196,.58)',glow:'rgba(103,239,207,.28)',label:'军乐范围 · 攻+10%',symbol:'♪'});
    for(const u of units.filter(unit=>unit.side!=='reserve'&&hasMilitaryBandAura(unit))){const q=iso(u.x,u.y);ctx.save();ctx.globalAlpha=.48+.2*pulse;ctx.strokeStyle='#75e2c4';ctx.lineWidth=Math.max(1,1.4*s);ctx.beginPath();ctx.ellipse(q.x,q.y+5*s,20*s,6*s,0,0,Math.PI*2);ctx.stroke();ctx.fillStyle='#8ef0d3';ctx.font=`bold ${Math.max(8,9*s)}px "Microsoft YaHei"`;ctx.textAlign='center';ctx.fillText('军乐 攻+10%',q.x,q.y-64*s);ctx.restore()}
  }
  function drawTransportAuras(){
    const s=bgRect.scale,pulse=(Math.sin(performance.now()/460)+1)/2,transports=units.filter(u=>u.side!=='reserve'&&u.hp>0&&u.troop==='transport');
    for(const carrier of transports){drawSupportAuraSource(carrier,{offsets:adjacentSupplyOffsets,fill:'rgba(91,196,255,.075)',stroke:'rgba(119,211,255,.62)',glow:'rgba(89,190,255,.3)',label:'运输补给范围',symbol:'+'});for(const target of units.filter(u=>u.id!==carrier.id&&u.side===carrier.side&&u.hp>0&&Math.abs(u.x-carrier.x)+Math.abs(u.y-carrier.y)===1)){const q=iso(target.x,target.y);ctx.save();ctx.globalAlpha=.48+.2*pulse;ctx.strokeStyle='#82dcff';ctx.lineWidth=Math.max(1,1.4*s);ctx.beginPath();ctx.ellipse(q.x,q.y+5*s,20*s,6*s,0,0,Math.PI*2);ctx.stroke();if(target.hp<target.maxHp){ctx.fillStyle='#a9edff';ctx.font=`bold ${Math.max(8,9*s)}px "Microsoft YaHei"`;ctx.textAlign='center';ctx.fillText('运输补给',q.x,q.y-64*s)}ctx.restore()}}
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
  function drawHealFx(){
    if(!healFx.length)return;
    const s=bgRect.scale;
    for(const fx of healFx){
      const p=iso(fx.target.x,fx.target.y),q=fx.progress,alpha=Math.sin(Math.PI*q),lift=(18+42*q)*s;
      ctx.save();ctx.globalCompositeOperation='screen';ctx.translate(p.x,p.y-16*s);
      const glow=ctx.createRadialGradient(0,0,2*s,0,0,(28+18*q)*s);glow.addColorStop(0,`rgba(238,255,194,${.62*alpha})`);glow.addColorStop(.42,`rgba(91,255,167,${.38*alpha})`);glow.addColorStop(1,'rgba(34,197,119,0)');ctx.fillStyle=glow;ctx.beginPath();ctx.arc(0,0,(30+18*q)*s,0,Math.PI*2);ctx.fill();
      ctx.strokeStyle=`rgba(151,255,210,${.8*alpha})`;ctx.lineWidth=Math.max(1.5,2*s);for(let i=0;i<2;i++){ctx.beginPath();ctx.ellipse(0,(8-i*15-22*q)*s,(18+i*8+15*q)*s,(6+i*3+4*q)*s,0,0,Math.PI*2);ctx.stroke()}
      for(let i=0;i<9;i++){const angle=i*Math.PI*2/9+.45*q,radius=(9+(i%3)*7)*s,y=-8*s-(12+(i%4)*8)*q*s;ctx.globalAlpha=alpha*(.58+(i%2)*.18);ctx.fillStyle=i%3?'#8dffc2':'#fff2a2';ctx.beginPath();ctx.arc(Math.cos(angle)*radius,y+Math.sin(angle)*radius*.35,Math.max(1.5,(2.2+(i%2))*s),0,Math.PI*2);ctx.fill()}
      ctx.globalAlpha=alpha;ctx.strokeStyle='#ecffd6';ctx.lineWidth=Math.max(2,3*s);ctx.beginPath();ctx.moveTo(-8*s,-lift);ctx.lineTo(8*s,-lift);ctx.moveTo(0,-lift-8*s);ctx.lineTo(0,-lift+8*s);ctx.stroke();
      ctx.font=`800 ${Math.max(17,22*s)}px "Microsoft YaHei"`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.lineWidth=Math.max(3,4*s);ctx.strokeStyle='rgba(4,40,25,.9)';ctx.fillStyle='#caff9f';const label=`+${fx.amount}`;ctx.strokeText(label,0,-lift-22*s);ctx.fillText(label,0,-lift-22*s);ctx.restore()
    }
  }
  function playHealAnimation(targetOrEvents,amount=null,source='heal'){
    const incoming=Array.isArray(targetOrEvents)?targetOrEvents:[{target:targetOrEvents,amount,source}],merged=new Map();
    for(const event of incoming){if(!event?.target||Number(event.amount)<=0)continue;const prior=merged.get(event.target)||{target:event.target,amount:0,source:event.source||source};prior.amount+=Number(event.amount);merged.set(event.target,prior)}
    const entries=[...merged.values()];if(!entries.length)return Promise.resolve();syncUI();entries.slice(0,3).forEach((event,index)=>setTimeout(()=>battleSfx('heal',event.target,{strong:event.amount>=300}),index*80));const duration=880/animationSpeed;
    return new Promise(resolve=>{const start=performance.now();function frame(now){const progress=Math.min(1,(now-start)/duration);healFx=entries.map(event=>({...event,progress}));draw();if(progress<1)requestAnimationFrame(frame);else{healFx=[];draw();resolve()}}requestAnimationFrame(frame)})
  }  function rebuildDangerTiles(){const keys=new Set();for(const e of units.filter(u=>u.side==='enemy'&&u.hp>0&&!u.confused)){const mobile=e.aiType===1||e.aiType===3||e.aiType===4,cells=mobile?calcReach(e):new Map([[keyOf(e.x,e.y),0]]);for(const k of cells.keys()){const [x,y]=k.split(',').map(Number);for(let yy=0;yy<ROWS;yy++)for(let xx=0;xx<COLS;xx++)if(isBasicAttackOffset(e,xx-x,yy-y))keys.add(keyOf(xx,yy))}if((knowsStrategy(e,'fire')||knowsStrategy(e,'contain'))&&(e.strategy||0)>=4){for(let yy=Math.max(0,e.y-3);yy<=Math.min(ROWS-1,e.y+3);yy++)for(let xx=Math.max(0,e.x-3);xx<=Math.min(COLS-1,e.x+3);xx++){const d=Math.abs(xx-e.x)+Math.abs(yy-e.y);if(d>0&&d<=3)keys.add(keyOf(xx,yy))}}}dangerTiles=[...keys].map(k=>{const[x,y]=k.split(',').map(Number);return{x,y}})}
  function drawMovementPath(){if(hoverPath.length<2)return;const s=bgRect.scale;ctx.save();ctx.strokeStyle='#ffe38a';ctx.lineWidth=Math.max(2,3*s);ctx.setLineDash([8*s,6*s]);ctx.beginPath();hoverPath.forEach((q,i)=>{const p=iso(q.x,q.y);if(i)ctx.lineTo(p.x,p.y);else ctx.moveTo(p.x,p.y)});ctx.stroke();ctx.setLineDash([]);let spent=0;hoverPath.forEach((q,i)=>{if(i===0)return;spent+=tileCost(selected,q.x,q.y);const p=iso(q.x,q.y);ctx.fillStyle='#0a2338dd';ctx.strokeStyle='#ffe38a';ctx.lineWidth=1;ctx.beginPath();ctx.arc(p.x,p.y,8*s,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.fillStyle='#fff0ad';ctx.font=`bold ${Math.max(8,9*s)}px sans-serif`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(spent,p.x,p.y+.5*s)});ctx.restore()}
  function draw(redrawMini=true){const W=wrap.clientWidth,H=wrap.clientHeight;ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,canvas.width,canvas.height);ctx.restore();const g=ctx.createLinearGradient(0,0,0,H);g.addColorStop(0,'#102a2e');g.addColorStop(1,'#061519');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);ctx.save();if(combatFx){ctx.translate(combatFx.shakeX||0,combatFx.shakeY||0)}updateBgRect();if(art.battlefield.complete&&art.battlefield.naturalWidth)ctx.drawImage(art.battlefield,bgRect.x,bgRect.y,bgRect.w,bgRect.h);drawEnvironmentFx(performance.now()/1000);drawMapStructures();if(dangerVisible)for(const q of dangerTiles)gridCell(q.x,q.y,'rgba(165,28,35,.13)','rgba(226,72,67,.34)');if(reachable.size)for(const key of reachable.keys()){const [x,y]=key.split(',').map(Number);gridCell(x,y,'rgba(25,190,207,.27)','rgba(112,242,236,.9)')}drawMovementPath();for(const q of attackable){const offensiveItem=phase==='item'&&['fireScroll','vortexScroll','rockScroll','fogScroll','bomb'].includes(activeItem),friendly=(phase==='strategy'&&strategies[activeStrategy]?.target==='friendly')||(phase==='item'&&!offensiveItem);gridCell(q.x,q.y,friendly?'rgba(56,190,130,.3)':'rgba(210,49,37,.3)',friendly?'rgba(139,255,208,.94)':'rgba(255,120,89,.92)')}if(hover)gridCell(hover.x,hover.y,'rgba(255,255,255,.09)','rgba(255,229,162,.85)');if(keyboardCursor)gridCell(keyboardCursor.x,keyboardCursor.y,'rgba(255,232,134,.08)','#ffe58d');if(selected&&selected.hp>0){gridCell(selected.x,selected.y,'rgba(241,200,92,.12)','#f3cc6b')}drawXuandeAura();drawMilitaryBandAuras();drawTransportAuras();[...units].filter(u=>u.side!=='reserve'&&(u.hp>0||(combatFx&&u===combatFx.target))).sort((a,b)=>iso(a.x,a.y).y-iso(b.x,b.y).y).forEach(drawUnit);drawCombatFx();drawDeathFx();drawStrategyFx();drawHealFx();ctx.restore();if(redrawMini)drawMini()}
  const keyOf=(x,y)=>`${x},${y}`;
  function neighbors(x,y){return [[x+1,y],[x-1,y],[x,y+1],[x,y-1]].filter(([a,b])=>a>=0&&b>=0&&a<COLS&&b<ROWS)}
  function movementEdgeKey(x1,y1,x2,y2){return x1<x2||x1===x2&&y1<y2?`${x1},${y1}>${x2},${y2}`:`${x2},${y2}>${x1},${y1}`}
  const blockedMovementEdges=new Set((level.blockedMovementEdges||[]).map(edge=>movementEdgeKey(...edge)));
  function canCrossMovementEdge(x1,y1,x2,y2){return!blockedMovementEdges.has(movementEdgeKey(x1,y1,x2,y2))}
  function movementClass(u){if(u.troop==='cavalry'||u.troop==='heavyCavalry')return 1;if(u.troop==='bandit'||u.troop==='martial'||u.troop==='beast')return 3;if(u.troop==='support')return 2;return 0}
  function isSpecialPassable(u,x,y){return!!level.specialPassable?.some(cell=>cell.unitId===u.id&&cell.x===x&&cell.y===y)}
  function tileCost(u,x,y){if(isSpecialPassable(u,x,y))return 1;const levelOverride=level.movementCostOverrides?.[keyOf(x,y)];if(Number.isFinite(levelOverride))return levelOverride;const rule=terrain[map[y][x]],cost=rule.move?.[movementClass(u)]??rule.cost;return Number.isFinite(cost)?cost:Infinity}
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
    const auditCoordinate=bootParams.has('battleAudit')?` · 格 ${q.x},${q.y}`:'';document.getElementById('terrainInfo').textContent=`${t.name} · 移动 ${moveText} · 防御 +${t.def}%${routeCost!==undefined&&routeCost!==null?` · 路径消耗 ${routeCost}`:''}${effect}${auditCoordinate}`;
    if(routeCost!==undefined&&routeCost!==null)hoverPath=findPath(selected,q.x,q.y)
  }
  function passable(u,x,y){return Number.isFinite(tileCost(u,x,y))&&(!unitAt(x,y)||unitAt(x,y)===u)}
  function traversable(u,x,y){const occupant=unitAt(x,y);return Number.isFinite(tileCost(u,x,y))&&(!occupant||occupant===u||!isOpponent(u,occupant))}
  function calcReach(u){const move=effectiveStat(u,'move'),dist=new Map([[keyOf(u.x,u.y),0]]),q=[[u.x,u.y]];while(q.length){const [x,y]=q.shift(),d=dist.get(keyOf(x,y));for(const [nx,ny] of neighbors(x,y)){if(!canCrossMovementEdge(x,y,nx,ny))continue;const nd=d+tileCost(u,nx,ny),k=keyOf(nx,ny);if(nd<=move&&traversable(u,nx,ny)&&(!dist.has(k)||nd<dist.get(k))){dist.set(k,nd);q.push([nx,ny])}}}return dist}
  function findPath(u,tx,ty){const start=keyOf(u.x,u.y),goal=keyOf(tx,ty),dist=new Map([[start,0]]),prev=new Map(),open=[[u.x,u.y]];while(open.length){open.sort((a,b)=>dist.get(keyOf(a[0],a[1]))-dist.get(keyOf(b[0],b[1])));const [x,y]=open.shift(),k=keyOf(x,y);if(k===goal)break;for(const [nx,ny] of neighbors(x,y)){if(!canCrossMovementEdge(x,y,nx,ny)||!traversable(u,nx,ny))continue;const nk=keyOf(nx,ny),nd=dist.get(k)+tileCost(u,nx,ny);if(nd<(dist.get(nk)??Infinity)){dist.set(nk,nd);prev.set(nk,k);open.push([nx,ny])}}}if(!dist.has(goal))return [{x:u.x,y:u.y}];const path=[];let k=goal;while(k){const [x,y]=k.split(',').map(Number);path.push({x,y});if(k===start)break;k=prev.get(k)}return path.reverse()}
  function animateUnitMove(u,tx,ty){ensureBattleCamera(u);const path=findPath(u,tx,ty);if(path.length<2)return Promise.resolve();return new Promise(resolve=>{let segment=0,segmentStart=performance.now(),lastStep=-1;function frame(now){const fromTile=path[segment],toTile=path[segment+1],from=iso(fromTile.x,fromTile.y),to=iso(toTile.x,toTile.y),terrainType=map[toTile.y][toTile.x],terrainFactor=['forest','hill','rough'].includes(terrainType)?1.22:1,mounted=isMountedUnit(u),movementSound=mounted?'hoofStep':'footStep',duration=(mounted?250:285)*terrainFactor/(animationSpeed*GLOBAL_MOVEMENT_SPEED),p=Math.min(1,(now-segmentStart)/duration),ease=p<.5?2*p*p:1-Math.pow(-2*p+2,2)/2,travel=u.troop==='bandit'?p:ease,dx=to.x-from.x,tileDx=toTile.x-fromTile.x,tileDy=toTile.y-fromTile.y,direction=tileDx>0?'east':tileDx<0?'west':tileDy>0?'south':'north',facing=Math.abs(dx)>.2?(dx>0?1:-1):(u.facing??defaultFacing(u)),step=Math.floor((segment+p)*2);if(step!==lastStep){lastStep=step;battleSfx(movementSound,u,{alternate:step%2===1,terrain:terrainType})}anim={unit:u,pos:{x:from.x+dx*travel,y:from.y+(to.y-from.y)*travel},walkPhase:segment+p,facing,direction};draw();if(p<1){requestAnimationFrame(frame);return}u.x=toTile.x;u.y=toTile.y;u.facing=facing;segment++;if(segment<path.length-1){segmentStart=now;requestAnimationFrame(frame)}else{anim=null;draw();resolve()}}requestAnimationFrame(frame)})}
  function isBasicAttackOffset(u,dx,dy){const ax=Math.abs(dx),ay=Math.abs(dy);return u.troop==='archer'?ax+ay===2:u.troop==='support'?Math.max(ax,ay)===1:ax+ay===1&&(dx===0||dy===0)}
  function attackTiles(u){const out=[];for(let y=0;y<ROWS;y++)for(let x=0;x<COLS;x++)if(isBasicAttackOffset(u,x-u.x,y-u.y))out.push({x,y});return out}
  function inAttackRange(a,t){return attackTiles(a).some(q=>q.x===t.x&&q.y===t.y)}
  function selectUnit(u){if(dialogue||!playerTurn)return;ensureBattleCamera(u);if(u.side!=='ally'){if(phase!=='select'||selected)return;inspected=u;reachable.clear();attackable=[];moveOrigin=null;keyboardCursor={x:u.x,y:u.y};syncUI();status(`${u.name} · ${u.role} · ${u.className}${u.confused?' · 混乱中':''}`);draw();return}if(u.confused){flash(`${u.name}混乱中，无法行动`);status(`${u.name}本回合因混乱而无法行动`);return}if(u.acted)return;inspected=null;selected=u;phase='move';reachable=calcReach(u);attackable=[];hoverPath=[];moveOrigin={x:u.x,y:u.y};keyboardCursor={x:u.x,y:u.y};syncUI();status(`${u.name}：请选择移动位置`);draw()}
  function beginAttack(){if(!selected||selected.acted||!playerTurn)return;phase='attack';reachable.clear();attackable=attackTiles(selected);syncUI();status(`${selected.name}：请选择红色范围内的敌军，或点击待机`);draw()}
  function isOpponent(a,b){return(a.side==='enemy')!==(b.side==='enemy')}
  function provokeUnit(target,attacker){if(target?.side!=='enemy'||!attacker||!isOpponent(target,attacker))return;target.provokedBy=attacker.id;target.provokedTurn=turn}
  function provokedTarget(actor,candidates){const id=BattleRules.retaliationTargetId({aiType:actor.aiType,provokedBy:actor.provokedBy,provokedTurn:actor.provokedTurn,currentTurn:turn,actorX:actor.x,actorY:actor.y,detectionRange:3,candidates});delete actor.provokedBy;delete actor.provokedTurn;return id?candidates.find(unit=>unit.id===id)||null:null}
  function strategyTiles(u,type){const rule=strategies[type],out=[];for(let y=0;y<ROWS;y++)for(let x=0;x<COLS;x++){const d=Math.abs(x-u.x)+Math.abs(y-u.y);if(d>rule.range||(type!=='recover'&&d===0))continue;const target=unitAt(x,y);if(!target)continue;let valid=false;if(rule.target==='enemy')valid=isOpponent(u,target);else if(!isOpponent(u,target)){if(type==='recover')valid=target.hp<target.maxHp;else if(type==='encourage')valid=(target.morale??100)<100||target.confused}if(valid)out.push({x,y})}return out}
  function toggleStrategyMenu(){if(!selected||selected.acted||!playerTurn)return;if(!learnedStrategyIds(selected).length){flash(`${selected.name}当前尚未习得策略`);return}document.getElementById('itemMenu').classList.add('hidden');document.getElementById('strategyMenu').classList.toggle('hidden')}
  function beginStrategy(type){if(!selected||selected.acted||!playerTurn||!knowsStrategy(selected,type))return;const rule=strategies[type];if((selected.strategy||0)<rule.cost){flash('策略值不足');return}activeStrategy=type;phase='strategy';reachable.clear();attackable=strategyTiles(selected,type);document.getElementById('strategyMenu').classList.add('hidden');syncUI();status(`${selected.name}：请选择${rule.name}目标（射程${rule.range}）`);if(!attackable.length)flash('范围内没有可用目标');draw()}
  function playStrategyAnimation(type,target,success){return new Promise(resolve=>{const start=performance.now(),duration=900/animationSpeed;function frame(now){strategyFx={type,target,success,progress:Math.min(1,(now-start)/duration)};draw();if(strategyFx.progress<1)requestAnimationFrame(frame);else{strategyFx=null;draw();resolve()}}requestAnimationFrame(frame)})}
  function gainStrategyExp(u,amount){u.exp+=amount;addLog(`${u.name}施展策略，获得 ${amount} 经验`,true);while(u.exp>=100){u.exp-=100;levelUp(u)}}
  async function useStrategy(target){
    if(!selected||!activeStrategy||phase!=='strategy')return;const caster=selected,type=activeStrategy,rule=strategies[type];if(!attackable.some(q=>q.x===target.x&&q.y===target.y))return;
    caster.strategy=Math.max(0,(caster.strategy||0)-rule.cost);caster.acted=true;phase='animating';attackable=[];activeStrategy=null;hideForecast();syncUI();const success=Math.random()<effectiveStrategyHit(caster,rule);status(`${caster.name}施展${rule.name}`);await playStrategyAnimation(type,target,success);
    let jianxiongSplit=null;if(success&&type==='fire'){const damage=Math.min(target.hp,Math.max(35,Math.round(effectiveStat(caster,'atk')*.22+caster.level*10)));jianxiongSplit=jianxiongDamageSplit(target,damage);target.hp=Math.max(0,target.hp-jianxiongSplit.targetDamage);applyJianxiongDamage(jianxiongSplit);flash(`火攻 -${jianxiongSplit.targetDamage}`);addLog(`${caster.name}火攻命中${target.name}，造成${jianxiongSplit.targetDamage}兵力伤害`,true)}
    else if(success&&type==='recover'){const amount=Math.min(150,target.maxHp-target.hp);target.hp+=amount;await playHealAnimation(target,amount,'strategy');flash(`兵力 +${amount}`);addLog(`${caster.name}为${target.name}恢复${amount}兵力`,true)}
    else if(success&&type==='encourage'){const before=target.morale??100,amount=Math.min(rule.morale,100-before),woke=!!target.confused;target.morale=before+amount;target.confused=false;await playHealAnimation(target,Math.max(1,amount),'strategy');flash(woke?`士气 +${amount} · 恢复行动`:`士气 +${amount}`);addLog(`${caster.name}激励${target.name}，恢复${amount}士气${woke?'并解除混乱':''}`,true)}
    else if(success){target.containedUntil=turn+1;applyMoraleLoss(target,Math.max(1,20+Math.floor(caster.level/10)-Math.floor(target.level/10)));flash('牵制成功');addLog(`${target.name}受到牵制：攻击与移动下降20%`,true)}
    else{flash(`${rule.name}失败`);addLog(`${caster.name}对${target.name}施展${rule.name}失败`)}
    gainStrategyExp(caster,success?(caster.troop==='support'?12:8):4);if(await resolveJianxiongProtector(jianxiongSplit,caster))return;clearActionMoveBonus(caster);phase='select';selected=null;syncUI();draw();scheduleAutoSave();
    if(target.hp<=0){addLog(`${target.name}撤退`,true);await playDefeatQuote(target);if(target.id===objectiveUnitId){victory();return}}
    if(playerTurn&&units.filter(u=>u.side==='ally'&&u.hp>0).every(u=>u.acted))queueEndPlayerTurn(360)
  }
  function chooseAiStrategy(caster,physicalPlan=null){
    const learned=new Set(learnedStrategyIds(caster));if(!learned.size)return null;
    const allowedOpponent=target=>!(caster.side==='guest'&&level.alliedAiAvoidsObjective&&target.id===objectiveUnitId)&&!(caster.id===objectiveUnitId&&level.objectiveAiTargetsPlayerOnly&&target.side==='guest');
    const friendly=units.filter(u=>u.hp>0&&!isOpponent(caster,u)&&Math.abs(caster.x-u.x)+Math.abs(caster.y-u.y)<=strategies.recover.range&&u.hp<u.maxHp*.35);
    const decision=BattleRules.aiStrategyDecision({turn,lastStrategyTurn:caster.lastStrategyTurn,cooldown:level.ai?.strategyCooldown??3,hasPhysicalAttack:!!physicalPlan?.target,emergencyHeal:learned.has('recover')&&(caster.strategy||0)>=strategies.recover.cost&&friendly.length>0,role:caster.role,zhili:caster.zhili||0});
    if(decision==='recover'){friendly.sort((a,b)=>(a.hp/a.maxHp)-(b.hp/b.maxHp)||a.spawnOrder-b.spawnOrder);return{type:'recover',target:friendly[0]}}
    if(decision!=='offensive'||(caster.strategy||0)<4)return null;
    const targets=units.filter(u=>u.hp>0&&isOpponent(caster,u)&&allowedOpponent(u)&&Math.abs(caster.x-u.x)+Math.abs(caster.y-u.y)<=3&&!inAttackRange(caster,u)).sort((a,b)=>{const score=t=>(t.hp/t.maxHp)*40-effectiveStat(t,'atk')/30+(map[t.y][t.x]==='forest'?-12:0);return score(a)-score(b)});
    if(!targets.length)return null;const target=targets[0],preferFire=(caster.zhili||0)>=55||map[target.y][target.x]==='forest';
    if(learned.has('fire')&&preferFire)return{type:'fire',target};if(learned.has('contain')&&(target.containedUntil||0)<turn)return{type:'contain',target};return null
  }
  async function useStrategyNpc(caster,type,target){
    if(!knowsStrategy(caster,type))return false;
    const rule=strategies[type],previousPhase=phase,bossProtected=caster.side==='guest'&&target.id===objectiveUnitId;caster.strategy=Math.max(0,(caster.strategy||0)-rule.cost);caster.lastStrategyTurn=turn;phase='animating';status(`${caster.name}施展${rule.name}`);syncUI();const success=previewParams.has('strategyDeathPreview')||Math.random()<effectiveStrategyHit(caster,rule);await playStrategyAnimation(type,target,success);
    let jianxiongSplit=null;if(success&&type==='fire'){let damage=Math.min(target.hp,Math.max(35,Math.round(effectiveStat(caster,'atk')*.22+caster.level*10)));if(bossProtected)damage=Math.min(damage,Math.max(0,target.hp-1));jianxiongSplit=jianxiongDamageSplit(target,damage);target.hp=Math.max(bossProtected?1:0,target.hp-jianxiongSplit.targetDamage);applyJianxiongDamage(jianxiongSplit);flash(`火攻 -${jianxiongSplit.targetDamage}`);addLog(`${caster.name}火攻命中${target.name}，造成${jianxiongSplit.targetDamage}兵力伤害`,true)}
    else if(success&&type==='recover'){const amount=Math.min(150,target.maxHp-target.hp);target.hp+=amount;await playHealAnimation(target,amount,'strategy');flash(`兵力 +${amount}`);addLog(`${caster.name}为${target.name}恢复${amount}兵力`,true)}
    else if(success&&type==='encourage'){const before=target.morale??100,amount=Math.min(rule.morale,100-before),woke=!!target.confused;target.morale=before+amount;target.confused=false;await playHealAnimation(target,Math.max(1,amount),'strategy');flash(woke?`士气 +${amount} · 恢复行动`:`士气 +${amount}`);addLog(`${caster.name}激励${target.name}，恢复${amount}士气${woke?'并解除混乱':''}`,true)}
    else if(success){target.containedUntil=turn+1;applyMoraleLoss(target,Math.max(1,20+Math.floor(caster.level/10)-Math.floor(target.level/10)),{preventRout:bossProtected});flash('牵制成功');addLog(`${target.name}受到牵制：攻击与移动下降20%`,true)}
    else{flash(`${rule.name}失败`);addLog(`${caster.name}对${target.name}施展${rule.name}失败`)}
    if(caster.side==='guest')gainStrategyExp(caster,success?(caster.troop==='support'?12:8):4);draw();syncUI();if(await resolveJianxiongProtector(jianxiongSplit,caster)){phase=previousPhase;return true}
    if(target.hp<=0){phase=previousPhase;addLog(`${target.name}撤退`,true);await playDefeatQuote(target);if(checkEnemyForceVictory(target))return true;if(target.id==='liu'){defeat('刘备撤退');return true}syncUI();draw();return false}
    phase=previousPhase;syncUI();draw();return false
  }
  function checkAlternateVictory(u){const rule=level.alternateVictory;if(!rule||u.id!==rule.unitId||!alternateVictoryContains(u.x,u.y))return false;const amount=Math.max(0,Number(rule.exp)||0);addLog(rule.log||`${u.name}抵达目标，全体残存部队获得经验${amount}`,true);victory(false,'alternate');return true}
  function checkEnemyForceVictory(defeated){if(defeated?.side!=='enemy')return false;const commanderDown=level.commanderDefeatEndsBattle!==false&&defeated.id===objectiveUnitId,allEnemiesDown=level.victoryCondition==='eliminateAllEnemies'&&!units.some(unit=>unit.side==='enemy'&&unit.hp>0);if(!commanderDown&&!allEnemiesDown)return false;victory();return true}
  async function triggerAreaEvents(u){
    for(const event of level.areaEvents||[]){
      if(event.unitId&&event.unitId!==u.id)continue;
      const r=event.rect,adjacentTarget=event.adjacentToUnitId?units.find(target=>target.id===event.adjacentToUnitId&&target.hp>0):null,inRect=!!r&&u.x>=r.x1&&u.x<=r.x2&&u.y>=r.y1&&u.y<=r.y2,withinDistance=!!adjacentTarget&&Math.abs(u.x-adjacentTarget.x)+Math.abs(u.y-adjacentTarget.y)<=Math.max(1,event.maxDistance||1);
      if((event.adjacentToUnitId?!withinDistance:!inRect)||timedEventsFired.has(event.id))continue;
      if(event.item&&carriedCount(u)>=8){flash(`${u.name}的道具栏已满，无法取得${shopItems[event.item]?.name||'道具'}`);continue}
      timedEventsFired.add(event.id);
      for(const update of event.terrainUpdates||[]){if(map[update.y]?.[update.x]!==undefined)map[update.y][update.x]=update.type}
      for(const update of event.aiUpdates||[]){const target=units.find(x=>x.id===update.unitId);if(!target)continue;if(Number.isInteger(update.aiType)){target.aiType=update.aiType;target.stationary=update.aiType===2}if(Number.isInteger(update.aiTarget))target.aiTarget=update.aiTarget}
      if(event.item){for(let i=0;i<(event.amount||1);i++)u.inventory.push(event.item);flash(`${u.name}获得${shopItems[event.item]?.name||event.item} × ${event.amount||1}`);syncItems()}
      if(event.dialogue?.length)await new Promise(resolve=>runDialogue(event.dialogue,resolve));
      if(event.recruitUnitId){const recruit=units.find(target=>target.id===event.recruitUnitId&&target.hp>0);if(recruit){recruit.side='ally';recruit.carryover=true;recruit.aiType=0;recruit.stationary=false;recruit.acted=true;recruit.facing=-1;if(event.restoreRecruited){recruit.hp=recruit.maxHp;recruit.strategy=recruit.maxStrategy;recruit.morale=100}inspected=recruit}}
      if(event.levelUpUnitId){const promoted=units.find(target=>target.id===event.levelUpUnitId&&target.hp>0);if(promoted)levelUp(promoted)}
      addLog(event.log||'战场事件触发',true);if(dangerVisible)rebuildDangerTiles();draw()
      if(level.victoryCondition==='eliminateAllEnemies'&&!units.some(unit=>unit.side==='enemy'&&unit.hp>0)){victory();return}
    }
  }
  async function moveSelected(x,y){const k=keyOf(x,y),occupant=unitAt(x,y);if(!reachable.has(k)){const target=alternateVictoryContains(x,y)?'徐州城目标格':'该位置';status(`${target}超出${selected?.name||'该武将'}本回合移动范围，请分回合接近`);flash('本回合无法到达');return}if(occupant){status(`${occupant.name}占据该格，暂时无法进入`);return}const u=selected,movementDistance=Math.max(0,findPath(u,x,y).length-1);reachable.clear();hoverPath=[];phase='animating';syncUI();status(`${u.name} 行进中`);await animateUnitMove(u,x,y);u.turnMoveDistance=movementDistance;keyboardCursor={x,y};collectTile(u);if(checkAlternateVictory(u))return;await triggerAreaEvents(u);await playBrotherMergeDialogue(u);if(tryDuel())return;phase='attack';attackable=attackTiles(u);syncUI();status(`${u.name}：选择敌军攻击，或点击待机`);draw()}
  function collectTile(u){const t=map[u.y][u.x],loot=level.events?.loot?.[`${u.x},${u.y}`],treasure=loot||level.events?.treasure||{gold:100},supplyItem=loot?.item??level.events?.supply?.item??'bean';if(t==='treasure'){if(treasure.treasureId){if(carriedCount(u)>=8){flash(`${u.name}的道具栏已满`);return}u.treasureItems.push(treasure.treasureId);refreshPassiveTreasures(u);const name=treasureCatalog[treasure.treasureId]?.name||treasure.treasureId;flash(`${u.name}获得${name} · 已收入装备／宝物栏`);addLog(`${u.name}打开宝物库，获得${name}（装备／宝物）`,true)}else if(treasure.item){if(carriedCount(u)>=8){flash(`${u.name}的道具栏已满`);return}for(let i=0;i<(treasure.amount||1);i++)u.inventory.push(treasure.item);flash(`获得${shopItems[treasure.item].name} × ${treasure.amount||1}`);addLog(`${u.name}打开宝物库，获得${shopItems[treasure.item].name}`,true)}else{const amount=treasure.gold??100;gold+=amount;flash(`获得金 ${amount}`);addLog(`${u.name}打开宝物库，获得金${amount}`,true)}map[u.y][u.x]='treasureEmpty';syncItems()}if(t==='supply'){if(carriedCount(u)<8){u.inventory.push(supplyItem);flash(`获得${shopItems[supplyItem].name} × 1`);addLog(`${u.name}在兵粮库获得${shopItems[supplyItem].name}`,true);map[u.y][u.x]='supplyEmpty';syncItems()}else{flash(`${u.name}的道具栏已满`);addLog(`兵粮库中有${shopItems[supplyItem].name}，但${u.name}无法携带`,true)}}}
  function recoverFromTerrain(side){const recoveries=[];for(const u of units.filter(x=>x.side===side&&x.hp>0)){const t=terrain[map[u.y][u.x]];if(!t.recoverHp&&!t.recoverMorale)continue;const result=BattleRules.terrainRecovery({hp:u.hp,maxHp:u.maxHp,morale:u.morale??100,tongyu:u.tongyu||0,recoverHp:!!t.recoverHp,recoverMorale:!!t.recoverMorale,hpRoll:Math.floor(Math.random()*11),moraleRoll:Math.floor(Math.random()*5)});u.hp=result.hp;u.morale=result.morale;if(result.hpGain<=0&&result.moraleGain<=0)continue;if(result.hpGain>0)recoveries.push({target:u,amount:result.hpGain,source:'terrain'});addLog(`${u.name}在${t.name}休整，恢复${result.hpGain}兵力${result.moraleGain?`、${result.moraleGain}士气`:''}`,true);if(side==='ally')flash(`${u.name} ${t.name}休整 +${result.hpGain}`)}return recoveries}
  function physicalMoraleDamage(target,damage){return BattleRules.physicalMoraleDamage(damage,target.level,target.morale??100)}
  function applyMoraleLoss(target,amount,{preventRout=false}={}){if(target.hp<=0||amount<=0)return{loss:0,routed:false,confused:false};const result=BattleRules.applyMoraleLoss(target.morale??100,amount,preventRout);target.morale=result.morale;if(result.loss>0)addLog(`${target.name}士气下降${result.loss}`,false);if(result.routed){target.hp=0;target.confused=false;addLog(`${target.name}士气崩溃，被迫撤退`,true);return{loss:result.loss,routed:true,confused:false}}if(target.morale<30&&!target.confused&&Math.random()<.60){target.confused=true;addLog(`${target.name}因士气低落陷入混乱`,true);flash(`${target.name}混乱！`);return{loss:result.loss,routed:false,confused:true}}return{loss:result.loss,routed:false,confused:false}}
  function renzhongLubuSplashTargets(attacker,primaryTarget){if(attacker?.id!=='lvbu'||!primaryTarget)return[];return units.filter(unit=>unit!==primaryTarget&&unit.hp>0&&isOpponent(attacker,unit)&&Math.abs(unit.x-primaryTarget.x)+Math.abs(unit.y-primaryTarget.y)===1)}
  function applyRenzhongLubuSplash(attacker,primaryTarget,primaryDamage,{protectObjective=false}={}){
    if(attacker?.id!=='lvbu'||primaryDamage<=0)return[];
    const splashDamage=Math.max(1,Math.round(primaryDamage*.1)),hits=[];
    for(const unit of renzhongLubuSplashTargets(attacker,primaryTarget)){
      const protectedTarget=protectObjective&&unit.id===objectiveUnitId,damage=protectedTarget?Math.min(splashDamage,Math.max(0,unit.hp-1)):splashDamage;if(damage<=0)continue;
      unit.hp=Math.max(protectedTarget?1:0,unit.hp-damage);hits.push({unit,damage});addLog(`人中吕布：方天画戟余威波及${unit.name}，造成${damage}兵力伤害`,true)
    }
    return hits
  }
  async function resolveRenzhongLubuSplash(hits,source){for(const {unit} of hits){if(unit.hp>0)continue;addLog(`${unit.name}受人中吕布波及而撤退`,true);if((source.side==='ally'||source.side==='guest')&&source.hp>0)gainExp(source,unit,true);await playDefeatQuote(unit);if(unit.id==='liu'){defeat('刘备撤退');return true}if(checkEnemyForceVictory(unit))return true}return false}
  function recoverConfusion(side){for(const u of units.filter(x=>x.side===side&&x.hp>0&&x.confused)){const chance=BattleRules.confusionRecoveryChance(u.tongyu||0,u.morale??0);if(Math.random()<chance){u.confused=false;addLog(`${u.name}恢复镇定，解除混乱`,true);if(side==='ally')flash(`${u.name}恢复镇定`)}else{u.acted=true;addLog(`${u.name}仍处于混乱，本阶段无法行动`,false)}}}
  function recoverFromMilitaryBands(side){
    for(const u of units.filter(x=>x.side===side&&x.hp>0&&x.maxStrategy>0)){
      const available=Math.max(0,u.maxStrategy-(u.strategy||0));if(!available)continue;
      const recovery=BattleRules.adjacentMilitaryBandRecovery({x:u.x,y:u.y,id:u.id,units}),gain=Math.min(available,recovery);if(!gain)continue;
      u.strategy=(u.strategy||0)+gain;addLog(`${u.name}受到邻近军乐鼓舞，策略值恢复${gain}`,true);if(side==='ally')flash(`${u.name} 策略值 +${gain}`)
    }
  }
  function gainTransportHealingExp(carrier,actualHealing){
    if(!carrier||carrier.troop!=='transport'||carrier.side==='enemy')return 0;
    const gain=BattleRules.transportHealingExperience(actualHealing);if(!gain)return 0;
    carrier.exp=(carrier.exp||0)+gain;addLog(`${carrier.name}执行医疗补给，获得 ${gain} 经验`,true);flash(`${carrier.name} 治疗经验 +${gain}`);
    while(carrier.exp>=100){carrier.exp-=100;levelUp(carrier)}
    return gain
  }
  function recoverFromTransports(side){
    const recoveries=[],transports=units.filter(u=>u.side===side&&u.troop==='transport'&&u.hp>0);
    for(const carrier of transports){
      let actualHealing=0;
      const targets=units.filter(u=>u.side===side&&u!==carrier&&u.hp>0&&u.hp<u.maxHp&&Math.abs(u.x-carrier.x)+Math.abs(u.y-carrier.y)===1);
      for(const target of targets){const amount=Math.min(target.maxHp-target.hp,70+carrier.level*5);target.hp+=amount;actualHealing+=amount;recoveries.push({target,amount,source:'transport'});addLog(`${carrier.name}为${target.name}补充兵力${amount}`,true)}
      gainTransportHealingExp(carrier,actualHealing)
    }
    return recoveries
  }
  async function beginSidePhase(side){const healEvents=[...recoverFromTerrain(side),...recoverFromTransports(side)];recoverFromMilitaryBands(side);recoverConfusion(side);if(healEvents.length)await playHealAnimation(healEvents)}
  function isWeakened(u){return u.hp<u.maxHp*.4||(u.morale??100)<40}
  function aiTurnOrder(side){return units.filter(u=>u.side===side&&u.hp>0&&!u.confused).sort((a,b)=>{const priority=u=>terrain[map[u.y][u.x]].recoverHp?0:isWeakened(u)?1:2;return priority(a)-priority(b)||a.spawnOrder-b.spawnOrder})}
  function affinity(a,b){const percent=BattleRules.affinityPercent(a,b);return percent<100?1.25:percent>100?.75:1}
  function damageOf(a,t,{counter=false}={}){return BattleRules.physicalDamage({attack:effectiveStat(a,'atk'),defense:effectiveStat(t,'def'),attackerTroop:a.troop,targetTroop:t.troop,terrainDefense:terrain[map[t.y][t.x]].def,targetHp:t.hp,counter})}
  function hitRate(attacker,target){return BattleRules.hitRate(attacker.morale??100,target.morale??100,terrain[map[target.y][target.x]].def,{archer:attacker.troop==='archer',targetInForest:map[target.y][target.x]==='forest'})}
  function canCounterUnit(defender,attacker){return['bandit','martial'].includes(defender.troop)&&['cavalry','heavyCavalry','bandit','beast','martial','tribal'].includes(attacker.troop)}
  function counterRate(defender,attacker){return canCounterUnit(defender,attacker)?Math.max(0,Math.min(1,(defender.wuli||0)/150)):0}
  function canAttackFrom(u,x,y,target){return isBasicAttackOffset(u,target.x-x,target.y-y)}
  function attackDirectionRank(u,x,y,target){const dx=target.x-x,dy=target.y-y,order=u.troop==='archer'?[[1,-1],[1,1],[-1,1],[-1,-1],[2,0],[-2,0],[0,2],[0,-2]]:[[0,-1],[1,0],[0,1],[-1,0]];const rank=order.findIndex(([ox,oy])=>ox===dx&&oy===dy);return rank<0?99:rank}
  function physicalActionValue(actor,target,x,y){const basic=damageOf(actor,target)+Math.floor(actor.hp/6),attackValue=Math.max(1,Math.floor(basic/16));return attackValue+Math.floor((terrain[map[y][x]].def||0)/5)}
  function bestAiAction(actor,candidates,mobile=true){const cells=mobile?calcReach(actor):new Map([[keyOf(actor.x,actor.y),0]]);let best=null;for(const [key,cost] of cells){const [x,y]=key.split(',').map(Number),occupant=unitAt(x,y);if(occupant&&occupant!==actor)continue;const ground=terrain[map[y][x]];if(isWeakened(actor)&&ground.recoverHp){const value=50+Math.floor((ground.def||0)/5);if(!best||value>best.value||(value===best.value&&cost<best.cost))best={x,y,target:null,value,cost,dirRank:99,kind:'recover'}}for(const target of candidates){if(!canAttackFrom(actor,x,y,target))continue;const value=physicalActionValue(actor,target,x,y),dirRank=attackDirectionRank(actor,x,y,target);if(!best||value>best.value||(value===best.value&&(dirRank<best.dirRank||(dirRank===best.dirRank&&cost<best.cost))))best={x,y,target,value,cost,dirRank,kind:'attack'}}}return best}
  function bestSupportMove(actor){
    const friends=units.filter(u=>u!==actor&&u.hp>0&&u.side===actor.side);if(!friends.length)return null;
    let best=null;for(const [key,cost] of calcReach(actor)){const[x,y]=key.split(',').map(Number),occupant=unitAt(x,y);if(occupant&&occupant!==actor)continue;let score=(terrain[map[y][x]].def||0)*.5-cost*.6;
      for(const friend of friends){const d=Math.abs(friend.x-x)+Math.abs(friend.y-y),missing=Math.max(0,(friend.maxStrategy||0)-(friend.strategy||0)),missingHp=Math.max(0,friend.maxHp-friend.hp),need=actor.troop==='transport'?Math.min(150,missingHp/3):missing?70+Math.min(40,missing):0;if(d===1)score+=90+need;else if(d===2)score+=18+need*.15;score-=Math.min(d,8)*.5}
      const nearestEnemy=units.filter(u=>u.hp>0&&u.side!==actor.side).reduce((d,u)=>Math.min(d,Math.abs(u.x-x)+Math.abs(u.y-y)),99);if(nearestEnemy<=1)score-=95;else if(nearestEnemy===2)score-=28;
      if(!best||score>best.score||(score===best.score&&cost<best.cost))best={x,y,score,cost,target:null,kind:'support'}
    }return best
  }
  function rollCombatOutcome(attacker,target,forced={}){const baseDamage=damageOf(attacker,target,{counter:!!forced.counter}),missed=forced.missed??(Math.random()>=hitRate(attacker,target)),critical=!missed&&(forced.critical??(Math.random()<effectiveRate(attacker,'critRate'))),blocked=!missed&&(forced.blocked??(Math.random()<effectiveRate(target,'blockRate')));let damage=baseDamage;if(critical)damage*=1.65;if(blocked)damage*=.42;return{critical,blocked,missed,counter:!!forced.counter,baseDamage,damage:missed?0:Math.max(1,Math.round(damage))}}
  function combatResultLabel(outcome){if(outcome.missed)return'闪避！';if(outcome.critical&&outcome.blocked)return'会心一击被格挡！';if(outcome.critical)return'会心一击！';if(outcome.blocked)return'格挡！';return''}
  function combatLogText(attacker,target,outcome){const prefix=outcome.counter?'反击：':'',result=combatResultLabel(outcome),detail=result?`（${result.replace('！','')}）`:'';return outcome.missed?`${prefix}${target.name}闪避了${attacker.name}的攻击`:`${prefix}${attacker.name}攻击${target.name}${detail}，造成${outcome.damage}兵力伤害`}
  function audio(){try{if(!audioCtx){audioCtx=new (window.AudioContext||window.webkitAudioContext)();sfxBus=audioCtx.createGain();sfxLimiter=audioCtx.createDynamicsCompressor();sfxLimiter.threshold.value=-10;sfxLimiter.knee.value=12;sfxLimiter.ratio.value=8;sfxLimiter.attack.value=.003;sfxLimiter.release.value=.18;applySfxMix();sfxBus.connect(sfxLimiter).connect(audioCtx.destination)}if(audioCtx.state==='suspended')audioCtx.resume();return audioCtx}catch{return null}}
  function sfxPanFor(u){const p=iso(u.x,u.y),screenX=bgRect.x+p.x*bgRect.scale,center=Math.max(1,wrap.clientWidth/2);return Math.max(-.82,Math.min(.82,(screenX-center)/center))}
  function battleSfx(name,u,options={}){const a=audio(),fn=window.BattleSfx?.[name];if(!a||!sfxBus||typeof fn!=='function')return;duckMusicForSfx(name);fn(a,sfxBus,{pan:sfxPanFor(u),...options})}
  function weaponSfxType(u){return window.BattleSfx?.weaponType?.(u)||'saber'}
  function updateMusicUI(){const btn=document.getElementById('musicBtn');btn.classList.toggle('muted',!musicEnabled);btn.setAttribute('aria-pressed',String(musicEnabled));document.getElementById('musicState').textContent=musicEnabled?'音乐':'静音'}
  function startTitleMusic(){if(!musicEnabled||!titleMusic.paused)return;storyMusic.pause();battleMusic.pause();titleMusic.volume=mixedMusicVolume();const playback=titleMusic.play();if(playback)playback.then(()=>{musicStarted=true}).catch(()=>{musicStarted=false});updateMusicUI()}
  function startStoryMusic(id=storyMusicId){
    const src=storyMusicAssets[id]||`assets/audio/original-music-${id}.wav`;if(storyMusicMode!=='story'||storyMusicId!==id||storyMusic.getAttribute('src')!==src){storyMusic.pause();storyMusicMode='story';storyMusicId=id;storyMusic.src=src;storyMusic.load()}
    titleMusic.pause();battleMusic.pause();if(!musicEnabled||!storyMusic.paused)return;storyMusic.volume=storyMusicVolume();musicStarted=true;const playback=storyMusic.play();if(playback)playback.catch(()=>{musicStarted=false});updateMusicUI()
  }
  function startShopMusic(){
    if(!configuredShopTrack){startStoryMusic();return}
    if(storyMusicMode!=='shop'||storyMusic.getAttribute('src')!==configuredShopTrack){storyMusic.pause();storyMusicMode='shop';storyMusic.src=configuredShopTrack;storyMusic.load()}
    titleMusic.pause();battleMusic.pause();if(!musicEnabled||!storyMusic.paused)return;storyMusic.volume=storyMusicVolume();musicStarted=true;const playback=storyMusic.play();if(playback)playback.catch(()=>{musicStarted=false});updateMusicUI()
  }
  function setBattleMusicTrack(track,{play=true,restart=true}={}){if(!track)return;const changed=activeBattleTrack!==track;activeBattleTrack=track;if(changed){battleMusic.pause();battleMusic.src=track;battleMusic.load();if(restart)battleMusic.currentTime=0}if(play)startBattleMusic()}
  function startBattleMusic(){storyMusic.pause();titleMusic.pause();if(!musicEnabled||!battleMusic.paused)return;battleMusic.volume=battleMusicVolume();musicStarted=true;const playback=battleMusic.play();if(playback)playback.catch(()=>{musicStarted=false});updateMusicUI()}
  function startActiveMusic(){if(titleIntroActive||titleVisible())startTitleMusic();else if(storyActive)startStoryMusic();else if(!document.getElementById('shopOverlay').classList.contains('hidden'))startShopMusic();else startBattleMusic()}
  function setMusicEnabled(enabled){musicEnabled=enabled;if(enabled)startActiveMusic();else{titleMusic.pause();storyMusic.pause();battleMusic.pause()}updateMusicUI()}
  function playCharge(u){battleSfx('charge',u,{critical:true})}
  function playCombatAnimation(attacker,target,damage,onImpact,outcome={}){
    ensureBattleCamera(target);
    const motionKey=`${attacker.troop}:${attackKeyFor(attacker)}`,repeatBoost=compactRepeatedAnimations&&seenCombatMotions.has(motionKey)?1.65:1,motionSpeed=animationSpeed*repeatBoost,critical=!!outcome.critical,blocked=!!outcome.blocked,missed=!!outcome.missed,ranged=attacker.troop==='archer',weaponType=weaponSfxType(attacker),from=iso(attacker.x,attacker.y),to=iso(target.x,target.y),dx=to.x-from.x,dy=to.y-from.y,dist=Math.max(1,Math.hypot(dx,dy)),ux=dx/dist,uy=dy/dist,chargeDuration=(critical?650:0)/motionSpeed,strikeDuration=(ranged?920:attacker.id==='guan'?1040:860)/motionSpeed,hitAt=ranged?.56:attacker.id==='guan'?.5:.43,impactAt=chargeDuration+strikeDuration*hitAt,fatal=!missed&&(damage>=target.hp||outcome.rout),authoredFatal=!!(fatal&&(deathPaths[target.id]||hurtPaths[target.troop])),deathStartAt=impactAt+strikeDuration*.08,deathDuration=(authoredFatal?980:620)/motionSpeed,duration=fatal?Math.max(chargeDuration+strikeDuration,deathStartAt+deathDuration):chargeDuration+strikeDuration;let struck=false,released=!critical,fallSound=false;if(critical)playCharge(attacker);else battleSfx('attack',attacker,{kind:weaponType,critical});
    return new Promise(resolve=>{
      const start=performance.now();
      function frame(now){
        const elapsed=now-start,inCharge=elapsed<chargeDuration,strikeElapsed=Math.max(0,elapsed-chargeDuration),p=Math.min(1,strikeElapsed/strikeDuration),totalP=Math.min(1,elapsed/duration),chargeProgress=critical?Math.min(1,elapsed/chargeDuration):0,fx={attacker,target,damage,fatal,authoredDeath:authoredFatal,critical,blocked,missed,criticalCharge:critical?(inCharge?chargeProgress:Math.max(0,1-p*5)):0,blockPose:0,blockFrame:0,blockImpact:0,deathProgress:0,targetAlpha:1,showAttackSprite:!inCharge&&p<(attacker.id==='guan'?.96:.9),attackFrame:0,attackerOffset:{x:0,y:0},targetOffset:{x:0,y:0},targetRotation:0,targetScaleX:1,targetScaleY:1,projectile:null,slashAlpha:0,impact:0,damageAlpha:0,hitFlash:0,hitReaction:0,shakeX:0,shakeY:0};
        if(inCharge){
          const crouch=Math.sin(chargeProgress*Math.PI*.5),tremble=Math.sin(elapsed*.055)*1.2*chargeProgress;fx.attackerOffset={x:-ux*5*crouch+tremble,y:-uy*5*crouch};fx.showAttackSprite=false;
        }else if(ranged){
          fx.attackFrame=combatAttackFrame(attacker,p,true);
          fx.projectile=p<.63?Math.max(0,Math.min(1,(p-.28)/.32)):null;
          const recoil=Math.sin(Math.min(1,p/.65)*Math.PI);
          fx.attackerOffset={x:-ux*5*recoil,y:-uy*5*recoil};
        }else{
          fx.attackFrame=combatAttackFrame(attacker,p,false);
          if(p<.2){const e=Math.sin(p/.2*Math.PI/2);fx.attackerOffset={x:-ux*8*e,y:-uy*8*e}}
          else if(p<hitAt){const e=1-Math.pow(1-(p-.2)/(hitAt-.2),3);fx.attackerOffset={x:ux*(5+30*e),y:uy*(5+30*e)}}
          else if(p<.58){fx.attackerOffset={x:ux*35,y:uy*35};fx.slashAlpha=Math.max(0,.28-(p-hitAt)*1.5)}
          else{const e=Math.min(1,(p-.58)/.38),back=(1-e)*(1-e);fx.attackerOffset={x:ux*35*back,y:uy*35*back}}
        }
        if(!released&&!inCharge){released=true;battleSfx('attack',attacker,{kind:weaponType,critical})}
        if(blocked&&!inCharge){const rise=Math.max(0,Math.min(1,(p-(hitAt-.2))/.12)),fall=p<hitAt+.2?1:Math.max(0,1-(p-hitAt-.2)/.28);fx.blockPose=rise*fall;fx.blockFrame=p<hitAt-.13?0:p<hitAt-.04?1:p<hitAt+.07?2:p<hitAt+.22?3:4}
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
  const LIU_CLEAR_EXP=50;
  function awardLiuBeiClearExp(){const liu=units.find(u=>u.id==='liu'&&u.hp>0&&(u.side==='ally'||u.side==='guest'));if(!liu)return{amount:0,levels:0};liu.exp=(liu.exp||0)+LIU_CLEAR_EXP;addLog(`刘备获得过关奖励经验 ${LIU_CLEAR_EXP}`,true);let levels=0;while(liu.exp>=100){liu.exp-=100;levelUp(liu);levels++}return{amount:LIU_CLEAR_EXP,levels}}
  function gainExp(u,target,killed){const gain=BattleRules.experienceGain(u.level,target.level,killed,!!target.boss);u.exp+=gain;addLog(`${u.name}获得 ${gain} 经验`,true);flash(`经验 +${gain}`);while(u.exp>=100){u.exp-=100;levelUp(u)}syncUI();return gain}
  const duelNativeFacing={
    liu:'left',guan:'left',zhang:'left',gongsun:'left',tao:'left',
    hua:'right',lvbu:'right',officer:'right',infantry:'right',archer:'right',support:'right',
    guanhai:'right',kongrong:'left',taishici:'left',mengsu:'left',beast:'left',
    yujin:'left',yuejin:'left',lidian:'left',guojia:'left',caohong:'left',xiahouyuan:'left',mifang:'left',sunqian:'left',transport:'left'
  };
  const duelAttackNativeFacing={zhaoyun:'right',wenchou:'right',yanliang:'right',zhanghe:'right',quyi:'right',guanhai:'right',kongrong:'left',taishici:'left',mengsu:'left',beast:'left',yujin:'left',yuejin:'left',lidian:'left',guojia:'left',caohong:'left',xiahouyuan:'left',mifang:'left',sunqian:'left',transport:'left'};
  function duelVisualKeyFor(u){return art[u.id]?u.id:genericVisualKeyFor(u)}
  function duelFacingScale(u,direction){const native=duelNativeFacing[duelVisualKeyFor(u)]||(u.side==='enemy'?'right':'left');return native===direction?1:-1}
  function duelAttackPose(progress){
    const p=Math.max(0,Math.min(.999,Number(progress)||0));
    if(p<.18)return{frame:0,lean:-.025};
    if(p<.38)return{frame:1,lean:-.075};
    if(p<.58)return{frame:2,lean:.025};
    if(p<.82)return{frame:3,lean:.095};
    return{frame:4,lean:.025}
  }
  // Resolve facing from the illustration actually drawn. Named recruits and
  // enemy officers often reuse a generic cavalry/infantry sheet whose native
  // direction differs from their unit id, so id-only facing turns them away.
  function drawDuelUnit(u,x,y,flipX,attackProgress=null,fall=0,alpha=1,options={}){
    const c=duelCtx,staticImg=spriteFor(u),baseH=Math.min(340,duelCanvas.clientHeight*.54),h=baseH*(options.scale||1),key=attackKeyFor(u),sheet=attackSpriteFor(u),squash=options.squash||0;
    const visualKey=duelVisualKeyFor(u),staticNative=duelNativeFacing[visualKey]||(u.side==='enemy'?'right':'left'),attackNative=duelAttackNativeFacing[visualKey]||staticNative,renderFlip=attackProgress!==null&&attackNative!==staticNative?-flipX:flipX,attackPose=attackProgress===null?null:duelAttackPose(attackProgress);
    c.save();c.globalAlpha=alpha;c.translate(x,y);c.rotate((options.rotation||0)+(attackPose?.lean||0)*renderFlip-renderFlip*fall*1.22);c.scale(renderFlip,(1-fall*.22)*(1-squash));
    let drewAttack=false;
    if(attackPose&&mediaReady(sheet)){const sourceFrame=xuzhouCombatFrame(u,'attack',attackPose.frame),sourceW=Math.floor(mediaWidth(sheet)/5),b=attackFrameBounds[key]?.[sourceFrame],scale=attackSheetScale(key,h,staticImg,sheet);if(b){c.drawImage(sheet,sourceFrame*sourceW+b[0],b[1],b[2],b[3],(b[0]-sourceW/2)*scale,-b[3]*scale,b[2]*scale,b[3]*scale);drewAttack=true}}
    if(!drewAttack&&mediaReady(staticImg)){const staticW=mediaWidth(staticImg),staticH=mediaHeight(staticImg),cropTop=u.id==='liu'?Math.round(staticH*.15):0,sourceH=staticH-cropTop,w=h*staticW/sourceH;c.drawImage(staticImg,0,cropTop,staticW,sourceH,-w/2,-h,w,h)}c.restore()
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
      for(const [at,name,kind,actor] of [[720,'zhang-charge','charge',zhang],[1750,'zhang-clash','clash',lvbu],[3020,'lvbu-counter','clash',zhang],[3820,'guan-charge','charge',guan],[5100,'guan-clash','clash',lvbu],[5750,'liu-charge','charge',liu],[6900,'liu-clash','clash',lvbu],[7540,'zhang-final','clash',lvbu],[8160,'three-final','finish',lvbu],[8560,'lvbu-retreat','charge',lvbu]])if(ms>=at&&!marks.has(name)){marks.add(name);if(kind==='charge')playCharge(actor);else if(kind==='finish')battleSfx('duelFinish',lvbu,{critical:true});else battleSfx('duelClash',actor,{heavy:true})}
      if(t<1)requestAnimationFrame(frame);else{overlay.classList.add('hidden');resolve()}}requestAnimationFrame(frame)})
  }
  function playDuelCinematic(g,h,scriptOverride=null){
    if(level.id==='hulao-pass')return playThreeHeroesDuel(g,h);
    const script=scriptOverride||level.events.duel,classic=level.id==='sishui-pass'&&!scriptOverride,overlay=document.getElementById('duelOverlay'),title=document.getElementById('duelHeading'),captionNode=document.getElementById('duelCaption');document.getElementById('duelKicker').textContent=script.kicker||'阵前单挑';title.textContent=script.title||`${g.name}　VS　${h.name}`;captionNode.textContent=script.caption||'两军阵前，一决胜负';overlay.classList.remove('hidden');const dpr=Math.min(devicePixelRatio||1,2),W=overlay.clientWidth,H=overlay.clientHeight;duelCanvas.width=Math.round(W*dpr);duelCanvas.height=Math.round(H*dpr);duelCanvas.style.width=W+'px';duelCanvas.style.height=H+'px';duelCtx.setTransform(dpr,0,0,dpr,0,0);const duration=7200,marks=new Set(),clamp=n=>Math.max(0,Math.min(1,n)),ease=n=>1-Math.pow(1-clamp(n),3),pulse=(at,width)=>Math.max(0,1-Math.abs(msCache-at)/width);let msCache=0;
    return new Promise(resolve=>{const start=performance.now();function frame(now){const ms=(now-start)*animationSpeed,t=Math.min(1,ms/duration),c=duelCtx;msCache=ms;let shake=0;for(const at of [1450,2360,3150,5230])shake=Math.max(shake,pulse(at,145));const sx=Math.sin(ms*.17)*shake*13,sy=Math.cos(ms*.21)*shake*7;c.setTransform(dpr,0,0,dpr,0,0);c.clearRect(0,0,W,H);c.save();c.translate(sx,sy);
      drawDuelBackdrop(c,W,H);
      const ground=H*.79,approach=ease(ms/850),mountedJieqiaoDuel=level.id==='jieqiao'&&g.id==='zhaoyun'&&h.id==='wenchou',duelGap=Math.min(W*(mountedJieqiaoDuel?.30:.19),mountedJieqiaoDuel?430:300),leftReady=W*.5-duelGap*.5,rightReady=W*.5+duelGap*.5,baseGX=W*.18+(leftReady-W*.18)*approach,baseHX=W*.82+(rightReady-W*.82)*approach;let gx=baseGX,hx=baseHX,gy=ground,hy=ground,gp=null,hp=null,fall=0,hAlpha=1,gFlip=duelFacingScale(g,'right'),hFlip=duelFacingScale(h,'left'),gRot=0,hRot=0,slash=0,slashAngle=-.24,impact=0,impactX=W*.5,impactY=ground-H*.22,caption='策马交锋';
      const first=clamp((ms-850)/850),second=clamp((ms-1700)/820),cross=clamp((ms-2600)/950),reset=clamp((ms-3550)/500),final=clamp((ms-4050)/1450),after=clamp((ms-5500)/700),fallP=clamp((ms-6040)/850);
      if(ms<850){gx+=Math.sin(ms*.045)*2;hx-=Math.sin(ms*.041)*2;gy-=Math.sin(ms*.035)*3;hy-=Math.sin(ms*.032)*3;caption='催马 · 迎锋'}
      else if(ms<1700){gp=first;hp=first>.35&&first<.79?.43:null;gx+=Math.sin(Math.PI*first)*52;hx-=Math.sin(Math.PI*first)*15;gRot=-.035*Math.sin(Math.PI*first);hRot=.045*Math.sin(Math.PI*first);slash=pulse(1390,210);impact=pulse(1450,115);impactX=(gx+hx)/2;caption=classic?'第一合 · 青龙刀破风':`第一合 · ${g.name}抢攻`}
      else if(ms<2600){hp=second;gp=second>.28&&second<.78?.46:null;hx-=Math.sin(Math.PI*second)*52;gx+=Math.sin(Math.PI*second)*13;hRot=.04*Math.sin(Math.PI*second);gRot=-.035*Math.sin(Math.PI*second);slash=pulse(2260,220);slashAngle=Math.PI+.18;impact=pulse(2360,115);impactX=(gx+hx)/2;caption=classic?'第二合 · 华雄反扑':`第二合 · ${h.name}反扑`}
      else if(ms<3550){gp=cross;hp=clamp((ms-2730)/790);gx+=Math.sin(Math.PI*cross)*38;hx-=Math.sin(Math.PI*cross)*38;gy-=Math.sin(Math.PI*cross)*7;hy-=Math.sin(Math.PI*cross)*7;slash=pulse(3040,250);impact=pulse(3150,125);impactX=(gx+hx)/2;caption='第三合 · 兵刃相抵'}
      else if(ms<4050){gx-=reset*W*.035;hx+=reset*W*.035;caption='各退半步 · 胜负将分'}
      else if(ms<5500){const charge=ease(final);gp=clamp((final-.18)/.68);gx=mountedJieqiaoDuel?W*(.36+.12*charge):W*(.37+.18*charge);hx=W*(mountedJieqiaoDuel?.64:.595);gy-=Math.sin(Math.PI*final)*9;slash=pulse(5100,300);impact=pulse(5230,150);impactX=(gx+hx)/2;caption=classic?(final<.52?'关羽蓄势 · 青龙偃月':'青龙一闪 · 拖刀绝杀'):(final<.52?`${g.name}蓄势`:`${g.name}与${h.name}兵刃再交`)}
      else if(ms<6040){gx=mountedJieqiaoDuel?W*(.48+.09*ease(after)):W*(.55+.105*ease(after));hx=W*(mountedJieqiaoDuel?.64:.595);gFlip=duelFacingScale(g,'left');gRot=.018;hRot=-.035*after;slash=Math.max(0,1-after*1.8);caption='刀光已过 · 胜负已定'}
      else if(classic){gx=W*.655;hx=W*.595;gFlip=duelFacingScale(g,'left');fall=ease(fallP);hAlpha=fallP<.76?1:1-(fallP-.76)/.24;hx-=fall*18;caption=fallP<.55?'华雄中刀':'华雄败北'}
      else{gx=W*(mountedJieqiaoDuel?.57:.56);hx=W*((mountedJieqiaoDuel?.66:.60)+.27*ease(fallP));gFlip=duelFacingScale(g,'right');hFlip=duelFacingScale(h,'right');fall=0;hAlpha=fallP<.82?1:1-(fallP-.82)/.18;caption=fallP<.48?`${h.name}拨马后撤`:`${h.name}退出战阵`}
      drawDuelShadow(c,gx,ground,1,Math.max(.18,.38-fall*.12));drawDuelShadow(c,hx,ground,1,hAlpha*.36);drawDuelDust(c,gx,ground,ms<850?1-approach:Math.max(0,1-final),-1);drawDuelDust(c,hx,ground,ms<850?1-approach:0,1);
      // Back-to-front order changes after Guan passes Hua on the final stroke.
      if(ms<5500){drawDuelUnit(h,hx,hy,hFlip,hp,fall,hAlpha,{rotation:hRot});drawDuelUnit(g,gx,gy,gFlip,gp,0,1,{rotation:gRot})}else{drawDuelUnit(g,gx,gy,gFlip,gp,0,1,{rotation:gRot});drawDuelUnit(h,hx,hy,hFlip,hp,fall,hAlpha,{rotation:hRot})}
      drawDuelSlash(c,impactX,impactY,Math.min(W,H)*.21,slashAngle,slash);drawDuelImpact(c,impactX,impactY,impact,ms);if(impact>.55){c.fillStyle=`rgba(255,245,205,${(impact-.55)*.48})`;c.fillRect(-20,-20,W+40,H+40)}
      c.restore();captionNode.textContent=caption;
      for(const [at,name,kind] of [[760,'charge','charge'],[1450,'clash1','clash'],[2360,'clash2','clash'],[3150,'clash3','clash'],[5230,'final','finish'],[6380,'fall','fall']])if(ms>=at&&!marks.has(name)){marks.add(name);if(kind==='finish')battleSfx('duelFinish',h,{critical:true});else if(kind==='charge')playCharge(g);else if(kind==='fall')battleSfx('fall',h,{mounted:true});else battleSfx('duelClash',h,{heavy:true})}
      if(t<1)requestAnimationFrame(frame);else{overlay.classList.add('hidden');resolve()}}requestAnimationFrame(frame)})
  }
  function playWarmWineCinematic(g){
    const overlay=document.getElementById('duelOverlay'),kicker=document.getElementById('duelKicker'),heading=document.getElementById('duelHeading'),caption=document.getElementById('duelCaption');
    kicker.textContent='温酒斩华雄';heading.textContent='酒尚温　将已还';caption.textContent='青龙刀归鞘，帐中温酒未冷';overlay.classList.add('warm-wine-scene');overlay.classList.remove('hidden');
    const previousMusicSceneMultiplier=musicSceneMultiplier;musicSceneMultiplier=.28;applyMusicMix();
    const dpr=Math.min(devicePixelRatio||1,2),W=overlay.clientWidth,H=overlay.clientHeight;duelCanvas.width=Math.round(W*dpr);duelCanvas.height=Math.round(H*dpr);duelCanvas.style.width=W+'px';duelCanvas.style.height=H+'px';duelCtx.setTransform(dpr,0,0,dpr,0,0);
    const duration=3400;let chimed=false;
    return new Promise(resolve=>{const start=performance.now();function frame(now){
      const ms=(now-start)*animationSpeed,t=Math.min(1,ms/duration),ease=1-Math.pow(1-t,3),fade=Math.min(1,ms/520)*Math.min(1,(duration-ms)/520),c=duelCtx;
      c.clearRect(0,0,W,H);c.fillStyle='#071018';c.fillRect(0,0,W,H);
      if(mediaReady(warmWineArt)){
        const baseScale=Math.max(W/mediaWidth(warmWineArt),H/mediaHeight(warmWineArt)),scale=baseScale*(1+.032*ease),dw=mediaWidth(warmWineArt)*scale,dh=mediaHeight(warmWineArt)*scale,dx=(W-dw)/2-W*.012*ease,dy=(H-dh)/2+H*.006*ease;
        c.save();c.globalAlpha=fade;c.filter='saturate(.94) contrast(1.03) brightness(.88)';c.drawImage(warmWineArt,dx,dy,dw,dh);c.restore();
      }
      const topShade=c.createLinearGradient(0,0,0,H*.32);topShade.addColorStop(0,'rgba(1,6,12,.82)');topShade.addColorStop(1,'rgba(1,6,12,0)');c.fillStyle=topShade;c.fillRect(0,0,W,H*.34);
      const bottomShade=c.createLinearGradient(0,H*.64,0,H);bottomShade.addColorStop(0,'rgba(1,6,12,0)');bottomShade.addColorStop(1,'rgba(1,6,12,.88)');c.fillStyle=bottomShade;c.fillRect(0,H*.62,W,H*.38);
      const vignette=c.createRadialGradient(W*.5,H*.48,Math.min(W,H)*.2,W*.5,H*.48,Math.max(W,H)*.7);vignette.addColorStop(.56,'rgba(0,0,0,0)');vignette.addColorStop(1,'rgba(0,0,0,.46)');c.fillStyle=vignette;c.fillRect(0,0,W,H);
      if(ms>760&&!chimed){chimed=true;playCharge(g)}
      if(t<1)requestAnimationFrame(frame);else{overlay.classList.add('hidden');overlay.classList.remove('warm-wine-scene');musicSceneMultiplier=previousMusicSceneMultiplier;applyMusicMix();resolve()}
    }requestAnimationFrame(frame)})
  }
  const criticalQuotes={
    liu:'汉室正统在此，破敌！',
    guan:'尝尝我青龙偃月刀的厉害！',
    zhang:'吃俺老张一矛！',
    jian:'此箭，正中要害！',
    zhaoyun:'常山赵子龙在此！'
  };
  function playCriticalQuote(attacker,outcome){
    if(!outcome?.critical||attacker.side==='enemy')return Promise.resolve();
    const text=attacker.criticalQuote||criticalQuotes[attacker.id]||'胜负，就在此一击！';
    addLog(`${attacker.name}会心一击：${text}`,true);status(`${attacker.name}发动会心一击`);
    return new Promise(resolve=>runDialogue([{speaker:attacker.name,text}],resolve))
  }
  async function performCounter(defender,attacker){
    if(defender.hp<=0||attacker.hp<=0||defender.confused||!canCounterUnit(defender,attacker)||!inAttackRange(defender,attacker)||Math.random()>=counterRate(defender,attacker))return false;
    const originalTarget=attacker,guard=brotherGuardFor(originalTarget,defender),counterTarget=guard||originalTarget;if(guard)announceBrotherGuard(guard,originalTarget);else status(`${defender.name}反击 ${originalTarget.name}`);
    const outcome=rollCombatOutcome(defender,counterTarget,{counter:true}),label=combatResultLabel(outcome),jianxiongSplit=jianxiongDamageSplit(counterTarget,outcome.damage);outcome.damage=jianxiongSplit.targetDamage;outcome.rout=!outcome.missed&&physicalMoraleDamage(counterTarget,outcome.damage)>=(counterTarget.morale??100);await playCriticalQuote(defender,outcome);await playBrotherGuardCombatAnimation(defender,originalTarget,guard,outcome.damage,()=>{counterTarget.hp=Math.max(0,counterTarget.hp-outcome.damage);applyJianxiongDamage(jianxiongSplit);if(!outcome.missed)applyMoraleLoss(counterTarget,physicalMoraleDamage(counterTarget,outcome.damage));if(label)flash(label);syncUI()},outcome);addLog(combatLogText(defender,counterTarget,outcome),!!label);if(defender.side==='ally')gainExp(defender,counterTarget,counterTarget.hp<=0);if(await resolveJianxiongProtector(jianxiongSplit,defender))return'battle-ended';
    if(counterTarget!==originalTarget&&counterTarget.hp<=0){addLog(`${counterTarget.name}因桃园护援而撤退`,true);await playDefeatQuote(counterTarget);if(counterTarget.id==='liu'){defeat('刘备撤退');return'battle-ended'}}draw();return originalTarget.hp<=0?'original-defeated':counterTarget.hp<=0?'protector-defeated':'survived'
  }
  async function attack(attacker,target){
    if(!attacker||!target||!inAttackRange(attacker,target)){status(`${attacker?.name||'该单位'}只能攻击上下左右射程内的目标`);return false}
    if(scriptedDuelPair(attacker,target)){startDuel();return}
    if(phase==='animating')return;const outcome=rollCombatOutcome(attacker,target),jianxiongSplit=jianxiongDamageSplit(target,outcome.damage),dmg=jianxiongSplit.targetDamage,label=combatResultLabel(outcome);let splashHits=[];outcome.damage=dmg;outcome.rout=!outcome.missed&&physicalMoraleDamage(target,dmg)>=(target.morale??100);attacker.acted=true;phase='animating';attackable=[];reachable.clear();selected=attacker;hideForecast();status(outcome.critical?`${attacker.name} 正在凝聚会心一击`:`${attacker.name} 攻击 ${target.name}`);syncUI();
    await playCriticalQuote(attacker,outcome);
    await playCombatAnimation(attacker,target,dmg,()=>{target.hp=Math.max(0,target.hp-dmg);applyJianxiongDamage(jianxiongSplit);if(!outcome.missed){applyMoraleLoss(target,physicalMoraleDamage(target,dmg));splashHits=applyRenzhongLubuSplash(attacker,target,dmg)}if(label)flash(label);syncUI()},outcome);
    provokeUnit(target,attacker);const killed=target.hp<=0;addLog(combatLogText(attacker,target,outcome),!!label);gainExp(attacker,target,killed);draw();
    if(await resolveJianxiongProtector(jianxiongSplit,attacker))return;
    if(killed){addLog(`${target.name}撤退`,true);await playDefeatQuote(target);if(checkEnemyForceVictory(target))return}
    if(await resolveRenzhongLubuSplash(splashHits,attacker))return;
    const counterResult=!killed?await performCounter(target,attacker):false;if(counterResult==='battle-ended')return;if(counterResult==='original-defeated'){addLog(`${attacker.name}撤退`,true);await playDefeatQuote(attacker);if(attacker.id==='liu'){defeat('刘备撤退');return}}
    clearActionMoveBonus(attacker);phase='select';syncUI();draw();scheduleAutoSave();if(playerTurn&&units.filter(u=>u.side==='ally'&&u.hp>0).every(u=>u.acted))queueEndPlayerTurn(360)
  }
  function scriptedDuelPair(a,b){const script=level.events?.duel;if(!script||!a||!b||a.hp<=0||b.hp<=0)return false;const pair=(a.id===script.attackerId&&b.id===script.defenderId)||(a.id===script.defenderId&&b.id===script.attackerId);return pair&&Math.abs(a.x-b.x)+Math.abs(a.y-b.y)===1}
  function tryDuel(){const script=level.events?.duel;if(script?.trigger==='combat')return false;const g=units.find(u=>u.id===script?.attackerId),h=units.find(u=>u.id===script?.defenderId);if(scriptedDuelPair(g,h)){startDuel();return true}return false}
  async function startDuel(){
    const script=level.events.duel,g=units.find(u=>u.id===script.attackerId),h=units.find(u=>u.id===script.defenderId);
    if(duelInProgress||!g||!h||g.hp<=0||h.hp<=0)return false;duelInProgress=true;const resumePhase=phase;g.acted=true;clearActionMoveBonus(g);phase='animating';reachable.clear();attackable=[];syncUI();
    if(script.musicId)startStoryMusic(script.musicId);
    await new Promise(resolve=>runDialogue(script.challenge,resolve));
    if(script.reinforcement?.length)await new Promise(resolve=>runDialogue(script.reinforcement,resolve));
    phase='animating';status(level.id==='hulao-pass'?'三英战吕布':`${g.name} 单挑 ${h.name}`);
    await playDuelCinematic(g,h);h.hp=0;flash(level.id==='sishui-pass'?'关羽斩华雄！':level.id==='hulao-pass'?'三英合力，吕布败退！':`${g.name}逼退${h.name}！`);syncUI();draw();
    const exchange=script.exchange||script.aftermath||[];if(exchange.length)await new Promise(resolve=>runDialogue(exchange,resolve));
    levelUp(g);addLog(level.id==='hulao-pass'?'刘备、关羽、张飞合力击退吕布':`${g.name}单挑击退${h.name}`,true);syncUI();draw();
    await new Promise(resolve=>runDialogue([script.levelUp],resolve));
    if(level.id==='sishui-pass'){await playWarmWineCinematic(g);if(script.report)await new Promise(resolve=>runDialogue([script.report],resolve))}
    else if(script.aftermath?.length)await new Promise(resolve=>runDialogue(script.aftermath,resolve));
    const duelEndsBattle=script.endsBattle??(h.id===objectiveUnitId);if(!duelEndsBattle&&level.victoryCondition==='eliminateAllEnemies'&&!units.some(unit=>unit.side==='enemy'&&unit.hp>0)){victory(true);return}
    if(duelEndsBattle){duelInProgress=false;victory(true);return true}
    if(script.confirmation)await new Promise(resolve=>runDialogue([script.confirmation],resolve));
    if(script.musicId)startBattleMusic();phase=playerTurn?'select':(['enemy','guest'].includes(resumePhase)?resumePhase:'enemy');selected=null;inspected=g;reachable.clear();attackable=[];duelInProgress=false;status(`${h.name}败退，继续击退${units.find(u=>u.id===objectiveUnitId)?.name||'敌军主将'}`);syncUI();draw();scheduleAutoSave();
    if(playerTurn&&units.filter(u=>u.side==='ally'&&u.hp>0).every(u=>u.acted))queueEndPlayerTurn(360)
    return true
  }
  function waitSelected(){if(!selected||selected.side!=='ally'||selected.acted||turnTransitionPending)return;const who=selected;who.acted=true;clearActionMoveBonus(who);selected=null;inspected=who;phase='select';moveOrigin=null;activeStrategy=null;activeItem=null;reachable.clear();attackable=[];hoverPath=[];hideForecast();document.getElementById('itemMenu').classList.add('hidden');document.getElementById('strategyMenu').classList.add('hidden');syncUI();status(`${who.name} 已待机，请选择下一名武将`);draw();scheduleAutoSave();if(tryDuel())return;if(units.filter(u=>u.side==='ally'&&u.hp>0).every(u=>u.acted))queueEndPlayerTurn(260)}
  function inventoryCount(u,type){return u?u.inventory.filter(x=>x===type).length:0}
  function carriedCount(u){return u?u.inventory.length+(u.treasureItems?.length||0):0}
  function removeInventoryItem(u,type){const i=u.inventory.indexOf(type);if(i>=0)u.inventory.splice(i,1)}
  function strategyAbility(u){return BattleRules.strategyAbility(u.zhili||0,u.level)}
  function fireScrollDamage(target){let base=Math.max(1,200-strategyAbility(target));if(['support','transport','sorcerer'].includes(target.troop))base=Math.floor(base/2);if(map[target.y][target.x]==='forest')base+=Math.floor(base/4);const randomRoll=Math.floor(Math.random()*(Math.floor(base/50)+1));return BattleRules.fireScrollDamage({targetZhili:target.zhili||0,targetLevel:target.level,targetTroop:target.troop,targetInForest:map[target.y][target.x]==='forest',randomRoll,targetHp:target.hp})}
  function vortexScrollDamage(target){let base=Math.max(1,180-strategyAbility(target));if(['support','transport','sorcerer'].includes(target.troop))base=Math.floor(base/2);if(['water','bridge','muddyWater'].includes(map[target.y][target.x]))base+=Math.floor(base/4);return Math.min(target.hp,base+Math.floor(Math.random()*(Math.floor(base/50)+1)))}
  function treasureLabel(id){const item=treasureCatalog[id];return item?(['attack','defense'].includes(item.effect)?`${item.name}（${item.effect==='defense'?'防御':'攻击'}+${item.bonus}%）`:item.name):id}
  function treasureDetail(id){const item=treasureCatalog[id];if(!item)return'未知宝物';if(item.effect==='classUpgrade')return`原作用途：Lv.${item.requiredLevel}以上${item.fromClass}进阶为${item.toClass}；本版暂未开放转职，可转交，占1格`;return`携带者${item.effect==='defense'?'防御':'攻击'}提高${item.bonus}% · 无需主动使用 · 可转交 · 占1格`}
  function treasureStatus(id){const item=treasureCatalog[id];return item?.effect==='classUpgrade'?'转职道具':'自动生效'}
  function inventoryLabel(u){const parts=(u.treasureItems||[]).map(treasureLabel);for(const type of consumableItemTypes){const count=inventoryCount(u,type);if(count)parts.push(`${shopItems[type].name}×${count}`)}return parts.length?parts.join('　'):'尚未携带道具'}
  function shopHolderLabel(u){return`${u.name}（携带${carriedCount(u)}/8 · 豆${inventoryCount(u,'bean')}）`}
  function syncShop(){
    const plan=currentShopPlan(),list=document.getElementById('shopList'),signature=plan.items.join('|');
    document.getElementById('shopLocation').textContent=`${plan.location} · 战前军需`;
    document.getElementById('shopTitle').textContent=plan.items.length?'道具屋':'军需转交';
    if(list.dataset.stock!==signature){list.dataset.stock=signature;list.innerHTML=plan.items.length?plan.items.map(type=>{const item=shopItems[type];return`<article data-shop-item="${type}"><b>${item.name}</b><span>${item.detail}</span><em>金${item.price}</em><select aria-label="${item.name}携带者"></select><button>购买</button></article>`}).join(''):`<p class="shop-empty">${plan.note}</p>`}
    document.getElementById('shopGold').textContent=gold;
    document.getElementById('shopFundingHint').textContent=`${plan.location}按原作地点货单供应。本关当前可用军资金${gold}。宝物和消耗品均占携带栏，可在我军间转交，每人最多8件；“携带1/8”可能是武器占格，并不代表有一颗豆。`;
    const allies=units.filter(u=>u.side==='ally');
    document.getElementById('shopInventory').innerHTML=allies.map(u=>`<div><b>${u.name}</b><span>${inventoryLabel(u)}</span><em>${carriedCount(u)}/8</em></div>`).join('');
    document.querySelectorAll('[data-shop-item]').forEach(row=>{
      const type=row.dataset.shopItem,select=row.querySelector('select'),previous=select.value;
      select.innerHTML=allies.map(u=>`<option value="${u.id}">${shopHolderLabel(u)}</option>`).join('');
      select.value=allies.some(u=>u.id===previous)?previous:(allies[0]?.id||'');
      const holder=allies.find(u=>u.id===select.value),button=row.querySelector('button');
      button.disabled=!holder||gold<shopItems[type].price||carriedCount(holder)>=8;
      button.title=holder&&carriedCount(holder)>=8?`${holder.name}的携带栏已满`:''
    });
    syncTransfer()
  }
  function transferChoices(u){const out=(u.treasureItems||[]).map(id=>({value:`treasure:${id}`,label:treasureLabel(id)}));for(const type of consumableItemTypes){const count=inventoryCount(u,type);if(count)out.push({value:`item:${type}`,label:`${shopItems[type].name} ×${count}`})}return out}
  function syncTransfer(){const allies=units.filter(u=>u.side==='ally'),fromEl=document.getElementById('transferFrom'),itemEl=document.getElementById('transferItem'),toEl=document.getElementById('transferTo'),button=document.getElementById('transferBtn'),oldFrom=fromEl.value||allies[0]?.id,oldItem=itemEl.value,oldTo=toEl.value;fromEl.innerHTML=allies.map(u=>`<option value="${u.id}">${u.name}</option>`).join('');fromEl.value=allies.some(u=>u.id===oldFrom)?oldFrom:allies[0]?.id;const from=units.find(u=>u.id===fromEl.value),choices=transferChoices(from);itemEl.innerHTML=choices.length?choices.map(item=>`<option value="${item.value}">${item.label}</option>`).join(''):'<option value="">无可转交物品</option>';if(choices.some(item=>item.value===oldItem))itemEl.value=oldItem;const receivers=allies.filter(u=>u!==from);toEl.innerHTML=receivers.map(u=>`<option value="${u.id}">${shopHolderLabel(u)}</option>`).join('');if(receivers.some(u=>u.id===oldTo))toEl.value=oldTo;const to=units.find(u=>u.id===toEl.value);button.disabled=!itemEl.value||!to||carriedCount(to)>=8}
  function transferInventoryItem(){const from=units.find(u=>u.id===document.getElementById('transferFrom').value),to=units.find(u=>u.id===document.getElementById('transferTo').value),token=document.getElementById('transferItem').value;if(!from||!to||!token||carriedCount(to)>=8)return;const[kind,type]=token.split(':');let name='';if(kind==='treasure'){const i=from.treasureItems.indexOf(type);if(i<0)return;from.treasureItems.splice(i,1);to.treasureItems.push(type);refreshPassiveTreasures(from);refreshPassiveTreasures(to);name=treasureCatalog[type].name}else{if(inventoryCount(from,type)<=0)return;removeInventoryItem(from,type);to.inventory.push(type);name=shopItems[type].name}addLog(`${from.name}将${name}转交给${to.name}`);syncShop();syncUI();flash(`${name}已交给${to.name}`)}
  function purchaseShopItem(row){const type=row.dataset.shopItem,item=shopItems[type],holder=units.find(u=>u.side==='ally'&&u.id===row.querySelector('select').value);if(!holder||!item||gold<item.price||carriedCount(holder)>=8)return;gold-=item.price;if(item.treasureId){holder.treasureItems.push(item.treasureId);refreshPassiveTreasures(holder)}else holder.inventory.push(type);addLog(`${holder.name}购入${item.name}`,false);syncShop();syncUI();flash(`${holder.name}获得${item.name}`)}
  function resetShop(){if(!prepBaseline)capturePrepBaseline();gold=prepBaseline.gold;units.filter(u=>u.side==='ally').forEach(u=>{const base=prepBaseline.units[u.id]||{inventory:[],treasureItems:treasureIdsFor(level.units.find(source=>source.id===u.id)||{})};u.inventory=[...base.inventory];u.treasureItems=[...base.treasureItems];refreshPassiveTreasures(u)});for(let i=logs.length-1;i>=0;i--)if(logs[i].msg.includes('购入')||logs[i].msg.includes('转交'))logs.splice(i,1);addLog('战前整备已重置');syncShop();syncUI();flash('已恢复进入本关时的军需与宝物')}
  function toggleItemMenu(){if(!selected||selected.acted||!playerTurn)return;document.getElementById('strategyMenu').classList.add('hidden');const menu=document.getElementById('itemMenu'),opening=menu.classList.contains('hidden');menu.classList.toggle('hidden');if(opening)requestAnimationFrame(()=>menu.scrollIntoView({block:'nearest'}))}
  function syncItems(){const holder=selected||inspected,treasures=holder?.treasureItems||[],list=document.getElementById('treasureItemList');list.classList.toggle('hidden',!treasures.length);list.innerHTML=treasures.length?`<strong>${holder.name}的装备／宝物</strong>${treasures.map(id=>`<div class="treasure-item-row" data-treasure="${id}" title="${treasureDetail(id)}"><b>宝</b><span>${treasureLabel(id)}<small>${treasureDetail(id)}</small></span><em>${treasureStatus(id)}</em></div>`).join('')}`:'';for(const type of consumableItemTypes){const count=inventoryCount(holder,type),counter=document.getElementById(`${type}Count`),button=document.querySelector(`[data-item="${type}"]`);if(counter)counter.textContent=`×${count}`;if(button)button.disabled=count<=0}}
  function itemTargetTiles(u,type){const out=[],validFireTerrain=new Set(['plain','grass','forest','city']),offensiveItems=new Set(['fireScroll','vortexScroll','rockScroll','fogScroll','bomb']),hpItems=new Set(['bean','wheat','supportScroll']);for(let y=0;y<ROWS;y++)for(let x=0;x<COLS;x++){const d=Math.abs(x-u.x)+Math.abs(y-u.y);if(d>3)continue;const target=unitAt(x,y);if(!target)continue;if(offensiveItems.has(type)){if(d>0&&target.side==='enemy'&&(type!=='fireScroll'||validFireTerrain.has(map[y][x])))out.push({x,y})}else if(target.side!=='enemy'&&d<=2&&(hpItems.has(type)?target.hp<target.maxHp:type==='injuryMedicine'?(target.strategy||0)<(target.maxStrategy||0):(target.morale??100)<100))out.push({x,y})}return out}
  function beginItemUse(type){if(!selected||selected.acted||!playerTurn||inventoryCount(selected,type)<=0)return;activeItem=type;phase='item';reachable.clear();attackable=itemTargetTiles(selected,type);document.getElementById('itemMenu').classList.add('hidden');syncUI();status(`${selected.name}：请选择${shopItems[type].name}的使用目标`);if(!attackable.length)flash('范围内没有可用目标');draw()}
  async function useItem(target){if(!selected||!activeItem||phase!=='item'||!attackable.some(q=>q.x===target.x&&q.y===target.y))return;const caster=selected,type=activeItem,item=shopItems[type];removeInventoryItem(caster,type);caster.acted=true;phase='animating';activeItem=null;attackable=[];if(['fireScroll','vortexScroll','rockScroll','bomb'].includes(type)){const damage=type==='fireScroll'?fireScrollDamage(target):type==='vortexScroll'?vortexScrollDamage(target):type==='bomb'?Math.max(1,Math.floor(target.maxHp*.25)):Math.max(80,Math.floor(caster.zhili*1.6+caster.level*7-(target.zhili||0)*.35)),label=item.name;status(`${caster.name}使用${label}`);await playStrategyAnimation(type==='fireScroll'||type==='vortexScroll'?'fire':'contain',target,true);target.hp=Math.max(0,target.hp-damage);flash(`${label} -${damage}`);addLog(`${caster.name}使用${label}命中${target.name}，造成${damage}兵力伤害`,true);gainExp(caster,target,target.hp<=0);if(target.hp<=0){addLog(`${target.name}撤退`,true);await playDefeatQuote(target);if(checkEnemyForceVictory(target))return}}else if(type==='fogScroll'){status(`${caster.name}使用${item.name}`);await playStrategyAnimation('contain',target,true);const result=applyMoraleLoss(target,30);flash(`士气 -${result.loss}`);addLog(`${caster.name}对${target.name}使用${item.name}，降低${result.loss}士气`,true);if(result.routed){await playDefeatQuote(target);if(checkEnemyForceVictory(target))return}}else if(item.recoverHp){const amount=Math.min(item.recoverHp,target.maxHp-target.hp);target.hp=Math.min(target.maxHp,target.hp+amount);await playHealAnimation(target,amount,type);flash(`兵力 +${amount}`);addLog(`${caster.name}对${target.name}使用${item.name}，恢复${amount}兵力`,true)}else if(item.recoverStrategy){const amount=Math.min((target.maxStrategy||0)-(target.strategy||0),item.recoverStrategy);target.strategy=(target.strategy||0)+amount;await playHealAnimation(target,amount,type);flash(`策略 +${amount}`);addLog(`${caster.name}对${target.name}使用${item.name}，恢复${amount}策略`,true)}else{const amount=Math.min(100-(target.morale??100),item.recoverMorale||50);target.morale=(target.morale??100)+amount;flash(`士气 +${amount}`);addLog(`${caster.name}对${target.name}使用${item.name}，恢复${amount}士气`,true)}clearActionMoveBonus(caster);phase='select';selected=null;inspected=target;syncItems();syncUI();draw();scheduleAutoSave();if(playerTurn&&units.filter(u=>u.side==='ally'&&u.hp>0).every(u=>u.acted))queueEndPlayerTurn(360)}
  function cancelAction(){document.getElementById('itemMenu').classList.add('hidden');document.getElementById('strategyMenu').classList.add('hidden');activeStrategy=null;activeItem=null;hoverPath=[];hideForecast();if(!selected||selected.acted)return;if(moveOrigin&&(selected.x!==moveOrigin.x||selected.y!==moveOrigin.y)){selected.x=moveOrigin.x;selected.y=moveOrigin.y}clearActionMoveBonus(selected);selected=null;phase='select';reachable.clear();attackable=[];syncUI();status('请选择我军单位');draw()}
  const delay=ms=>new Promise(r=>setTimeout(r,ms));
  function queueEndPlayerTurn(delayMs=0){if(turnTransitionPending||!playerTurn||ending)return;turnTransitionPending=true;selected=null;phase='turnEnding';reachable.clear();attackable=[];syncUI();status('我军行动完毕');draw();setTimeout(()=>endPlayerTurn(true),delayMs)}
  function retryQueuedEndPlayerTurn(){if(turnTransitionPending&&playerTurn&&!ending)setTimeout(()=>endPlayerTurn(true),180)}
  async function endPlayerTurn(fromQueue=false){
    if((turnTransitionPending&&!fromQueue)||!playerTurn)return;
    if(dialogue||phase==='animating'){if(fromQueue)retryQueuedEndPlayerTurn();return}
    try{
      turnTransitionPending=false;document.getElementById('itemMenu').classList.add('hidden');document.getElementById('strategyMenu').classList.add('hidden');activeStrategy=null;activeItem=null;hideForecast();units.filter(u=>u.side==='ally').forEach(u=>{u.acted=true;clearActionMoveBonus(u)});playerTurn=false;selected=null;reachable.clear();attackable=[];
      const guests=aiTurnOrder('guest');if(guests.length){phase='guest';document.getElementById('sideLabel').textContent='盟军阶段';syncUI();flash('盟军阶段');draw();await beginSidePhase('guest');await guestPhase();if(ending||phase==='ended')return}
      phase='enemy';document.getElementById('sideLabel').textContent='敌军阶段';syncUI();flash('敌军阶段');draw();await beginSidePhase('enemy');await enemyPhase()
    }catch(error){
      console.error('AI phase recovered after an unexpected error',error);anim=null;combatFx=null;strategyFx=null;healFx=[];turnTransitionPending=false;selected=null;reachable.clear();attackable=[];hoverPath=[];activeStrategy=null;activeItem=null;playerTurn=true;phase='select';units.filter(u=>u.side==='ally'&&u.hp>0).forEach(u=>{u.acted=false;clearActionMoveBonus(u)});document.getElementById('sideLabel').textContent='我军阶段';syncUI();draw();addLog('敌军行动发生异常，已自动恢复我军控制',true);status('敌军行动异常，已恢复我军回合')
    }
  }
  let stalledAnimationSince=0;
  function hasActiveBattlePresentation(){return!!(dialogue||duelInProgress||anim||combatFx||strategyFx||healFx.length||!document.getElementById('duelOverlay').classList.contains('hidden'))}
  function recoverStalledBattleFlow(){
    if(!battleStarted||ending||!playerTurn||phase!=='animating'){stalledAnimationSince=0;return}
    if(hasActiveBattlePresentation()){stalledAnimationSince=0;return}
    const now=Date.now();if(!stalledAnimationSince){stalledAnimationSince=now;return}if(now-stalledAnimationSince<1800)return;
    const resumeQueuedTurn=turnTransitionPending;stalledAnimationSince=0;selected=null;inspected=null;reachable.clear();attackable=[];hoverPath=[];activeStrategy=null;activeItem=null;hideForecast();phase=resumeQueuedTurn?'turnEnding':'select';syncUI();draw();addLog('检测到战斗流程停顿，已自动恢复控制',true);
    if(resumeQueuedTurn){status('战斗流程已恢复，正在继续结束回合');setTimeout(()=>endPlayerTurn(true),0)}else status('战斗流程已恢复，请继续行动')
  }
  setInterval(recoverStalledBattleFlow,400);
  function aiRouteDistance(actor,startX,startY,target){
    const desired=actor.troop==='archer'?2:1,start=keyOf(startX,startY),dist=new Map([[start,0]]),open=[[startX,startY]];
    while(open.length){
      open.sort((a,b)=>dist.get(keyOf(a[0],a[1]))-dist.get(keyOf(b[0],b[1])));
      const [x,y]=open.shift(),current=dist.get(keyOf(x,y));
      if(Math.abs(x-target.x)+Math.abs(y-target.y)===desired)return current;
      for(const [nx,ny] of neighbors(x,y)){
        if(!canCrossMovementEdge(x,y,nx,ny))continue;
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
  async function guestPhase(){for(const g of aiTurnOrder('guest')){const allEnemies=units.filter(u=>u.side==='enemy'&&u.hp>0),enemies=level.alliedAiAvoidsObjective?allEnemies.filter(u=>u.id!==objectiveUnitId):allEnemies;if(!allEnemies.length)return;if(!enemies.length){g.acted=true;draw();continue}const mobile=g.aiType!==2&&!g.stationary,supportUnit=['support','transport'].includes(g.troop);let plan=bestAiAction(g,enemies,mobile&&!supportUnit);const tactic=chooseAiStrategy(g,plan);if(tactic){if(await useStrategyNpc(g,tactic.type,tactic.target)||ending)return;await delay(100);g.acted=true;draw();continue}if(!plan&&mobile&&supportUnit)plan=bestSupportMove(g);if(!plan&&mobile&&!supportUnit){const target=chooseAiTarget(g,enemies),to=bestEnemyMove(g,target);plan={x:to.x,y:to.y,target:null,kind:'advance'}}if(!plan){g.acted=true;draw();continue}if(plan.x!==g.x||plan.y!==g.y){status(`${g.name} 行进中`);await animateUnitMove(g,plan.x,plan.y)}if(plan.target&&plan.target.hp>0&&inAttackRange(g,plan.target)){await attackNpc(g,plan.target);if(ending)return}await delay(100);g.acted=true;draw()}if(dangerVisible)rebuildDangerTiles()}
  async function triggerTimedEvents(){for(const event of level.timedEvents||[]){const key=event.once||`turn-${event.turn}-${event.unitId||''}`;if(event.turn!==turn||timedEventsFired.has(key))continue;timedEventsFired.add(key);const unit=units.find(u=>u.id===event.unitId);if(unit&&Number.isInteger(event.setAiType)){unit.aiType=event.setAiType;unit.stationary=event.setAiType===2}for(const id of event.activateUnitIds||[]){const activated=units.find(u=>u.id===id&&u.hp>0);if(activated){activated.aiType=1;activated.stationary=false}}for(const spawn of event.spawns||[]){const arriving=units.find(u=>u.id===spawn.unitId);if(!arriving)continue;arriving.side=spawn.side||arriving.side;arriving.x=spawn.x;arriving.y=spawn.y;arriving.acted=false;if(Number.isInteger(spawn.aiType))arriving.aiType=spawn.aiType}if(event.spawns?.length){syncUI();draw();addLog(`第${turn}回合：战场援军出现`,true)}if(event.musicId)startStoryMusic(event.musicId);if(event.dialogue?.length)await new Promise(resolve=>runDialogue(event.dialogue,resolve));if(event.endBattleVariant){victory(false,event.endBattleVariant);return}if(event.battleMusicAfter)setBattleMusicTrack(event.battleMusicAfter);else if(event.musicId)startBattleMusic();if(event.activateUnitIds?.length)addLog(event.activateLog||`第${turn}回合：曹军新的部队开始出击`,true);else if(unit)addLog(`第${turn}回合事件：${unit.name}开始主动出击`,true)}}
  function recoverAiUnitAction(unit,error){console.error(`AI unit action skipped: ${unit.id}`,error);anim=null;combatFx=null;strategyFx=null;healFx=[];phase=unit.side==='guest'?'guest':'enemy';addLog(`${unit.name}行动异常，已跳过并继续本阶段`,true);status(`${unit.name}行动已跳过`);syncUI();draw()}
  async function runEnemyUnitTurn(e){const allAllies=units.filter(u=>(u.side==='ally'||u.side==='guest')&&u.hp>0),allies=level.objectiveAiTargetsPlayerOnly&&e.id===objectiveUnitId?allAllies.filter(u=>u.side==='ally'):allAllies;if(!allAllies.length){defeat();return}if(!allies.length)return;const provoked=provokedTarget(e,allies),mobile=e.aiType===1||e.aiType===3||e.aiType===4||e.aiType===6||!!provoked,supportUnit=['support','transport'].includes(e.troop);let plan=provoked?bestAiAction(e,[provoked],!supportUnit):e.aiType===6?bestAiAction(e,allies,false):bestAiAction(e,allies,mobile&&!supportUnit);const tactic=chooseAiStrategy(e,plan);if(tactic){if(await useStrategyNpc(e,tactic.type,tactic.target)||ending)return;await delay(100);return}if(!plan&&mobile&&supportUnit)plan=bestSupportMove(e);if(!plan&&mobile&&!supportUnit){let to;if((e.aiType===4||e.aiType===6)&&Number.isInteger(e.aiTarget)){const waypoint=Number.isInteger(e.runtimeAiTarget)?e.runtimeAiTarget:e.aiTarget;to=bestMoveToPoint(e,waypoint&255,waypoint>>>8)}else{const target=provoked||(e.aiType===3&&Number.isInteger(e.aiTarget)?units.find(u=>u.originalId===e.aiTarget&&u.hp>0):chooseAiTarget(e,allies));if(target)to=bestEnemyMove(e,target)}if(to)plan={x:to.x,y:to.y,target:null,kind:'advance'}}if(!plan)return;if(plan.x!==e.x||plan.y!==e.y){status(`${e.name} 行进中`);await animateUnitMove(e,plan.x,plan.y)}if(plan.target&&plan.target.hp>0&&inAttackRange(e,plan.target))await attackNpc(e,plan.target);await delay(100)}
  async function enemyPhase(){for(const e of aiTurnOrder('enemy')){try{await runEnemyUnitTurn(e)}catch(error){recoverAiUnitAction(e,error)}e.acted=true;draw();if(ending)return}turn++;if(turn>level.maxTurns){defeat('超过回合限制');return}playerTurn=true;turnTransitionPending=false;units.forEach(u=>{u.acted=false;clearActionMoveBonus(u)});document.getElementById('sideLabel').textContent='我军阶段';document.getElementById('turnNumber').textContent=turn;syncUI();flash('我军阶段');draw();await beginSidePhase('ally');units.filter(u=>u.side==='ally'&&u.confused).forEach(u=>u.acted=true);await triggerTimedEvents();if(dangerVisible)rebuildDangerTiles();phase='select';syncUI();status('请选择我军单位');draw();scheduleAutoSave()}
  async function attackNpc(a,t){
    if(!a||!t||!inAttackRange(a,t))return false;
    if(scriptedDuelPair(a,t)){await startDuel();return}
    const protectedTarget=t,brotherGuard=brotherGuardFor(protectedTarget,a);if(brotherGuard){t=brotherGuard;announceBrotherGuard(brotherGuard,protectedTarget)}
    const outcome=rollCombatOutcome(a,t),previousPhase=phase,bossProtected=a.side==='guest'&&t.id===objectiveUnitId;if(bossProtected&&t.hp<=1){status(`${a.name}按兵不动，等待刘备军迎战${t.name}`);return}const cappedDamage=bossProtected?Math.min(outcome.damage,Math.max(0,t.hp-1)):outcome.damage,jianxiongSplit=jianxiongDamageSplit(t,cappedDamage),dmg=jianxiongSplit.targetDamage;let splashHits=[];outcome.damage=dmg;outcome.rout=!bossProtected&&!outcome.missed&&physicalMoraleDamage(t,dmg)>=(t.morale??100);const label=combatResultLabel(outcome);phase='animating';status(outcome.critical?`${a.name} 正在凝聚会心一击`:`${a.name} 攻击 ${t.name}`);syncUI();
    await playCriticalQuote(a,outcome);
    await playBrotherGuardCombatAnimation(a,protectedTarget,brotherGuard,dmg,()=>{t.hp=Math.max(bossProtected?1:0,t.hp-dmg);applyJianxiongDamage(jianxiongSplit);if(!outcome.missed){applyMoraleLoss(t,physicalMoraleDamage(t,dmg),{preventRout:bossProtected});splashHits=applyRenzhongLubuSplash(a,t,dmg,{protectObjective:a.side==='guest'})}if(label)flash(label);syncUI()},outcome);
    provokeUnit(t,a);const killed=t.hp<=0;addLog(combatLogText(a,t,outcome),!!label);if(bossProtected&&t.hp===1)addLog(`${a.name}重创${t.name}，最后一击留待刘备军`,true);if(a.side==='guest')gainExp(a,t,killed);draw();
    if(await resolveJianxiongProtector(jianxiongSplit,a)){phase=previousPhase;return}
    if(killed){phase=previousPhase;addLog(`${t.name}撤退`,true);await playDefeatQuote(t);if(checkEnemyForceVictory(t))return;else if(t.id==='liu')defeat('刘备撤退');return}
    if(await resolveRenzhongLubuSplash(splashHits,a)){phase=previousPhase;return}
    const counterResult=await performCounter(t,a);if(counterResult==='battle-ended')return;if(counterResult==='original-defeated'){addLog(`${a.name}撤退`,true);await playDefeatQuote(a);if(checkEnemyForceVictory(a))return;else if(a.id==='liu')defeat('刘备撤退')}
    phase=previousPhase;syncUI();draw()
  }
  function nextLevelUrl(){const nextLevelId=resolvedNextLevelId(),nextIndex=nextLevelId==='huainan'?'12':nextLevelId==='taishan'?'11':nextLevelId==='xiaopei'?'10':nextLevelId==='xuzhou'?'9':nextLevelId==='beihai'?'8':nextLevelId==='jieqiao'?'7':nextLevelId==='qinghe'?'6':nextLevelId==='julu'?'5':nextLevelId==='guangchuan'?'3':nextLevelId==='hulao-pass'?'2':null;if(!nextIndex)return null;const params=new URLSearchParams();params.set('level',nextIndex);params.set('storySelect','1');params.set('build',RUNTIME_BUILD);if(level.id==='hulao-pass')params.set('routeChoice','1');if(['guangchuan','xindu'].includes(level.id))params.set('secondRouteChoice','1');preserveDialogueMode(params);return`${location.pathname}?${params}`}
  function continueCampaign(){const url=nextLevelUrl();if(!url){flash('下一关尚未接入');return}writeCampaignTransfer();location.href=url}
  function victory(duel=false,variant='normal'){if(ending)return;ending=true;playerTurn=false;turnTransitionPending=false;phase='ending';const victoryMusicId=level.events?.victoryMusicId||(Number(levelIndex)>=9?DEFAULT_CAMPAIGN_VICTORY_MUSIC_ID:null);if(victoryMusicId)startStoryMusic(victoryMusicId);const alternate=variant==='alternate',withdrawal=variant==='withdrawal';campaignVictoryType=duel?'duel':variant;window.ZhaolieLeaderboard?.finish?.({level,turns:turn,units,victoryType:campaignVictoryType});const clearExp=awardLiuBeiClearExp(),boss=units.find(u=>u.id===objectiveUnitId),duelist=units.find(u=>u.id===level.events?.duel?.attackerId),reward=withdrawal?(level.events?.withdrawalReward??0):alternate?(level.alternateVictory?.goldReward??0):(level.events?.battleReward??100),postBattleReward=level.id==='taishan'?Math.max(0,Number(level.events?.postBattleReward)||0):0,alternateExp=Math.max(0,Number(level.alternateVictory?.exp)||0),alternateLines=level.events?.alternateVictory||[],normalLines=level.events?.normalVictory||[],normalOccupation=level.events?.normalOccupation||normalLines.at(-1)||{speaker:'军报',text:`${boss?.name||'敌军主将'}败退，${level.name}胜利。`},occupation=alternate?(alternateLines.at(-1)||{speaker:'军报',text:'目标达成。'}):duel?(level.events?.duel?.occupation||normalOccupation):normalOccupation;gold+=reward+postBattleReward;if(alternate&&alternateExp)units.filter(u=>u.side==='ally'&&u.hp>0).forEach(u=>{u.exp+=alternateExp;addLog(`${u.name}获得 ${alternateExp} 经验`,true);while(u.exp>=100){u.exp-=100;levelUp(u)}});if(resolvedNextLevelId())writeCampaignTransfer(campaignVictoryType);if(level.id==='xiaopei')saveXiaopeiPostBattle(withdrawal?'withdrawal':campaignVictoryType);if(level.id==='taishan')saveTaishanPostBattle();syncUI();flash(level.events?.victoryFlash||(withdrawal?'曹军撤退':alternate?(level.alternateVictory?.label||'目标达成'):(level.id==='taishan'?'泰山贼众平定':`${boss?.name||'敌军主将'}败退`)));status(occupation.text.replace(/[。．]$/,''));const duelLines=[level.events?.duel?.confirmation,occupation].filter(Boolean),rawBaseLines=withdrawal?(level.events?.withdrawalVictory||[occupation]):alternate?alternateLines:duel?duelLines:normalLines.length?normalLines:[{speaker:'刘备',text:'我军胜利了。'},occupation],baseLines=boss?.defeatQuotePlayed?rawBaseLines.filter(line=>!(line.speaker===boss.name&&line.text===boss.defeatQuote)):rawBaseLines,lines=[...baseLines,...(level.events?.postVictory||[]),...(level.events?.postBattleStory||[])],rewardText=alternate&&alternateExp?`全体存活我军获得经验${alternateExp}`:postBattleReward?`战斗获得金${reward} · 乡民酬谢金${postBattleReward}`:reward?`战后获得金${reward}`:'无额外战利金',clearExpText=clearExp.amount?` · 刘备额外获得经验${clearExp.amount}`:'';if(level.id==='huainan'){playHuainanAftermath(alternate?'alternate':'normal',`${rewardText}${clearExpText} · 当前金${gold}。刘备已转赴许昌，后续关卡尚未开放。`);return}runDialogue(lines,()=>{phase='ended';showOutcome('胜利',`${occupation.text.replace(/[。．]$/,'')} · ${rewardText}${clearExpText} · 当前金${gold}${duel?` · ${duelist?.name||'单挑武将'}升1级`:''}${level.nextBattle?`。下一步：${level.nextBattle}。`:''}`,resolvedNextLevelId()?'next':level.nextBattle?'pending':'replay')})}
  function playHuainanAftermath(variant,summary,resume=null){
    markLevelCleared('huainan');
    const branch=variant==='alternate'?'alternate':'normal';
    preBattleStory=window.HUAINAN_POST_BATTLE_STORY[branch];
    huainanAftermathState={variant:branch,summary,complete:false};
    ending=true;playerTurn=false;phase='ended';clearTimeout(autoSaveTimer);document.getElementById('sideLabel').textContent='战后剧情';status('淮南战后：奖励已经结算，剧情存档保留当前成长');
    if(resume?.actors)resetStoryActors(resume.actors);
    const index=Number.isInteger(resume?.index)?Math.max(0,Math.min(preBattleStory.length-1,resume.index)):0;
    playPreBattleStory(()=>{phase='ended';showOutcome('淮南战后',summary,'pending')},index);
    // Preserve settled battle units/gold before any animation or user interaction.
    saveStoryAutoCheckpoint('postbattle');
  }
  function defeat(reason='刘备败退'){if(ending)return;ending=true;playerTurn=false;selected=null;phase='ended';reachable.clear();attackable=[];hideForecast();flash('战斗失败');status(reason);syncUI();draw();showOutcome('败北',`${reason}。整备部队后再度挑战。`)}
  function saveXuzhouPostBattleChoice(branch){
    const existing=readCampaignTransferRaw(),carry=units.filter(u=>u.carryover).map(u=>({id:u.id,level:u.level,exp:u.exp||0,inventory:[...(u.inventory||[])],treasureItems:[...(u.treasureItems||[])]})),payload={schema:CAMPAIGN_SCHEMA,fromLevelId:'xuzhou',toLevelId:'xuzhou-postbattle',savedAt:Date.now(),victoryType:campaignVictoryType||'normal',postBattleChoice:branch,gold,units:carry};
    try{saveStorage.setItem(CAMPAIGN_KEY,JSON.stringify({...existing,...payload}));const store=readSaveStore(),snapshot=makeSnapshot('auto');snapshot.postBattleChoice=branch;snapshot.phaseType='postbattle';store.auto=snapshot;return writeSaveStore(store)}catch(error){flash(error.message||'无法保存战后选择');return false}
  }
  function chooseXuzhouPostBattle(branch){const choice=branch==='negotiate'?'派张飞前往议和':'正面迎战曹操',ok=saveXuzhouPostBattleChoice(branch);flash(ok?`${choice} · 已自动保存`:'存档失败');if(!ok)return;const params=preserveDialogueMode(new URLSearchParams({level:'10',storySelect:'1',xiaopeiBranch:branch,xiaopeiResume:'1',build:RUNTIME_BUILD}));location.href=`${location.pathname}?${params}`}
  function saveXiaopeiPostBattle(victoryType='normal'){const transfer=readCampaignTransferRaw()||{},carry=units.filter(u=>u.carryover).map(u=>({id:u.id,level:u.level,exp:u.exp||0,inventory:[...(u.inventory||[])],treasureItems:[...(u.treasureItems||[])]})),withdrawal=victoryType==='withdrawal',negotiate=victoryType==='negotiate',summary=negotiate?'曹操因吕布袭击陈留而撤军。小沛之战未发生，不生成战斗成绩，也不发放战斗金。下一关：泰山之战。':withdrawal?`曹操军撤退了 · 无额外战利金 · 当前金${gold}。下一关：泰山之战。`:`曹操军败退 · 战后获得金${level.events?.battleReward??100} · 当前金${gold}。下一关：泰山之战。`;try{saveStorage.setItem(CAMPAIGN_KEY,JSON.stringify({...transfer,schema:CAMPAIGN_SCHEMA,fromLevelId:negotiate?'xiaopei-negotiate':'xiaopei',toLevelId:'taishan',postBattleChoice:negotiate?'negotiate':'fight',victoryType,savedAt:Date.now(),gold,units:carry,sunQianJoined:true}));const store=readSaveStore(),snapshot=makeSnapshot('auto');snapshot.phaseType='postbattle';snapshot.postBattleChoice=negotiate?'negotiate':'fight';snapshot.postBattleTitle=negotiate?'议和完成':'胜利';snapshot.postBattleText=summary;snapshot.postBattleAction='next';store.auto=snapshot;writeSaveStore(store);refreshContinueButton();return true}catch(error){flash(error.message||'无法保存小沛战后进度');return false}}
  function completeXiaopeiNegotiation(){markLevelCleared('xiaopei');saveXiaopeiPostBattle('negotiate');phase='ended';showOutcome('议和完成','曹操因吕布袭击陈留而撤军。小沛之战未发生，不生成战斗成绩，也不发放战斗金。下一关：泰山之战。','next')}
  function saveTaishanPostBattle(){const carry=units.filter(u=>u.carryover&&u.hp>0).map(u=>({id:u.id,level:u.level,exp:u.exp||0,inventory:[...(u.inventory||[])],treasureItems:[...(u.treasureItems||[])]})),summary=`泰山贼众平定 · 战斗金400 · 乡民酬谢金500 · 当前金${gold}。夏丘、彭城已按本次路线跳过；下一关：淮南之战。`;try{saveStorage.setItem(CAMPAIGN_KEY,JSON.stringify({schema:CAMPAIGN_SCHEMA,fromLevelId:'taishan',toLevelId:'huainan',savedAt:Date.now(),victoryType:campaignVictoryType||'normal',gold,units:carry,taishanCleared:true,liMingJoined:carry.some(u=>u.id==='liming'),sunQianJoined:true,miZhuJoined:true,miFangJoined:true,xiaqiuSkipped:true,pengchengSkipped:true,skippedSideBattles:['xiaqiu','pengcheng'],nextStoryId:'huainan'}));const store=readSaveStore(),snapshot=makeSnapshot('auto');snapshot.phaseType='postbattle';snapshot.postBattleTitle='泰山平定';snapshot.postBattleText=summary;snapshot.postBattleAction='next';store.auto=snapshot;writeSaveStore(store);refreshContinueButton();return true}catch(error){flash(error.message||'无法保存泰山战后进度');return false}}
  function showOutcome(title,text,action='replay'){if(action==='pending'&&resolvedNextLevelId())action='next';const button=document.getElementById('restartBtn'),branches=document.getElementById('xuzhouPostBattleChoices'),chooseBranch=title==='胜利'&&action==='pending'&&level.id==='xuzhou';document.getElementById('outcomeTitle').textContent=title;document.getElementById('outcomeText').textContent=text;if(title!=='胜利')document.getElementById('battleScoreCard')?.classList.add('hidden');branches?.classList.toggle('hidden',!chooseBranch);button.classList.toggle('hidden',chooseBranch);if(action==='next'){button.textContent=['hulao-pass','guangchuan','xindu'].includes(level.id)?'继续剧情 · 选择路线':`进入${level.nextBattle||'下一关'}`;outcomeAction=continueCampaign}else if(action==='pending'){button.textContent='返回开始画面';outcomeAction=returnToTitleAfterBattle}else{button.textContent='重新挑战';outcomeAction=restartBattle}document.getElementById('outcomeOverlay').classList.remove('hidden')}
  function runDialogue(lines,onDone){dialogue={lines,onDone};dialogIndex=0;showDialogLine()}
  function syncLevelSelectAvailability(){const cleared=new Set(readClearedLevels());document.querySelectorAll('[data-select-level]').forEach(button=>{const index=Math.max(0,Number(button.dataset.selectLevel)-1),levelId=LEVEL_SELECT_IDS[index],locked=!developerLevelsUnlocked&&index!==0&&!cleared.has(levelId);button.disabled=locked;button.classList.toggle('progress-locked',locked);button.setAttribute('aria-disabled',String(locked))});const status=document.getElementById('levelDeveloperStatus');if(status&&developerLevelsUnlocked){status.textContent='开发者模式已开启：全部关卡可选，并使用各关固定均衡等级。';status.classList.remove('error');status.classList.add('success')}}
  function openLevelSelect(){syncLevelSelectAvailability();document.getElementById('levelSelectOverlay').classList.remove('hidden');document.getElementById('levelDeveloperCode').value=''}
  function unlockDeveloperLevels(){const input=document.getElementById('levelDeveloperCode'),status=document.getElementById('levelDeveloperStatus'),code=input.value.trim().toLowerCase();if(code==='ink to life'||code==='pandaking'){developerLevelsUnlocked=true;input.value='';syncLevelSelectAvailability();return}status.textContent='开发者代码不正确。';status.classList.remove('success');status.classList.add('error');input.select()}
  function selectLevelFromMenu(button){if(button.disabled||button.getAttribute('aria-disabled')==='true')return;const params=new URLSearchParams();params.set('level',button.dataset.selectLevel);params.set('storySelect','1');params.set('levelSelect','1');preserveDialogueMode(params);location.href=`${location.pathname}?${params}`}
  function playDefeatQuote(unit){if(unit.defeatQuotePlayed)return Promise.resolve();const text=typeof unit.defeatQuote==='string'?unit.defeatQuote.trim():'';if(!text)return Promise.resolve();unit.defeatQuotePlayed=true;return new Promise(resolve=>runDialogue([{speaker:unit.name,text}],resolve))}
  const dialoguePortraits={...storyPortraits,...Object.fromEntries(units.filter(u=>(u.originalId??999)<256).map(u=>[u.name,portraitForUnit(u)]))};
  Object.values(dialoguePortraits).forEach(preloadImage);
  window.ZhaolieStartup?.seal();
  function showDialogLine(){const line=dialogue.lines[dialogIndex],styledLine={...line,text:window.ZhaolieDialogue?.romance?.(line.text,line.speaker)||line.text},portrait=document.getElementById('dialogPortrait'),img=document.getElementById('dialogPortraitImage'),mark=document.getElementById('dialogPortraitMark'),src=dialoguePortraits[line.speaker];dialogueHistory.push(styledLine);document.getElementById('dialogSpeaker').textContent=line.speaker;portrait.dataset.speaker=line.speaker;if(src){img.src=src;img.alt=`${line.speaker}立绘`;img.classList.remove('hidden');mark.classList.add('hidden')}else{mark.textContent=line.speaker[0];mark.classList.remove('hidden');img.classList.add('hidden')}document.getElementById('dialogText').textContent=styledLine.text;document.getElementById('dialogOverlay').classList.remove('hidden')}
  function nextDialog(){if(!dialogue)return;dialogIndex++;if(dialogIndex<dialogue.lines.length){showDialogLine();return}const done=dialogue.onDone;dialogue=null;document.getElementById('dialogOverlay').classList.add('hidden');if(done)done()}
  function skipDialogue(){if(!dialogue)return;dialogIndex=dialogue.lines.length-1;nextDialog()}
  function showDialogueHistory(){document.getElementById('historyList').innerHTML=dialogueHistory.map(x=>`<div class="history-line"><b>${x.speaker}</b><span>${x.text}</span></div>`).join('')||'<div class="history-line">暂无记录</div>';document.getElementById('historyOverlay').classList.remove('hidden')}
  function flash(msg){const el=document.getElementById('toast');el.textContent=msg;el.classList.add('show');clearTimeout(flash.t);flash.t=setTimeout(()=>el.classList.remove('show'),1200)}
  function status(msg){document.getElementById('statusText').textContent=msg}
  function showForecast(target){if(!selected||!target){hideForecast();return}const factor=affinity(selected.troop,target.troop),label=factor>1?'兵种优势':factor<1?'兵种劣势':'兵种相当',t=terrain[map[target.y][target.x]],base=damageOf(selected,target),rawLow=Math.max(1,Math.round(base*.42)),rawHigh=Math.max(1,Math.round(base*1.65)),lowSplit=jianxiongDamageSplit(target,rawLow),highSplit=jianxiongDamageSplit(target,rawHigh),low=lowSplit.targetDamage,high=highSplit.targetDamage,jianxiongGuard=highSplit.sharedDamage?` · 奸雄护卫分担${lowSplit.sharedDamage}–${highSplit.sharedDamage}`:'',moraleLow=physicalMoraleDamage(target,low),moraleHigh=physicalMoraleDamage(target,high),routRisk=moraleHigh>=(target.morale??100),hit=Math.round(hitRate(selected,target)*100),crit=Math.round(effectiveRate(selected,'critRate')*100),block=Math.round(effectiveRate(target,'blockRate')*100),canCounter=canCounterUnit(target,selected)&&inAttackRange(target,selected),counter=canCounter?damageOf(target,selected,{counter:true}):0,counterChance=canCounter?Math.round(counterRate(target,selected)*100):0,aura=hasXuandeAura(selected)?' · 仁德光环+10%':'',bandAura=hasMilitaryBandAura(selected)?' · 军乐攻击+10%':'',jianxiong=hasJianxiongAura(selected)?' · 奸雄攻击/防御+8%':'',doushen=selected.id==='zhang'?' · 斗神+10%':'',danqi=hasDanqi(selected)?' · 单骑生效':'',renzhong=selected.id==='lvbu'?' · 人中吕布·相邻敌军波及10%':'',qianlixing=qianlixingAttackBonus(selected),qianlixingText=qianlixing?` · 千里行+${Math.round(qianlixing*100)}%攻击`:'';document.getElementById('forecastAttacker').textContent=selected.name;document.getElementById('forecastTarget').textContent=target.name;document.getElementById('forecastDamage').textContent=`伤害 ${low}–${high}${jianxiongGuard} · 士气 -${moraleLow}${moraleHigh!==moraleLow?`–${moraleHigh}`:''}${routRisk?' · 可能溃退':''}`;document.getElementById('forecastDetail').textContent=`命中${hit}% · ${t.name} 防御+${t.def}% · ${label} · 会心${crit}% / 敌格挡${block}%${canCounter?` / 反击${counterChance}% 约${counter}伤害`:' / 不会反击'}${doushen}${danqi}${qianlixingText}${renzhong}${jianxiong}${aura}${bandAura}`;document.getElementById('forecast').classList.remove('hidden')}
  function hideForecast(){document.getElementById('forecast').classList.add('hidden')}
  function addLog(msg,important=false){logs.push({msg,important});if(logs.length>8)logs.shift();document.getElementById('battleLog').innerHTML=[...logs].reverse().map(x=>`<div class="log-entry ${x.important?'important':''}">${x.msg}</div>`).join('')}
  function syncUI(){
    const u=selected||inspected||units.find(x=>x.side==='ally'&&x.hp>0)||units[0],aura=hasXuandeAura(u),bandAura=hasMilitaryBandAura(u),jianxiong=u.id==='caocao',jianxiongAura=hasJianxiongAura(u);
    const morale=Math.max(0,Math.min(100,u.morale??100)),moraleRow=document.querySelector('.morale-row'),swornBrother=swornBrotherIds.has(u.id),doushen=u.id==='zhang',qianlixing=u.id==='guan',qianlixingBonus=qianlixingAttackBonus(u),danqi=u.id==='zhaoyun',danqiActive=hasDanqi(u),renzhong=u.id==='lvbu';document.getElementById('unitName').textContent=u.name;document.getElementById('unitRole').textContent=`${u.role} · Lv.${u.level}${swornBrother?' · 桃园护援':''}${doushen?' · 斗神':''}${qianlixing?' · 千里行':''}${danqi?` · 单骑${danqiActive?'生效':''}`:''}${renzhong?' · 人中吕布':''}${jianxiong?' · 奸雄':''}${jianxiongAura?' · 奸雄号令':''}${aura?' · 仁德光环':''}${bandAura?' · 军乐激励':''}${u.containedUntil>=turn?' · 牵制':''}`;document.getElementById('hpText').textContent=`${u.hp} / ${u.maxHp}`;document.getElementById('hpBar').style.width=(u.hp/u.maxHp*100)+'%';document.getElementById('moraleText').textContent=`${morale} / 100`;document.getElementById('moraleBar').style.width=`${morale}%`;moraleRow.classList.toggle('low',morale<30);document.getElementById('expText').textContent=`${u.exp} / 100`;document.getElementById('expBar').style.width=`${u.exp}%`;document.getElementById('spText').textContent=`${u.strategy||0} / ${u.maxStrategy||0}`;document.getElementById('spBar').style.width=`${u.maxStrategy?Math.round((u.strategy||0)/u.maxStrategy*100):0}%`;document.getElementById('equipmentText').textContent=(u.treasureItems||[]).length?(u.treasureItems||[]).map(treasureLabel).join(' · '):'无装备';document.getElementById('fundsText').textContent=`金 ${gold} · 携带 ${carriedCount(u)}/8 · 豆 ${inventoryCount(u,'bean')} · 麦 ${inventoryCount(u,'wheat')} · 酒 ${inventoryCount(u,'wine')} · 焦热书 ${inventoryCount(u,'fireScroll')}`;document.getElementById('atkStat').textContent=effectiveStat(u,'atk');document.getElementById('defStat').textContent=effectiveStat(u,'def');document.getElementById('movStat').textContent=effectiveStat(u,'move');document.getElementById('classStat').textContent=u.className;document.getElementById('critStat').textContent=`${Math.round(effectiveRate(u,'critRate')*100)}%`;document.getElementById('blockStat').textContent=`${Math.round(effectiveRate(u,'blockRate')*100)}%`;['atkStat','defStat','movStat','critStat','blockStat'].forEach(id=>document.getElementById(id).classList.toggle('buffed',aura||(bandAura&&id==='atkStat')||(jianxiongAura&&['atkStat','defStat'].includes(id))||(doushen&&id==='critStat')||(qianlixingBonus&&id==='atkStat')||(danqiActive&&['atkStat','defStat','blockStat'].includes(id))));const portraitImage=document.getElementById('portraitImage');portraitImage.src=portraitForUnit(u);portraitImage.alt=u.name;portraitImage.style.filter='';
    const brotherGuardText='桃园护援：任一兄弟兵力降至30%及以下并遭受物理攻击时，周围一圈8格内兵力比例最高的兄弟替他承受整次攻击；策略和范围伤害不触发。';
    const duelHint=level.id==='hulao-pass'&&u.id===level.events?.duel?.attackerId,strategyInspect=!!inspected,bandInspect=u.troop==='support',transportInspect=u.troop==='transport',originalLearned=BattleRules.learnedStrategies({troop:u.troop,level:u.level,override:level.strategyAccess?.[u.id]}),passive=document.getElementById('passiveSkill'),passiveName=document.getElementById('passiveSkillName'),passiveText=document.getElementById('passiveSkillText');passive.classList.toggle('hidden',u.id!=='liu'&&!doushen&&!qianlixing&&!danqi&&!renzhong&&!jianxiong&&!jianxiongAura&&!aura&&!bandAura&&!duelHint&&!strategyInspect&&!bandInspect&&!transportInspect);passive.classList.toggle('aura-active',aura||bandAura||danqiActive||renzhong||jianxiong||jianxiongAura);if(u.id==='liu'){passiveName.textContent='被动 · 仁德号令 · 桃园护援';passiveText.textContent=`周围一圈8格内的友方单位攻击、防御、移动、会心与格挡提高10%（敌军无效）。${brotherGuardText}`}else if(jianxiong){const guards=jianxiongProtectors(u);passiveName.textContent='被动 · 奸雄';passiveText.textContent=`两格内友军攻击、防御提高8%，策略命中率提高10个百分点；曹操受击时由其中一名友军分担20%伤害。当前范围内友军${guards.length}人。`}else if(renzhong){passiveName.textContent='特性 · 人中吕布';passiveText.textContent='普通单体攻击命中后，对目标相邻的其他敌方单位造成本次伤害10%的波及伤害。'}else if(doushen){passiveName.textContent=`被动 · 斗神 · 桃园护援${aura?' · 仁德光环生效':''}`;passiveText.textContent=`永久提高10个百分点会心率；当前会心率${Math.round(effectiveRate(u,'critRate')*100)}%。${aura?'位于刘备周围8格内时仍可获得仁德光环加成。':''}${duelHint?' 本关与吕布相邻时攻击或待机可触发三英战吕布。':''} ${brotherGuardText}`}else if(qianlixing){passiveName.textContent=`被动 · 千里行 · 桃园护援${qianlixingBonus?` · 攻击+${Math.round(qianlixingBonus*100)}%`:''}`;passiveText.textContent=`永久有效。每移动1格，本次行动攻击提高2%，最多10%；当前移动${u.turnMoveDistance||0}格，攻击提高${Math.round(qianlixingBonus*100)}%。行动结束后重新计算。${aura?' 当前另受仁德光环加成。':''} ${brotherGuardText}`}else if(danqi){passiveName.textContent=`被动 · 单骑${danqiActive?' · 生效':' · 未生效'}`;passiveText.textContent=danqiActive?`两格内没有其他友军：攻击、防御提高10%，格挡率提高10个百分点；当前格挡率${Math.round(effectiveRate(u,'blockRate')*100)}%。`:`两格内存在其他友军，效果暂时关闭。与友军距离超过2格后，攻击、防御提高10%，格挡率提高10个百分点。${aura?' 当前受到刘备仁德光环加成。':''}`}else if(jianxiongAura){passiveName.textContent='增益 · 奸雄';passiveText.textContent='曹操两格内：攻击、防御提高8%，策略命中率提高10个百分点。'}else if(bandAura){passiveName.textContent='增益 · 军乐激励 +10%';passiveText.textContent=`位于同阵营军乐队周围8格内：攻击力提高10%。${aura?'同时受到刘备仁德光环。':''}`}else if(aura){passiveName.textContent='增益 · 仁德光环 +10%';passiveText.textContent='位于刘备周围8格内：当前全部战斗属性提高10%'}else if(duelHint){passiveName.textContent='事件 · 三英战吕布';passiveText.textContent='张飞与吕布相邻时攻击或待机触发；关羽、刘备随后加入，合力逼退吕布，张飞升1级'}else if(bandInspect){const amount=BattleRules.militaryBandStrategyRecovery(u.level);passiveName.textContent='兵种特性 · 军乐';passiveText.textContent=`可对两格内受损士气的友军使用“激励”，每次成功获得12经验；可以普通攻击周围8格。周围一圈8格内的同阵营单位攻击力提高10%，多支军乐队的攻击光环不叠加；相邻部队在各自阶段开始时恢复${amount}点策略值，策略恢复可以叠加。军乐队自身不受自己的攻击光环影响。`}else if(transportInspect){const amount=70+u.level*5;passiveName.textContent='兵种特性 · 运输补给';passiveText.textContent=`所属阵营阶段开始时，为上下左右相邻的所有受伤友军各恢复${amount}兵力（70＋等级×5）；每实际恢复25兵力获得1经验，至少1点、每阶段最多10点，满兵力单位不产生经验。多支运输队可分别生效。自动行动时会优先靠近受伤友军。`}else if(strategyInspect){passiveName.textContent=originalLearned.length?`原作策略 · ${originalLearned.map(id=>originalStrategyNames[id]||id).join('、')}`:'原作策略 · 未习得';passiveText.textContent=originalLearned.length?'AI只会使用当前兵种和等级已经习得的原作策略；能够普通攻击时优先攻击。':`${u.className} Lv.${u.level} 尚未达到本兵种首个策略等级，AI不会施展策略。`}
    if(u.confused)document.getElementById('unitRole').textContent+=' · 混乱';
    const canAct=!!selected&&!selected.acted&&!selected.confused&&playerTurn&&!turnTransitionPending,hasTarget=selected&&attackTiles(selected).some(q=>{const x=unitAt(q.x,q.y);return x&&x.side==='enemy'}),learned=selected?learnedStrategyIds(selected):[],waitBtn=document.getElementById('waitBtn'),waitReminder=canAct&&phase==='attack';waitBtn.disabled=!canAct;waitBtn.classList.toggle('wait-reminder',waitReminder);waitBtn.title=waitReminder?'行动尚未结束：攻击、使用策略或点击待机':'待机并结束当前武将行动';waitBtn.setAttribute('aria-label',waitReminder?'行动尚未结束，点击待机':'待机');document.getElementById('itemBtn').disabled=!canAct;document.getElementById('strategyBtn').disabled=!canAct||!learned.length;document.getElementById('strategyBtn').title=learned.length?`已习得：${learned.map(id=>strategies[id].name).join('、')}`:'当前兵种与等级尚未习得策略';document.getElementById('attackBtn').disabled=!canAct||!hasTarget;document.getElementById('undoBtn').disabled=!canAct;document.getElementById('endTurnBtn').disabled=!playerTurn||phase==='animating'||turnTransitionPending;document.getElementById('dangerBtn').classList.toggle('active',dangerVisible);document.getElementById('dangerBtn').innerHTML=`<span>危</span>${dangerVisible?'隐藏':'显示'}敌军危险区`;document.querySelectorAll('#strategyMenu [data-strategy]').forEach(btn=>{const available=selected&&learned.includes(btn.dataset.strategy);btn.classList.toggle('hidden',!available);btn.disabled=!available||(selected.strategy||0)<strategies[btn.dataset.strategy].cost});
    const allies=units.filter(x=>x.side==='ally'),guests=units.filter(x=>x.side==='guest');document.getElementById('unitCount').textContent=`我军 ${allies.filter(x=>x.hp>0).length}/${allies.length} · 盟军 ${guests.filter(x=>x.hp>0).length}/${guests.length}`;
    const card=x=>`<div class="roster-item ${x.side==='guest'?'guest':''} ${selected===x||inspected===x?'active':''} ${x.acted?'done':''} ${(x.morale??100)<30?'low-morale':''}" data-id="${x.id}"><span class="mark"></span><span class="avatar ${!portraitPaths[x.id]&&!storyPortraits[x.name]&&usesGenericFriendlyArt(x)?'ally-generic':''}" style="background-image:url('${portraitForUnit(x)}')"></span><span class="name"><b>${x.name}</b><small>Lv.${x.level} ${x.className} · EXP ${x.exp}</small></span><span class="hp">${x.hp}/${x.maxHp}<small>士气 ${x.morale??100}</small></span></div>`;
    document.getElementById('roster').innerHTML=allies.map(card).join('')+`<div class="roster-divider">盟军 · 自动行动</div>`+guests.map(card).join('');document.querySelectorAll('.roster-item').forEach(el=>el.onclick=()=>selectUnit(units.find(x=>x.id===el.dataset.id)));syncItems()
  }
  function drawMini(){const w=mini.width,h=mini.height,cw=w/COLS,ch=h/ROWS;mctx.clearRect(0,0,w,h);for(let y=0;y<ROWS;y++)for(let x=0;x<COLS;x++){const t=map[y][x];mctx.fillStyle=t==='water'?'#2f7890':t==='forest'?'#244e35':t==='fort'?'#9b784c':t==='hill'||t==='cliff'?'#3f4841':t==='wall'?'#74746f':t==='bridge'?'#b08a52':t==='rough'?'#8b7651':t==='village'?'#d3b45b':t.startsWith('treasure')?'#e0a84b':t.startsWith('supply')?'#74b6ad':t==='grass'?'#70964c':'#55763f';mctx.fillRect(x*cw,y*ch,cw+.5,ch+.5)}for(const u of units.filter(x=>x.side!=='reserve'&&x.hp>0)){mctx.fillStyle=u.side==='enemy'?'#e55347':u.side==='guest'?'#86d8ee':'#44d2d0';mctx.fillRect(u.x*cw+1,u.y*ch+1,Math.max(3,cw-2),Math.max(3,ch-2))}}
  function handleTileAction(q){if(dialogue||!playerTurn||phase==='ended'||!q)return;keyboardCursor={x:q.x,y:q.y};updateTerrainInfo(q);const u=unitAt(q.x,q.y);if(phase==='select'){if(u)selectUnit(u)}else if(phase==='move'){if(u===selected)beginAttack();else if(u&&u.side==='ally')selectUnit(u);else moveSelected(q.x,q.y)}else if(phase==='attack'){if(u&&u.side==='enemy'&&attackable.some(a=>a.x===q.x&&a.y===q.y))attack(selected,u);else if(!u)status('请选择红色范围内的敌军，或点击待机')}else if(phase==='strategy'){if(u&&attackable.some(a=>a.x===q.x&&a.y===q.y))useStrategy(u);else status('请选择高亮范围内的策略目标')}else if(phase==='item'){if(u&&attackable.some(a=>a.x===q.x&&a.y===q.y))useItem(u);else status('请选择高亮范围内的道具目标')}}
  function toggleDanger(){dangerVisible=!dangerVisible;if(dangerVisible)rebuildDangerTiles();syncUI();draw()}
  canvas.addEventListener('mousemove',e=>{const r=canvas.getBoundingClientRect();if(drag&&lastMouse){panX+=e.clientX-lastMouse.x;panY+=e.clientY-lastMouse.y;lastMouse={x:e.clientX,y:e.clientY};draw();return}hover=actionTileAt(e.clientX-r.left,e.clientY-r.top);hoverPath=[];if(hover){updateTerrainInfo(hover);const u=unitAt(hover.x,hover.y);if(phase==='attack'&&u&&u.side==='enemy'&&attackable.some(a=>a.x===hover.x&&a.y===hover.y))showForecast(u);else hideForecast()}else hideForecast();draw()});canvas.addEventListener('mouseleave',()=>{hoverPath=[];hideForecast()});canvas.addEventListener('mousedown',e=>{if(e.button===1){drag=true;lastMouse={x:e.clientX,y:e.clientY};e.preventDefault()}});window.addEventListener('mouseup',()=>{drag=false;lastMouse=null});canvas.addEventListener('wheel',e=>{e.preventDefault();battleOverview=false;document.getElementById('touchOverview').setAttribute('aria-pressed','false');if(e.ctrlKey){zoom=Math.max(MIN_ZOOM,Math.min(MAX_ZOOM,zoom-e.deltaY*.004))}else if(Math.abs(e.deltaX)>0||Math.abs(e.deltaY)<60){panX-=e.deltaX;panY-=e.deltaY}else{zoom=Math.max(MIN_ZOOM,Math.min(MAX_ZOOM,zoom+(e.deltaY<0?.1:-.1)))}draw()},{passive:false});
  function touchPair(){const p=[...touchPoints.values()];if(p.length<2)return null;return{cx:(p[0].x+p[1].x)/2,cy:(p[0].y+p[1].y)/2,d:Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y)}}
  canvas.addEventListener('pointerdown',e=>{if(e.pointerType==='mouse')return;e.preventDefault();e.stopPropagation?.();if(!touchPoints.size){updateBgRect();panX=bgRect.x-(wrap.clientWidth*.62-(.09+(battleFocus?.x??13)*.0535)*bgRect.w);panY=bgRect.y-(wrap.clientHeight*.63-(.105+(battleFocus?.y??19)*.0335)*bgRect.h);if(!squareBattlefield){panX=bgRect.x-(wrap.clientWidth-bgRect.w)/2;panY=bgRect.y-(wrap.clientHeight-bgRect.h)/2}}try{canvas.setPointerCapture?.(e.pointerId)}catch{}touchPoints.set(e.pointerId,{x:e.clientX,y:e.clientY});if(touchPoints.size===1){touchGesture={startX:e.clientX,startY:e.clientY,basePanX:panX,basePanY:panY,moved:false,multi:false}}else{const p=touchPair();touchGesture={...touchGesture,multi:true,moved:true,pinchDistance:Math.max(1,p.d),pinchZoom:zoom,pinchCenterX:p.cx,pinchCenterY:p.cy,pinchPanX:panX,pinchPanY:panY}}},{passive:false});
  canvas.addEventListener('pointermove',e=>{if(e.pointerType==='mouse'||!touchPoints.has(e.pointerId))return;e.preventDefault();e.stopPropagation?.();touchPoints.set(e.pointerId,{x:e.clientX,y:e.clientY});if(touchPoints.size>=2){battleOverview=false;document.getElementById('touchOverview').setAttribute('aria-pressed','false');const p=touchPair();if(!touchGesture.pinchDistance){touchGesture.pinchDistance=Math.max(1,p.d);touchGesture.pinchZoom=zoom;touchGesture.pinchCenterX=p.cx;touchGesture.pinchCenterY=p.cy;touchGesture.pinchPanX=panX;touchGesture.pinchPanY=panY}zoom=Math.max(MIN_ZOOM,Math.min(MAX_ZOOM,touchGesture.pinchZoom*p.d/touchGesture.pinchDistance));panX=touchGesture.pinchPanX+p.cx-touchGesture.pinchCenterX;panY=touchGesture.pinchPanY+p.cy-touchGesture.pinchCenterY;draw();return}if(!touchGesture)return;const dx=e.clientX-touchGesture.startX,dy=e.clientY-touchGesture.startY;if(Math.hypot(dx,dy)>9)touchGesture.moved=true;if(touchGesture.moved){panX=touchGesture.basePanX+dx;panY=touchGesture.basePanY+dy;draw()}},{passive:false});
  function finishTouch(e){if(e.pointerType==='mouse'||!touchPoints.has(e.pointerId))return;e.preventDefault();e.stopPropagation?.();const wasLast=touchPoints.size===1,gesture=touchGesture;touchPoints.delete(e.pointerId);ignoreClickUntil=Date.now()+700;if(e.type!=='pointercancel'&&wasLast&&gesture&&!gesture.moved&&!gesture.multi){const r=canvas.getBoundingClientRect();handleBattleTap(e.clientX-r.left,e.clientY-r.top)}if(touchPoints.size===1){const p=[...touchPoints.values()][0];touchGesture={startX:p.x,startY:p.y,basePanX:panX,basePanY:panY,moved:true,multi:true}}else if(!touchPoints.size)touchGesture=null}
  canvas.addEventListener('pointerup',finishTouch,{passive:false});canvas.addEventListener('pointercancel',finishTouch,{passive:false});canvas.addEventListener('click',e=>{if(Date.now()<ignoreClickUntil)return;const r=canvas.getBoundingClientRect();handleBattleTap(e.clientX-r.left,e.clientY-r.top)});canvas.addEventListener('contextmenu',e=>{e.preventDefault();cancelAction()});
  document.getElementById('waitBtn').onclick=waitSelected;document.getElementById('itemBtn').onclick=toggleItemMenu;document.getElementById('strategyBtn').onclick=toggleStrategyMenu;document.getElementById('dangerBtn').onclick=toggleDanger;document.querySelectorAll('#strategyMenu [data-strategy]').forEach(btn=>btn.onclick=()=>beginStrategy(btn.dataset.strategy));document.querySelectorAll('#itemMenu [data-item]').forEach(btn=>btn.onclick=()=>beginItemUse(btn.dataset.item));document.getElementById('shopList').onclick=e=>{const button=e.target.closest('button'),row=button?.closest('[data-shop-item]');if(row)purchaseShopItem(row)};document.getElementById('shopList').onchange=e=>{if(e.target.matches('select'))syncShop()};document.getElementById('transferFrom').onchange=syncTransfer;document.getElementById('transferItem').onchange=syncTransfer;document.getElementById('transferTo').onchange=syncTransfer;document.getElementById('transferBtn').onclick=transferInventoryItem;document.getElementById('shopResetBtn').onclick=resetShop;
  document.getElementById('shopStartBtn').onclick=commenceBattle;
  document.getElementById('undoBtn').onclick=cancelAction;document.getElementById('attackBtn').onclick=beginAttack;document.getElementById('endTurnBtn').onclick=endPlayerTurn;document.getElementById('dialogOverlay').onclick=nextDialog;document.getElementById('restartBtn').onclick=()=>outcomeAction();document.querySelectorAll('[data-xuzhou-branch]').forEach(button=>button.onclick=()=>chooseXuzhouPostBattle(button.dataset.xuzhouBranch));
  document.getElementById('newGameBtn').onclick=startNewGame;document.getElementById('continueGameBtn').onclick=()=>{requestGameFullscreen();const entry=latestSaveEntry();if(entry)openStoredSnapshot(entry.save,entry.token)};document.getElementById('titleLoadBtn').onclick=()=>openGameMenu('load','title');document.getElementById('titleLevelSelectBtn').onclick=openLevelSelect;document.getElementById('levelSelectCloseBtn').onclick=()=>document.getElementById('levelSelectOverlay').classList.add('hidden');document.querySelectorAll('[data-select-level]').forEach(button=>button.onclick=()=>selectLevelFromMenu(button));document.getElementById('levelDeveloperUnlockBtn').onclick=unlockDeveloperLevels;document.getElementById('levelDeveloperCode').onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();unlockDeveloperLevels()}};
  document.getElementById('titleIntroVideo').onended=finishTitleIntro;document.getElementById('titleIntroVideo').onerror=finishTitleIntro;document.getElementById('titleIntro').onclick=finishTitleIntro;document.getElementById('titleIntroSkipBtn').onclick=e=>{e.stopPropagation();finishTitleIntro()};
  document.getElementById('titleExportSaveBtn').onclick=exportPortableSave;document.getElementById('titleImportSaveBtn').onclick=choosePortableSaveFile;document.getElementById('titleUndoImportBtn').onclick=undoPortableImport;document.getElementById('menuExportSaveBtn').onclick=exportPortableSave;document.getElementById('menuImportSaveBtn').onclick=choosePortableSaveFile;document.getElementById('saveImportInput').onchange=e=>importPortableSaveFile(e.target.files?.[0]);
  document.getElementById('openingVideo').onended=finishOpeningMovie;document.getElementById('openingVideo').onerror=finishOpeningMovie;document.getElementById('openingOverlay').onclick=finishOpeningMovie;document.getElementById('openingSkipBtn').onclick=e=>{e.stopPropagation();finishOpeningMovie()};
  document.getElementById('storyOverlay').onclick=e=>{if(e.target.closest('.story-controls,.story-route-choices,.story-actor'))return;if(storyInteraction){nextStoryLine();return}if(storyFreeRoam){if(e.target.closest('.story-dialogue')||storyAdvanceLocked)return;const stage=document.getElementById('storyCast'),rect=stage.getBoundingClientRect();if(e.clientX>=rect.left&&e.clientX<=rect.right&&e.clientY>=rect.top&&e.clientY<=rect.bottom){const x=Math.round((e.clientX-rect.left)/rect.width*32),y=Math.round((e.clientY-rect.top)/rect.height*20);walkFreeRoamLiuTo(x,y)}return}nextStoryLine()};document.getElementById('storyAutoBtn').onclick=e=>{e.stopPropagation();if(storyFreeRoam||storyRouteChoicePending)return;storyAuto=!storyAuto;e.currentTarget.classList.toggle('active',storyAuto);clearTimeout(storyTimer);if(storyAuto&&!storyAdvanceLocked){const line=preBattleStory[storyIndex];storyTimer=setTimeout(nextStoryLine,Math.max(2300,900+line.text.length*72))}};document.getElementById('storySkipBtn').onclick=e=>{e.stopPropagation();finishPreBattleStory()};document.querySelectorAll('[data-story-route]').forEach(button=>button.onclick=e=>{e.stopPropagation();chooseStoryOption(button)});
  document.getElementById('storySaveBtn').onclick=e=>{e.stopPropagation();openGameMenu('save','story')};
  document.getElementById('menuBtn').onclick=()=>openGameMenu('save','game');document.getElementById('gameMenuCloseBtn').onclick=closeGameMenu;document.getElementById('resumeGameBtn').onclick=closeGameMenu;document.getElementById('battlePrepBtn').onclick=restartBattle;document.getElementById('returnTitleBtn').onclick=showTitle;document.getElementById('saveTabBtn').onclick=()=>openGameMenu('save',saveMenuOrigin);document.getElementById('loadTabBtn').onclick=()=>openGameMenu('load',saveMenuOrigin);
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
  [...Object.values(art),...Object.values(friendlyArt),...Object.values(attackArt),...Object.values(friendlyAttackArt),...Object.values(criticalArt),...Object.values(blockArt),...Object.values(directionalAttackArt),...Object.values(walkArt),...Object.values(friendlyWalkArt),...Object.values(deathArt),...Object.values(friendlyDeathArt),...Object.values(hurtArt),...Object.values(friendlyHurtArt),woundedArt,friendlyWoundedArt,...Object.values(terrainArt)].forEach(img=>img.addEventListener('load',draw));
  let lastEnvironmentFrame=0;function animateEnvironment(now){if(now-lastEnvironmentFrame>42&&!combatFx){lastEnvironmentFrame=now;draw(false)}requestAnimationFrame(animateEnvironment)}
  window.addEventListener('resize',resize);resize();syncUI();syncShop();updateMusicUI();refreshContinueButton();addLog(`胜利条件：${level.objective}`,true);addLog(`败北条件：${level.defeat}`);requestAnimationFrame(animateEnvironment);status('请先完成战前军需整备');
  // Query-only preview for visual regression checks; it never runs in normal play.
  const previewParams=bootParams;
  const previewAnimationSpeed=Math.max(.1,Number(previewParams.get('previewSpeed'))||.65);
  if([...previewParams.keys()].length)document.getElementById('titleScreen').classList.add('hidden');
  if(previewParams.has('newGame'))setTimeout(launchFirstChapterNewGame,120);
  else if(previewParams.has('loadSlot')&&previewParams.has('victoryPreview'))setTimeout(()=>{const token=previewParams.get('loadSlot'),store=readSaveStore(),save=token==='auto'?store.auto:store.manual[Number(token)];if(!validSnapshot(save)||!loadSnapshot(save)){showTitle();return}const previewVictory=previewParams.get('victoryPreview');setTimeout(()=>victory(previewVictory==='duel',previewVictory==='withdrawal'?'withdrawal':previewVictory==='alternate'?'alternate':'normal'),120)},180);
  else if(previewParams.has('loadSlot'))setTimeout(()=>{const token=previewParams.get('loadSlot'),store=readSaveStore(),save=token==='auto'?store.auto:store.manual[Number(token)];if(validSnapshot(save)){requestGameFullscreen();loadSnapshot(save)}else showTitle()},180);
  else if(previewParams.has('routeChoice')||previewParams.has('secondRouteChoice'))setTimeout(()=>{resetBattleState();hideTitle(false);if(preBattleStory.length)playPreBattleStory(openBattlePrep);else openBattlePrep()},180);
  else if(previewParams.has('routeResume'))setTimeout(()=>{resetBattleState();hideTitle(false);const routeStart=['julu','qinghe'].includes(level.id)?5:14;if(preBattleStory.length)playPreBattleStory(openBattlePrep,Math.min(routeStart,preBattleStory.length-1));else openBattlePrep()},180);
  else if(previewParams.has('storySelect'))setTimeout(()=>{resetBattleState();hideTitle(false);if(level.id==='sishui-pass'){clearCampaignTransfer();playOpeningMovie(()=>playPreBattleStory(openBattlePrep))}else if(preBattleStory.length)playPreBattleStory(openBattlePrep);else openBattlePrep()},180);
  else if(previewParams.has('battleSelect'))setTimeout(()=>{resetBattleState();hideTitle(false);openBattlePrep()},180);
  else if(level.id==='huainan'&&previewParams.has('bridgeSouthAudit'))setTimeout(()=>{resetBattleState();hideTitle(false);document.getElementById('shopOverlay').classList.add('hidden');battleStarted=true;const u=units.find(q=>q.id==='zhang');units.filter(q=>q!==u).forEach(q=>q.side='reserve');u.x=18;u.y=14;u.acted=false;battleFocus={x:u.x,y:u.y};selected=u;phase='move';reachable=calcReach(u);keyboardCursor={x:17,y:14};syncUI();status(`淮南桥南通行测试：张飞左侧(17,14)${reachable.has('17,14')?'可以进入':'不可进入'}`);draw()},260);
  else if(level.id==='huainan'&&previewParams.has('southwestCampAudit'))setTimeout(()=>{resetBattleState();hideTitle(false);document.getElementById('shopOverlay').classList.add('hidden');battleStarted=true;const u=units.find(q=>q.id==='mifang');units.filter(q=>q!==u).forEach(q=>q.side='reserve');u.x=3;u.y=19;u.acted=false;battleFocus={x:4,y:19};selected=u;phase='move';reachable=calcReach(u);keyboardCursor={x:3,y:18};syncUI();status('淮南左下兵营通行测试：明路可走，栅栏、角楼不可穿越');draw()},260);
  else if(previewParams.get('level')==='2'&&previewParams.has('duelEventPreview'))setTimeout(()=>{resetBattleState();hideTitle(false);animationSpeed=4;document.getElementById('shopOverlay').classList.add('hidden');startDuel()},320);
  else if(level.id==='jieqiao'&&previewParams.has('portraitPreview'))setTimeout(()=>{resetBattleState();hideTitle(false);document.getElementById('shopOverlay').classList.add('hidden');runDialogue([{speaker:'赵云',text:'常山赵子龙在此！'},{speaker:'文丑',text:'来将通名！'}],()=>{})},220);
  else if(level.id==='jieqiao'&&previewParams.has('zhaoyunDuelPreview'))setTimeout(()=>{resetBattleState();hideTitle(false);animationSpeed=previewAnimationSpeed;document.getElementById('shopOverlay').classList.add('hidden');const script=level.openingDuelSequence.find(q=>q.winnerId==='zhaoyun'),zhao=units.find(q=>q.id==='zhaoyun'),wenchou=units.find(q=>q.id==='wenchou');zhao.side='guest';playDuelCinematic(zhao,wenchou,script)},320);
  else if(level.id==='sishui-pass'&&previewParams.has('warmWinePreview'))setTimeout(()=>{resetBattleState();hideTitle(false);document.getElementById('shopOverlay').classList.add('hidden');playWarmWineCinematic(units.find(u=>u.id==='guan'))},260);
  else if(level.id==='guangchuan'&&previewParams.has('terrainAudit'))setTimeout(()=>{resetBattleState();hideTitle(false);document.getElementById('shopOverlay').classList.add('hidden');battleStarted=true;const guan=units.find(u=>u.id==='guan'),southwest=previewParams.get('terrainAudit')==='southwest',origin=southwest?{x:6,y:9}:{x:14,y:5},target=southwest?{x:9,y:7}:{x:13,y:5};guan.x=origin.x;guan.y=origin.y;battleFocus=target;selected=guan;phase='move';reachable=calcReach(guan);keyboardCursor=target;syncUI();status(southwest?'广川西南草地通行测试：宝物库东北方草地可进入':'广川地形通行测试：关羽左侧开阔地可进入');draw()},260);
  else if(previewParams.has('healPreview'))setTimeout(async()=>{resetBattleState();hideTitle(false);document.getElementById('shopOverlay').classList.add('hidden');battleStarted=true;const target=units.find(u=>u.id==='guan')||units.find(u=>u.side==='ally');target.hp=Math.max(1,target.maxHp-200);selected=target;syncUI();draw();await delay(260);const amount=Math.min(200,target.maxHp-target.hp);target.hp+=amount;await playHealAnimation(target,amount,'bean');syncUI();draw()},260);
  else if(previewParams.has('duelPreview'))setTimeout(()=>{resetBattleState();hideTitle(false);animationSpeed=previewAnimationSpeed;document.getElementById('shopOverlay').classList.add('hidden');const script=level.events.duel;playDuelCinematic(units.find(u=>u.id===script.attackerId),units.find(u=>u.id===script.defenderId))},320);
  else if(previewParams.has('turnEventPreview'))setTimeout(()=>{resetBattleState();hideTitle(false);document.getElementById('shopOverlay').classList.add('hidden');battleStarted=true;turn=Number(previewParams.get('turnEventPreview'))||18;document.getElementById('turnNumber').textContent=turn;triggerTimedEvents();draw()},320);
  else if(previewParams.has('victoryPreview'))setTimeout(()=>{resetBattleState();hideTitle(false);document.getElementById('shopOverlay').classList.add('hidden');battleStarted=true;window.ZhaolieLeaderboard?.start?.(level);const previewVictory=previewParams.get('victoryPreview');victory(previewVictory==='duel',previewVictory==='withdrawal'?'withdrawal':previewVictory==='alternate'?'alternate':'normal')},260);
  else if(previewParams.has('areaEventPreview')&&level.areaEvents?.length)setTimeout(()=>{resetBattleState();hideTitle(false);document.getElementById('shopOverlay').classList.add('hidden');battleStarted=true;const event=level.areaEvents[0],u=units.find(q=>q.id===(event.unitId||'liu')),target=event.adjacentToUnitId?units.find(q=>q.id===event.adjacentToUnitId):null;if(target){u.x=Math.max(0,target.x-1);u.y=target.y}else if(event.rect){u.x=event.rect.x1;u.y=event.rect.y1}triggerAreaEvents(u).then(()=>{syncUI();draw()})},260);
  else if(previewParams.has('treasurePickupPreview')&&level.events?.loot)setTimeout(()=>{resetBattleState();hideTitle(false);document.getElementById('shopOverlay').classList.add('hidden');battleStarted=true;const lootKey=Object.keys(level.events.loot)[0],position=lootKey?.split(',').map(Number),u=units.find(q=>q.side==='ally'&&q.hp>0);if(!u||position?.length!==2){status('宝物库拾取预览缺少单位或坐标');return}u.x=position[0];u.y=position[1];selected=u;phase='attack';collectTile(u);syncUI();status(`${u.name}已到达宝物库并完成拾取`);draw()},260);
  else if(previewParams.has('treasureInventoryPreview'))setTimeout(()=>{resetBattleState();hideTitle(false);document.getElementById('shopOverlay').classList.add('hidden');battleStarted=true;const u=units.find(q=>q.id==='liu');u.treasureItems=[...new Set([...(u.treasureItems||[]),'longSpear','repeatingCrossbow'])];refreshPassiveTreasures(u);selected=u;inspected=null;phase='attack';syncUI();toggleItemMenu();status('装备／宝物显示测试：长枪、连弩已收入刘备携带栏');draw()},260);
  else if(level.id==='xiaopei'&&previewParams.has('bridgeAudit'))setTimeout(()=>{resetBattleState();hideTitle(false);document.getElementById('shopOverlay').classList.add('hidden');battleStarted=true;const u=units.find(q=>q.id==='liu'),bridgeIndex=Math.max(0,Math.min(1,Number(previewParams.get('bridgeAudit'))-1||0)),audit=[{bridge:[9,8],start:[10,8]},{bridge:[12,13],start:[11,13]}][bridgeIndex],[bx,by]=audit.bridge;units.filter(q=>q!==u&&Math.abs(q.x-bx)+Math.abs(q.y-by)<=3).forEach(q=>{q.x=0;q.y=0});u.x=audit.start[0];u.y=audit.start[1];battleFocus={x:bx,y:by};selected=u;phase='move';reachable=calcReach(u);keyboardCursor={x:bx,y:by};syncUI();status(`小沛桥梁通行测试：桥格(${bx},${by})`);draw()},260);
  else if(previewParams.has('granaryAccessPreview')&&level.alternateVictory)setTimeout(()=>{resetBattleState();hideTitle(false);document.getElementById('shopOverlay').classList.add('hidden');battleStarted=true;const u=units.find(q=>q.id===level.alternateVictory.unitId),rule=level.alternateVictory,target={x:rule.rect?.x1??rule.x,y:rule.rect?.y1??rule.y};u.x=Math.max(0,target.x-1);u.y=target.y;battleFocus={x:target.x,y:target.y};selected=u;phase='move';reachable=calcReach(u);keyboardCursor={x:target.x,y:target.y};syncUI();status('特殊胜利格可进入测试');draw()},260);
  else if(previewParams.has('alternateVictoryPreview')&&level.alternateVictory)setTimeout(()=>{
    resetBattleState();hideTitle(false);document.getElementById('shopOverlay').classList.add('hidden');battleStarted=true;
    const u=units.find(q=>q.id===level.alternateVictory.unitId),rule=level.alternateVictory,rect=rule.rect||{x1:rule.x,y1:rule.y,x2:rule.x,y2:rule.y},directions=[[1,0],[-1,0],[0,1],[0,-1]];turn=Math.max(turn,Number(rule.minTurn)||1);document.getElementById('turnNumber').textContent=turn;let target=null,origin=null;
    for(let y=rect.y1;y<=rect.y2&&!target;y++)for(let x=rect.x1;x<=rect.x2&&!target;x++){if(!passable(u,x,y))continue;for(const [dx,dy] of directions){const ox=x+dx,oy=y+dy;if(ox>=0&&oy>=0&&ox<COLS&&oy<ROWS&&passable(u,ox,oy)){target={x,y};origin={x:ox,y:oy};break}}}
    if(!target||!origin){status('未找到可进入的特殊胜利格');return}u.x=origin.x;u.y=origin.y;selected=u;phase='move';reachable=calcReach(u);moveSelected(target.x,target.y)
  },260);
  else if(previewParams.get('level')==='2'&&![...previewParams.keys()].some(key=>key!=='level'))setTimeout(()=>{resetBattleState();hideTitle(false);if(preBattleStory.length)playPreBattleStory(openBattlePrep);else openBattlePrep()},180);
  else if(previewParams.has('storyPreview'))setTimeout(()=>{resetBattleState();hideTitle(false);const target=Math.max(1,Math.min(preBattleStory.length,Number(previewParams.get('storyPreview'))||1));playPreBattleStory(openBattlePrep,target-1)},150);
  else if(previewParams.has('huainanCampGatePreview')&&level.id==='huainan')setTimeout(()=>{resetBattleState();hideTitle(false);document.getElementById('shopOverlay').classList.add('hidden');battleStarted=true;const actor=units.find(u=>u.id==='guan');actor.x=9;actor.y=17;actor.acted=false;selected=actor;inspected=null;phase='move';reachable=calcReach(actor);battleFocus={x:actor.x,y:actor.y};syncUI();draw();status('淮南营寨东门验证：关羽可由 9,17 经 8,17 进入寨内')},220);
  else if(previewParams.has('militaryBandPreview')&&level.id==='huainan')setTimeout(()=>{resetBattleState();hideTitle(false);document.getElementById('shopOverlay').classList.add('hidden');battleStarted=true;const band=units.find(u=>u.id==='mizhu'),ally=units.find(u=>u.id==='liu');band.x=12;band.y=10;band.acted=false;band.strategy=Math.max(band.strategy||0,strategies.encourage.cost);ally.x=13;ally.y=10;ally.morale=50;selected=band;inspected=null;phase='attack';reachable.clear();attackable=attackTiles(band);keyboardCursor={x:ally.x,y:ally.y};battleFocus={x:band.x,y:band.y};syncUI();draw();status('军乐队升级验证：糜竺可用激励恢复刘备士气并获得12经验')},220);
  else if(previewParams.has('longBattleAudit'))setTimeout(()=>{animationSpeed=20;compactRepeatedAnimations=true;battleStarted=true;document.getElementById('shopOverlay').classList.add('hidden');phase='select';playerTurn=true;syncUI();status('长局回归验证：可连续结束回合');draw()},200);
  else if(previewParams.has('turnRecoveryPreview'))setTimeout(()=>{resetBattleState();hideTitle(false);animationSpeed=20;compactRepeatedAnimations=true;battleStarted=true;document.getElementById('shopOverlay').classList.add('hidden');units.filter(u=>u.side==='ally').forEach(u=>{u.acted=true});playerTurn=true;turnTransitionPending=true;phase='animating';selected=units.find(u=>u.side==='ally'&&u.hp>0)||null;syncUI();status('模拟动画结束后遗留的回合锁');draw()},220);
  else if(previewParams.has('defeatQuotePreview'))setTimeout(()=>{resetBattleState();hideTitle(false);document.getElementById('shopOverlay').classList.add('hidden');battleStarted=true;const id=previewParams.get('defeatQuotePreview')||objectiveUnitId,u=units.find(q=>q.id===id)||units.find(q=>(q.originalId??999)<256);u.hp=0;playDefeatQuote(u).then(()=>{if(u.id===objectiveUnitId)victory()})},300);
  else if(previewParams.has('defeatPreview'))setTimeout(()=>{document.getElementById('shopOverlay').classList.add('hidden');defeat('刘备撤退')},300);
  else if(level.id==='xiaopei'&&previewParams.has('jianxiongPreview'))setTimeout(()=>{resetBattleState();hideTitle(false);document.getElementById('shopOverlay').classList.add('hidden');battleStarted=true;const mode=previewParams.get('jianxiongPreview')||'panel',caocao=units.find(u=>u.id==='caocao'),guard=units.find(u=>u.id==='xiahoudun'),attacker=units.find(u=>u.id==='liu');if(mode==='damage'){const split=jianxiongDamageSplit(caocao,100);caocao.hp-=split.targetDamage;applyJianxiongDamage(split);inspected=caocao;status(`奸雄替伤验证：曹操承受${split.targetDamage}，${split.protector?.name||'无护卫'}承受${split.sharedDamage}`)}else if(mode==='guard'){inspected=guard;status('奸雄增益验证：夏侯惇位于曹操两格内')}else{inspected=caocao;status('曹操被动技能 · 奸雄')}if(mode==='forecast'){attacker.x=caocao.x;attacker.y=caocao.y-1;attacker.level=60;attacker.wuli=100;caocao.level=10;caocao.tongyu=70;selected=attacker;inspected=null;phase='attack';attackable=attackTiles(attacker);showForecast(caocao)}syncUI();draw()},300);
  else if(previewParams.has('qianlixingPreview'))setTimeout(()=>{resetBattleState();hideTitle(false);document.getElementById('shopOverlay').classList.add('hidden');battleStarted=true;const guan=units.find(u=>u.id==='guan'),target=units.find(u=>u.side==='enemy');guan.x=Math.min(COLS-3,Math.max(2,Math.floor(COLS*.55)));guan.y=Math.min(ROWS-3,Math.max(2,Math.floor(ROWS*.55)));target.x=guan.x+1;target.y=guan.y;guan.turnMoveDistance=Math.max(0,Math.min(5,Number(previewParams.get('qianlixingPreview'))||0));selected=guan;inspected=null;phase='attack';attackable=attackTiles(guan);syncUI();showForecast(target);status(`千里行预览：已移动${guan.turnMoveDistance}格`);draw()},300);
  else if(previewParams.has('forecastPreview'))setTimeout(()=>{const liu=units.find(u=>u.id==='liu'),target=units.find(u=>u.id==='e1');document.getElementById('shopOverlay').classList.add('hidden');liu.x=12;liu.y=8;if(previewParams.get('forecastPreview')==='rout')target.morale=5;selected=liu;phase='attack';attackable=attackTiles(liu);syncUI();showForecast(target);draw()},300);
  else if(previewParams.has('strategyDeathPreview'))setTimeout(()=>{resetBattleState();hideTitle(false);animationSpeed=20;compactRepeatedAnimations=true;battleStarted=true;document.getElementById('shopOverlay').classList.add('hidden');const caster=units.find(u=>u.side==='enemy'&&knowsStrategy(u,'fire')),target=units.find(u=>u.id==='jian')||units.find(u=>u.side==='ally'&&u.id!=='liu');if(!caster||!target){status('策略击退预览缺少焦热施术者或非主将目标');return}units.filter(u=>(u.side==='ally'||u.side==='guest')&&u!==target).forEach((u,index)=>{u.x=Math.max(0,COLS-2-index%2);u.y=Math.max(0,ROWS-2-Math.floor(index/2))});caster.x=Math.max(2,Math.min(COLS-5,17));caster.y=Math.max(2,Math.min(ROWS-3,9));caster.aiType=2;caster.stationary=true;caster.strategy=Math.max(caster.strategy||0,strategies.fire.cost);target.x=caster.x+3;target.y=caster.y;target.hp=35;playerTurn=false;phase='enemy';document.getElementById('sideLabel').textContent='敌军阶段';syncUI();draw();status(`策略击退回合恢复测试：${caster.name}对${target.name}施展焦热`);enemyPhase()},300);
  else if(previewParams.has('aiStrategyPreview'))setTimeout(()=>{const mode=previewParams.get('aiStrategyPreview'),li=units.find(u=>u.id==='li'),hu=units.find(u=>u.id==='hu'),liu=units.find(u=>u.id==='liu');document.getElementById('shopOverlay').classList.add('hidden');liu.x=20;liu.y=9;if(mode==='recover'){li.x=17;li.y=9;li.hp=180}else if(mode==='contain'){li.strategy=0;hu.x=17;hu.y=9}else{li.x=17;li.y=9}playerTurn=false;phase='enemy';document.getElementById('sideLabel').textContent='敌军阶段';enemyPhase()},300);
  else if(previewParams.has('duelContactPreview'))setTimeout(()=>{const g=units.find(u=>u.id==='guan'),h=units.find(u=>u.id==='hua');g.x=h.x+1;g.y=h.y;selected=g;phase='attack';document.getElementById('shopOverlay').classList.add('hidden');attack(g,h)},300);
  else if(previewParams.has('duelEventPreview'))setTimeout(()=>{animationSpeed=4;document.getElementById('shopOverlay').classList.add('hidden');startDuel()},500);
  else if(previewParams.has('duelPreview'))setTimeout(()=>{animationSpeed=.65;document.getElementById('shopOverlay').classList.add('hidden');playDuelCinematic(units.find(u=>u.id==='guan'),units.find(u=>u.id==='hua')).then(()=>document.getElementById('shopOverlay').classList.remove('hidden'))},500);
  else if(previewParams.has('woundedPreview'))setTimeout(()=>{resetBattleState();hideTitle(false);document.getElementById('shopOverlay').classList.add('hidden');battleStarted=true;const sample=units.slice(0,Math.min(units.length,10)),startX=Math.max(2,Math.floor(COLS/2)-2),startY=Math.max(2,Math.floor(ROWS/2)-2);sample.forEach((u,i)=>{u.x=Math.min(COLS-2,startX+i%5);u.y=Math.min(ROWS-2,startY+Math.floor(i/5)*2);u.hp=Math.max(1,Math.floor(u.maxHp*.25));u.facing=i%2?1:-1});phase='select';status('濒死姿态预览 · 兵力低于30%');syncUI();draw()},320);
  else if(previewParams.has('reactionPreview')||previewParams.has('zhaoyunReactionPreview'))setTimeout(()=>{const id=previewParams.get('reactionPreview')||'zhaoyun',mode=previewParams.get('reaction')||previewParams.get('zhaoyunReactionPreview')||'block',target=units.find(q=>q.id===id)||units.find(q=>q.id==='zhaoyun'),attacker=units.find(q=>q.side!==target.side&&q.side!=='reserve');if(target.side==='reserve')target.side='guest';target.x=Math.min(COLS-3,Math.max(2,Math.floor(COLS*.55)));target.y=Math.min(ROWS-3,Math.max(2,Math.floor(ROWS*.55)));attacker.x=target.x-1;attacker.y=target.y;target.hp=mode==='death'?60:target.maxHp;animationSpeed=previewAnimationSpeed;battleStarted=true;document.getElementById('shopOverlay').classList.add('hidden');playCombatAnimation(attacker,target,60,()=>{target.hp=Math.max(0,target.hp-60)},{critical:false,blocked:mode==='block',missed:false})},450);
  else if(previewParams.has('mountedDeathPreview'))setTimeout(()=>{const id=previewParams.get('mountedDeathPreview')||'guan',target=units.find(q=>q.id===id)||units.find(q=>q.id==='guan'),attacker=units.find(q=>q.side!==target.side&&q.side!=='guest')||units.find(q=>q.side!==target.side);target.x=Math.min(COLS-3,Math.max(2,Math.floor(COLS*.55)));target.y=Math.min(ROWS-3,Math.max(2,Math.floor(ROWS*.55)));target.hp=60;attacker.x=target.x-1;attacker.y=target.y;animationSpeed=previewAnimationSpeed;battleStarted=true;document.getElementById('shopOverlay').classList.add('hidden');playCombatAnimation(attacker,target,60,()=>{target.hp=0},{critical:false,blocked:false,missed:false})},450);
  else if(previewParams.has('criticalQuotePreview'))setTimeout(()=>{const id=previewParams.get('criticalQuotePreview')||'guan',u=units.find(q=>q.id===id)||units.find(q=>q.id==='guan'),target=units.find(q=>q.side==='enemy')||units.find(q=>q!==u);if(u.side==='reserve')u.side='guest';u.x=Math.min(COLS-3,Math.max(2,Math.floor(COLS*.55)));u.y=Math.min(ROWS-3,Math.max(2,Math.floor(ROWS*.55)));target.x=u.x+1;target.y=u.y;target.hp=target.maxHp;animationSpeed=previewAnimationSpeed;battleStarted=true;phase='animating';document.getElementById('shopOverlay').classList.add('hidden');const outcome={critical:true,blocked:false,missed:false};playCriticalQuote(u,outcome).then(()=>playCombatAnimation(u,target,60,()=>{target.hp=Math.max(0,target.hp-60)},outcome))},450);
  else if(previewParams.has('directionalAttackPreview'))setTimeout(()=>{const id=previewParams.get('directionalAttackPreview')||'liu',u=units.find(q=>q.id===id)||units.find(q=>q.id==='liu'),target=units.find(q=>q.side!==u.side&&!(u.side==='ally'&&q.side==='guest'))||units.find(q=>q!==u),direction=previewParams.get('attackDirection')||'north',delta={east:[1,0],west:[-1,0],south:[0,1],north:[0,-1]}[direction]||[0,-1];if(u.side==='reserve')u.side='guest';u.x=Math.min(COLS-3,Math.max(2,Math.floor(COLS*.55)));u.y=Math.min(ROWS-3,Math.max(2,Math.floor(ROWS*.55)));target.x=u.x+delta[0];target.y=u.y+delta[1];target.hp=target.maxHp;animationSpeed=previewAnimationSpeed;battleStarted=true;document.getElementById('shopOverlay').classList.add('hidden');playCombatAnimation(u,target,60,()=>{target.hp=Math.max(0,target.hp-60)},{critical:false,blocked:false,missed:false})},450);
  else if(previewParams.has('walkPreview'))setTimeout(()=>{const id=previewParams.get('walkPreview')||'guan',u=units.find(q=>q.id===id)||units.find(q=>q.id==='guan'),direction=previewParams.get('walkDirection')||'east',delta={east:[1,0],west:[-1,0],south:[0,1],north:[0,-1]}[direction]||[1,0];if(u.side==='reserve')u.side='guest';u.x=Math.min(COLS-3,Math.max(2,Math.floor(COLS*.55)));u.y=Math.min(ROWS-3,Math.max(2,Math.floor(ROWS*.55)));const target=[u.x+delta[0],u.y+delta[1]];animationSpeed=.18;battleStarted=true;document.getElementById('shopOverlay').classList.add('hidden');if(passable(u,target[0],target[1]))animateUnitMove(u,target[0],target[1])},450);
  else if(window.ZhaolieStartup?.ready)window.ZhaolieStartup.ready.then(playTitleIntro);
  else playTitleIntro();
})();
