(function () {
  // Chapter 1, Xindu route. Terrain and deployment are decoded from
  // HEXZMAP.R3 map 3 and SNR1D.R3 paragraph 6/7/8 in the user's original game.
  const encodedRows=[
    '06060606060605000000010101010102020202020202',
    '05060505050505000000010101010101020202020202',
    '050a0505050505000000000701010101020202020202',
    '00000000000000000000000007070101010102020202',
    '00000000000000000300000000000701010107070202',
    '07070000000010030303030800000007070707070707',
    '07070700000003030303030300000000000000000007',
    '07000003040303030010030303030000000000000000',
    '03000303040300000000000003030300000007070000',
    '03030300000007070700000000040400070101010707',
    '03030000070701010107070000030300010101010101'
  ];
  const terrainByCode=['plain','forest','hill','water','bridge','wall','city','grass','village','cliff','gate','rough','fence','fort','camp','supply','treasure','house','fire','muddyWater'];
  const width=22,height=11,terrainCodes=encodedRows.map(row=>row.match(/../g).map(hex=>parseInt(hex,16))),terrain=terrainCodes.map(row=>row.map(code=>terrainByCode[code]));
  const bases={infantry:[40,40,500,50,4],archer:[30,40,500,40,4],cavalry:[60,30,500,60,6],bandit:[50,40,540,40,5],support:[20,30,400,40,5],martial:[60,40,500,50,5]};
  const stats=(troop,level,wuli,zhili,tongyu)=>{const[a,d,h,g,m]=bases[troop],morale=100;return{hp:h+g*(level-1),maxHp:h+g*(level-1),morale,atk:Math.floor((Math.floor(4000/(140-wuli))+a*2+morale)*(level+10)/10),def:Math.floor((Math.floor(4000/(140-tongyu))+d*2+morale)*(level+10)/10),move:m,strategy:Math.floor((level+10)*zhili*5/200),maxStrategy:Math.floor((level+10)*zhili*5/200)}};
  const U=(data)=>Object.assign(data,stats(data.troop,data.level,data.wuli,data.zhili,data.tongyu));
  window.LEVEL_03_XINDU={
    id:'xindu',chapter:'第一章 · 界桥之战',name:'信都之战',width,height,terrain,terrainCodes,
    source:'用户原游戏 HEXZMAP.R3 / SNR1D.R3 / SNR1M.R3 / BAKDATA.R3 / MAIN.EXE',
    maxTurns:30,objective:'击退淳于琼，或刘备抵达信都城门',defeat:'刘备撤退或超过30回合',objectiveUnitId:'chunyu',originalRules:true,
    squareGrid:true,viewProjection:{x:.023,y:.07,dx:.0452,dy:.086,rowShift:[0,0,0,0,0,0,0,0,0,0,0]},battlefieldArt:'assets/level-03-xindu/xindu-map-v1.webp',
    // Keep the extracted source grid intact for the audit, but use a collision
    // layer that follows the remastered river pixel for pixel.  The painting
    // moved all three crossings, so retaining the original bridge cells let a
    // unit stand on visible water while some painted bridges stayed blocked.
    paintedTerrainOverrides:[
      // The painted north-west gate has a continuous road into the city. The
      // source gate cell was globally treated as impassable, which isolated
      // every otherwise-walkable city tile behind it.
      {x:1,y:2,type:'city'},

      // Painted land that was river/bridge in the original tactical bitmap.
      {x:8,y:4,type:'plain'},
      {x:9,y:5,type:'grass'},{x:10,y:5,type:'grass'},
      {x:11,y:6,type:'grass'},
      {x:3,y:7,type:'grass'},{x:4,y:7,type:'forest'},{x:5,y:7,type:'grass'},{x:6,y:7,type:'grass'},
      {x:0,y:8,type:'forest'},{x:2,y:8,type:'forest'},{x:3,y:8,type:'forest'},{x:4,y:8,type:'forest'},{x:5,y:8,type:'grass'},{x:13,y:8,type:'grass'},
      {x:0,y:9,type:'forest'},{x:13,y:9,type:'grass'},{x:14,y:9,type:'grass'},
      {x:13,y:10,type:'grass'},{x:14,y:10,type:'grass'},

      // Every visibly blue square is impassable.  These cells cover both river
      // branches, including the eastern bend that the old collision layer
      // accidentally treated as open grass.
      {x:21,y:5,type:'water'},
      {x:18,y:6,type:'water'},{x:19,y:6,type:'water'},{x:20,y:6,type:'water'},
      {x:7,y:7,type:'water'},{x:10,y:7,type:'water'},{x:11,y:7,type:'water'},{x:13,y:7,type:'water'},
      {x:14,y:7,type:'water'},{x:15,y:7,type:'water'},{x:16,y:7,type:'water'},{x:17,y:7,type:'water'},{x:18,y:7,type:'water'},
      {x:7,y:8,type:'water'},{x:14,y:8,type:'water'},{x:15,y:8,type:'water'},
      {x:4,y:9,type:'water'},{x:5,y:9,type:'water'},{x:7,y:9,type:'water'},
      {x:7,y:10,type:'water'},{x:8,y:10,type:'water'},

      // Only the three bridges visible in the painting are passable crossings.
      {x:7,y:5,type:'bridge'},
      {x:12,y:6,type:'bridge'},
      {x:12,y:7,type:'bridge'},
      {x:6,y:9,type:'bridge'},
      {x:12,y:8,type:'grass'}
    ],
    // The remastered eastern river bend covers two original deployment cells.
    // Preserve the audited source coordinates in units[] and move only the
    // runtime pieces to the adjacent dry squares shown by the painting.
    paintedDeploymentOverrides:[
      {unitId:'guan',fromX:20,fromY:6,x:20,y:7},
      {unitId:'jian',fromX:21,fromY:5,x:20,y:5}
    ],
    battleTrack:'assets/level-03/thousand-suns-dw7th-mix.opus',nextBattle:'第四战 · 巨鹿或清河',nextLevelId:'julu',
    // SNR's battlefield-point event prints this as (3,1), in row/column
    // order.  In the runtime's x/y order the gate approach is (1,3).
    alternateVictory:{unitId:'liu',x:1,y:3,exp:50,type:'gate'},
    environmentFx:{
      forestZones:[[.27,.02,.28,.23,.4],[.02,.32,.16,.27,2.1],[.42,.22,.20,.23,3.7],[.73,.68,.18,.24,5.6]],
      waterBands:[
        {from:[.01,.78],to:[.59,.49],bend:.08,width:.065,speed:.042,gaps:[[.26,.31],[.51,.56]]},
        {from:[.33,.68],to:[.98,.47],bend:-.04,width:.058,speed:.035,gaps:[[.46,.51]]}
      ]
    },
    intro:[
      {speaker:'藩宫',text:'就要守不住了……袁绍军怎么会在这儿出现。'},
      {speaker:'淳于琼',text:'好。信都城快攻下来了，大家再加把劲。'},
      {speaker:'关羽',text:'兄长，好像是袁绍军。信都城遭到袁绍军的袭击。'},
      {speaker:'简雍',text:'袁绍军怎么会打到这里来呢？公孙瓒怎么样了呢？'},
      {speaker:'淳于琼',text:'那是平原刘备的部队！不管他，在此杀掉刘备！全军向刘备军出击！'},
      {speaker:'张飞',text:'大哥，袁绍军杀过来了。'},
      {speaker:'关羽',text:'兄长，救信都城吧。只要能守住信都城，袁绍军就得撤退。向城门打吧！'}
    ],
    timedEvents:[
      {turn:3,once:'xindu-turn3-boss-hold',unitId:'chunyu',setAiType:2,dialogue:[]},
      {turn:3,once:'xindu-turn3-infantry-advance',unitId:'e2',setAiType:1,dialogue:[]},
      {turn:3,once:'xindu-turn3-bandit-advance',unitId:'e7',setAiType:1,dialogue:[]},
      {turn:14,once:'xindu-turn14-boss-advance',unitId:'chunyu',setAiType:1,dialogue:[{speaker:'淳于琼',text:'不能再拖了！全军压上，拿下信都！'}]}
    ],
    events:{
      loot:{'6,5':{gold:100},'9,7':{item:'wine',amount:1}},
      duel:{
        attackerId:'zhang',defenderId:'chunyu',title:'张飞　VS　淳于琼',kicker:'信都城 · 阵前单挑',caption:'丈八蛇矛破袁军',
        challenge:[{speaker:'张飞',text:'哪个是主将？喂，我是张飞，哪个与我单挑较量！'},{speaker:'淳于琼',text:'好，正中下怀。张飞！杀！'}],
        aftermath:[{speaker:'淳于琼',text:'这……！这么厉害……'},{speaker:'张飞',text:'就这点儿能耐，赢不了我！'},{speaker:'淳于琼',text:'打不过他。妈的，没办法，走为上。'}],
        levelUp:{speaker:'军报',text:'张飞的等级上升了！'},
        confirmation:{speaker:'关羽',text:'兄长，袁绍军好像退兵了。'},occupation:{speaker:'军报',text:'淳于琼败退了，刘备军打败了袁绍军。'}
      },
      normalVictory:[{speaker:'淳于琼',text:'他妈的，再加把劲就能攻下来，可是只好全军撤退！'},{speaker:'关羽',text:'兄长，袁绍军好像退兵了。'},{speaker:'军报',text:'淳于琼败退了，刘备军打败了袁绍军。'}],
      alternateVictory:[{speaker:'刘备',text:'城门已到。守住信都，袁绍军便不能继续进攻。'},{speaker:'淳于琼',text:'信都援军已经入城……全军撤退！'},{speaker:'军报',text:'刘备进入信都，守城成功。全体存活部队获得经验50。'}],
      postVictory:[
        {speaker:'简雍',text:'好像不妙，先进信都城吧。'},
        {speaker:'藩宫',text:'刘备，您救了信都，太谢谢你了。'},
        {speaker:'刘备',text:'不用谢。还好，我们正好经过信都。'},
        {speaker:'刘备',text:'我们这是去支援公孙瓒，刚才要从信都过去，发现你这里受到攻击。'},
        {speaker:'藩宫',text:'刘备，请让我也加入援军，以报答您救信都之恩。'},
        {speaker:'军报',text:'藩宫加入了刘备军！'},
        {speaker:'关羽',text:'那么，兄长，我们快去支援吧。'},
        {speaker:'简雍',text:'主公，出发前要不要去打制兵器的道具屋看一看？'},
        {speaker:'张飞',text:'大哥，再不出发也许就来不及了。'},
        {speaker:'藩宫',text:'我也参加你们的援军。'}
      ],
      battleReward:200
    },
    strategyAccess:{},ai:{strategyCooldown:5},
    units:[
      U({id:'liu',originalId:0,name:'刘备',role:'我军主将',className:'短兵',troop:'infantry',level:1,side:'ally',x:21,y:7,wuli:75,zhili:64,tongyu:91,critRate:.12,blockRate:.14,weapon:'佩剑',color:'#45a9cf',accent:'#e0ba59',carryover:true,defeatQuote:'汉室未兴……我怎能倒在这里……'}),
      U({id:'guan',originalId:1,name:'关羽',role:'别部司马',className:'轻骑兵',troop:'cavalry',level:2,side:'ally',x:20,y:6,wuli:98,zhili:80,tongyu:100,critRate:.20,blockRate:.15,weapon:'青龙偃月刀',treasureItems:['qinglong'],color:'#3fa574',accent:'#cf4940',carryover:true,defeatQuote:'大哥……云长不能再护你周全了。'}),
      U({id:'zhang',originalId:2,name:'张飞',role:'别部司马',className:'轻骑兵',troop:'cavalry',level:2,side:'ally',x:20,y:8,wuli:99,zhili:42,tongyu:83,critRate:.18,blockRate:.10,weapon:'蛇矛',treasureItems:['spear'],color:'#496fab',accent:'#d7aa52',carryover:true,defeatQuote:'可恨！俺还没杀尽这些逆贼……'}),
      U({id:'jian',originalId:82,name:'简雍',role:'幕僚',className:'弓兵',troop:'archer',level:3,side:'ally',x:21,y:5,wuli:42,zhili:74,tongyu:36,range:2,critRate:.08,blockRate:.07,weapon:'角弓',color:'#4d8ca7',accent:'#d8bd70',carryover:true,defeatQuote:'主公……简雍暂且退下……'}),
      U({id:'fagong',originalId:220,name:'藩宫',role:'信都守将',className:'武术家队',troop:'martial',level:4,side:'guest',x:1,y:0,wuli:62,zhili:52,tongyu:71,aiType:2,stationary:true,critRate:.10,blockRate:.14,weapon:'拳刃',color:'#6ab7c6',accent:'#d8bb69',defeatQuote:'信都百姓……藩宫有负所托……'}),
      U({id:'guoshi',originalId:245,name:'郭适',role:'信都守军',className:'山贼',troop:'bandit',level:4,side:'guest',x:3,y:0,wuli:35,zhili:63,tongyu:50,aiType:2,stationary:true,critRate:.06,blockRate:.08,weapon:'朴刀',color:'#6ab7c6',accent:'#d8bb69',defeatQuote:'信都……就交给你们了……'}),
      U({id:'hanying',originalId:244,name:'韩英',role:'信都守军',className:'短兵',troop:'infantry',level:4,side:'guest',x:0,y:0,wuli:61,zhili:44,tongyu:55,aiType:2,stationary:true,critRate:.08,blockRate:.09,weapon:'佩剑',color:'#6ab7c6',accent:'#d8bb69',defeatQuote:'未能守住信都……惭愧……'}),
      U({id:'chunyu',originalId:105,name:'淳于琼',role:'敌军主将',className:'轻骑兵',troop:'cavalry',level:8,side:'enemy',x:1,y:4,wuli:73,zhili:62,tongyu:68,aiType:4,aiTarget:775,critRate:.13,blockRate:.11,weapon:'长枪',color:'#9e443f',accent:'#d0ad5d',boss:true,defeatQuote:'他妈的，再加把劲就能攻下来，可是只好全军撤退！'}),
      U({id:'e1',originalId:256,name:'步兵队',role:'前锋',className:'短兵',troop:'infantry',level:4,side:'enemy',x:8,y:3,wuli:40,zhili:30,tongyu:50,aiType:4,aiTarget:1033,color:'#9e443f',accent:'#848c8a'}),
      U({id:'e2',originalId:257,name:'步兵队',role:'前锋',className:'短兵',troop:'infantry',level:4,side:'enemy',x:4,y:6,wuli:40,zhili:30,tongyu:50,aiType:4,aiTarget:2313,color:'#9e443f',accent:'#848c8a'}),
      U({id:'e3',originalId:258,name:'步兵队',role:'前锋',className:'短兵',troop:'infantry',level:4,side:'enemy',x:7,y:1,wuli:40,zhili:30,tongyu:50,aiType:0,color:'#9e443f',accent:'#848c8a'}),
      U({id:'e4',originalId:292,name:'骑兵队',role:'前锋',className:'轻骑兵',troop:'cavalry',level:1,side:'enemy',x:7,y:4,wuli:50,zhili:30,tongyu:40,aiType:1,color:'#9e443f',accent:'#848c8a'}),
      U({id:'e5',originalId:293,name:'骑兵队',role:'前锋',className:'轻骑兵',troop:'cavalry',level:1,side:'enemy',x:5,y:4,wuli:50,zhili:30,tongyu:40,aiType:4,aiTarget:776,color:'#9e443f',accent:'#848c8a'}),
      U({id:'e6',originalId:274,name:'弓兵队',role:'前锋',className:'弓兵',troop:'archer',level:3,side:'enemy',x:0,y:4,wuli:40,zhili:50,tongyu:30,range:2,aiType:4,aiTarget:1026,color:'#9e443f',accent:'#848c8a'}),
      U({id:'e7',originalId:310,name:'贼兵队',role:'前锋',className:'山贼',troop:'bandit',level:2,side:'enemy',x:4,y:7,wuli:50,zhili:40,tongyu:30,aiType:4,aiTarget:2313,color:'#8d5038',accent:'#9b8f6b'}),
      U({id:'e8',originalId:311,name:'贼兵队',role:'前锋',className:'山贼',troop:'bandit',level:2,side:'enemy',x:6,y:3,wuli:50,zhili:40,tongyu:30,aiType:1,color:'#8d5038',accent:'#9b8f6b'}),
      U({id:'e9',originalId:328,name:'军乐队',role:'支援',className:'军乐队',troop:'support',level:3,side:'enemy',x:3,y:3,wuli:10,zhili:70,tongyu:10,aiType:4,aiTarget:520,color:'#9e443f',accent:'#c3a85d'})
    ]
  };
})();
