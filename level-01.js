(function () {
  // Directly decoded from the first section of the user's HEXZMAP.R3.
  // Each pair is one original tactical terrain code; the grid is 28 × 16.
  const encodedRows = [
    '09090909090909090909090909090909090900010101010101010003',
    '09090909090909090909090909090909090900070101010107000303',
    '09090909090909090909090909090909090900000101010700030303',
    '09090909090909090909090909090909090900000707000003030300',
    '09090505090909090909090909090909090b00000000000303030007',
    '0b0b05050909090909090909090909090b0000000303030300000000',
    '00000505000b0b09090b0b0b0f0b0b0b000000030303030000000000',
    '000005050000100b0b000b0b0b000000000003030000000000000000',
    '00000005000000000000000d00000000000303000000000000000007',
    '00000000000000000000000000000000000303080000000000070707',
    '00000005000000000000000000000000000400000000000007070101',
    '00000505000000000007070700000000030300000007070707070101',
    '09090505000000000707070000080003030300070101070707010101',
    '09090909090000000000070000000303000001010101010101010101',
    '09090909090909090000000000030303000701010101010101010101',
    '09090909090909090900000007030300070101010101010101010101'
  ];
  const terrainByCode = [
    'plain','forest','hill','water','bridge','wall','city','grass','village','cliff',
    'gate','rough','fence','fort','camp','supply','treasure','house','fire','muddyWater'
  ];
  const width = 28, height = 16;
  const terrainCodes = encodedRows.map(row => row.match(/../g).map(hex => parseInt(hex, 16)));
  const terrain = terrainCodes.map(row => row.map(code => terrainByCode[code]));

  window.LEVEL_01 = {
    id: 'sishui-pass', chapter: '序章', name: '汜水关之战', width, height, terrain, terrainCodes,
    source: '用户原游戏 HEXZMAP.R3 / SNR0D.R3 / SNR0M.R3 / BAKDATA.R3 / MAIN.EXE',
    maxTurns: 30, objective: '歼灭华雄', defeat: '刘备撤退或超过30回合',
    nextLevelId: 'hulao-pass', nextBattle: '虎牢关之战',
    originalRules: true,
    marchDialogue: [
      { speaker:'关羽', text:'敌人在汜水关，火速进军。' }
    ],
    // Opcode 0x00 points to a contiguous portrait-dialogue series in SNR0M.R3.
    intro: [
      { speaker:'华雄', text:'吃一次亏也不长一智，联军还来自找麻烦，是谁的部队？' },
      { speaker:'李肃', text:'主将好像是个叫刘备的人。' },
      { speaker:'华雄', text:'刘备？这个名字没听说过，为何叫这种无名鼠辈来。看不起我吗？' },
      { speaker:'李肃', text:'大概是联军没人了。' },
      { speaker:'华雄', text:'管他是谁，杀了他祭旗，众将士，出征迎敌。' },
      { speaker:'张飞', text:'大哥，我先活动一下身体吧。' },
      { speaker:'关羽', text:'大哥，这个交给我吧，我一定取华雄首级来见你。' }
    ],
    events: {
      treasure: { x:6, y:7, gold:100 },
      supply: { x:12, y:6, item:'bean', amount:1 },
      duel: {
        attackerId:'guan', defenderId:'hua', title:'关羽　VS　华雄', kicker:'阵前单挑', caption:'温酒未冷，青龙出鞘',
        challenge: [
          { speaker:'关羽', text:'对面的可是华雄，我要与你单挑！' },
          { speaker:'关羽', text:'接我一刀！' }
        ],
        aftermath: [
          { speaker:'华雄', text:'好厉害！' },
          { speaker:'华雄', text:'呀！失手了！' },
          { speaker:'关羽', text:'先割下华雄首级。' }
        ],
        levelUp: { speaker:'军报', text:'关羽的等级上升了！' },
        report: { speaker:'张飞', text:'大哥，关羽好像斩了华雄。' },
        confirmation: { speaker:'刘备', text:'嗯，我军胜利了。' },
        occupation: { speaker:'军报', text:'刘备军打败华雄军，占领汜水关。' }
      },
      normalVictory: [
        { speaker:'刘备', text:'我军胜利了。' },
        { speaker:'军报', text:'刘备军打败华雄军，占领汜水关。' }
      ],
      battleReward: 100
    },
    units: [
      {id:'liu',originalId:0,name:'刘备',role:'我军主将',className:'短兵',troop:'infantry',level:1,side:'ally',x:22,y:9,hp:500,maxHp:500,morale:100,wuli:75,zhili:64,tongyu:91,strategy:17,maxStrategy:17,atk:265,def:287,move:4,critRate:.12,blockRate:.14,weapon:'佩剑',color:'#45a9cf',accent:'#e0ba59',defeatQuote:'汉室未兴……我怎能倒在这里……'},
      {id:'guan',originalId:1,name:'关羽',role:'别部司马',className:'轻骑兵',troop:'cavalry',level:1,side:'ally',x:20,y:10,hp:500,maxHp:500,morale:100,wuli:98,zhili:80,tongyu:100,strategy:22,maxStrategy:22,atk:387,def:286,move:6,critRate:.20,blockRate:.15,color:'#3fa574',accent:'#cf4940',weapon:'青龙偃月刀',treasureItems:['qinglong'],defeatQuote:'大哥……云长不能再护你周全了。'},
      {id:'zhang',originalId:2,name:'张飞',role:'别部司马',className:'轻骑兵',troop:'cavalry',level:1,side:'ally',x:20,y:9,hp:500,maxHp:500,morale:100,wuli:99,zhili:42,tongyu:83,strategy:11,maxStrategy:11,atk:382,def:253,move:6,critRate:.18,blockRate:.10,color:'#496fab',accent:'#d7aa52',weapon:'蛇矛',treasureItems:['spear'],defeatQuote:'可恨！俺还没杀尽这些逆贼……'},
      {id:'gongsun',originalId:12,name:'公孙瓒',role:'友军',className:'轻骑兵',troop:'cavalry',level:4,side:'guest',x:16,y:7,hp:680,maxHp:680,morale:100,wuli:71,zhili:55,tongyu:67,strategy:19,maxStrategy:19,atk:387,def:299,move:6,critRate:.12,blockRate:.11,weapon:'长槊',color:'#6bbbd5',accent:'#e9d48c',defeatQuote:'白马义从……随我奋战至此，已无憾了……'},
      {id:'tao',originalId:15,name:'陶谦',role:'友军',className:'短兵',troop:'infantry',level:4,side:'guest',x:16,y:6,hp:650,maxHp:650,morale:100,wuli:53,zhili:61,tongyu:42,strategy:21,maxStrategy:21,atk:315,def:308,move:4,critRate:.06,blockRate:.13,weapon:'佩剑',color:'#70b8c8',accent:'#d9d1aa',defeatQuote:'徐州百姓……还望诸公多加照拂……'},
      {id:'hua',originalId:5,name:'华雄',role:'敌军主将',className:'轻骑兵',troop:'cavalry',level:5,side:'enemy',x:3,y:9,hp:740,maxHp:740,morale:100,wuli:90,zhili:29,tongyu:88,strategy:10,maxStrategy:10,atk:450,def:354,move:6,aiType:2,critRate:.18,blockRate:.14,weapon:'长刀',color:'#b94f43',accent:'#e2b659',boss:true,stationary:true,defeatQuote:'呀！失手了！'},
      {id:'li',originalId:20,name:'李肃',role:'西凉军',className:'弓兵',troop:'archer',level:2,side:'enemy',x:5,y:10,hp:540,maxHp:540,morale:100,wuli:54,zhili:68,tongyu:50,strategy:20,maxStrategy:20,atk:247,def:268,move:4,range:2,aiType:0,critRate:.15,blockRate:.10,weapon:'角弓',color:'#9e443f',accent:'#848c8a',defeatQuote:'大势已去……董相国，恕我不能复命……'},
      {id:'hu',originalId:21,name:'胡轸',role:'西凉军',className:'短兵',troop:'infantry',level:2,side:'enemy',x:4,y:9,hp:550,maxHp:550,morale:100,wuli:58,zhili:30,tongyu:37,strategy:9,maxStrategy:9,atk:273,def:261,move:4,aiType:0,critRate:.12,blockRate:.13,weapon:'环首刀',color:'#a8403d',accent:'#9ca7a5',defeatQuote:'汜水关……竟守不住了……'},
      {id:'zhao',originalId:27,name:'赵岑',role:'西凉军',className:'短兵',troop:'infantry',level:2,side:'enemy',x:6,y:9,hp:550,maxHp:550,morale:100,wuli:63,zhili:25,tongyu:57,strategy:7,maxStrategy:7,atk:277,def:273,move:4,aiType:0,critRate:.13,blockRate:.11,weapon:'长枪',color:'#a8403d',accent:'#d2a65b',defeatQuote:'华将军……末将先走一步……'},
      {id:'e1',originalId:256,name:'步兵队',role:'前锋',className:'短兵',troop:'infantry',level:1,side:'enemy',x:11,y:8,hp:500,maxHp:500,morale:100,wuli:40,zhili:30,tongyu:50,strategy:8,maxStrategy:8,atk:242,def:246,move:4,aiType:0,color:'#9e443f',accent:'#848c8a'},
      {id:'e2',originalId:257,name:'步兵队',role:'前锋',className:'短兵',troop:'infantry',level:1,side:'enemy',x:11,y:10,hp:500,maxHp:500,morale:100,wuli:40,zhili:30,tongyu:50,strategy:8,maxStrategy:8,atk:242,def:246,move:4,aiType:0,color:'#9e443f',accent:'#848c8a'},
      {id:'e3',originalId:258,name:'步兵队',role:'前锋',className:'短兵',troop:'infantry',level:1,side:'enemy',x:11,y:12,hp:500,maxHp:500,morale:100,wuli:40,zhili:30,tongyu:50,strategy:8,maxStrategy:8,atk:242,def:246,move:4,aiType:0,color:'#9e443f',accent:'#848c8a'}
    ]
  };
})();
