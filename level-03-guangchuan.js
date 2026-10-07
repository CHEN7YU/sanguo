(function () {
  // Chapter 1, Guangchuan route. Terrain and deployment are decoded from
  // HEXZMAP.R3 map 2 and SNR1D.R3 paragraph 3/4 in the user's original game.
  const encodedRows = [
    '0101010102020202020202020202070000000000',
    '0701010101010202020202020207000000000000',
    '0007010101010102020207000000000000070701',
    '0000000701010101010700000101000007010101',
    '0000000007010101000000010101070701010101',
    '0100000000000700000101010101000007010703',
    '0101070000000008070101010100001000030303',
    '0101010107000000000100000000030303030300',
    '0101010101000000000000000303030300000001',
    '0101010100100000000303030303000001010101',
    '0101010700000000030300000007010101010101'
  ];
  const terrainByCode=['plain','forest','hill','water','bridge','wall','city','grass','village','cliff','gate','rough','fence','fort','camp','supply','treasure','house','fire','muddyWater'];
  const width=20,height=11,terrainCodes=encodedRows.map(row=>row.match(/../g).map(hex=>parseInt(hex,16))),terrain=terrainCodes.map(row=>row.map(code=>terrainByCode[code]));
  window.LEVEL_03_GUANGCHUAN={
    id:'guangchuan',chapter:'第一章 · 界桥之战',name:'广川之战',width,height,terrain,terrainCodes,
    source:'用户原游戏 HEXZMAP.R3 / SNR1D.R3 / SNR1M.R3 / BAKDATA.R3 / MAIN.EXE',
    maxTurns:30,objective:'击退逢纪',defeat:'刘备撤退或超过30回合',objectiveUnitId:'fengji',originalRules:true,
    squareGrid:true,viewProjection:{x:.025,y:.17,dx:.05,dy:.077,rowShift:[0,0,0,0,0,0,-.02,-.06,-.10,-.04,0]},battlefieldArt:'assets/level-03/guangchuan-map-v1.webp',
    battleTrack:'assets/level-03/thousand-suns-dw7th-mix.opus',nextBattle:'第四战 · 巨鹿或清河',nextLevelId:'julu',
    environmentFx:{
      forestZones:[[.06,.08,.26,.18,.3],[.30,.04,.28,.16,1.7],[.48,.34,.20,.20,3.1],[.82,.18,.16,.15,4.9],[.05,.54,.18,.30,6.2],[.83,.71,.17,.22,7.6]],
      waterBands:[{from:[.34,.92],to:[.98,.45],bend:.075,width:.085,speed:.04,gaps:[]}]
    },
    intro:[
      {speaker:'关羽',text:'那是？兄长，像是袁绍军。'},
      {speaker:'逢纪',text:'刘备军竟从广川而来。列阵，不能让他们赶到界桥！'},
      {speaker:'刘备',text:'公孙瓒军情势危急。众人谨慎推进，先击退逢纪。'}
    ],
    events:{
      loot:{'15,6':{item:'bean',amount:1},'5,9':{gold:100}},
      duel:{
        attackerId:'guan',defenderId:'fengji',title:'关羽　VS　逢纪',kicker:'广川 · 阵前单挑',caption:'青龙偃月刀破敌阵',
        challenge:[{speaker:'关羽',text:'逢纪，可敢与关某一战！'},{speaker:'逢纪',text:'你叫什么名字？'}],
        aftermath:[{speaker:'逢纪',text:'原来是击退吕布军的关羽……我不是你的对手！'},{speaker:'关羽',text:'退兵吧，关某不追。'}],
        levelUp:{speaker:'军报',text:'关羽的等级上升了！'},
        confirmation:{speaker:'刘备',text:'云长取胜，逢纪军已经溃退。'},occupation:{speaker:'军报',text:'刘备军击退逢纪，占领广川。'}
      },
      normalVictory:[{speaker:'逢纪',text:'刘备军如此强悍，广川不能再守。全军撤退！'},{speaker:'刘备',text:'不要追击，尽快整顿部队，赶往界桥。'},{speaker:'军报',text:'刘备军击退逢纪，占领广川。'}],
      postVictory:[
        {speaker:'关羽',text:'敌人好像已经全部撤退。'},
        {speaker:'韩英',text:'刘使君，请留步。我是韩英，这位是郭适。愿随使君一同救援公孙将军。'},
        {speaker:'郭适',text:'我等愿效犬马之劳。'},
        {speaker:'军报',text:'韩英、郭适加入刘备军！'},
        {speaker:'简雍',text:'主公，我军力量更强了。事不宜迟，赶快去支援公孙瓒吧。'}
      ],
      battleReward:200
    },
    strategyAccess:{fengji:['fire'],jian:['fire']},
    ai:{strategyCooldown:4},
    units:[
      {id:'liu',originalId:0,name:'刘备',role:'我军主将',className:'短兵',troop:'infantry',level:1,side:'ally',x:18,y:0,hp:500,maxHp:500,morale:100,wuli:75,zhili:64,tongyu:91,strategy:17,maxStrategy:17,atk:265,def:287,move:4,critRate:.12,blockRate:.14,weapon:'佩剑',color:'#45a9cf',accent:'#e0ba59',carryover:true,defeatQuote:'汉室未兴……我怎能倒在这里……'},
      {id:'guan',originalId:1,name:'关羽',role:'别部司马',className:'轻骑兵',troop:'cavalry',level:2,side:'ally',x:17,y:0,hp:560,maxHp:560,morale:100,wuli:98,zhili:80,tongyu:100,strategy:24,maxStrategy:24,atk:422,def:312,move:6,critRate:.20,blockRate:.15,weapon:'青龙偃月刀',treasureItems:['qinglong'],color:'#3fa574',accent:'#cf4940',carryover:true,defeatQuote:'大哥……云长不能再护你周全了。'},
      {id:'zhang',originalId:2,name:'张飞',role:'别部司马',className:'轻骑兵',troop:'cavalry',level:2,side:'ally',x:19,y:0,hp:560,maxHp:560,morale:100,wuli:99,zhili:42,tongyu:83,strategy:12,maxStrategy:12,atk:417,def:276,move:6,critRate:.18,blockRate:.10,weapon:'蛇矛',treasureItems:['spear'],color:'#496fab',accent:'#d7aa52',carryover:true,defeatQuote:'可恨！俺还没杀尽这些逆贼……'},
      {id:'jian',originalId:82,name:'简雍',role:'幕僚',className:'弓兵',troop:'archer',level:3,side:'ally',x:19,y:1,hp:580,maxHp:580,morale:100,wuli:42,zhili:74,tongyu:36,strategy:24,maxStrategy:24,atk:260,def:283,move:4,range:2,critRate:.08,blockRate:.07,weapon:'角弓',color:'#4d8ca7',accent:'#d8bd70',carryover:true,defeatQuote:'主公……简雍暂且退下……'},
      {id:'fengji',originalId:54,name:'逢纪',role:'敌军主将',className:'短兵',troop:'infantry',level:6,side:'enemy',x:0,y:2,hp:750,maxHp:750,morale:100,wuli:54,zhili:82,tongyu:66,strategy:32,maxStrategy:32,atk:361,def:374,move:4,aiType:0,critRate:.10,blockRate:.11,weapon:'佩剑',color:'#9e443f',accent:'#d0ad5d',boss:true,defeatQuote:'刘备军如此强悍，广川不能再守。全军撤退！'},
      {id:'e1',originalId:256,name:'步兵队',role:'前锋',className:'短兵',troop:'infantry',level:4,side:'enemy',x:4,y:6,hp:650,maxHp:650,morale:100,wuli:40,zhili:30,tongyu:50,strategy:10,maxStrategy:10,atk:308,def:313,move:4,aiType:4,aiTarget:1543,color:'#9e443f',accent:'#848c8a'},
      {id:'e2',originalId:257,name:'步兵队',role:'前锋',className:'短兵',troop:'infantry',level:4,side:'enemy',x:7,y:7,hp:650,maxHp:650,morale:100,wuli:40,zhili:30,tongyu:50,strategy:10,maxStrategy:10,atk:308,def:313,move:4,aiType:1,color:'#9e443f',accent:'#848c8a'},
      {id:'e3',originalId:274,name:'弓兵队',role:'前锋',className:'弓兵',troop:'archer',level:3,side:'enemy',x:1,y:3,hp:580,maxHp:580,morale:100,wuli:40,zhili:50,tongyu:30,strategy:16,maxStrategy:16,atk:260,def:280,move:4,range:2,aiType:0,color:'#9e443f',accent:'#848c8a'},
      {id:'e4',originalId:292,name:'骑兵队',role:'前锋',className:'轻骑兵',troop:'cavalry',level:1,side:'enemy',x:9,y:8,hp:500,maxHp:500,morale:100,wuli:50,zhili:30,tongyu:40,strategy:8,maxStrategy:8,atk:290,def:220,move:6,aiType:1,color:'#9e443f',accent:'#848c8a'},
      {id:'e5',originalId:293,name:'骑兵队',role:'前锋',className:'轻骑兵',troop:'cavalry',level:1,side:'enemy',x:10,y:8,hp:500,maxHp:500,morale:100,wuli:50,zhili:30,tongyu:40,strategy:8,maxStrategy:8,atk:290,def:220,move:6,aiType:1,color:'#9e443f',accent:'#848c8a'},
      {id:'e6',originalId:310,name:'山贼队',role:'前锋',className:'山贼',troop:'bandit',level:3,side:'enemy',x:1,y:4,hp:620,maxHp:620,morale:100,wuli:50,zhili:40,tongyu:30,strategy:13,maxStrategy:13,atk:320,def:272,move:5,aiType:0,color:'#8d5038',accent:'#9b8f6b'},
      {id:'e7',originalId:311,name:'山贼队',role:'前锋',className:'山贼',troop:'bandit',level:2,side:'enemy',x:6,y:5,hp:580,maxHp:580,morale:100,wuli:50,zhili:40,tongyu:30,strategy:12,maxStrategy:12,atk:298,def:253,move:5,aiType:1,color:'#8d5038',accent:'#9b8f6b'},
      {id:'e8',originalId:312,name:'山贼队',role:'前锋',className:'山贼',troop:'bandit',level:2,side:'enemy',x:4,y:4,hp:580,maxHp:580,morale:100,wuli:50,zhili:40,tongyu:30,strategy:12,maxStrategy:12,atk:298,def:253,move:5,aiType:1,color:'#8d5038',accent:'#9b8f6b'}
    ]
  };
})();


