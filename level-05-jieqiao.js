(function(){
  const encodedRows=[
    '01010101010101010101020202020201010101070700000c0000000000000000','01010101010101010202020202020202020101010700000c0000000f0010000e',
    '07010101010101020202020202020202020202010700000c0000000000000000','00070701010102020202020202020202020202010700100c000e000e000e0000',
    '00000707010102020202020202020202010101010100000c0000000000000000','00000007010102020202020202020201010101010700000c0c0c0c0c00000c0c',
    '0000000701010202020202020101010101020201070000000000000000000000','0000000701010101020201010102020202020201070000000000000000000707',
    '0000000707010101010101020202020202020201070000000000000007070101','0000000707070707070702020202020202020201070000000000070101010101',
    '0000000007070707020202020202020202020201010700000000010101010101','0000000000070702020202020202020202020201010700000000070101010101',
    '0000000000000702020202020202020202020202010707000000000007010101','0000000000000702020202020202020202020202070707000000000000070101',
    '0000000000070707020202020202020202020202070707000000000000070101','000000000007070702020202020202020202020207070000000d000007070101',
    '0000000000070707070702020202020202020202070700000000000007070101','0000080000000707070707070707020202020202070700000000000701010101',
    '0303000000000000070707070707070702020707070000000000070101010101','0303030300000000000000000007070707070707000000000800010101010101',
    '0003030303030000000000000000000707070000000000000007010101010101','0000000003030300100000000000000000000000000000070707010101010101',
    '0707070000000303030000000000000d00000000000000070701010101010101','0101010707000303030000000000100000000000000707070701010101010101'
  ];
  const terrainByCode=['plain','forest','hill','water','bridge','wall','city','grass','village','cliff','gate','rough','fence','fort','camp','supply','treasure','house','fire','muddyWater'];
  const width=32,height=24,terrainCodes=encodedRows.map(row=>row.match(/../g).map(hex=>parseInt(hex,16))),terrain=terrainCodes.map(row=>row.map(code=>terrainByCode[code]));
  const bases={infantry:[40,40,500,50,4],archer:[30,40,500,40,4],cavalry:[60,30,500,60,6],bandit:[50,40,540,40,5],support:[20,30,400,40,5],transport:[20,30,400,40,5],martial:[60,40,500,50,5]};
  const stats=(troop,level,wuli,zhili,tongyu)=>{const[a,d,h,g,m]=bases[troop]||bases.infantry,morale=100;return{hp:h+g*(level-1),maxHp:h+g*(level-1),morale,atk:Math.floor((Math.floor(4000/(140-wuli))+a*2+morale)*(level+10)/10),def:Math.floor((Math.floor(4000/(140-tongyu))+d*2+morale)*(level+10)/10),move:m,strategy:Math.floor((level+10)*zhili*5/200),maxStrategy:Math.floor((level+10)*zhili*5/200)}};
  const U=data=>Object.assign(data,stats(data.troop,data.level,data.wuli,data.zhili,data.tongyu));
  const E=(id,originalId,name,role,troop,level,x,y,wuli,zhili,tongyu,extra={})=>U({id,originalId,name,role,className:{infantry:'短兵',archer:'弓兵',cavalry:'轻骑兵',transport:'运输队',support:'军乐队',bandit:'山贼'}[troop],troop,level,side:'enemy',x,y,wuli,zhili,tongyu,aiType:0,range:troop==='archer'?2:undefined,critRate:originalId<256?.1:undefined,blockRate:originalId<256?.1:undefined,weapon:troop==='archer'?'角弓':troop==='cavalry'?'长枪':'佩剑',color:'#9e443f',accent:troop==='support'||troop==='transport'?'#c3a85d':'#d0ad5d',...extra});
  function previousRoute(){const p=new URLSearchParams(location.search),explicit=p.get('jieqiaoRoute');if(['julu','qinghe'].includes(explicit))return explicit;try{const t=JSON.parse(localStorage.getItem('sanguozhi-zhaolie-campaign-v1')||'null');if(['julu','qinghe'].includes(t?.fromLevelId))return t.fromLevelId}catch{}return'qinghe'}
  const route=previousRoute();
  const heroes=[
    U({id:'liu',originalId:0,name:'刘备',role:'我军主将',className:'短兵',troop:'infantry',level:4,side:'ally',x:0,y:14,wuli:75,zhili:64,tongyu:91,critRate:.12,blockRate:.14,weapon:'佩剑',color:'#45a9cf',accent:'#e0ba59',carryover:true,defeatQuote:'汉室未兴……我怎能倒在这里……'}),
    U({id:'guan',originalId:1,name:'关羽',role:'别部司马',className:'轻骑兵',troop:'cavalry',level:5,side:'ally',x:2,y:14,wuli:98,zhili:80,tongyu:100,critRate:.20,blockRate:.15,weapon:'青龙偃月刀',treasureItems:['qinglong'],color:'#3fa574',accent:'#cf4940',carryover:true,defeatQuote:'大哥……云长不能再护你周全了。'}),
    U({id:'zhang',originalId:2,name:'张飞',role:'别部司马',className:'轻骑兵',troop:'cavalry',level:5,side:'ally',x:3,y:13,wuli:99,zhili:42,tongyu:83,critRate:.18,blockRate:.10,weapon:'蛇矛',treasureItems:['spear'],color:'#496fab',accent:'#d7aa52',carryover:true,defeatQuote:'可恨！俺还没杀尽这些逆贼……'}),
    U({id:'jian',originalId:82,name:'简雍',role:'幕僚',className:'弓兵',troop:'archer',level:5,side:'ally',x:1,y:13,wuli:42,zhili:74,tongyu:36,range:2,critRate:.08,blockRate:.07,weapon:'角弓',color:'#4d8ca7',accent:'#d8bd70',carryover:true,defeatQuote:'主公……简雍暂且退下……'}),
    U({id:'gongsun',originalId:12,name:'公孙瓒',role:'北平主将',className:'轻骑兵',troop:'cavalry',level:8,side:'guest',x:3,y:15,wuli:71,zhili:55,tongyu:67,aiType:1,critRate:.13,blockRate:.13,weapon:'长枪',color:'#6ab7c6',accent:'#d8bb69',defeatQuote:'北平将士……随我暂退！'}),
    U({id:'zhoubi',originalId:222,name:'周比',role:'北平援军',className:'弓兵',troop:'archer',level:7,side:'guest',x:6,y:14,wuli:66,zhili:53,tongyu:61,range:2,aiType:1,critRate:.10,blockRate:.09,weapon:'角弓',color:'#6ab7c6',accent:'#d8bb69',defeatQuote:'周比力尽……先退！'}),
    U({id:'chenjiang',originalId:227,name:'陈蒋',role:'北平先锋',className:'轻骑兵',troop:'cavalry',level:7,side:'guest',x:4,y:15,wuli:58,zhili:54,tongyu:53,aiType:1,critRate:.10,blockRate:.10,weapon:'长枪',color:'#6ab7c6',accent:'#d8bb69',defeatQuote:'太、太厉害了……'}),
    U({id:'zhaoyun',originalId:53,name:'赵云',role:'常山义士',className:'轻骑兵',troop:'cavalry',level:11,side:'reserve',x:-1,y:-1,wuli:98,zhili:84,tongyu:87,aiType:1,critRate:.20,blockRate:.17,weapon:'龙胆枪',color:'#7bbbd0',accent:'#e2d8b5',defeatQuote:'子龙尚能再战……暂退！'})
  ];
  const common=[
    E('yuanshao',9,'袁绍','敌军主将','infantry',13,25,15,58,47,71,{boss:true,critRate:.13,blockRate:.14,treasureItems:['qinggang','wuzi'],defeatQuote:'公孙瓒，我不会认输的！'}),
    E('tianfeng',49,'田丰','袁军军师','archer',8,26,16,45,90,88,{defeatQuote:'主公，胜负已分……先撤吧。'}),
    E('wenchou',52,'文丑','袁军猛将','cavalry',10,4,16,91,19,86,{critRate:.18,blockRate:.13,defeatQuote:'噢！这次也败了……'}),
    E('chenlin',98,'陈琳','袁军运输','transport',8,15,23,23,80,55,{defeatQuote:'军资难保……陈琳先退！'}),
    E('guotu',92,'郭图','袁军将领','infantry',7,27,3,34,76,31,{defeatQuote:'粮仓有失，战局不利……撤！'}),
    E('e1',256,'步兵队','后军','infantry',5,28,6,40,30,50),E('e2',257,'步兵队','后军','infantry',5,29,6,40,30,50),
    E('cav1',292,'骑兵队','前军','cavalry',3,15,21,50,30,40),E('cav2',293,'骑兵队','前军','cavalry',3,5,19,50,30,40)
  ];
  const qingheSurvivors=[
    E('jushou',50,'沮授','袁军谋士','archer',8,7,17,60,85,71,{defeatQuote:'界桥阵势已破……沮授无颜见主公。'}),E('jiaochu',138,'焦触','袁军将领','archer',7,25,16,65,34,61,{defeatQuote:'敌势已近本阵……焦触先退！'}),
    E('zhanghe',102,'张郃','袁军名将','cavalry',10,23,19,90,62,88,{critRate:.16,blockRate:.15,defeatQuote:'界桥再败……张郃惭愧！'}),E('yanliang',51,'颜良','袁军猛将','cavalry',10,25,19,87,32,84,{critRate:.17,blockRate:.12,defeatQuote:'可恶！颜良改日再战！'}),
    E('shenpei',91,'审配','袁军参军','infantry',7,24,16,71,67,73,{defeatQuote:'此战失算……撤回袁公身边！'}),E('fengji',54,'逢纪','袁军将领','infantry',8,6,18,54,82,66,{defeatQuote:'又是刘备军……撤！'}),
    E('gaolan',103,'高览','袁军将领','archer',7,9,18,75,50,72,{aiType:1,defeatQuote:'刘备军势盛……高览先退！'}),E('archer1',274,'弓兵队','前军','archer',3,8,19,40,50,30,{aiType:1}),
    E('band1',328,'军乐队','支援','support',5,7,20,20,70,35,{aiType:1}),E('band2',329,'军乐队','支援','support',5,16,22,20,70,35)
  ];
  const juluSurvivors=[
    E('jushou',50,'沮授','袁军谋士','archer',8,7,20,60,85,71,{defeatQuote:'界桥阵势已破……沮授无颜见主公。'}),E('jiaochu',138,'焦触','袁军将领','archer',7,14,22,65,34,61,{defeatQuote:'敌势已近本阵……焦触先退！'}),
    E('quyi',60,'麴义','袁军名将','cavalry',10,25,19,73,39,65,{critRate:.15,blockRate:.13,defeatQuote:'竟又败在刘备军手里……撤！'}),E('zhangnan',139,'张南','袁军将领','archer',7,9,18,56,46,47,{aiType:1,defeatQuote:'张南难挡援军，先退！'}),
    E('chenzhen',56,'陈震','袁军将领','infantry',7,24,16,35,65,32,{defeatQuote:'敌军来势太猛……撤！'}),E('xuyou',55,'许攸','袁军参军','support',7,25,16,45,61,40,{defeatQuote:'形势不妙，许攸先走一步！'}),
    E('bandit1',310,'贼兵','前军','bandit',6,8,19,50,40,30,{aiType:1}),E('band1',328,'军乐队','支援','support',5,10,17,20,70,35)
  ];
  window.LEVEL_05_JIEQIAO={
    id:'jieqiao',chapter:'第一章 · 界桥之战',name:'界桥之战',width,height,terrain,terrainCodes,routeVariant:route,
    source:'用户原游戏 HEXZMAP.R3 map 6 / SNR1D.R3 paragraph 15 / MAIN.EXE',maxTurns:40,
    objective:'击退袁绍，或由刘备夺取袁军兵粮库',defeat:'刘备撤退或超过40回合',objectiveUnitId:'yuanshao',originalRules:true,
    squareGrid:true,structuresBakedIntoArt:false,viewProjection:{x:1/64,y:1/48,dx:1/32,dy:1/24,rowShift:Array(24).fill(0)},battlefieldArt:'assets/level-05-jieqiao/jieqiao-map-v3.webp',nextBattle:'第六战 · 北海之战',
    alternateVictory:{unitId:'liu',x:27,y:1,exp:50,goldReward:200,type:'supply',label:'夺取袁绍兵粮库',log:'刘备夺取袁绍兵粮库，全体存活我军获得经验50'},
    openingDuelSequence:[
      {winnerId:'wenchou',loserId:'chenjiang',loserDefeated:true,title:'文丑　VS　陈蒋',kicker:'界桥 · 袁军突击',caption:'文丑阵前击破陈蒋',challenge:[{speaker:'袁绍',text:'敌军已经不堪一击。文丑！去取公孙瓒的首级！'},{speaker:'文丑',text:'我乃文丑，公孙瓒，明年的今天就是你的忌日！'},{speaker:'陈蒋',text:'主公，这里交给我吧。文丑，来受死！'}],exchange:[{speaker:'陈蒋',text:'太、太厉害了……'},{speaker:'文丑',text:'哈哈哈，凭你这点本事也想赢我！'}]},
      {winnerId:'zhaoyun',loserId:'wenchou',loserDefeated:false,spawnWinner:{side:'guest',x:0,y:17},moveLoser:{x:15,y:22},title:'赵云　VS　文丑',kicker:'界桥 · 白马救主',caption:'赵云挺枪救公孙瓒',challenge:[{speaker:'文丑',text:'公孙瓒，哪里走！纳命来！'},{speaker:'公孙瓒',text:'看来我命到此休矣！'},{speaker:'赵云',text:'等一下，这次我来战你。'},{speaker:'文丑',text:'和公孙瓒一起作我枪下之鬼吧！'}],exchange:[{speaker:'文丑',text:'好厉害！先撤吧！'},{speaker:'公孙瓒',text:'刚才差一点没了命，真是太感谢你了。请问大名？'},{speaker:'赵云',text:'我叫赵云。以前曾跟随袁绍，看透了他既不忠君，也不爱惜百姓。'},{speaker:'公孙瓒',text:'你能不能帮助我？'},{speaker:'赵云',text:'好！'}]}
    ],
    intro:[{speaker:'公孙瓒',text:'那支军队是？'},{speaker:'赵云',text:'那是平原刘备的援军。诸位，援军到了！'},{speaker:'关羽',text:'大哥，好像赶上了。'},{speaker:'刘备',text:'听说伯圭兄正在苦战，我特地从平原赶来助战。'},{speaker:'张飞',text:'大哥，敌军强大，我们去袭击敌人的粮仓吧。'},{speaker:'田丰',text:'主公，刘备军来了。'},{speaker:'袁绍',text:'好，一起杀死他们祭旗！'}],
    areaEvents:[
      {id:'jieqiao-front-reacts',rect:{x1:17,y1:10,x2:23,y2:15},dialogue:[{speaker:'田丰',text:'主公，敌军兵力虽少，却已经接近中军。'}],aiUpdates:[{unitId:'yuanshao',aiType:4,aiTarget:0},{unitId:'tianfeng',aiType:4,aiTarget:0},{unitId:'yanliang',aiType:4,aiTarget:0},{unitId:'zhanghe',aiType:4,aiTarget:0},{unitId:'quyi',aiType:4,aiTarget:0},{unitId:'chenlin',aiType:1,aiTarget:0},{unitId:'jiaochu',aiType:1,aiTarget:0},{unitId:'cav1',aiType:1,aiTarget:0},{unitId:'band1',aiType:1,aiTarget:0}],log:'刘备军逼近中军，袁绍军阵线开始前移'},
      {id:'jieqiao-granary-reacts',unitId:'liu',rect:{x1:23,y1:6,x2:29,y2:9},dialogue:[{speaker:'郭图',text:'主公，刘备正向兵粮库逼近！'}],aiUpdates:[{unitId:'yuanshao',aiType:3,aiTarget:0},{unitId:'tianfeng',aiType:3,aiTarget:0},{unitId:'jushou',aiType:3,aiTarget:0},{unitId:'jiaochu',aiType:3,aiTarget:0},{unitId:'yanliang',aiType:3,aiTarget:0},{unitId:'zhanghe',aiType:3,aiTarget:0},{unitId:'quyi',aiType:3,aiTarget:0}],log:'刘备逼近兵粮库，袁绍中军开始追击'}
    ],
    environmentFx:{forestZones:[[0,0,.23,.37,.4],[.58,0,.18,.55,1.7],[.74,.62,.26,.38,2.7]],waterBands:[{from:[0,.77],to:[.20,1],bend:.03,width:.06,speed:.035,gaps:[]}]},
    events:{
      loot:{'8,21':{item:'fireScroll',amount:1},'22,3':{treasureId:'longSpear'},'14,23':{item:'wheat',amount:1},'29,1':{treasureId:'repeatingCrossbow'}},supply:{item:'wheat'},
      duel:{attackerId:'zhang',defenderId:'wenchou',endsBattle:false,title:'张飞　VS　文丑',kicker:'界桥 · 阵前再战',caption:'丈八蛇矛逼退河北文丑',challenge:[{speaker:'文丑',text:'刚才因大意受挫，这次不会了，要让你们看看我的厉害！'},{speaker:'张飞',text:'还有没有稍微有点骨气的？俺跟你玩玩！'}],exchange:[{speaker:'张飞',text:'怎么如此不中用，没意思！'},{speaker:'文丑',text:'不，不应该这么不争气！'},{speaker:'张飞',text:'你回去吧，俺懒得和你交手。'},{speaker:'文丑',text:'噢噢！刚才败了，这次也败了！'}],levelUp:{speaker:'军报',text:'张飞等级上升了！'},confirmation:{speaker:'刘备',text:'翼德取胜，继续向袁绍本阵推进。'},occupation:{speaker:'军报',text:'文丑败退，袁绍军前锋动摇。'}},
      normalVictory:[{speaker:'袁绍',text:'刘备这个混账！我不会善罢甘休。全军撤退！'},{speaker:'军报',text:'界桥之战，公孙瓒军取得胜利。'}],
      alternateVictory:[{speaker:'刘备',text:'好！我们夺取了袁绍的兵粮库。'},{speaker:'郭图',text:'这样袁绍军就没有粮食了！'},{speaker:'军报',text:'袁绍军失去兵粮，被迫撤退。'}],
      postVictory:[{speaker:'公孙瓒',text:'刘备，你来得正好。这次多亏你来帮我们。'},{speaker:'军报',text:'战后，赵云将正式与刘备相识。'}],battleReward:200
    },
    ai:{strategyCooldown:6},units:[...heroes,...common,...(route==='julu'?juluSurvivors:qingheSurvivors)]
  };
})();
