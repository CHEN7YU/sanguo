(function(){
  // DOS 原作 HEXZMAP.R3 section 13：显示层 48×48，战术层 24×24。
  // 地形按行优先解码；原事件脚本把部分战场事件写成“行、列”，
  // 因此西北鹿砦(原脚本 2,0)与宝物库(原脚本 22,2)在本坐标系中
  // 分别对应 (0,2) 与 (2,22)。
  const encodedRows=[
    '000303030303030300000007070707020202020202020202',
    '000003030303030300000000070707070202020202020202',
    '0d0000030303030303000000000007070702020202020202',
    '000000000003030303000707000000000707020202020202',
    '000000000003030303030707070000000701010202020202',
    '000000000000030303030300000000070701010102020202',
    '070000000000000303030303000000000707010101010101',
    '010700000000000303030303000000000707010101010101',
    '010101070000000000030303030000000007070701010101',
    '010101010700000000030303030000000000000707070707',
    '010101070707000000000303030000000000000000070707',
    '010107070700000000030303030303000000000000000000',
    '070707070000000000030303030303030008000000000000',
    '000000000000000000000303030303030303040303000003',
    '0c0c00000c0c0c0c00000003030303030303040303030303',
    '000000000000000c07070700000000030303040303030303',
    '000e00000e00000c00070700000000000303040303030303',
    '000000000000000c00000000000000000000040303030303',
    '000e00000000000c00000000000000000000000000000000',
    '00000e000000000000000000000000000000080000000707',
    '0000000e000e000c00000000000000000000000007020207',
    '000000000000000c00000000000007000007070702020202',
    '000010000e0e000c00000707070707020202020202020202',
    '000000000000000c00000707070202020202020202020202'
  ];
  const terrainByCode=['plain','forest','hill','water','bridge','wall','city','grass','village','cliff','gate','rough','fence','fort','camp','supply','treasure','house','fire','muddyWater'];
  const width=24,height=24,terrainCodes=encodedRows.map(row=>row.match(/../g).map(hex=>parseInt(hex,16))),terrain=terrainCodes.map(row=>row.map(code=>terrainByCode[code]));
  // The painted remaster keeps the original 24 x 24 tactical board, but its
  // river bends farther east than HEXZMAP.R3 from the middle of the map onward.
  // Runtime overrides make the collision grid follow the water players see.
  // The untouched `terrain` / `terrainCodes` above remain the original record.
  const paintedRiverBands=[
    [0,[[2,4]]],[1,[[3,7]]],[2,[[4,8]]],[3,[[6,9]]],
    [4,[[7,10]]],[5,[[8,11]]],[6,[[9,11]]],[7,[[10,12]]],
    [8,[[11,13]]],[9,[[12,13]]],[10,[[12,14]]],[11,[[13,17]]],
    [12,[[15,17],[19,23]]],[13,[[19,23]]]
  ];
  const paintedWaterCells=new Set(paintedRiverBands.flatMap(([y,bands])=>bands.flatMap(([x1,x2])=>Array.from({length:x2-x1+1},(_,index)=>`${x1+index},${y}`))));
  const paintedBridgeCells=new Set(Array.from({length:6},(_,index)=>`18,${12+index}`));
  // The west side of the southern bridge approach is visibly dry grass.
  // Keep it explicit so original-map water data or an older saved map cannot
  // turn the empty square left of a unit on the bridge into a false blocker.
  const paintedSouthwestApproachCells=new Set(Array.from({length:5},(_,index)=>`17,${13+index}`));
  // The remastered southwest camp was painted after the original DOS collision
  // map was decoded.  Its palisades moved one or more cells, leaving open grass
  // blocked and visible walls walkable.  Keep the original terrain record above
  // intact, then replace only the runtime collision cells with the painted wall
  // and tower footprint.
  const originalSouthwestFenceCells=new Set([
    '0,14','1,14','4,14','5,14','6,14','7,14','7,15','7,16','7,17','7,18','7,20','7,22','7,23'
  ]);
  const paintedSouthwestFenceCells=new Set([
    '0,14','1,14','8,14','8,15','8,16','8,18','8,19','8,20','8,21','9,18','1,20','1,21','4,21','5,21','6,21','7,21'
  ]);
  // Some palisades sit exactly between two tactical cells.  Blocking the edge
  // lets units use the clear ground on both sides without walking through the
  // fence.  Each entry is [fromX, fromY, toX, toY].
  const blockedMovementEdges=[
    ...Array.from({length:6},(_,index)=>[2+index,14,2+index,15]),
    [1,18,2,18],[1,19,2,19],
    [2,19,2,20],
    [3,20,4,20]
  ];
  // The painted east gate crosses (9,17) -> (8,17), while the south gate
  // crosses rows 21/22 at columns 2-3.  These openings must remain free of
  // both impassable cells and blocked edges so every troop class can enter.
  // Keep the decoded deployment coordinates as provenance, but do not let the
  // three southwest defenders spawn on the palisade after collision alignment.
  const paintedDeploymentOverrides=[
    {unitId:'yuanInf2',fromX:6,fromY:21,x:6,y:20},
    {unitId:'yuanCav2',fromX:4,fromY:21,x:4,y:20},
    {unitId:'yuanBand',fromX:1,fromY:21,x:3,y:21}
  ];
  const paintedTerrainOverrides=[];
  for(let y=0;y<height;y++)for(let x=0;x<width;x++){
    const key=`${x},${y}`,original=terrain[y][x];
    if(paintedBridgeCells.has(key)){if(original!=='bridge')paintedTerrainOverrides.push({x,y,type:'bridge'});continue}
    if(paintedWaterCells.has(key)){if(original!=='water')paintedTerrainOverrides.push({x,y,type:'water'});continue}
    if(paintedSouthwestApproachCells.has(key)){paintedTerrainOverrides.push({x,y,type:'plain'});continue}
    if(original==='water'||original==='muddyWater'||original==='bridge')paintedTerrainOverrides.push({x,y,type:'plain'});
  }
  for(const key of originalSouthwestFenceCells){const[x,y]=key.split(',').map(Number);paintedTerrainOverrides.push({x,y,type:'plain'})}
  for(const key of paintedSouthwestFenceCells){const[x,y]=key.split(',').map(Number);paintedTerrainOverrides.push({x,y,type:'fence'})}
  // The original northern village is (17,12), immediately above the bridge.
  // On the remastered painting that coordinate is river, so its runtime cell is
  // moved to the dry bridge approach while save-state migration keeps visits.
  paintedTerrainOverrides.push({x:19,y:10,type:'village'});
  const bases={infantry:[40,40,500,50,4],archer:[30,40,500,40,4],cavalry:[60,30,500,60,6],heavyCavalry:[70,40,600,70,6],support:[20,30,400,40,5],transport:[20,30,400,40,5],martial:[65,30,500,50,5],bandit:[55,45,500,55,5]};
  const stats=(troop,level,wuli,zhili,tongyu)=>{const[a,d,h,g,m]=bases[troop]||bases.infantry,morale=100;return{hp:h+g*(level-1),maxHp:h+g*(level-1),morale,atk:Math.floor((Math.floor(4000/(140-wuli))+a*2+morale)*(level+10)/10),def:Math.floor((Math.floor(4000/(140-tongyu))+d*2+morale)*(level+10)/10),move:m,strategy:Math.floor((level+10)*zhili*5/200),maxStrategy:Math.floor((level+10)*zhili*5/200)}};
  const defeatQuotes={
    liu:'徐州已失，我岂能再倒在这里！',
    guan:'青龙刀尚在，云长来日再雪此耻！',
    zhang:'气煞俺也！待俺重整兵马再来！',
    jian:'箭囊已空，宪和先护伤兵后撤！',
    zhaoyun:'子龙护卫不周，请主公速整阵势！',
    sunqian:'粮车不可尽失，公祐先护军资后撤！',
    pangong:'拳刃虽折，藩宫这条命还要留着护民！',
    mizhu:'军鼓虽歇，子仲必将粮草送回主公帐下！',
    mifang:'阵脚已乱，子方先收拢徐州兵！',
    liming:'猛兽受惊，李明先带它们退出乱阵！',
    jiling:'三尖刀仍在，纪灵改日再雪此耻！',
    lejiu:'袁术军阵脚已乱，乐就先去收拢部曲！',
    chenji:'淮南军势已挫，陈纪回营请罪！',
    chengong:'此局已破，公台另寻良策！',
    zhangliao:'今日刀势已尽，文远来日再战！',
    weixu:'并州兵不能尽折在这里，魏续退兵！',
    songxian:'弓弦已断，宋宪先撤出战圈！'
  };
  const U=data=>Object.assign({},defeatQuotes[data.id]?{defeatQuote:defeatQuotes[data.id]}:{},data,stats(data.troop,data.level,data.wuli,data.zhili,data.tongyu));
  const classNames={infantry:'短兵',archer:'弓兵',cavalry:'轻骑兵',heavyCavalry:'重骑兵',support:'军乐队',transport:'运输队',martial:'武术家',bandit:'贼兵'};
  const weaponFor=troop=>troop==='archer'?'角弓':troop==='cavalry'||troop==='heavyCavalry'?'长枪':troop==='support'?'鼓槌':troop==='transport'?'护身短刀':troop==='martial'?'拳套':troop==='bandit'?'环首刀':'环首刀';
  const P=(x,y)=>x|(y<<8);
  const E=(id,originalId,name,role,troop,level,x,y,wuli,zhili,tongyu,extra={})=>U({id,originalId,name,role,className:classNames[troop],troop,level,side:extra.reserve?'reserve':'enemy',x,y,wuli,zhili,tongyu,aiType:extra.reserve?1:0,stationary:!extra.reserve,range:troop==='archer'?2:undefined,weapon:weaponFor(troop),color:'#9e443f',accent:'#d0ad5d',...extra});
  const allies=[
    U({id:'liu',originalId:0,name:'刘备',role:'徐州牧',className:'短兵',troop:'infantry',level:12,side:'ally',x:14,y:5,wuli:75,zhili:64,tongyu:91,critRate:.12,blockRate:.14,weapon:'佩剑',carryover:true,color:'#45a9cf',accent:'#e0ba59'}),
    U({id:'guan',originalId:1,name:'关羽',role:'别部司马',className:'轻骑兵',troop:'cavalry',level:13,side:'ally',x:15,y:4,wuli:98,zhili:80,tongyu:100,critRate:.20,blockRate:.15,weapon:'青龙偃月刀',treasureItems:['qinglong'],carryover:true,color:'#3fa574',accent:'#cf4940'}),
    U({id:'zhang',originalId:2,name:'张飞',role:'别部司马',className:'轻骑兵',troop:'cavalry',level:13,side:'ally',x:15,y:6,wuli:99,zhili:42,tongyu:83,critRate:.18,blockRate:.10,weapon:'蛇矛',treasureItems:['spear'],carryover:true,color:'#496fab',accent:'#d7aa52'}),
    U({id:'jian',originalId:82,name:'简雍',role:'幕僚',className:'弓兵',troop:'archer',level:11,side:'ally',x:13,y:6,wuli:42,zhili:74,tongyu:36,range:2,carryover:true,weapon:'角弓',color:'#4d8ca7',accent:'#d8bd70'}),
    U({id:'zhaoyun',originalId:53,name:'赵云',role:'常山义士',className:'轻骑兵',troop:'cavalry',level:13,side:'ally',x:13,y:4,wuli:98,zhili:84,tongyu:87,critRate:.20,blockRate:.17,carryover:true,weapon:'龙胆枪',color:'#7bbbd0',accent:'#e2d8b5'}),
    U({id:'sunqian',originalId:63,name:'孙乾',role:'徐州从事',className:'运输队',troop:'transport',level:10,side:'ally',x:16,y:5,wuli:38,zhili:74,tongyu:34,carryover:true,weapon:'护身短刀',color:'#4e9fb4',accent:'#d8bb69'}),
    U({id:'pangong',originalId:52,name:'藩宫',role:'信都义士',className:'武术家',troop:'martial',level:11,side:'ally',x:12,y:5,wuli:62,zhili:52,tongyu:71,carryover:true,weapon:'拳套',color:'#4f9fb0',accent:'#dec06d'}),
    U({id:'mizhu',originalId:64,name:'糜竺',role:'徐州别驾',className:'军乐队',troop:'support',level:10,side:'ally',x:12,y:3,wuli:40,zhili:64,tongyu:36,carryover:true,weapon:'鼓槌',color:'#4e9fb4',accent:'#d8bb69'}),
    U({id:'mifang',originalId:81,name:'糜芳',role:'徐州将领',className:'短兵',troop:'infantry',level:10,side:'ally',x:14,y:3,wuli:63,zhili:25,tongyu:59,carryover:true,weapon:'环首刀',color:'#4e9fb4',accent:'#d8bb69'}),
    U({id:'liming',originalId:375,name:'李明',role:'泰山义军',className:'猛兽师',troop:'beast',level:12,side:'ally',x:16,y:4,wuli:70,zhili:48,tongyu:72,carryover:true,requiredCampaignFlag:'liMingJoined',weapon:'驭兽短鞭',color:'#4e9fb4',accent:'#d8bb69'})
  ];
  const initialEnemies=[
    E('jiling',69,'纪灵','袁术军主将','heavyCavalry',18,2,20,70,35,70,{boss:true,critRate:.15,blockRate:.14,weapon:'三尖两刃刀'}),
    E('lejiu',66,'乐就','袁术军将领','infantry',15,17,20,70,51,67,{className:'长兵',weapon:'长枪'}),
    E('chenji',71,'陈纪','袁术军将领','infantry',14,4,19,68,42,62),
    E('yuanInf1',256,'步兵队','袁术军','infantry',11,15,20,60,40,55),
    E('yuanInf2',257,'步兵队','袁术军','infantry',11,6,21,60,40,55),
    E('yuanCav1',292,'骑兵队','袁术军','cavalry',11,9,20,64,35,60),
    E('yuanCav2',293,'骑兵队','袁术军','cavalry',11,4,21,64,35,60),
    E('yuanArch1',274,'弓兵队','袁术军','archer',11,18,19,58,45,54),
    E('yuanArch2',275,'弓兵队','袁术军','archer',10,16,19,58,45,54),
    E('yuanArch3',276,'弓兵队','袁术军','archer',11,3,18,58,45,54),
    E('yuanBand',328,'军乐队','袁术军','support',11,1,21,35,62,48),
    E('yuanMartial',336,'武术家','袁术军','martial',11,7,19,67,35,61)
  ];
  const reserves=[
    E('chengong',75,'陈宫','吕布军军师','archer',18,11,1,54,80,85,{reserve:true,className:'连弩兵',range:2}),
    E('zhangliao',79,'张辽','吕布军将领','infantry',17,11,2,90,80,87,{reserve:true,className:'长兵',weapon:'长枪',critRate:.18,blockRate:.16}),
    E('weixu',73,'魏续','吕布军将领','infantry',14,12,1,72,46,68,{reserve:true}),
    E('songxian',74,'宋宪','吕布军将领','archer',14,10,2,59,45,50,{reserve:true,range:2}),
    E('lvCav1',294,'骑兵队','吕布军','cavalry',11,9,0,65,34,60,{reserve:true}),
    E('lvCav2',295,'骑兵队','吕布军','cavalry',10,11,0,63,33,59,{reserve:true}),
    E('lvCav3',296,'骑兵队','吕布军','cavalry',11,13,0,65,34,60,{reserve:true}),
    E('lvMartial',337,'武术家','吕布军','martial',11,13,2,67,35,61,{reserve:true}),
    E('lvInf',258,'步兵队','吕布军','infantry',10,9,1,60,40,55,{reserve:true}),
    E('lvBandit',310,'贼兵','吕布军','bandit',11,14,1,64,30,58,{reserve:true})
  ];
  const allEnemyIds=[...initialEnemies,...reserves].map(unit=>unit.id);
  window.LEVEL_10_HUAINAN={
    id:'huainan',chapter:'第一章 · 淮南风云',name:'淮南之战',width,height,terrain,terrainCodes,
    source:'原作 DOS SNR1D.R3 paragraph 12 / HEXZMAP.R3 section 13 / BAKDATA.R3 人物记录',maxTurns:30,
    objective:'击破全部敌军；第6回合后刘备也可撤至西北鹿砦',defeat:'刘备撤退或超过30回合',objectiveUnitId:'jiling',victoryCondition:'eliminateAllEnemies',commanderDefeatEndsBattle:false,
    originalRules:true,squareGrid:true,structuresBakedIntoArt:false,structureScaleByType:{village:.68},viewProjection:{x:1/48,y:1/48,dx:1/24,dy:1/24},battlefieldArt:'assets/level-10-huainan/huainan-map-v1.webp',
    paintedTerrainOverrides,blockedMovementEdges,paintedDeploymentOverrides,paintedTerrainMigrations:[{fromX:17,fromY:12,x:19,y:10,type:'village'}],
    nextBattle:'前往许昌，投靠曹操',
    alternateVictory:{unitId:'liu',x:0,y:2,minTurn:6,exp:50,goldReward:0,label:'刘备撤至西北鹿砦',log:'刘备撤至西北鹿砦，全体存活部队获得经验50'},
    intro:[{speaker:'纪灵',text:'我家主公岂能被刘备轻视！让他看看袁术军的厉害。'},{speaker:'刘备',text:'奉诏讨伐袁术，各军谨慎推进，不可扰害沿途百姓。'}],
    timedEvents:[{
      turn:6,once:'huainan-lvbu-reinforcement',musicId:10,battleMusicAfter:window.GAME_AUDIO_CONFIG?.events?.['huainan-lvbu-turn6']||'assets/audio/langrisser-ii-leon.opus',activateLog:'第6回合：袁术军与吕布军开始全面追击',
      spawns:reserves.map(unit=>({unitId:unit.id,side:'enemy',x:unit.x,y:unit.y,aiType:1})),
      activateUnitIds:initialEnemies.map(unit=>unit.id),
      dialogue:[{speaker:'糜竺',text:'主公，徐州急报！吕布趁我军出征，已经夺取徐州。'},{speaker:'陈宫',text:'此战关系主公一生。众将听令，向刘备军发动总攻！'},{speaker:'军报',text:'吕布军自北面出现。战斗目标增加：刘备可撤往西北鹿砦。'}]
    }],
    areaEvents:[{
      id:'huainan-retreat-warning',unitId:'liu',rect:{x1:3,y1:10,x2:9,y2:13},
      aiUpdates:allEnemyIds.map(unitId=>({unitId,aiType:3,aiTarget:0})),
      dialogue:[{speaker:'刘备',text:'简雍所说的鹿砦就在前面。再坚持一程，便能脱离战场。'},{speaker:'军报',text:'敌军发现刘备撤退意图，开始全力追击刘备。'}],
      log:'刘备接近西北鹿砦，敌军改为追击刘备'
    }],
    events:{
      loot:{'2,22':{item:'infernoScroll',amount:1,gold:300}},
      duel:{attackerId:'guan',defenderId:'zhangliao',endsBattle:false,musicId:12,title:'关羽　VS　张辽',kicker:'淮南 · 忠义交锋',caption:'青龙偃月刀逼退张辽',challenge:[{speaker:'关羽',text:'张辽，吕布背信夺取徐州，你还要追随他吗？'},{speaker:'张辽',text:'各为其主，关将军，请赐教！'}],exchange:[{speaker:'关羽',text:'不愧是张辽，但此招你躲得过吗？'},{speaker:'张辽',text:'关云长果然厉害，今日我认输。'},{speaker:'张辽',text:'撤退！我不愿再与关羽交战。'}],levelUp:{speaker:'军报',text:'关羽的等级上升了！'},confirmation:{speaker:'军报',text:'张辽败退，战斗仍在继续。'},occupation:{speaker:'军报',text:'张辽已经撤离战场。'}},
      normalVictory:[{speaker:'军报',text:'刘备军击破纪灵率领的袁术军，并击退来袭的吕布军。'}],
      normalOccupation:{speaker:'刘备',text:'徐州已落入吕布之手。先整顿部队，再议去向。'},
      alternateVictory:[{speaker:'军报',text:'刘备军成功撤离淮南战场。'},{speaker:'张飞',text:'吕布这个畜生！大哥、二哥，俺也去徐州杀他！'}],
      battleReward:400,victoryMusicId:16
    },
    environmentFx:{forestZones:[[.72,.14,.20,.18,.7],[.04,.30,.18,.22,2.1],[.78,.43,.16,.16,3.8]]},
    ai:{strategyCooldown:6},units:[...allies,...initialEnemies,...reserves]
  };
})();
