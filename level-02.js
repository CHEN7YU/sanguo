(function () {
  // Directly decoded from section 2 of the user's HEXZMAP.R3.
  // Each pair is one original tactical terrain code; the grid is 16 × 24.
  const encodedRows = [
    '09090000000000000000000909090909',
    '09090505050000000505050909090909',
    '09090505050500050505050909090909',
    '09090505050500050505050909090909',
    '09090303030304030303030909090909',
    '09090000000000000000000909090909',
    '09090000000000000000000909090909',
    '09090007000000000000000009090909',
    '09090007070000000000000009090909',
    '0900070707070000000000000b0b0909',
    '0900070707070700000000000b100909',
    '000701010707070008000000000b0f09',
    '07070101010707070700000000000b09',
    '07010101010107070707070000000b0b',
    '01010101010101070707070000000000',
    '01010101010101070707070700000000',
    '01010101010101070707070700000000',
    '01010101010101070707070008000000',
    '01010101010101010707070000000000',
    '01010101010101010707000000000000',
    '01010101010101010107000000000000',
    '07010101010101010101070700000000',
    '07010101010101010101070707070000',
    '01010101010101010107070707070707'
  ];
  const terrainByCode = [
    'plain','forest','hill','water','bridge','wall','city','grass','village','cliff',
    'gate','rough','fence','fort','camp','supply','treasure','house','fire','muddyWater'
  ];
  const width = 16, height = 24;
  const terrainCodes = encodedRows.map(row => row.match(/../g).map(hex => parseInt(hex, 16)));
  const terrain = terrainCodes.map(row => row.map(code => terrainByCode[code]));
  // The remastered painting follows the original topology but gives the
  // broad river two visible rows and renders several rock faces explicitly.
  // Keep the decoded original grid above untouched for auditing; these
  // presentation overrides are the collision layer used at runtime so units,
  // AI and path previews cannot walk across painted water or high mountains.
  const paintedTerrainOverrides = [];
  for (const y of [4,5]) for (let x=0;x<width;x++) {
    paintedTerrainOverrides.push({x,y,type:x===6?'bridge':'water'});
  }
  const paintedCliffs = [
    [0,0],[1,0],[2,0],[3,0],[4,0],[5,0],[7,0],[8,0],[9,0],[10,0],[11,0],[12,0],[13,0],[14,0],[15,0],
    [0,1],[1,1],[2,1],[3,1],[4,1],[5,1],[7,1],[8,1],[9,1],[10,1],[11,1],[12,1],[13,1],[14,1],[15,1],
    [0,2],[1,2],[2,2],[3,2],[4,2],[5,2],[7,2],[8,2],[9,2],[10,2],[11,2],[12,2],[13,2],[14,2],[15,2],
    [0,3],[1,3],[2,3],[3,3],[10,3],[11,3],[12,3],[13,3],[14,3],[15,3],
    [0,6],[1,6],[15,6],[0,7],[1,7],[15,7],[0,8],[1,8],[4,8],[5,8],[15,8],
    [0,9],[1,9],[2,9],[15,9],[0,10],[1,10],[2,10],[15,10],[0,11],[1,11],[2,11],
    [0,12],[1,12],[2,12],[1,13],[2,13],[0,14],[1,14],[5,14],[0,15],[1,15],[5,15],
    [0,16],[1,16],[2,16],[5,16],[0,17],[1,17],[2,17],[5,17],[0,18],[1,18],[2,18],[7,18],
    [0,19],[1,19],[2,19],[3,19],[6,19],[0,20],[1,20],[2,20],[3,20],[6,20],[7,20],[8,20],
    [0,21],[1,21],[2,21],[5,21],[7,21],[0,22],[1,22],[2,22],[3,22],[5,22],
    [0,23],[1,23],[2,23],[3,23],[5,23],[6,23],[7,23]
  ];
  for (const [x,y] of paintedCliffs) paintedTerrainOverrides.push({x,y,type:'cliff'});

  window.LEVEL_02 = {
    id: 'hulao-pass', chapter: '序章', name: '虎牢关之战', width, height, terrain, terrainCodes,
    source: '用户原游戏 HEXZMAP.R3 / SNR0D.R3 / SNR0M.R3 / BAKDATA.R3 / MAIN.EXE',
    maxTurns: 30, objective: '击退吕布军', defeat: '刘备撤退或超过30回合',
    originalRules: true,
    marchHandledByStory: true,
    squareGrid: true,
    battlefieldArt: 'assets/hulao-remaster-v2.webp',
    paintedTerrainOverrides,
    environmentFx: {
      // Normalized against the painted battlefield.  These masks keep the
      // subtle motion on foliage and water instead of sliding the whole map.
      forestZones: [
        [.10,.03,.16,.08,.2], [.83,.05,.16,.10,1.4], [.12,.30,.16,.12,2.8],
        [.20,.48,.18,.17,4.1], [.34,.68,.22,.22,5.2], [.76,.53,.14,.12,6.1],
        [.88,.78,.11,.13,7.3]
      ],
      waterBands: [
        { from:[.02,.187], to:[.98,.187], bend:.006, width:.050, speed:.045, gaps:[[.375,.438]] },
        { from:[.02,.222], to:[.98,.222], bend:.005, width:.047, speed:.038, gaps:[[.375,.438]] }
      ]
    },
    battleTrack: 'assets/audio/hulao-lubu-theme.mp3',
    nextLevelId: 'guangchuan', nextBattle: '选择进军路线',
    marchDialogue: [
      { speaker:'关羽', text:'敌人好像逃到了前面的虎牢关。大哥，该怎么办？' },
      { speaker:'张飞', text:'说什么呀？现在当然是乘胜追击了，我去！' },
      { speaker:'关羽', text:'唉！追上去了，还是那么鲁莽。' },
      { speaker:'公孙瓒', text:'话不要这么说，我军士气也鼓舞起来了嘛。' },
      { speaker:'陶谦', text:'现在应该乘势攻下虎牢关。' },
      { speaker:'刘备', text:'没办法。好！跟上张飞，进军虎牢关！' }
    ],
    intro: [
      { speaker:'吕布', text:'什么？联军攻来了，还杀了华雄？好厉害，不过，他们的好运也就到此为止了。' },
      { speaker:'侯成', text:'吕布将军，现在让他们知道一下我军的厉害。' },
      { speaker:'吕布', text:'好，全军出击！联军，好好看看我的厉害。' },
      { speaker:'张飞', text:'主将何在？不能只让关羽逞雄风，我也要出风头。' },
      { speaker:'关羽', text:'这里好像是吕布把守。' },
      { speaker:'刘备', text:'是吕布，恐怕没有比他更可怕的敌人了。' },
      { speaker:'关羽', text:'吕布座下赤兔马，据说日行千里。' },
      { speaker:'张飞', text:'吕布算什么？让他看看我的厉害。' }
    ],
    timedEvents: [
      {
        turn:18, once:'lu-bu-advance', unitId:'lvbu', setAiType:1,
        dialogue:[{ speaker:'吕布', text:'哼！七拼八凑的部队还挺厉害，不过我可不会败给这些鼠辈，要让他们知道我的厉害。' }]
      }
    ],
    events: {
      treasure: { x:13, y:10, item:'fireScroll', amount:1 },
      supply: { x:14, y:11, item:'bean', amount:1 },
      duel: {
        attackerId:'zhang', defenderId:'lvbu',
        allyIds:['liu','guan','zhang'], resolution:'retreat',
        title:'三英　VS　吕布', kicker:'虎牢关 · 三英战吕布', caption:'双股剑 · 青龙偃月刀 · 丈八蛇矛',
        challenge: [
          { speaker:'张飞', text:'三姓家奴休走！燕人张飞在此！' },
          { speaker:'吕布', text:'无名之辈，也敢来送死？' }
        ],
        reinforcement: [
          { speaker:'关羽', text:'三弟休要独斗，我来助你！' },
          { speaker:'刘备', text:'二弟、三弟，我们合兵一处！' },
          { speaker:'张飞', text:'好！今日便叫他识得我兄弟三人的厉害！' }
        ],
        exchange: [
          { speaker:'吕布', text:'好一个刘关张！今日且让你们一阵，改日再战！' },
          { speaker:'张飞', text:'吕布休走！再战三百回合！' },
          { speaker:'关羽', text:'三弟莫追，虎牢关已破。' },
          { speaker:'刘备', text:'我兄弟同心，方能退此强敌。' }
        ],
        levelUp: { speaker:'军报', text:'张飞的等级上升了！' },
        aftermath: [{ speaker:'军报', text:'吕布突围撤退，守关敌军阵脚大乱。' }],
        occupation: { speaker:'军报', text:'吕布军撤退，刘备军占领虎牢关。' }
      },
      normalVictory: [
        { speaker:'吕布', text:'可恶！没办法，全军撤退。' },
        { speaker:'刘备', text:'太好了！我们打败了吕布。' },
        { speaker:'军报', text:'吕布军撤退，刘备军占领虎牢关。' }
      ],
      battleReward: 100
    },
    units: [
      {id:'liu',originalId:0,name:'刘备',role:'我军主将',className:'短兵',troop:'infantry',level:1,side:'ally',x:15,y:21,hp:500,maxHp:500,morale:100,wuli:75,zhili:64,tongyu:91,strategy:17,maxStrategy:17,atk:265,def:287,move:4,critRate:.12,blockRate:.14,weapon:'佩剑',color:'#45a9cf',accent:'#e0ba59',carryover:true,defeatQuote:'汉室未兴……我怎能倒在这里……'},
      {id:'guan',originalId:1,name:'关羽',role:'别部司马',className:'轻骑兵',troop:'cavalry',level:1,side:'ally',x:13,y:21,hp:500,maxHp:500,morale:100,wuli:98,zhili:80,tongyu:100,strategy:22,maxStrategy:22,atk:387,def:286,move:6,critRate:.20,blockRate:.15,color:'#3fa574',accent:'#cf4940',weapon:'青龙偃月刀',treasureItems:['qinglong'],carryover:true,defeatQuote:'大哥……云长不能再护你周全了。'},
      {id:'zhang',originalId:2,name:'张飞',role:'别部司马',className:'轻骑兵',troop:'cavalry',level:1,side:'ally',x:12,y:20,hp:500,maxHp:500,morale:100,wuli:99,zhili:42,tongyu:83,strategy:11,maxStrategy:11,atk:382,def:253,move:6,critRate:.18,blockRate:.10,color:'#496fab',accent:'#d7aa52',weapon:'蛇矛',treasureItems:['spear'],carryover:true,defeatQuote:'可恨！俺还没杀尽这些逆贼……'},
      {id:'gongsun',originalId:12,name:'公孙瓒',role:'友军',className:'轻骑兵',troop:'cavalry',level:4,side:'guest',x:14,y:18,hp:680,maxHp:680,morale:100,wuli:71,zhili:55,tongyu:67,strategy:19,maxStrategy:19,atk:387,def:299,move:6,critRate:.12,blockRate:.11,weapon:'长槊',color:'#6bbbd5',accent:'#e9d48c',carryover:true,defeatQuote:'白马义从……随我奋战至此，已无憾了……'},
      {id:'tao',originalId:15,name:'陶谦',role:'友军',className:'短兵',troop:'infantry',level:4,side:'guest',x:13,y:18,hp:650,maxHp:650,morale:100,wuli:53,zhili:61,tongyu:42,strategy:21,maxStrategy:21,atk:315,def:308,move:4,critRate:.06,blockRate:.13,weapon:'佩剑',color:'#70b8c8',accent:'#d9d1aa',carryover:true,defeatQuote:'徐州百姓……还望诸公多加照拂……'},
      {id:'lvbu',originalId:4,name:'吕布',role:'敌军主将',className:'轻骑兵',troop:'cavalry',level:6,side:'enemy',x:6,y:5,hp:800,maxHp:800,morale:100,wuli:100,zhili:21,tongyu:80,strategy:8,maxStrategy:8,atk:512,def:361,move:6,aiType:2,critRate:.22,blockRate:.15,weapon:'方天画戟',color:'#a62f32',accent:'#dbbb65',boss:true,stationary:true,defeatQuote:'可恶！没办法，全军撤退。'},
      {id:'zhangliao',originalId:79,name:'张辽',role:'并州军',className:'骑马短兵',troop:'infantry',mountedVisual:true,level:3,side:'enemy',x:3,y:7,hp:600,maxHp:600,morale:100,wuli:90,zhili:80,tongyu:87,strategy:26,maxStrategy:26,atk:338,def:331,move:4,aiType:0,critRate:.16,blockRate:.14,weapon:'长刀',color:'#9e443f',accent:'#8c8f92',defeatQuote:'今日之败，来日定当奉还……'},
      {id:'houcheng',originalId:80,name:'侯成',role:'并州军',className:'轻骑兵',troop:'cavalry',level:3,side:'enemy',x:6,y:8,hp:620,maxHp:620,morale:100,wuli:67,zhili:42,tongyu:65,strategy:13,maxStrategy:13,atk:356,def:276,move:6,aiType:0,critRate:.12,blockRate:.10,weapon:'长枪',color:'#9e443f',accent:'#8c8f92',defeatQuote:'吕将军……末将先退了……'},
      {id:'songxian',originalId:74,name:'宋宪',role:'并州军',className:'弓兵',troop:'archer',level:3,side:'enemy',x:10,y:8,hp:580,maxHp:580,morale:100,wuli:59,zhili:45,tongyu:50,strategy:14,maxStrategy:14,atk:271,def:291,move:4,range:2,aiType:0,critRate:.13,blockRate:.08,weapon:'角弓',color:'#9e443f',accent:'#8c8f92',defeatQuote:'虎牢关……竟也守不住吗……'},
      {id:'weixu',originalId:73,name:'魏续',role:'并州军',className:'短兵',troop:'infantry',level:2,side:'enemy',x:10,y:11,hp:550,maxHp:550,morale:100,wuli:72,zhili:46,tongyu:68,strategy:13,maxStrategy:13,atk:285,def:282,move:4,aiType:1,critRate:.13,blockRate:.11,weapon:'环首刀',color:'#9e443f',accent:'#8c8f92',defeatQuote:'可恨……联军竟有如此战力……'},
      {id:'e4',originalId:274,name:'弓兵队',role:'守军',className:'弓兵',troop:'archer',level:1,side:'enemy',x:8,y:8,hp:500,maxHp:500,morale:100,wuli:40,zhili:50,tongyu:30,strategy:13,maxStrategy:13,atk:220,def:237,move:4,range:2,aiType:0,weapon:'角弓',color:'#9e443f',accent:'#848c8a'},
      {id:'e5',originalId:275,name:'弓兵队',role:'前锋',className:'弓兵',troop:'archer',level:1,side:'enemy',x:5,y:11,hp:500,maxHp:500,morale:100,wuli:40,zhili:50,tongyu:30,strategy:13,maxStrategy:13,atk:220,def:237,move:4,range:2,aiType:1,weapon:'角弓',color:'#9e443f',accent:'#848c8a'}
    ]
  };
})();
