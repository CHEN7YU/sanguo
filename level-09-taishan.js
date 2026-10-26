(function(){
  // Original DOS HEXZMAP.R3 section 10: display 64×32, tactical 32×16.
  // Source terrain is decoded row-major. The HD repaint was authored as a
  // seamless concept scene, so its mountains do not follow the DOS collision
  // matrix. The visual collision rows below realign the whole 32x16 field
  // while keeping this source matrix intact for the original-data audit.
  const encodedRows=[
    '0b0b0b09090909090b0b100b0b0b09090909090909090909090b0b0b0b0b0b0b',
    '0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0909090909090909090b0b0b0b0b0b0b0b',
    '0b09090b0d0b0b0b0b0b0b0b0b0b0b0b0909090909090b0b0b0b0b0b0b0b0b0b',
    '0909090909090b0b0b0b0b0b0b0b0b0b0b080b0b0b0b0b0b0b0b0b0b0b0b0b0b',
    '0909090909090909090909090b0b0b0b0b0b0b0b0b0b0b0b0909090b0b0b0b0b',
    '09090b090909090909090909090b0b0b0b0b0b0b0b0b0b0909090909090b0000',
    '000000000b09090909090b0b0b0b0b0b0b090b090b0b09090909000b0b000000',
    '07070000000b0b0b0b0b0b0b0b0b0b0909090909090909090b00070000000700',
    '070000000000000b100b000b0b000b0b0b090909090909090007070707070009',
    '000b0b0000000000000000000000070000000b0b09090b0b0007070707000909',
    '09090b0b0b090000090900000007000000000000000b0b000007070000000909',
    '090909090909090909090900000800000b0b0000000000000000000009090909',
    '09090909090909090909090900000b0b0b090909090900090909090909090909',
    '0909090909090909090909090909090909090909090909090909090909090909',
    '0909090909090909090909090909090909090909090909090909090909090909',
    '0909090909090909090909090909090909090909090909090909090909090909'
  ];
  const terrainByCode=['plain','forest','hill','water','bridge','wall','city','grass','village','cliff','gate','rough','fence','fort','camp','supply','treasure','house','fire','muddyWater'];
  const width=32,height=16,terrainCodes=encodedRows.map(row=>row.match(/../g).map(hex=>parseInt(hex,16))),terrain=terrainCodes.map(row=>row.map(code=>terrainByCode[code]));
  // C = visible rock / dark map boundary, F = dense painted forest and
  // . = visible road or grass. Every cell was re-audited against the painted
  // background so roads stay continuous and mountain faces are never used as
  // shortcuts. The shaded road at 7,1 remains open by visual inspection.
  const paintedCollisionRows=[
    'CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC',
    'CF...FF.CCCCCCC.FFCCCCFCCCF..CFC',
    'CF...F..CCCCCCC..FCFCFC.CCF...CC',
    'CFF.FFF..FCCFCF..CFCCCFC.CF.FFCC',
    'CCC.CCF...C..CC..F.CFCCF.CC.CCCC',
    'CCF..CF.FFCCF.FC.FFCCFCC.F..FCFC',
    'CCF....CCCCCCC.C..CFFCCC.CC.CCFC',
    'CFF...FCCFFCCCCF...CCCCF.CF.FCCC',
    'CFC..FFFFCCCCFCC..F.CCFCF..CCCCC',
    'C......CCCFFCFCF...F..FFCC.FCCCC',
    'C.......F.FCCCCF...FF...FC..CCCC',
    'CCF.......CFCCF..FFFF....CC.FCCC',
    'CCCC.........FF..FF....FFC..FFFC',
    'CCCCCFF.............F...CC..FCCC',
    'CCCFCCCFCF.....F....F.....CCFCCC',
    'CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC'
  ];
  const paintedStructures=new Map([
    ['4,2','fort'],['17,3','village'],['19,7','treasure'],['8,11','treasure'],['15,12','village']
  ]);
  const paintedTerrainOverrides=paintedCollisionRows.flatMap((row,y)=>[...row].map((cell,x)=>({x,y,type:paintedStructures.get(`${x},${y}`)||(cell==='C'?'cliff':cell==='F'?'forest':'rough')})));
  const paintedCliffCells=paintedTerrainOverrides.filter(tile=>tile.type==='cliff').map(({x,y})=>[x,y]);
  const bases={infantry:[40,40,500,50,4],archer:[30,40,500,40,4],cavalry:[60,30,500,60,6],support:[20,30,400,40,5],transport:[20,30,400,40,5],martial:[65,30,500,50,5],bandit:[55,45,500,55,5],beast:[75,35,520,60,5]};
  const stats=(troop,level,wuli,zhili,tongyu)=>{const[a,d,h,g,m]=bases[troop]||bases.infantry,morale=100;return{hp:h+g*(level-1),maxHp:h+g*(level-1),morale,atk:Math.floor((Math.floor(4000/(140-wuli))+a*2+morale)*(level+10)/10),def:Math.floor((Math.floor(4000/(140-tongyu))+d*2+morale)*(level+10)/10),move:m,strategy:Math.floor((level+10)*zhili*5/200),maxStrategy:Math.floor((level+10)*zhili*5/200)}};
  const U=data=>Object.assign(data,stats(data.troop,data.level,data.wuli,data.zhili,data.tongyu));
  const classNames={infantry:'短兵',archer:'弓兵',cavalry:'轻骑兵',support:'军乐队',transport:'运输队',martial:'武术家',bandit:'贼兵',beast:'猛兽师'};
  const P=(x,y)=>x|(y<<8);
  const E=(id,originalId,name,troop,level,x,y,wuli,zhili,tongyu,extra={})=>U({id,originalId,name,role:name==='李明'?'泰山贼首':'泰山贼众',className:classNames[troop],troop,level,side:'enemy',x,y,wuli,zhili,tongyu,aiType:0,stationary:true,range:troop==='archer'?2:undefined,weapon:troop==='beast'?'驭兽短鞭':troop==='martial'?'拳套':'环首刀',color:'#9e443f',accent:'#d0ad5d',...extra});
  const allies=[
    U({id:'liu',originalId:0,name:'刘备',role:'平原相',className:'短兵',troop:'infantry',level:10,side:'ally',x:23,y:11,wuli:75,zhili:64,tongyu:91,critRate:.12,blockRate:.14,weapon:'佩剑',color:'#45a9cf',accent:'#e0ba59',carryover:true,defeatQuote:'泰山未平，我岂能倒下！'}),
    U({id:'guan',originalId:1,name:'关羽',role:'别部司马',className:'轻骑兵',troop:'cavalry',level:10,side:'ally',x:22,y:11,wuli:98,zhili:80,tongyu:100,critRate:.20,blockRate:.15,weapon:'青龙偃月刀',treasureItems:['qinglong'],color:'#3fa574',accent:'#cf4940',carryover:true,defeatQuote:'青龙刀尚在，云长来日再雪此耻！'}),
    U({id:'zhang',originalId:2,name:'张飞',role:'别部司马',className:'轻骑兵',troop:'cavalry',level:10,side:'ally',x:22,y:12,wuli:99,zhili:42,tongyu:83,critRate:.18,blockRate:.10,weapon:'蛇矛',treasureItems:['spear'],color:'#496fab',accent:'#d7aa52',carryover:true,defeatQuote:'山路难行，俺也去整顿兵马再来！'}),
    U({id:'jian',originalId:82,name:'简雍',role:'幕僚',className:'弓兵',troop:'archer',level:9,side:'ally',x:24,y:10,wuli:42,zhili:74,tongyu:36,range:2,critRate:.08,blockRate:.07,weapon:'角弓',color:'#4d8ca7',accent:'#d8bd70',carryover:true,defeatQuote:'箭囊已空，宪和先护伤兵后撤！'}),
    U({id:'zhaoyun',originalId:53,name:'赵云',role:'常山义士',className:'轻骑兵',troop:'cavalry',level:10,side:'ally',x:25,y:10,wuli:98,zhili:84,tongyu:87,critRate:.20,blockRate:.17,weapon:'龙胆枪',color:'#7bbbd0',accent:'#e2d8b5',carryover:true,defeatQuote:'子龙护卫不周，请主公速整阵势！'}),
    U({id:'sunqian',originalId:63,name:'孙乾',role:'徐州从事',className:'运输队',troop:'transport',level:9,side:'ally',x:25,y:11,wuli:38,zhili:74,tongyu:34,critRate:.08,blockRate:.08,weapon:'护身短刀',color:'#4e9fb4',accent:'#d8bb69',carryover:true,defeatQuote:'粮车不可尽失，公祐先护军资后撤！'}),
    U({id:'pangong',originalId:52,name:'藩宫',role:'信都义士',className:'武术家',troop:'martial',level:10,side:'ally',x:21,y:10,wuli:62,zhili:52,tongyu:71,critRate:.12,blockRate:.12,weapon:'拳套',color:'#4f9fb0',accent:'#dec06d',carryover:true,defeatQuote:'拳刃虽折，藩宫这条命还要留着护民！'})
  ];
  const enemies=[
    E('liming',375,'李明','beast',12,4,2,70,48,72,{gender:'female',boss:true,aiType:2,stationary:true,critRate:.14,blockRate:.13,defeatQuote:'众兄弟，是我李明连累了你们……'}),
    E('banditGuard',256,'贼兵队','bandit',10,26,1,62,34,58,{aiType:4,stationary:false,aiTarget:P(11,12)}),
    E('banditVanguard1',257,'贼兵队','bandit',10,14,5,64,32,59,{aiType:1,stationary:false}),
    E('banditVanguard2',258,'贼兵队','bandit',8,15,5,60,30,55,{aiType:1,stationary:false}),
    E('banditLeft1',259,'贼兵队','bandit',10,9,2,64,32,59),
    E('banditLeft2',260,'贼兵队','bandit',8,7,1,60,30,55),
    E('banditLeft3',261,'贼兵队','bandit',7,4,1,58,28,53),
    E('banditReserve',262,'贼兵队','bandit',7,5,2,58,28,53),
    E('beastRight',310,'猛兽师','beast',8,25,2,65,36,60,{aiType:4,stationary:false,aiTarget:P(11,12)}),
    E('beastLeft',311,'猛兽师','beast',8,5,1,65,36,60),
    E('martialRight',330,'武术家','martial',10,24,3,68,34,62,{aiType:4,stationary:false,aiTarget:P(11,12)}),
    E('martialLeft',331,'武术家','martial',9,8,3,66,33,60)
  ];
  const paintedUnitPlacements={
    liu:[8,12],guan:[10,12],zhang:[12,12],jian:[8,13],zhaoyun:[10,13],sunqian:[12,13],pangong:[13,13],
    liming:[4,2],banditGuard:[16,7],banditVanguard1:[16,4],banditVanguard2:[16,5],banditLeft1:[9,3],banditLeft2:[7,1],banditLeft3:[4,1],banditReserve:[5,2],
    beastRight:[17,7],beastLeft:[5,1],martialRight:[18,7],martialLeft:[8,3]
  };
  const paintedLegacyPlacements={
    liu:[[20,12],[10,12]],guan:[[21,12],[11,12]],zhang:[[22,12]],
    jian:[[22,10],[20,11],[10,13]],zhaoyun:[[23,10],[21,11],[11,13]],sunqian:[[24,11],[22,11]],pangong:[[19,11]]
  };
  const paintedDeploymentOverrides=[...allies,...enemies].flatMap(unit=>{
    const [x,y]=paintedUnitPlacements[unit.id];
    const fromCells=[[unit.x,unit.y],...(paintedLegacyPlacements[unit.id]||[]),...paintedCliffCells];
    const seen=new Set();
    return fromCells.filter(([fromX,fromY])=>{
      const key=`${fromX},${fromY}`;
      if(seen.has(key)||(fromX===x&&fromY===y))return false;
      seen.add(key);return true
    }).map(([fromX,fromY])=>({unitId:unit.id,fromX,fromY,x,y}));
  });
  window.LEVEL_09_TAISHAN={
    id:'taishan',chapter:'第一章 · 饿虎吕布来访',name:'泰山之战',width,height,terrain,terrainCodes,
    source:'原作 DOS HEXZMAP.R3 section 10 / SNR1D.R3 泰山事件 / FACEDAT face 230',maxTurns:40,
    objective:'平定泰山贼众；刘备可劝降李明',defeat:'刘备撤退或超过40回合',objectiveUnitId:'liming',victoryCondition:'eliminateAllEnemies',commanderDefeatEndsBattle:false,
    originalRules:true,squareGrid:true,structuresBakedIntoArt:false,viewProjection:{x:1/64,y:1/32,dx:1/32,dy:1/16,rowShift:Array(16).fill(0)},battlefieldArt:'assets/level-09-taishan/taishan-map-v2.webp',
    paintedCollisionRows,paintedTerrainOverrides,paintedDeploymentOverrides,
    paintedTerrainMigrations:[
      {fromX:10,fromY:0,x:19,y:7,type:'treasure'},
      {fromX:8,fromY:8,x:8,y:11,type:'treasure'}
    ],
    nextBattle:'淮南之战',nextLevelId:'huainan',
    intro:[
      {speaker:'关羽',text:'众军列队！泰山道路险峻，切莫各自冒进。'},
      {speaker:'李明',text:'来者可是平原相刘备？此人素有仁名……我等虽落草为寇，也不愿与百姓为敌。'}
    ],
    timedEvents:[
      {turn:2,once:'taishan-left-charge',activateUnitIds:['banditLeft1','banditLeft2','banditLeft3','beastLeft','martialLeft'],dialogue:[{speaker:'李明',text:'官军已经入谷。众兄弟守住山道，莫伤无辜百姓！'}]},
      {turn:3,once:'taishan-woman-chief',dialogue:[{speaker:'孙乾',text:'主公，据乡民所言，泰山贼首李明竟是一名女子。'},{speaker:'张飞',text:'女子又如何？若肯归顺大哥，俺便不与她为难！'}]}
    ],
    areaEvents:[{
      id:'taishan-recruit-li-ming',unitId:'liu',adjacentToUnitId:'liming',maxDistance:1,recruitUnitId:'liming',levelUpUnitId:'liu',restoreRecruited:true,
      dialogue:[
        {speaker:'刘备',text:'李首领，我军此来只为安民，并非滥杀。你若愿放下兵刃，我愿保全山中众人。'},
        {speaker:'李明',text:'久闻玄德公仁义，今日一见，果然不虚。李明愿率部归顺，只求使君善待众兄弟。'},
        {speaker:'刘备',text:'只要诚心归附，便都是我军袍泽。往日之事，不再追究。'},
        {speaker:'军报',text:'李明加入刘备军；刘备等级上升一级。战斗继续，尚须平定拒降贼众。'}
      ],log:'刘备劝降李明，李明作为猛兽师加入我军'
    }],
    environmentFx:{forestZones:[[.18,.18,.22,.15,.4],[.52,.22,.23,.17,1.9],[.80,.28,.16,.20,3.4],[.40,.62,.22,.18,4.7]]},
    events:{
      loot:{'19,7':{item:'rockScroll',amount:1},'8,11':{item:'bomb',amount:1}},
      normalVictory:[{speaker:'军报',text:'泰山贼众已经平定，山道重归安宁。'}],
      normalOccupation:{speaker:'刘备',text:'贼众既平，当速令军士安抚乡民，不可扰害一人。'},
      postBattleStory:[
        {speaker:'乡民',text:'多谢刘使君平定泰山！这是乡里凑出的五百金，请收下作军资。'},
        {speaker:'刘备',text:'百姓方经兵乱，本不该收。既是众人心意，便尽数用来赈济伤者。'},
        {speaker:'史官',text:'刘备回到小沛不久，陶谦病势转沉，将徐州托付于刘备，随后病逝。'},
        {speaker:'糜竺',text:'陶使君遗命在此。糜竺、糜芳愿随主公，共保徐州百姓。'},
        {speaker:'军报',text:'糜竺、糜芳加入刘备军。夏丘、彭城两路本次暂缓，剧情直接推进至淮南。'},
        {speaker:'吕布',text:'玄德公，吕布兵败无归，愿暂借小沛容身。'},
        {speaker:'刘备',text:'将军既来相投，便请安心驻扎。只是军民相处，务须秋毫无犯。'},
        {speaker:'使者',text:'天子诏命：袁术僭越不臣，着刘备会同诸军，进兵淮南。'},
        {speaker:'关羽',text:'兄长，诏命既到，当整顿军马，准备南下。'}
      ],
      victoryMusicId:16,battleReward:400,postBattleReward:500
    },
    ai:{strategyCooldown:6},units:[...allies,...enemies]
  };
})();
