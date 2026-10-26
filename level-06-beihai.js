(function(){
  const encodedRows=[
    '060606060606050505050500030702020202020207070000','050506050505050505050500030007020202020207070000',
    '05050a050505050505050500030307020202020207000000','030304030303030303030303030300070202020700000000',
    '000000000000000000000000030303070202020700000000','000000000000000000000010000303000702070000000007',
    '000000000000000000000000000303030303000000000007','000000000007070707070000000700030303030000000007',
    '000000000707020202020707070101070003030000000007','000000000007020202020707010101010700030404030000',
    '000000000002020202020101010101010000030404030300','000000000007020202010101010101070000080000030303',
    '070207000000070707010101010107000000000000000303','020207000000000000010101070700000000070707000003',
    '020202070700000000070107070000000000070707070000','020202020207070700000000000000000707010101070707',
    '020202020202020207000000000000070701010101010107','020202020202020202020000001007010101010101010101',
    '020202020202020202020700000007010101010101010101','020202020202020202020707070701010101010101010101'
  ];
  const terrainByCode=['plain','forest','hill','water','bridge','wall','city','grass','village','cliff','gate','rough','fence','fort','camp','supply','treasure','house','fire','muddyWater'];
  const width=24,height=20,terrainCodes=encodedRows.map(row=>row.match(/../g).map(hex=>parseInt(hex,16))),terrain=terrainCodes.map(row=>row.map(code=>terrainByCode[code]));
  const bases={infantry:[40,40,500,50,4],archer:[30,40,500,40,4],cavalry:[60,30,500,60,6],bandit:[50,40,540,40,5],beast:[70,30,500,50,5]};
  const stats=(troop,level,wuli,zhili,tongyu)=>{const[a,d,h,g,m]=bases[troop]||bases.infantry,morale=100;return{hp:h+g*(level-1),maxHp:h+g*(level-1),morale,atk:Math.floor((Math.floor(4000/(140-wuli))+a*2+morale)*(level+10)/10),def:Math.floor((Math.floor(4000/(140-tongyu))+d*2+morale)*(level+10)/10),move:m,strategy:Math.floor((level+10)*zhili*5/200),maxStrategy:Math.floor((level+10)*zhili*5/200)}};
  const U=data=>Object.assign(data,stats(data.troop,data.level,data.wuli,data.zhili,data.tongyu));
  const E=(id,originalId,name,role,troop,level,x,y,wuli,zhili,tongyu,extra={})=>U({id,originalId,name,role,className:{infantry:'短兵',archer:'弓兵',cavalry:'轻骑兵',bandit:'山贼',beast:'猛兽兵团'}[troop],troop,level,side:'enemy',x,y,wuli,zhili,tongyu,aiType:0,range:troop==='archer'?2:undefined,weapon:troop==='archer'?'角弓':troop==='beast'?'驭兽鞭':'环首刀',color:'#9e443f',accent:'#d0ad5d',...extra});
  const P=(x,y)=>x|(y<<8);
  // The remastered background widened and shifted several bends of the
  // original river.  Keep the decoded original grid in `terrain`, then apply
  // these runtime-only overrides so every visibly wet square is impassable
  // and both painted bridges remain the only legal crossings.
  const paintedWater=[
    [12,0],[12,1],
    [0,2],[1,2],[3,2],[4,2],[5,2],[6,2],[7,2],[8,2],[9,2],[10,2],[11,2],[12,2],[13,2],
    [0,3],[1,3],[3,3],[4,3],[5,3],[6,3],[7,3],[8,3],[9,3],[10,3],[11,3],[12,3],[13,3],[14,3],
    [13,4],[14,4],[15,4],[16,4],[17,4],[18,4],[19,4],[14,5],[15,5],[16,5],[17,5],[18,5],[19,5],
    [18,6],[19,6],[20,6],[20,7],[20,8],[21,11],[22,11],[22,12],[23,12],[23,13],[23,14]
  ];
  const paintedBridges=[[2,3],[20,9],[21,9],[20,10],[21,10]];
  const paintedGround=[
    [12,4,'grass'],[13,5,'grass'],[13,6,'grass'],[14,6,'forest'],[15,6,'forest'],[16,6,'forest'],[17,6,'forest'],
    [15,7,'forest'],[16,7,'forest'],[17,7,'forest'],[18,7,'forest'],[17,8,'forest'],[18,8,'forest'],
    [18,9,'forest'],[19,9,'grass'],[18,10,'village'],[19,10,'grass'],[18,11,'grass'],[22,10,'grass'],[23,10,'grass'],[23,11,'grass'],
    [13,16,'treasure'],[13,17,'plain']
  ];
  const paintedTerrainOverrides=[
    ...paintedGround.map(([x,y,type])=>({x,y,type})),
    ...paintedWater.map(([x,y])=>({x,y,type:'water'})),
    ...paintedBridges.map(([x,y])=>({x,y,type:'bridge'}))
  ];
  const heroes=[
    U({id:'liu',originalId:0,name:'刘备',role:'平原相',className:'短兵',troop:'infantry',level:6,side:'ally',x:22,y:3,wuli:75,zhili:64,tongyu:91,critRate:.12,blockRate:.14,weapon:'佩剑',color:'#45a9cf',accent:'#e0ba59',carryover:true,defeatQuote:'北海尚未解围……我岂能倒在这里……'}),
    U({id:'guan',originalId:1,name:'关羽',role:'别部司马',className:'轻骑兵',troop:'cavalry',level:7,side:'ally',x:21,y:4,wuli:98,zhili:80,tongyu:100,critRate:.20,blockRate:.15,weapon:'青龙偃月刀',treasureItems:['qinglong'],color:'#3fa574',accent:'#cf4940',carryover:true,defeatQuote:'青龙刀尚在，云长来日再雪此耻！'}),
    U({id:'zhang',originalId:2,name:'张飞',role:'别部司马',className:'轻骑兵',troop:'cavalry',level:7,side:'ally',x:20,y:5,wuli:99,zhili:42,tongyu:83,critRate:.18,blockRate:.10,weapon:'蛇矛',treasureItems:['spear'],color:'#496fab',accent:'#d7aa52',carryover:true,defeatQuote:'可恶！俺也去整顿兵马再来！'}),
    U({id:'jian',originalId:82,name:'简雍',role:'幕僚',className:'弓兵',troop:'archer',level:6,side:'ally',x:22,y:5,wuli:42,zhili:74,tongyu:36,range:2,critRate:.08,blockRate:.07,weapon:'角弓',color:'#4d8ca7',accent:'#d8bd70',carryover:true,defeatQuote:'箭囊已空，宪和先护伤兵后撤！'}),
    U({id:'zhaoyun',originalId:53,name:'赵云',role:'常山义士',className:'轻骑兵',troop:'cavalry',level:9,side:'ally',x:21,y:2,wuli:98,zhili:84,tongyu:87,critRate:.20,blockRate:.17,weapon:'龙胆枪',color:'#7bbbd0',accent:'#e2d8b5',carryover:true,defeatQuote:'子龙护卫不周，请主公速整阵势！'})
  ];
  const guests=[
    U({id:'kongrong',originalId:7,name:'孔融',role:'北海太守',className:'短兵',troop:'infantry',level:8,side:'guest',x:3,y:0,wuli:58,zhili:83,tongyu:67,aiType:2,stationary:true,critRate:.10,blockRate:.10,weapon:'佩剑',color:'#6ab7c6',accent:'#d8bb69',defeatQuote:'北海百姓……孔融有负所托。'}),
    U({id:'taishici',originalId:149,name:'太史慈',role:'北海义士',className:'轻骑兵',troop:'cavalry',level:9,side:'guest',x:2,y:0,wuli:94,zhili:67,tongyu:81,aiType:2,stationary:true,critRate:.18,blockRate:.15,weapon:'长枪',color:'#6ab7c6',accent:'#d8bb69',defeatQuote:'慈未报北海之恩，岂能葬身此地！'}),
    U({id:'mengsu',originalId:233,name:'孟肃',role:'北海守军',className:'山贼',troop:'bandit',level:1,side:'guest',x:1,y:0,wuli:69,zhili:31,tongyu:52,aiType:2,stationary:true,critRate:.10,blockRate:.10,weapon:'环首刀',color:'#6ab7c6',accent:'#d8bb69',defeatQuote:'寨门交给诸位，孟肃去聚拢乡勇！'})
  ];
  const enemies=[
    E('guanhai',216,'管亥','黄巾首领','bandit',10,6,7,68,14,52,{boss:true,aiType:6,aiTarget:P(7,10),runtimeAiTarget:P(10,7),critRate:.16,blockRate:.12,weapon:'大刀',defeatQuote:'倒霉！你们再晚一点来，这个城就成我的了．'}),
    E('bandit1',310,'贼兵','攻城前锋','bandit',6,2,9,50,40,30,{aiType:6,aiTarget:P(9,15)}),
    E('bandit2',311,'贼兵','攻城前锋','bandit',6,3,8,50,40,30,{aiType:6,aiTarget:P(9,16)}),
    E('bandit3',312,'贼兵','攻城前锋','bandit',5,7,6,50,40,30,{aiType:6,aiTarget:P(8,10)}),
    E('bandit4',313,'贼兵','山贼','bandit',5,10,10,50,40,30),
    E('bandit5',314,'贼兵','山贼','bandit',6,10,12,50,40,30),
    E('bandit6',315,'贼兵','山贼','bandit',6,8,14,50,40,30),
    E('bandit7',316,'贼兵','山贼','bandit',5,18,11,50,40,30),
    E('bandit8',317,'贼兵','山贼','bandit',5,18,12,50,40,30),
    E('archer1',274,'弓兵队','攻城弓手','archer',6,1,7,40,50,30,{aiType:6,aiTarget:P(5,11)}),
    E('archer2',275,'弓兵队','攻城弓手','archer',6,9,7,40,50,30,{aiType:6,aiTarget:P(14,11)}),
    E('beast1',332,'猛兽师','黄巾驭兽师','beast',4,13,8,70,10,40,{aiType:6,aiTarget:P(17,11)}),
    E('beast2',333,'猛兽师','黄巾驭兽师','beast',4,6,12,70,10,40,{aiType:6,aiTarget:P(7,13)})
  ];
  window.LEVEL_06_BEIHAI={
    id:'beihai',chapter:'第一章 · 支援北海、徐州',name:'北海之战',width,height,terrain,terrainCodes,paintedTerrainOverrides,
    source:'用户原游戏 HEXZMAP.R3 section 7 / SNR1D.R3 page 1 paragraphs 0–3 / BAKDATA.R3',maxTurns:30,
    objective:'击退管亥',defeat:'刘备撤退或超过30回合',objectiveUnitId:'guanhai',originalRules:true,squareGrid:true,structuresBakedIntoArt:true,
    alliedAiAvoidsObjective:true,objectiveAiTargetsPlayerOnly:true,movementCostOverrides:{'13,16':1},
    viewProjection:{x:1/48,y:1/40,dx:1/24,dy:1/20,rowShift:Array(20).fill(0)},battlefieldArt:'assets/level-06-beihai/beihai-map-v1.webp',battleTrack:'assets/audio/hulao-lubu-theme.mp3',nextLevelId:'xuzhou',nextBattle:'第七战 · 徐州之战',
    intro:[{speaker:'管亥',text:'哈哈哈．这个城就等于到手了．混蛋们，把城里的金银财宝统统给我拿来．'}],
    areaEvents:[
      {id:'beihai-open-gate',rect:{x1:7,y1:9,x2:19,y2:14},dialogue:[{speaker:'太史慈',text:'主公，不知道来的是什么人，但我们现在应该杀出去配合他们．'},{speaker:'军报',text:'城门打开，孔融军杀了出去！'}],terrainUpdates:[{x:2,y:2,type:'plain'}],aiUpdates:[{unitId:'kongrong',aiType:1},{unitId:'taishici',aiType:1},{unitId:'mengsu',aiType:1}],log:'北海城门打开，孔融军开始主动出击'},
      {id:'beihai-premium-wine',rect:{x1:5,y1:11,x2:5,y2:11},item:'premiumWine',amount:1,log:'发现原作隐藏道具：特级酒'},
      {id:'beihai-morale-scroll',rect:{x1:17,y1:13,x2:17,y2:13},item:'moraleScroll',amount:1,log:'发现原作隐藏道具：平气书'}
    ],
    environmentFx:{forestZones:[[.28,.38,.39,.36,.8],[.53,.72,.35,.28,2.1]],waterBands:[{from:[.52,0],to:[.55,.68],bend:.05,width:.06,speed:.035,gaps:[[.12,.18],[.44,.51]]}]},
    events:{
      duel:{attackerId:'zhaoyun',defenderId:'guanhai',endsBattle:true,title:'赵云　VS　管亥',kicker:'北海 · 白马破贼',caption:'赵云阵斩管亥',challenge:[{speaker:'赵云',text:'那是山贼的大将，在刘备面前也显示一下我的本领．'},{speaker:'管亥',text:'我是管亥，让你去阴曹地府……'}],exchange:[{speaker:'管亥',text:'啊！'},{speaker:'赵云',text:'岂能宽容你这坑害百姓的草寇．'}],levelUp:{speaker:'军报',text:'赵云等级上升了！'},confirmation:{speaker:'军报',text:'赵云杀了管亥，刘备军打败了草寇．'},occupation:{speaker:'军报',text:'北海之围已解。'}},
      normalVictory:[{speaker:'管亥',text:'倒霉！你们再晚一点来，这个城就成我的了．'},{speaker:'军报',text:'刘备军打败了草寇．'}],
      postVictory:[{speaker:'太史慈',text:'虽素不相识，但深感大德，能否请教尊姓大名．'},{speaker:'刘备',text:'在下平原刘备。北海百姓无恙，便是此战最大的收获。'}],battleReward:300
    },
    ai:{strategyCooldown:6},units:[...heroes,...guests,...enemies]
  };
})();
