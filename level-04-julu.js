(function () {
  // Chapter 1, Julu route. Terrain, deployment and event conditions are
  // decoded from HEXZMAP.R3 map 4 and SNR1D.R3 paragraph 13 in the user's
  // original game. Tactical coordinates use the extracted 18×18 square grid.
  const encodedRows=[
    '0b0b0b0b0b0b0b0b09090909090b0b0b0b0b',
    '00000b0b0b0b0b0b0b0b09090909090b0b0b',
    '00000b0b0b0b0b0b0b0b0b0b090909090b0b',
    '0b00000b0b0b0b0b0b0b0b0b0b0b09090909',
    '090b0b0b0b0b0b0b0b0b0b0b0b0b0b090909',
    '0909090b0b090b0b0b0b0b0b0b0b0b0b0b09',
    '09090909090909090b0b0b0b0b0b0b0b0b0b',
    '0b0909090909090909090b080b0b0b0b0b0b',
    '0b0b0b0b0b0f0b09090909090b0b0b0b0b0b',
    '00000b0b0b0b0b0b0b0b0909090b0b0b0b0b',
    '0d0000000b0b0b0b0b0b0b0b0b0b0b0b0b0b',
    '07000000000b0b0b0b0b0b0b0b0b0b0b0b0b',
    '010700000000000b0b0b0b0b0b0b0b000007',
    '01010700000000080b0b0b0b000000070707',
    '010107000000000000000000070707070101',
    '010107000000000000000007070707010101',
    '010707000000000007070707070707010101',
    '010700000000070707070707070701010101'
  ];
  const terrainByCode=['plain','forest','hill','water','bridge','wall','city','grass','village','cliff','gate','rough','fence','fort','camp','supply','treasure','house','fire','muddyWater'];
  const width=18,height=18,terrainCodes=encodedRows.map(row=>row.match(/../g).map(hex=>parseInt(hex,16))),terrain=terrainCodes.map(row=>row.map(code=>terrainByCode[code]));
  const bases={infantry:[40,40,500,50,4],archer:[30,40,500,40,4],cavalry:[60,30,500,60,6],bandit:[50,40,540,40,5],support:[20,30,400,40,5],transport:[20,30,400,40,5],martial:[60,40,500,50,5]};
  const stats=(troop,level,wuli,zhili,tongyu)=>{const[a,d,h,g,m]=bases[troop]||bases.infantry,morale=100;return{hp:h+g*(level-1),maxHp:h+g*(level-1),morale,atk:Math.floor((Math.floor(4000/(140-wuli))+a*2+morale)*(level+10)/10),def:Math.floor((Math.floor(4000/(140-tongyu))+d*2+morale)*(level+10)/10),move:m,strategy:Math.floor((level+10)*zhili*5/200),maxStrategy:Math.floor((level+10)*zhili*5/200)}};
  const U=data=>Object.assign(data,stats(data.troop,data.level,data.wuli,data.zhili,data.tongyu));
  window.LEVEL_04_JULU={
    id:'julu',chapter:'第一章 · 界桥之战',name:'巨鹿之战',width,height,terrain,terrainCodes,
    source:'用户原游戏 HEXZMAP.R3 map 4 / SNR1D.R3 paragraph 13 / MAIN.EXE',
    maxTurns:30,objective:'击退张郃，或刘备抵达西面鹿砦',defeat:'刘备撤退或超过30回合',objectiveUnitId:'zhanghe',originalRules:true,
    squareGrid:true,structuresBakedIntoArt:false,viewProjection:{x:1/36,y:1/36,dx:1/18,dy:1/18,rowShift:Array(18).fill(0)},battlefieldArt:'assets/level-04-julu/julu-map-aligned-v3.webp',
    nextBattle:'第五战 · 界桥之战',
    alternateVictory:{unitId:'liu',x:0,y:10,exp:50,type:'fort',label:'突破巨鹿',log:'刘备抵达西面鹿砦，全体存活我军获得经验50'},
    areaEvents:[{
      id:'julu-central-trigger',unitId:'liu',rect:{x1:4,y1:8,x2:10,y2:13},
      dialogue:[{speaker:'张郃',text:'不能让刘备突破巨鹿，全军阻挡刘备！'}],
      aiUpdates:[
        {unitId:'zhanghe',aiType:3,aiTarget:0},{unitId:'yanliang',aiType:3,aiTarget:0},{unitId:'gaolan',aiType:3,aiTarget:0},
        {unitId:'e2',aiType:3,aiTarget:0},{unitId:'e3',aiType:3,aiTarget:0},{unitId:'transport',aiType:3,aiTarget:0}
      ]
    }],
    timedEvents:[{
      turn:3,once:'julu-turn3-reinforcements',
      spawns:[
        {unitId:'bandit1',side:'enemy',x:2,y:0},{unitId:'bandit2',side:'enemy',x:1,y:1},{unitId:'bandit3',side:'enemy',x:0,y:2},
        {unitId:'guanchun',side:'guest',x:17,y:13},{unitId:'gengwu',side:'guest',x:17,y:12}
      ],
      dialogue:[
        {speaker:'刘备',text:'唉！那是！？'},
        {speaker:'军报',text:'敌人的援军来了！'},
        {speaker:'刘备',text:'什么？从前面也来了吗！？'},
        {speaker:'关纯',text:'我是关纯，原是韩馥的部下。此番前来加入刘备军。'},
        {speaker:'军报',text:'耿武、关纯来支援！'}
      ]
    }],
    environmentFx:{forestZones:[[.02,.67,.17,.31,.3],[.78,.69,.20,.28,2.6]],waterBands:[]},
    intro:[
      {speaker:'关羽',text:'好像是敌人，列队。'},
      {speaker:'颜良',text:'张郃，快些收拾掉北平军，赶快和界桥的主力会合吧。'},
      {speaker:'刘备',text:'公孙越，平原刘备前来助战。'},
      {speaker:'张郃',text:'来了，刘备！我张郃在此挡路，你去不了界桥。'}
    ],
    events:{
      loot:{'5,8':{item:'wheat',amount:1}},
      supply:{item:'wheat'},
      duel:{
        attackerId:'zhang',defenderId:'yanliang',endsBattle:false,title:'张飞　VS　颜良',kicker:'巨鹿 · 阵前单挑',caption:'丈八蛇矛力挫颜良',
        challenge:[{speaker:'张飞',text:'噢，看样子是个很厉害的对手嘛。俺去对付他！'},{speaker:'颜良',text:'来将通名！'}],
        exchange:[{speaker:'张飞',text:'好像还有两下子，碰上我算你倒霉。'},{speaker:'张飞',text:'你玩的什么武艺？这样还能赢我？'},{speaker:'颜良',text:'噢噢！打不过他，撤！'}],
        aftermath:[],levelUp:{speaker:'军报',text:'张飞的等级上升了！'},
        confirmation:{speaker:'刘备',text:'翼德取胜，袁绍军阵脚已乱。'},occupation:{speaker:'军报',text:'张郃败退了，刘备军打败了袁绍军。'}
      },
      normalVictory:[{speaker:'张郃',text:'可恶！败给了刘备！撤退！'},{speaker:'军报',text:'张郃败退了，刘备军打败了袁绍军。'}],
      alternateVictory:[{speaker:'张郃',text:'可恶！不能让刘备过去！'},{speaker:'军报',text:'刘备军突破巨鹿了。'}],
      postVictory:[{speaker:'刘备',text:'巨鹿已经突破。整顿部队，立即赶往界桥。'}],battleReward:200
    },
    ai:{strategyCooldown:5},
    units:[
      U({id:'liu',originalId:0,name:'刘备',role:'我军主将',className:'短兵',troop:'infantry',level:3,side:'ally',x:2,y:2,wuli:75,zhili:64,tongyu:91,critRate:.12,blockRate:.14,weapon:'佩剑',color:'#45a9cf',accent:'#e0ba59',carryover:true,defeatQuote:'汉室未兴……我怎能倒在这里……'}),
      U({id:'guan',originalId:1,name:'关羽',role:'别部司马',className:'轻骑兵',troop:'cavalry',level:4,side:'ally',x:4,y:3,wuli:98,zhili:80,tongyu:100,critRate:.20,blockRate:.15,weapon:'青龙偃月刀',treasureItems:['qinglong'],color:'#3fa574',accent:'#cf4940',carryover:true,defeatQuote:'大哥……云长不能再护你周全了。'}),
      U({id:'zhang',originalId:2,name:'张飞',role:'别部司马',className:'轻骑兵',troop:'cavalry',level:4,side:'ally',x:3,y:1,wuli:99,zhili:42,tongyu:83,critRate:.18,blockRate:.10,weapon:'蛇矛',treasureItems:['spear'],color:'#496fab',accent:'#d7aa52',carryover:true,defeatQuote:'可恨！俺还没杀尽这些逆贼……'}),
      U({id:'jian',originalId:82,name:'简雍',role:'幕僚',className:'弓兵',troop:'archer',level:4,side:'ally',x:1,y:2,wuli:42,zhili:74,tongyu:36,range:2,critRate:.08,blockRate:.07,weapon:'角弓',color:'#4d8ca7',accent:'#d8bd70',carryover:true,defeatQuote:'主公……简雍暂且退下……'}),
      U({id:'gongsunyue',originalId:25,name:'公孙越',role:'北平援军',className:'弓兵',troop:'archer',level:7,side:'guest',x:10,y:4,wuli:60,zhili:47,tongyu:58,range:2,aiType:1,critRate:.10,blockRate:.10,weapon:'角弓',color:'#6ab7c6',accent:'#d8bb69',defeatQuote:'兄长……公孙越先退了……'}),
      U({id:'yuze',originalId:221,name:'羽则',role:'北平援军',className:'短兵',troop:'infantry',level:5,side:'guest',x:9,y:5,wuli:23,zhili:46,tongyu:30,aiType:1,critRate:.07,blockRate:.09,weapon:'佩剑',color:'#6ab7c6',accent:'#d8bb69',defeatQuote:'公孙将军……羽则先退了……'}),
      U({id:'guanchun',originalId:58,name:'关纯',role:'援军',className:'弓兵',troop:'archer',level:4,side:'reserve',x:-1,y:-1,wuli:42,zhili:61,tongyu:32,range:2,aiType:1,critRate:.09,blockRate:.10,weapon:'角弓',color:'#6ab7c6',accent:'#d8bb69',defeatQuote:'未能报效使君……关纯先退……'}),
      U({id:'gengwu',originalId:57,name:'耿武',role:'援军',className:'短兵',troop:'infantry',level:4,side:'reserve',x:-1,y:-1,wuli:44,zhili:53,tongyu:32,aiType:1,critRate:.09,blockRate:.10,weapon:'佩剑',color:'#6ab7c6',accent:'#d8bb69',defeatQuote:'巨鹿未破……耿武不甘……'}),
      U({id:'zhanghe',originalId:102,name:'张郃',role:'敌军主将',className:'轻骑兵',troop:'cavalry',level:10,side:'enemy',x:5,y:17,wuli:90,zhili:62,tongyu:88,aiType:0,critRate:.16,blockRate:.15,weapon:'青釭剑',treasureItems:['qinggang','wuzi'],color:'#9e443f',accent:'#d0ad5d',boss:true,defeatQuote:'可恶！败给了刘备！撤退！'}),
      U({id:'yanliang',originalId:51,name:'颜良',role:'袁军猛将',className:'轻骑兵',troop:'cavalry',level:7,side:'enemy',x:6,y:15,wuli:87,zhili:32,tongyu:84,aiType:0,critRate:.17,blockRate:.12,weapon:'青釭剑',treasureItems:['qinggang','wuzi'],color:'#9e443f',accent:'#d0ad5d',defeatQuote:'噢噢！打不过他，撤！'}),
      U({id:'gaolan',originalId:103,name:'高览',role:'袁军将领',className:'弓兵',troop:'archer',level:7,side:'enemy',x:4,y:14,wuli:75,zhili:50,tongyu:72,range:2,aiType:0,critRate:.12,blockRate:.09,weapon:'角弓',color:'#9e443f',accent:'#d0ad5d',defeatQuote:'刘备军势盛……高览暂且撤退！'}),
      U({id:'shenpei',originalId:91,name:'审配',role:'袁军参军',className:'短兵',troop:'infantry',level:6,side:'enemy',x:12,y:6,wuli:71,zhili:67,tongyu:73,aiType:1,critRate:.09,blockRate:.12,weapon:'青釭剑',treasureItems:['qinggang','wuzi'],color:'#9e443f',accent:'#d0ad5d',defeatQuote:'此战失算……回报袁公，再作计较。'}),
      U({id:'fengji',originalId:54,name:'逢纪',role:'袁军将领',className:'短兵',troop:'infantry',level:7,side:'enemy',x:11,y:14,wuli:54,zhili:82,tongyu:66,aiType:1,critRate:.10,blockRate:.11,weapon:'青釭剑',treasureItems:['qinggang','wuzi'],color:'#9e443f',accent:'#d0ad5d',defeatQuote:'巨鹿难守……先退回袁公军中！'}),
      U({id:'e1',originalId:256,name:'步兵队',role:'前锋',className:'短兵',troop:'infantry',level:5,side:'enemy',x:10,y:6,wuli:40,zhili:30,tongyu:50,aiType:1,color:'#9e443f',accent:'#848c8a'}),
      U({id:'e2',originalId:257,name:'步兵队',role:'前锋',className:'短兵',troop:'infantry',level:5,side:'enemy',x:7,y:16,wuli:40,zhili:30,tongyu:50,aiType:0,color:'#9e443f',accent:'#848c8a'}),
      U({id:'e3',originalId:274,name:'弓兵队',role:'前锋',className:'弓兵',troop:'archer',level:4,side:'enemy',x:9,y:17,wuli:40,zhili:50,tongyu:30,range:2,aiType:0,color:'#9e443f',accent:'#848c8a'}),
      U({id:'e4',originalId:292,name:'骑兵队',role:'前锋',className:'轻骑兵',troop:'cavalry',level:3,side:'enemy',x:10,y:14,wuli:50,zhili:30,tongyu:40,aiType:1,color:'#9e443f',accent:'#848c8a'}),
      U({id:'martial',originalId:336,name:'武术家',role:'前锋',className:'武术家队',troop:'martial',level:4,side:'enemy',x:13,y:5,wuli:62,zhili:38,tongyu:57,aiType:1,color:'#9e443f',accent:'#848c8a'}),
      U({id:'transport',originalId:348,name:'运输队',role:'支援',className:'运输队',troop:'transport',level:4,side:'enemy',x:4,y:16,wuli:20,zhili:70,tongyu:35,aiType:0,color:'#9e443f',accent:'#c3a85d'}),
      U({id:'bandit1',originalId:310,name:'贼兵',role:'伏兵',className:'山贼',troop:'bandit',level:3,side:'reserve',x:-1,y:-1,wuli:50,zhili:40,tongyu:30,aiType:1,color:'#8d5038',accent:'#9b8f6b'}),
      U({id:'bandit2',originalId:311,name:'贼兵',role:'伏兵',className:'山贼',troop:'bandit',level:3,side:'reserve',x:-1,y:-1,wuli:50,zhili:40,tongyu:30,aiType:1,color:'#8d5038',accent:'#9b8f6b'}),
      U({id:'bandit3',originalId:312,name:'贼兵',role:'伏兵',className:'山贼',troop:'bandit',level:3,side:'reserve',x:-1,y:-1,wuli:50,zhili:40,tongyu:30,aiType:1,color:'#8d5038',accent:'#9b8f6b'})
    ]
  };
})();
