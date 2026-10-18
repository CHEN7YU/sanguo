(function(){
  // 原作 HEXZMAP.R3 section 9：显示层 48×32，战术层 24×16。
  const encodedRows=[
    '070707020202020202020202010101010101010101010107',
    '070707020202020202020202020101010101010107070700',
    '000002020202020202020202020101010101010707000000',
    '030300020202020202020202020701010101010700000000',
    '030303070702020202020202070701010101010708000007',
    '000003030707070202020207070707010101070000000707',
    '000000030303030307070707070707070707000000000701',
    '000000000000030303000000070707070000000007070701',
    '000000000000000303030000000000000000000707010101',
    '0c0c0c0c0c00000000040000000000080000070701010101',
    '00000e000c00000000030300000000000007070101010102',
    '0e0000000c00000000030303030000000007010101020202',
    '000e00000000000000000303030000000707070202020202',
    '000000000000000000000000040000000707020202020202',
    '000e00000c00000707000000030300000702020202020202',
    '00000e000c00070707070000030300000707020202020202'
  ];
  const terrainByCode=['plain','forest','hill','water','bridge','wall','city','grass','village','cliff','gate','rough','fence','fort','camp','supply','treasure','house','fire','muddyWater'];
  const width=24,height=16,terrainCodes=encodedRows.map(row=>row.match(/../g).map(hex=>parseInt(hex,16))),terrain=terrainCodes.map(row=>row.map(code=>terrainByCode[code]));
  const bases={infantry:[40,40,500,50,4],archer:[30,40,500,40,4],cavalry:[60,30,500,60,6],heavyCavalry:[70,40,600,70,6],support:[20,30,400,40,5],transport:[20,30,400,40,5]};
  const stats=(troop,level,wuli,zhili,tongyu)=>{const[a,d,h,g,m]=bases[troop]||bases.infantry,morale=100;return{hp:h+g*(level-1),maxHp:h+g*(level-1),morale,atk:Math.floor((Math.floor(4000/(140-wuli))+a*2+morale)*(level+10)/10),def:Math.floor((Math.floor(4000/(140-tongyu))+d*2+morale)*(level+10)/10),move:m,strategy:Math.floor((level+10)*zhili*5/200),maxStrategy:Math.floor((level+10)*zhili*5/200)}};
  const U=data=>Object.assign(data,stats(data.troop,data.level,data.wuli,data.zhili,data.tongyu));
  const classNames={infantry:'短兵',archer:'弓兵',cavalry:'轻骑兵',heavyCavalry:'重骑兵',support:'军乐队',transport:'运输队'};
  const E=(id,originalId,name,role,troop,level,x,y,wuli,zhili,tongyu,extra={})=>U({id,originalId,name,role,className:classNames[troop],troop,level,side:'enemy',x,y,wuli,zhili,tongyu,aiType:0,stationary:true,range:troop==='archer'?2:undefined,weapon:troop==='archer'?'角弓':troop==='cavalry'||troop==='heavyCavalry'?'长枪':troop==='support'?'鼓槌':troop==='transport'?'护身短刀':'环首刀',color:'#9e443f',accent:'#d0ad5d',...extra});
  const P=(x,y)=>x|(y<<8);
  const allies=[
    U({id:'liu',originalId:0,name:'刘备',role:'平原相',className:'短兵',troop:'infantry',level:11,side:'ally',x:21,y:4,wuli:75,zhili:64,tongyu:91,critRate:.12,blockRate:.14,weapon:'佩剑',color:'#45a9cf',accent:'#e0ba59',carryover:true,defeatQuote:'曹军未退，我岂能倒下！'}),
    U({id:'guan',originalId:1,name:'关羽',role:'别部司马',className:'轻骑兵',troop:'cavalry',level:12,side:'ally',x:19,y:6,wuli:98,zhili:80,tongyu:100,critRate:.20,blockRate:.15,weapon:'青龙偃月刀',treasureItems:['qinglong'],color:'#3fa574',accent:'#cf4940',carryover:true,defeatQuote:'兄长，云长暂退。'}),
    U({id:'zhang',originalId:2,name:'张飞',role:'别部司马',className:'轻骑兵',troop:'cavalry',level:12,side:'ally',x:19,y:7,wuli:99,zhili:42,tongyu:83,critRate:.18,blockRate:.10,weapon:'蛇矛',treasureItems:['spear'],color:'#496fab',accent:'#d7aa52',carryover:true,defeatQuote:'可恶！俺也去整顿兵马再来！'}),
    U({id:'jian',originalId:82,name:'简雍',role:'幕僚',className:'弓兵',troop:'archer',level:10,side:'ally',x:21,y:6,wuli:42,zhili:74,tongyu:36,range:2,critRate:.08,blockRate:.07,weapon:'角弓',color:'#4d8ca7',accent:'#d8bd70',carryover:true,defeatQuote:'主公，简雍先退一步……'}),
    U({id:'zhaoyun',originalId:53,name:'赵云',role:'常山义士',className:'轻骑兵',troop:'cavalry',level:13,side:'ally',x:20,y:7,wuli:98,zhili:84,tongyu:87,critRate:.20,blockRate:.17,weapon:'龙胆枪',color:'#7bbbd0',accent:'#e2d8b5',carryover:true,defeatQuote:'主公，子龙暂且退下！'})
  ];
  const guests=[
    U({id:'tao',originalId:15,name:'陶谦',role:'徐州牧',className:'短兵',troop:'infantry',level:11,side:'guest',x:23,y:2,wuli:53,zhili:61,tongyu:42,aiType:1,critRate:.08,blockRate:.10,weapon:'佩剑',color:'#6ab7c6',accent:'#d8bb69',defeatQuote:'徐州百姓……老夫有负所托。'}),
    U({id:'sunqian',originalId:63,name:'孙乾',role:'徐州从事',className:'运输队',troop:'transport',level:8,side:'guest',x:20,y:3,wuli:38,zhili:74,tongyu:34,aiType:1,critRate:.08,blockRate:.08,weapon:'护身短刀',color:'#6ab7c6',accent:'#d8bb69',carryover:true,defeatQuote:'小沛未定……孙乾先退一步。'}),
    U({id:'mifang',originalId:81,name:'糜芳',role:'徐州将领',className:'短兵',troop:'infantry',level:8,side:'guest',x:20,y:5,wuli:63,zhili:25,tongyu:59,aiType:1,critRate:.10,blockRate:.10,weapon:'环首刀',color:'#6ab7c6',accent:'#d8bb69',defeatQuote:'主公，糜芳守不住了！'})
  ];
  const enemies=[
    E('caocao',8,'曹操','曹军主将','cavalry',23,1,13,72,92,98,{className:'重骑兵',boss:true,critRate:.18,blockRate:.18,defeatQuote:'陈留危急……今日暂且放过刘备！'}),
    E('xunyu',68,'荀彧','曹军军师','support',14,0,14,32,95,73,{critRate:.08,blockRate:.10,defeatQuote:'主公，此地不宜久留。'}),
    E('guojia',61,'郭嘉','曹军军师','archer',13,4,8,36,97,32,{range:2,critRate:.10,blockRate:.08,defeatQuote:'此势不利，奉孝先退一步。'}),
    E('xiahoudun',16,'夏侯惇','曹军猛将','cavalry',14,2,13,92,64,82,{critRate:.18,blockRate:.15,defeatQuote:'孟德，我先退下！'}),
    E('xiahouyuan',17,'夏侯渊','曹军猛将','cavalry',14,0,12,90,52,86,{critRate:.18,blockRate:.14,defeatQuote:'这张飞好生厉害……暂且退兵！'}),
    E('lidian',115,'李典','曹军将领','infantry',14,3,12,72,47,73,{critRate:.13,blockRate:.13,defeatQuote:'敌军顽强，李典暂退！'}),
    E('yuejin',217,'乐进','曹军先锋','cavalry',13,7,10,74,39,74,{aiType:1,stationary:false,critRate:.15,blockRate:.11,defeatQuote:'乐进先退，来日再战！'}),
    E('yujin',62,'于禁','曹军将领','infantry',14,8,14,60,52,62,{aiType:1,stationary:false,critRate:.14,blockRate:.15,defeatQuote:'于禁暂退！'}),
    E('caohong',19,'曹洪','曹军将领','infantry',14,5,13,74,47,74,{critRate:.14,blockRate:.12,defeatQuote:'可恶，竟被刘备军压住了！'}),
    E('infantry1',256,'步兵队','曹军步兵','infantry',10,10,14,60,40,55,{aiType:1,stationary:false}),
    E('infantry2',257,'步兵队','曹军步兵','infantry',10,6,9,60,40,55,{aiType:1,stationary:false}),
    E('infantry3',258,'步兵队','曹军步兵','infantry',10,6,14,60,40,55),
    E('archer1',274,'弓兵队','曹军弓手','archer',10,6,11,52,48,45,{aiType:1,stationary:false,range:2}),
    E('archer2',275,'弓兵队','曹军弓手','archer',9,9,13,50,46,44,{aiType:1,stationary:false,range:2}),
    E('archer3',276,'弓兵队','曹军弓手','archer',9,2,11,50,46,44,{range:2}),
    E('cavalry1',292,'骑兵队','曹军骑兵','cavalry',10,7,15,68,32,58,{aiType:1,stationary:false}),
    E('cavalry2',293,'骑兵队','曹军骑兵','cavalry',10,3,15,68,32,58),
    E('cavalry3',294,'骑兵队','曹军骑兵','cavalry',9,1,14,66,30,56),
    E('support1',328,'军乐队','曹军军乐','support',10,7,12,24,70,46,{aiType:1,stationary:false}),
    E('support2',329,'军乐队','曹军军乐','support',10,0,10,24,70,46),
    E('transport1',348,'运输队','曹军运输队','transport',10,1,10,28,64,48),
    E('transport2',349,'运输队','曹军运输队','transport',9,1,15,28,62,46)
  ];
  window.LEVEL_08_XIAOPEI={
    id:'xiaopei',chapter:'第一章 · 支援北海、徐州',name:'小沛之战',width,height,terrain,terrainCodes,
    source:'用户原游戏 HEXZMAP.R3 section 9 / SNR1D.R3 page 1 paragraph 7 / BAKDATA.R3',maxTurns:30,
    objective:'击退曹操军；第10回合曹军因陈留遇袭撤退',defeat:'刘备撤退或超过30回合',objectiveUnitId:'caocao',victoryCondition:'eliminateAllEnemies',originalRules:true,squareGrid:true,structuresBakedIntoArt:true,
    viewProjection:{x:1/48,y:1/32,dx:1/24,dy:1/16,rowShift:Array(16).fill(0)},battlefieldArt:'assets/level-08-xiaopei/xiaopei-map-v2.webp',structureOverlayTiles:['20,4','15,9'],
    paintedTerrainOverrides:[
      {x:7,y:8,type:'plain'},{x:8,y:8,type:'bridge'},{x:9,y:8,type:'bridge'},{x:9,y:9,type:'plain'},
      {x:10,y:9,type:'water'},{x:11,y:9,type:'water'},{x:9,y:10,type:'forest'},{x:11,y:10,type:'water'},
      {x:9,y:11,type:'forest'},{x:10,y:12,type:'forest'},
      {x:11,y:13,type:'plain'},{x:12,y:13,type:'bridge'},{x:12,y:12,type:'bridge'},{x:13,y:12,type:'plain'},{x:13,y:13,type:'hill'}
    ],nextLevelId:'taishan',nextBattle:'泰山之战',
    intro:[{speaker:'曹操',text:'刘备小儿，与我仇敌为友，我绝不宽恕你。杀尽刘备军！'}],
    timedEvents:[
      {turn:4,once:'xiaopei-turn4',musicId:11,activateUnitIds:['guojia','lidian','caohong','infantry3','archer3','cavalry2'],dialogue:[{speaker:'曹操',text:'哼，这种战斗力还能打仗吗？再狠狠地给我杀！'}]},
      {turn:8,once:'xiaopei-turn8',musicId:11,activateUnitIds:['caocao','xunyu','xiahoudun','xiahouyuan','cavalry3','support2','transport1','transport2'],dialogue:[{speaker:'曹操',text:'不陪你们玩了，众将士，全面出击！'}]},
      {turn:10,once:'xiaopei-turn10-withdrawal',musicId:11,endBattleVariant:'withdrawal',dialogue:[{speaker:'曹操',text:'什么！陈留遭吕布偷袭！坏了，忘了吕布的事。唉，没办法，全军撤退！陶谦、刘备，暂且留着你们的命！'}]}
    ],
    environmentFx:{forestZones:[[.60,.0,.40,.34,.7],[.64,.63,.36,.37,1.8]],waterBands:[{from:[.0,.18],to:[1,.47],bend:.12,width:.07,speed:.035,gaps:[[.19,.24],[.57,.62]]}]},
    events:{
      duel:{attackerId:'zhang',defenderId:'xiahouyuan',endsBattle:false,musicId:12,title:'张飞　VS　夏侯渊',kicker:'小沛 · 蛇矛叫阵',caption:'张飞阵前击退夏侯渊',challenge:[{speaker:'张飞',text:'出来一战吧！废话少说！有胆子的出来！'},{speaker:'夏侯渊',text:'夏侯渊在此，休得猖狂！'}],exchange:[{speaker:'张飞',text:'看枪！'},{speaker:'夏侯渊',text:'唉，好厉害，胜不了他。'},{speaker:'张飞',text:'要逃吗？太狡猾了，干脆认输吧！'}],levelUp:{speaker:'军报',text:'张飞的等级上升了！'},confirmation:{speaker:'军报',text:'夏侯渊败退，战斗仍在继续。'},occupation:{speaker:'军报',text:'曹操军撤退了。'}},
      normalVictory:[{speaker:'曹操',text:'混蛋！再组织进攻！什么，陈留遭吕布偷袭？全军撤退！'},{speaker:'军报',text:'曹操军撤退了。'}],
      withdrawalVictory:[{speaker:'军报',text:'曹操军因陈留遇袭撤退了。'}],
      postVictory:[{speaker:'张飞',text:'咦？曹操怎么突然逃跑了？'}],
      postBattleStory:[{speaker:'陶谦',text:'刘备，这次你实在帮了大忙。'},{speaker:'刘备',text:'不，我们什么忙也没帮，只是曹操折回去了。'},{speaker:'陶谦',text:'谢谢，我想把小沛托给你治理。'},{speaker:'孙乾',text:'在下愿随刘使君前往小沛。'},{speaker:'军报',text:'孙乾正式加入刘备军。'}],
      victoryMusicId:7,battleReward:300,withdrawalReward:0
    },
    ai:{strategyCooldown:6},units:[...allies,...guests,...enemies]
  };
})();
