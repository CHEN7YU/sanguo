(function(){
  const encodedRows=[
    '000007070707070700000007070700000000070701010101010707070000',
    '000000070000000000000000000000000000070707010101070000000000',
    '090000000000000000000000000000000000000707010101070000000003',
    '090909000000000909090909090909090909000007070101070000030303',
    '090909090909090909090909090909090909000000000303030403030300',
    '090909090909090909090909090909090909000800030303030403000000',
    '090909090909090909090909090909090b00000003030300000000000000',
    '090909090909090909090909090900000000000003030000000000000000',
    '0909090909090909090909090b0000000000000003030701070000000505',
    '09090909090909090909090b000000030303030303000101010000000505',
    '09090909090909090b0b0b00000303030303030300070101010000000506',
    '0909090909090b0b00000000030303030000000000010101000000000506',
    '09090909090b0b0000000003030000000707000000000000000000000006',
    '0b0909090b0b000000000303030000000000000000000000000000000506',
    '000b0b0b0000000000000404000000000000070707070000000000000506',
    '000000000000000000000404000000000007010101070700000000000505',
    '000800000000000000030303000000070701010101010107070000000505',
    '000000000007070000030300000707010101010101010101070700000000'
  ];
  const terrainByCode=['plain','forest','hill','water','bridge','wall','city','grass','village','cliff','gate','rough','fence','fort','camp','supply','treasure','house','fire','muddyWater'];
  const width=30,height=18,terrainCodes=encodedRows.map(row=>row.match(/../g).map(hex=>parseInt(hex,16))),terrain=terrainCodes.map(row=>row.map(code=>terrainByCode[code]));
  const bases={infantry:[40,40,500,50,4],archer:[30,40,500,40,4],cavalry:[60,30,500,60,6],bandit:[50,40,540,40,5],support:[20,30,400,40,5],transport:[20,30,400,40,5],martial:[60,40,500,50,5]};
  const stats=(troop,level,wuli,zhili,tongyu)=>{const[a,d,h,g,m]=bases[troop]||bases.infantry,morale=100;return{hp:h+g*(level-1),maxHp:h+g*(level-1),morale,atk:Math.floor((Math.floor(4000/(140-wuli))+a*2+morale)*(level+10)/10),def:Math.floor((Math.floor(4000/(140-tongyu))+d*2+morale)*(level+10)/10),move:m,strategy:Math.floor((level+10)*zhili*5/200),maxStrategy:Math.floor((level+10)*zhili*5/200)}};
  const U=data=>Object.assign(data,stats(data.troop,data.level,data.wuli,data.zhili,data.tongyu));
  const classNames={infantry:'短兵',archer:'弓兵',cavalry:'轻骑兵',bandit:'山贼',support:'军乐队',transport:'运输队',martial:'武术家队'};
  const E=(id,originalId,name,role,troop,level,x,y,wuli,zhili,tongyu,extra={})=>U({id,originalId,name,role,className:classNames[troop],troop,level,side:'enemy',x,y,wuli,zhili,tongyu,aiType:0,range:troop==='archer'?2:undefined,weapon:troop==='archer'?'角弓':troop==='cavalry'?'长枪':troop==='martial'?'拳套':troop==='bandit'?'大刀':troop==='support'?'鼓槌':troop==='transport'?'护身短刀':'环首刀',color:'#9e443f',accent:'#d0ad5d',...extra});
  const P=(x,y)=>x|(y<<8);
  const heroes=[
    U({id:'liu',originalId:0,name:'刘备',role:'平原相',className:'短兵',troop:'infantry',level:7,side:'ally',x:3,y:16,wuli:75,zhili:64,tongyu:91,critRate:.12,blockRate:.14,weapon:'佩剑',color:'#45a9cf',accent:'#e0ba59',carryover:true,defeatQuote:'徐州百姓正等着我们……我不能倒下！'}),
    U({id:'guan',originalId:1,name:'关羽',role:'别部司马',className:'轻骑兵',troop:'cavalry',level:8,side:'ally',x:1,y:15,wuli:98,zhili:80,tongyu:100,critRate:.20,blockRate:.15,weapon:'青龙偃月刀',treasureItems:['qinglong'],color:'#3fa574',accent:'#cf4940',carryover:true,defeatQuote:'青龙刀尚在，云长来日再雪此耻！'}),
    U({id:'zhang',originalId:2,name:'张飞',role:'别部司马',className:'轻骑兵',troop:'cavalry',level:8,side:'ally',x:2,y:15,wuli:99,zhili:42,tongyu:83,critRate:.18,blockRate:.10,weapon:'蛇矛',treasureItems:['spear'],color:'#496fab',accent:'#d7aa52',carryover:true,defeatQuote:'可恶！俺也去整顿兵马再来！'}),
    U({id:'jian',originalId:82,name:'简雍',role:'幕僚',className:'弓兵',troop:'archer',level:7,side:'ally',x:2,y:16,wuli:42,zhili:74,tongyu:36,range:2,critRate:.08,blockRate:.07,weapon:'角弓',color:'#4d8ca7',accent:'#d8bd70',carryover:true,defeatQuote:'箭囊已空，宪和先护伤兵后撤！'}),
    U({id:'zhaoyun',originalId:53,name:'赵云',role:'常山义士',className:'轻骑兵',troop:'cavalry',level:13,side:'ally',x:2,y:17,wuli:98,zhili:84,tongyu:87,critRate:.20,blockRate:.17,weapon:'龙胆枪',color:'#7bbbd0',accent:'#e2d8b5',carryover:true,defeatQuote:'子龙护卫不周，请主公速整阵势！'})
  ];
  const guests=[
    U({id:'tao',originalId:15,name:'陶谦',role:'徐州牧',className:'短兵',troop:'infantry',level:10,side:'guest',x:29,y:12,wuli:53,zhili:61,tongyu:42,aiType:2,stationary:true,critRate:.08,blockRate:.10,weapon:'佩剑',color:'#6ab7c6',accent:'#d8bb69',defeatQuote:'徐州百姓……老夫有负所托。'}),
    U({id:'mifang',originalId:81,name:'糜芳',role:'徐州将领',className:'短兵',troop:'infantry',level:7,side:'guest',x:29,y:11,wuli:63,zhili:25,tongyu:59,aiType:2,stationary:true,critRate:.10,blockRate:.10,weapon:'环首刀',color:'#6ab7c6',accent:'#d8bb69',defeatQuote:'阵脚已乱，子方先收拢徐州兵！'}),
    U({id:'sunqian',originalId:63,name:'孙乾',role:'徐州从事',className:'运输队',troop:'transport',level:7,side:'guest',x:29,y:13,wuli:38,zhili:74,tongyu:34,aiType:2,stationary:true,critRate:.08,blockRate:.08,weapon:'护身短刀',color:'#6ab7c6',accent:'#d8bb69',defeatQuote:'粮车不可尽失，公祐先护军资后撤！'}),
    U({id:'taishici',originalId:149,name:'太史慈',role:'北海义士',className:'轻骑兵',troop:'cavalry',level:13,side:'reserve',x:-1,y:-1,wuli:94,zhili:67,tongyu:81,aiType:4,aiTarget:P(27,12),critRate:.18,blockRate:.15,weapon:'长枪',color:'#6ab7c6',accent:'#d8bb69',defeatQuote:'援军未至徐州……太史慈岂能倒下！'})
  ];
  const enemies=[
    E('yujin',62,'于禁','曹军主将','infantry',14,25,12,60,52,62,{boss:true,aiType:6,aiTarget:P(22,13),critRate:.14,blockRate:.15,defeatQuote:'关云长刀势沉猛，于禁整军后再战！'}),
    E('yuejin',217,'乐进','曹军先锋','cavalry',11,15,1,74,39,74,{aiType:3,critRate:.15,blockRate:.11,defeatQuote:'乐进冲阵未成，须去收拢先锋营！'}),
    E('lidian',115,'李典','曹军将领','infantry',11,26,9,72,47,73,{aiType:6,aiTarget:P(22,12),critRate:.13,blockRate:.13,defeatQuote:'李典判断失误，徐州援军比预想更快！'}),
    E('guojia',61,'郭嘉','曹军军师','archer',10,24,14,36,97,32,{aiType:6,aiTarget:P(21,15),range:2,critRate:.10,blockRate:.08,defeatQuote:'徐州之势已变，奉孝须回报孟德另定计策！'}),
    E('caohong',19,'曹洪','曹军将领','infantry',11,8,1,74,47,74,{aiType:1,critRate:.14,blockRate:.12,defeatQuote:'曹洪守不住这条路了，必须护住主公本阵！'}),
    E('xiahouyuan',17,'夏侯渊','曹军援将','cavalry',11,4,1,90,52,86,{aiType:4,aiTarget:P(27,12),critRate:.18,blockRate:.14,defeatQuote:'妙才疾行未能合围，回曹军右翼重整快骑！'}),
    E('infantry1',256,'步兵队','曹军步兵','infantry',7,5,0,60,40,55,{aiType:4,aiTarget:P(27,11)}),
    E('infantry2',257,'步兵队','曹军步兵','infantry',7,5,2,60,40,55,{aiType:3}),
    E('martial1',336,'武术家','曹军武术家','martial',7,25,14,72,28,65,{aiType:6,aiTarget:P(20,12)}),
    E('cavalry1',292,'骑兵队','曹军骑兵','cavalry',7,15,0,68,32,58,{aiType:3}),
    E('cavalry2',293,'骑兵队','曹军骑兵','cavalry',7,15,2,68,32,58,{aiType:3}),
    E('cavalry3',294,'骑兵队','曹军骑兵','cavalry',7,3,0,68,32,58,{aiType:1}),
    E('cavalry4',295,'骑兵队','曹军骑兵','cavalry',6,3,2,66,30,56,{aiType:1}),
    E('archer1',274,'弓兵队','曹军弓手','archer',7,7,0,52,48,45,{aiType:3,range:2}),
    E('transport1',348,'运输队','曹军运输队','transport',6,6,1,28,64,48,{aiType:4,aiTarget:P(27,10)}),
    E('bandit1',310,'贼兵','曹军杂兵','bandit',7,26,10,64,28,52,{aiType:6,aiTarget:P(20,14)}),
    E('support1',328,'军乐队','曹军军乐','support',7,25,16,24,70,46,{aiType:6,aiTarget:P(22,14)})
  ];
  window.LEVEL_07_XUZHOU={
    id:'xuzhou',chapter:'第一章 · 支援北海、徐州',name:'徐州之战',width,height,terrain,terrainCodes,
    source:'用户原游戏 HEXZMAP.R3 section 8 / SNR1D.R3 page 1 paragraph 5 / BAKDATA.R3',maxTurns:30,
    objective:'全歼曹操军，或令刘备进入徐州城',defeat:'刘备撤退或超过30回合',objectiveUnitId:'enemy-force',victoryCondition:'eliminateAllEnemies',originalRules:true,squareGrid:true,structuresBakedIntoArt:true,
    viewProjection:{x:1/60,y:1/36,dx:1/30,dy:1/18,rowShift:Array(18).fill(0)},battlefieldArt:'assets/level-07-xuzhou/xuzhou-map-v1.webp',structureOverlayTiles:['1,16'],nextBattle:'徐州战后抉择',
    paintedTerrainOverrides:[
      // The remastered painting moved the northern crossing and added the
      // clearly visible central bridge. Keep the extracted source grid above
      // intact, but make collision follow the bridge decks players can see.
      {x:25,y:4,type:'plain'},{x:25,y:5,type:'plain'},
      {x:27,y:3,type:'bridge'},{x:28,y:3,type:'bridge'},
      {x:27,y:4,type:'bridge'},{x:28,y:4,type:'bridge'},
      {x:20,y:8,type:'bridge'},{x:21,y:8,type:'bridge'},
      // The source tile sat one row above the village painted on this
      // remastered map. Move the interactive village onto its courtyard.
      {x:19,y:5,type:'plain'},{x:19,y:6,type:'village'}
    ],
    alternateVictory:{unitId:'liu',rect:{x1:28,y1:10,x2:29,y2:14},exp:50,goldReward:0,label:'刘备进入徐州城',log:'刘备进入徐州城，全体残存部队获得经验50'},
    intro:[{speaker:'于禁',text:'说什么？刘备攻过来了？有多少兵？……不好。一定设法等夏侯渊的到来。'}],
    timedEvents:[{turn:5,once:'xuzhou-taishici-turn5',unitId:'taishici',musicId:15,spawns:[{unitId:'taishici',side:'guest',x:6,y:17,aiType:4}],dialogue:[{speaker:'太史慈',text:'刘备，遵孔融之命，太史慈前来助你。'},{speaker:'军报',text:'太史慈前来支援！'}]}],
    environmentFx:{forestZones:[[.68,.05,.18,.23,.6],[.67,.48,.22,.42,1.8]],waterBands:[{from:[.99,.05],to:[.34,.98],bend:.12,width:.08,speed:.035,gaps:[[.09,.13],[.48,.54],[.82,.87]]}]},
    events:{
      duel:{attackerId:'guan',defenderId:'yujin',endsBattle:false,musicId:12,title:'关羽　VS　于禁',kicker:'徐州 · 青龙叫阵',caption:'青龙偃月刀压制于禁',challenge:[{speaker:'关羽',text:'我就是关羽关云长，有武将的话就出来。'},{speaker:'于禁',text:'曹军于禁在此，休得猖狂！'}],exchange:[{speaker:'关羽',text:'不愧是曹操的手下大将。只是凭你的武艺胜不了我。'},{speaker:'于禁',text:'关云长果然名不虚传……于禁暂且退兵！'}],levelUp:{speaker:'军报',text:'关羽的等级上升了！'},confirmation:{speaker:'军报',text:'于禁败退，战斗仍在继续。'},occupation:{speaker:'军报',text:'刘备军进入徐州城。'}},
      normalVictory:[{speaker:'张飞',text:'太棒了，大哥。'},{speaker:'军报',text:'刘备军打败了曹操军，进了徐州城。'}],
      alternateVictory:[{speaker:'陶谦',text:'好，放他进徐州城。大家不要打硬仗，退进城去。'},{speaker:'军报',text:'刘备军退进了徐州城内。'}],
      postVictory:[{speaker:'军报',text:'曹军仍在徐州境内集结。接下来必须决定迎战或议和。'}],
      postBattleStory:[
        {speaker:'曹操',text:'刘备竟已赶到徐州。传令各军暂退整顿，再图进取。'},
        {speaker:'郭嘉',text:'刘备得徐州人心，又有陶谦接应，此时强攻未必有利。'},
        {speaker:'陶谦',text:'玄德公冒险来援，徐州上下感激不尽。'},
        {speaker:'刘备',text:'曹军并未远去。应当早定方略，免使百姓再受兵灾。'},
        {speaker:'关羽',text:'兄长若要迎战，云长愿为先锋。'},
        {speaker:'张飞',text:'若要讲和，俺也去曹营走一遭！'},
        {speaker:'军报',text:'请选择下一步行动。'}
      ],victoryMusicId:16,battleReward:300
    },
    ai:{strategyCooldown:6},units:[...heroes,...guests,...enemies]
  };
})();
