(function () {
  // Chapter 1, Qinghe route. Terrain, deployment, AI targets, loot, timed
  // reinforcements and duel conditions are decoded from the user's original
  // HEXZMAP.R3 map 5 and SNR1D.R3 paragraph 11.
  const encodedRows=[
    '02020202020107000303000000000707070101010101010101010101',
    '02020101010101000303030000000007070101010101010101010101',
    '01010101010101010003030300000000070701010101010101010101',
    '01010101010101010700000303030000000707070101010101010102',
    '01010101010101010107000303030000000007070101010101070702',
    '01010101010101010107070003030300000000070701010707070202',
    '01010101010101010107000000030300000000000707070707020202',
    '00070701010101010700000000040400000000080007070707020202',
    '00000007070707000000000000040400000000000000070702020202',
    '000f0000000000000000000800030300000007000000070702020202',
    '07070000000000070707070000030300000707070000000707020202',
    '02070707070707010101070700030303000707070000000007070707',
    '02020201010101010101010710030303000707010700000000000707',
    '02020202010101010101010707000303030701010101010700000000',
    '02020202010101010101070707000303000701010101010107000000',
    '02020202020101010101070700030303000101010101010101010101'
  ];
  const terrainByCode=['plain','forest','hill','water','bridge','wall','city','grass','village','cliff','gate','rough','fence','fort','camp','supply','treasure','house','fire','muddyWater'];
  const width=28,height=16,terrainCodes=encodedRows.map(row=>row.match(/../g).map(hex=>parseInt(hex,16))),terrain=terrainCodes.map(row=>row.map(code=>terrainByCode[code]));
  const bases={infantry:[40,40,500,50,4],archer:[30,40,500,40,4],cavalry:[60,30,500,60,6],bandit:[50,40,540,40,5],support:[20,30,400,40,5],transport:[20,30,400,40,5],martial:[60,40,500,50,5]};
  const stats=(troop,level,wuli,zhili,tongyu)=>{const[a,d,h,g,m]=bases[troop]||bases.infantry,morale=100;return{hp:h+g*(level-1),maxHp:h+g*(level-1),morale,atk:Math.floor((Math.floor(4000/(140-wuli))+a*2+morale)*(level+10)/10),def:Math.floor((Math.floor(4000/(140-tongyu))+d*2+morale)*(level+10)/10),move:m,strategy:Math.floor((level+10)*zhili*5/200),maxStrategy:Math.floor((level+10)*zhili*5/200)}};
  const U=data=>Object.assign(data,stats(data.troop,data.level,data.wuli,data.zhili,data.tongyu));
  window.LEVEL_04_QINGHE={
    id:'qinghe',chapter:'第一章 · 界桥之战',name:'清河之战',width,height,terrain,terrainCodes,
    source:'用户原游戏 HEXZMAP.R3 map 5 / SNR1D.R3 paragraph 11 / MAIN.EXE',
    maxTurns:30,objective:'消灭麴义',defeat:'刘备撤退或超过30回合',objectiveUnitId:'quyi',originalRules:true,
    squareGrid:true,structuresBakedIntoArt:false,viewProjection:{x:1/56,y:1/32,dx:1/28,dy:1/16,rowShift:Array(16).fill(0)},battlefieldArt:'assets/level-04-qinghe/qinghe-map-remaster-v2.webp',
    nextBattle:'第五战 · 界桥之战',nextLevelId:'jieqiao',
    environmentFx:{
      forestZones:[[.00,.00,.30,.48,.4],[.55,.00,.43,.28,2.1],[.06,.72,.32,.27,1.3],[.60,.72,.37,.27,2.9]],
      waterBands:[
        {from:[.31,.00],to:[.47,1.00],bend:.045,width:.07,speed:.038,gaps:[[.46,.57]]},
        {from:[.37,.00],to:[.52,1.00],bend:.038,width:.055,speed:.032,gaps:[[.46,.57]]}
      ]
    },
    openingDuel:{
      winnerId:'quyi',loserId:'yangang',title:'麴义　VS　严纲',kicker:'清河 · 开战前单挑',caption:'麴义阵前斩严纲',
      challenge:[
        {speaker:'严纲',text:'麴义！我严纲要和你单挑较量！'},
        {speaker:'麴义',text:'有胆量，但你要倒霉啦！你还觉得能打赢我麴义？杀啊！'}
      ],
      exchange:[
        {speaker:'麴义',text:'严纲，看刀！'},
        {speaker:'严纲',text:'哎呀！'},
        {speaker:'麴义',text:'公孙瓒的大将严纲被斩了！'}
      ]
    },
    intro:[
      {speaker:'关羽',text:'大哥，好像晚了一步。严纲被斩，清河北平军溃败了。'},
      {speaker:'刘备',text:'晚了一步啊……好！血债要用血来还！'},
      {speaker:'麴义',text:'嗯？那不是刘备军吗？想去支援公孙瓒？我麴义不让你们过去！'}
    ],
    timedEvents:[{
      turn:7,once:'qinghe-turn7-bandits',
      spawns:[{unitId:'bandit1',side:'enemy',x:14,y:0},{unitId:'bandit2',side:'enemy',x:13,y:1}],
      dialogue:[{speaker:'刘备',text:'嗯！那是！？'},{speaker:'军报',text:'敌人的援军出现了！'}]
    }],
    events:{
      loot:{'9,1':{item:'wine',amount:1},'12,12':{gold:100}},
      supply:{item:'wine'},treasure:{gold:100},
      duel:{
        attackerId:'guan',defenderId:'quyi',endsBattle:true,title:'关羽　VS　麴义',kicker:'清河 · 阵前单挑',caption:'青龙偃月刀斩破清河敌阵',
        challenge:[{speaker:'关羽',text:'这里的大将听着！我要和你单挑较量！'},{speaker:'麴义',text:'什么？竟还有人敢向我挑战！好吧，就与你斗一斗！'}],
        exchange:[{speaker:'麴义',text:'让你也和刚才的严纲落个同样下场！'},{speaker:'麴义',text:'好家伙！好厉害……'},{speaker:'关羽',text:'我的武艺也不够娴熟，这么个小对手竟感到有点难对付……'}],
        aftermath:[],levelUp:{speaker:'军报',text:'关羽的等级上升了！'},
        confirmation:{speaker:'关羽',text:'强中自有强中手。麴义已败，清河道路打通了。'},
        occupation:{speaker:'军报',text:'关羽斩了麴义，刘备军突破了清河。'}
      },
      normalVictory:[{speaker:'麴义',text:'喂，刘备！休想从这里过去！'},{speaker:'军报',text:'麴义败退，刘备军突破了清河。'}],
      postVictory:[{speaker:'刘备',text:'清河已经突破。整顿部队，立即赶往界桥。'}],
      battleReward:200
    },
    ai:{strategyCooldown:5},
    units:[
      U({id:'liu',originalId:0,name:'刘备',role:'我军主将',className:'短兵',troop:'infantry',level:3,side:'ally',x:24,y:11,wuli:75,zhili:64,tongyu:91,critRate:.12,blockRate:.14,weapon:'佩剑',color:'#45a9cf',accent:'#e0ba59',carryover:true,defeatQuote:'汉室未兴……我怎能倒在这里……'}),
      U({id:'guan',originalId:1,name:'关羽',role:'别部司马',className:'轻骑兵',troop:'cavalry',level:4,side:'ally',x:23,y:11,wuli:98,zhili:80,tongyu:100,critRate:.20,blockRate:.15,weapon:'青龙偃月刀',treasureItems:['qinglong'],color:'#3fa574',accent:'#cf4940',carryover:true,defeatQuote:'大哥……云长不能再护你周全了。'}),
      U({id:'zhang',originalId:2,name:'张飞',role:'别部司马',className:'轻骑兵',troop:'cavalry',level:4,side:'ally',x:22,y:10,wuli:99,zhili:42,tongyu:83,critRate:.18,blockRate:.10,weapon:'蛇矛',treasureItems:['spear'],color:'#496fab',accent:'#d7aa52',carryover:true,defeatQuote:'可恨！俺还没杀尽这些逆贼……'}),
      U({id:'jian',originalId:82,name:'简雍',role:'幕僚',className:'弓兵',troop:'archer',level:4,side:'ally',x:22,y:12,wuli:42,zhili:74,tongyu:36,range:2,critRate:.08,blockRate:.07,weapon:'角弓',color:'#4d8ca7',accent:'#d8bd70',carryover:true,defeatQuote:'主公……简雍暂且退下……'}),
      U({id:'yangang',originalId:59,name:'严纲',role:'北平大将',className:'轻骑兵',troop:'cavalry',level:5,side:'guest',x:3,y:10,wuli:66,zhili:45,tongyu:60,aiType:2,critRate:.11,blockRate:.10,weapon:'长枪',color:'#6ab7c6',accent:'#d8bb69',defeatQuote:'主公……严纲无能……'}),
      U({id:'quyi',originalId:60,name:'麴义',role:'敌军主将',className:'轻骑兵',troop:'cavalry',level:9,side:'enemy',x:2,y:10,wuli:73,zhili:39,tongyu:65,aiType:2,critRate:.15,blockRate:.13,weapon:'战刀',color:'#9e443f',accent:'#d0ad5d',boss:true,defeatQuote:'好家伙……好厉害！'}),
      U({id:'e1',originalId:256,name:'步兵队',role:'前锋',className:'短兵',troop:'infantry',level:5,side:'enemy',x:4,y:9,wuli:40,zhili:30,tongyu:50,aiType:0,color:'#9e443f',accent:'#848c8a'}),
      U({id:'e2',originalId:257,name:'步兵队',role:'守军',className:'短兵',troop:'infantry',level:5,side:'enemy',x:10,y:7,wuli:40,zhili:30,tongyu:50,aiType:4,aiTarget:1804,color:'#9e443f',accent:'#848c8a'}),
      U({id:'e3',originalId:258,name:'步兵队',role:'守军',className:'短兵',troop:'infantry',level:4,side:'enemy',x:9,y:9,wuli:40,zhili:30,tongyu:50,aiType:4,aiTarget:2060,color:'#9e443f',accent:'#848c8a'}),
      U({id:'band',originalId:328,name:'军乐队',role:'支援',className:'军乐队',troop:'support',level:4,side:'enemy',x:8,y:8,wuli:20,zhili:70,tongyu:35,aiType:4,aiTarget:2059,color:'#9e443f',accent:'#c3a85d'}),
      U({id:'cavalry',originalId:292,name:'骑兵队',role:'前锋',className:'轻骑兵',troop:'cavalry',level:2,side:'enemy',x:3,y:8,wuli:50,zhili:30,tongyu:40,aiType:0,color:'#9e443f',accent:'#848c8a'}),
      U({id:'archer1',originalId:274,name:'弓兵队',role:'前锋',className:'弓兵',troop:'archer',level:4,side:'enemy',x:2,y:9,wuli:40,zhili:50,tongyu:30,range:2,aiType:0,color:'#9e443f',accent:'#848c8a'}),
      U({id:'archer2',originalId:275,name:'弓兵队',role:'守军',className:'弓兵',troop:'archer',level:4,side:'enemy',x:10,y:10,wuli:40,zhili:50,tongyu:30,range:2,aiType:4,aiTarget:2315,color:'#9e443f',accent:'#848c8a'}),
      U({id:'bandit1',originalId:310,name:'贼兵',role:'援军',className:'山贼',troop:'bandit',level:3,side:'reserve',x:-1,y:-1,wuli:50,zhili:40,tongyu:30,aiType:1,color:'#8d5038',accent:'#9b8f6b'}),
      U({id:'bandit2',originalId:311,name:'贼兵',role:'援军',className:'山贼',troop:'bandit',level:3,side:'reserve',x:-1,y:-1,wuli:50,zhili:40,tongyu:30,aiType:1,color:'#8d5038',accent:'#9b8f6b'})
    ]
  };
})();
