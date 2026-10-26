const BattleRules=(()=>{
  const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
  const TROOP_BASE={
    infantry:{attack:40,defense:40,hp:500,hpGrowth:50,move:4},
    archer:{attack:30,defense:40,hp:500,hpGrowth:40,move:4},
    cavalry:{attack:60,defense:30,hp:500,hpGrowth:60,move:6},
    // 淮南纪灵使用独立的重骑兵兵种。它仍属于骑兵相克体系，但
    // 基础兵力与攻防高于轻骑兵，必须进入统一属性表，避免 AI
    // 计算移动范围时因未知兵种抛错并锁死整个敌军阶段。
    heavyCavalry:{attack:70,defense:40,hp:600,hpGrowth:70,move:6},
    // Other base classes already present in chapter-one deployments. Keeping
    // them in the same authoritative table prevents an NPC turn from aborting
    // when a bandit/support/martial unit reaches the stat calculator.
    bandit:{attack:50,defense:40,hp:540,hpGrowth:40,move:5},
    support:{attack:20,defense:30,hp:400,hpGrowth:40,move:5},
    transport:{attack:20,defense:30,hp:400,hpGrowth:40,move:5},
    martial:{attack:60,defense:40,hp:500,hpGrowth:50,move:5},
    beast:{attack:70,defense:30,hp:500,hpGrowth:50,move:5}
  };
  const ORIGINAL_STRATEGY_LEARNING={
    // Original PC version, base troop tiers.  Higher-tier skills are added
    // when the corresponding promotion system is implemented.
    infantry:[{id:'fire',level:6},{id:'falseReport',level:10},{id:'encourage',level:15}],
    cavalry:[{id:'whirlwind',level:10},{id:'falseReport',level:20}],
    heavyCavalry:[{id:'whirlwind',level:10},{id:'falseReport',level:20}],
    archer:[{id:'vortex',level:6},{id:'fortify',level:10},{id:'recover',level:15}],
    bandit:[],
    // Original military bands gain levels mainly by restoring morale. The
    // first morale-support tactic is available from the moment the class is
    // usable; stronger variants can extend this progression later.
    support:[{id:'encourage',level:1}],
    transport:[],
    // 武术家在原作中并非无策略兵种：6级习得焦热，10级习得援助。
    // 藩宫在泰山登场时已经达到10级，因此两项都应出现在指令菜单中。
    martial:[{id:'fire',level:6},{id:'recover',level:10},{id:'inferno',level:26}],
    beast:[]
  };

  function troopBase(troop){const base=TROOP_BASE[troop];if(!base)throw new Error(`Unsupported original troop type: ${troop}`);return base}

  function derivedStats({troop,level,wuli,zhili,tongyu,morale=100,attackBonus=0,defenseBonus=0}){
    const base=troopBase(troop);
    const attackBase=Math.floor(4000/(140-wuli))+base.attack*2+morale;
    const defenseBase=Math.floor(4000/(140-tongyu))+base.defense*2+morale;
    const attack=Math.floor(Math.floor(attackBase*(level+10)/10)*(100+attackBonus)/100);
    const defense=Math.floor(Math.floor(defenseBase*(level+10)/10)*(100+defenseBonus)/100);
    return{
      attack,defense,
      maxHp:base.hp+base.hpGrowth*(level-1),
      hpGrowth:base.hpGrowth,
      move:base.move,
      maxStrategy:Math.floor((level+10)*zhili*5/200)
    }
  }

  function affinityPercent(attackerTroop,targetTroop){
    if(attackerTroop==='heavyCavalry')attackerTroop='cavalry';
    if(targetTroop==='heavyCavalry')targetTroop='cavalry';
    if((attackerTroop==='infantry'&&targetTroop==='archer')||(attackerTroop==='archer'&&targetTroop==='cavalry')||(attackerTroop==='cavalry'&&targetTroop==='infantry'))return 75;
    if((targetTroop==='infantry'&&attackerTroop==='archer')||(targetTroop==='archer'&&attackerTroop==='cavalry')||(targetTroop==='cavalry'&&attackerTroop==='infantry'))return 125;
    return 100
  }

  function physicalDamage({attack,defense,attackerTroop,targetTroop,terrainDefense=0,targetHp=Infinity,counter=false}){
    const adjustedDefense=Math.floor(defense*affinityPercent(attackerTroop,targetTroop)/100);
    let damage=Math.floor((attack-Math.floor(adjustedDefense/2))*(100-terrainDefense)/100);
    damage=Math.max(1,damage);
    if(counter)damage=Math.max(1,Math.floor(damage/2));
    return Math.min(targetHp,damage)
  }

  function physicalMoraleDamage(damage,level,currentMorale=100){
    if(damage<=0||currentMorale<=0)return 0;
    const loss=Math.max(1,Math.floor(Math.floor(damage/(level+5))/3));
    return Math.min(currentMorale,loss)
  }

  function applyMoraleLoss(currentMorale,amount,preventRout=false){
    const before=clamp(currentMorale,0,100),minimum=preventRout?1:0,morale=Math.max(minimum,before-Math.max(0,amount));
    return{morale,loss:before-morale,routed:morale<=0}
  }

  function confusionRecoveryChance(tongyu,morale){
    return clamp((Math.max(0,tongyu)+Math.max(0,morale))/300,0,1)
  }

  function hitRate(attackerMorale,targetMorale,terrainDefense,{archer=false,targetInForest=false}={}){
    const terrainPenalty=Math.max(0,terrainDefense)*.002,morale=(attackerMorale-targetMorale)*.0015,forestPenalty=archer&&targetInForest?.08:0;
    return clamp(.92+morale-terrainPenalty-forestPenalty,.68,.98)
  }

  function experienceGain(attackerLevel,targetLevel,killed=false,boss=false){
    let gain=attackerLevel<=targetLevel?Math.min(16,(targetLevel-attackerLevel+3)*2):4;
    if(killed)gain+=boss?48:targetLevel>attackerLevel?32:Math.floor(64/(attackerLevel-targetLevel+2));
    return gain
  }

  function transportHealingExperience(actualHealing){
    const amount=Math.max(0,Math.floor(Number(actualHealing)||0));
    return amount>0?Math.min(10,Math.ceil(amount/25)):0
  }

  function terrainRecovery({hp,maxHp,morale=100,tongyu=0,recoverHp=false,recoverMorale=false,hpRoll=0,moraleRoll=0}){
    let nextHp=hp,nextMorale=morale,hpGain=0,moraleGain=0;
    if(recoverHp&&nextHp<maxHp){
      hpGain=Math.min(maxHp-nextHp,150+clamp(Math.floor(hpRoll),0,10)*10);nextHp+=hpGain;
      if(maxHp-nextHp<10){hpGain+=maxHp-nextHp;nextHp=maxHp}
    }
    if(recoverMorale&&nextMorale<100){
      moraleGain=Math.min(100-nextMorale,Math.floor(tongyu/10)+1+clamp(Math.floor(moraleRoll),0,4));nextMorale+=moraleGain;
      if(nextMorale>90){moraleGain+=100-nextMorale;nextMorale=100}
    }
    return{hp:nextHp,morale:nextMorale,hpGain,moraleGain}
  }

  function strategyAbility(zhili,level){return Math.floor(zhili*level/50)+zhili}

  // Original PC rule: a unit beside a military band recovers one strategy
  // point per ten band levels, rounded down, plus one. Bands do not restore
  // themselves, while several adjacent bands stack.
  function militaryBandStrategyRecovery(level){return Math.floor(Math.max(0,Number(level)||0)/10)+1}

  function adjacentMilitaryBandRecovery({x,y,id,units=[]}){
    return units.filter(unit=>unit&&unit.id!==id&&unit.hp>0&&unit.troop==='support'&&Math.abs(unit.x-x)+Math.abs(unit.y-y)===1)
      .reduce((sum,band)=>sum+militaryBandStrategyRecovery(band.level),0)
  }

  // Military bands inspire every friendly unit in the surrounding eight
  // squares. Multiple bands deliberately do not stack this attack aura.
  function militaryBandAttackAura({x,y,id,side,units=[]}){
    return units.some(band=>band&&band.id!==id&&band.hp>0&&band.side!=='reserve'&&band.troop==='support'&&(band.side==='enemy')===(side==='enemy')&&Math.max(Math.abs(band.x-x),Math.abs(band.y-y))===1)
  }

  const FIRE_TACTIC_POWER={fire:200,fireDragon:600,inferno:1000};

  // DOS original: an offensive scroll uses the tactic's base power minus the
  // defender's strategy ability. Casting the learned tactic adds twice the
  // attacker's strategy ability. Scrolls are guaranteed to hit; learned
  // tactics use their own hit check before reaching this damage function.
  function fireTacticDamage({tactic='fire',attackerZhili=null,attackerLevel=null,targetZhili,targetLevel,targetTroop,targetInForest=false,randomRoll=0,targetHp=Infinity}){
    const power=FIRE_TACTIC_POWER[tactic];
    if(!power)throw new Error(`Unsupported fire tactic: ${tactic}`);
    const attackerBonus=Number.isFinite(attackerZhili)&&Number.isFinite(attackerLevel)?strategyAbility(attackerZhili,attackerLevel)*2:0;
    let base=Math.max(1,power+attackerBonus-strategyAbility(targetZhili,targetLevel));
    if(['support','transport','sorcerer'].includes(targetTroop))base=Math.floor(base/2);
    if(targetInForest)base+=Math.floor(base/4);
    const spread=Math.floor(base/50),bonus=clamp(Math.floor(randomRoll),0,spread);
    return Math.min(targetHp,base+bonus)
  }

  function fireScrollDamage(args){return fireTacticDamage({...args,tactic:'fire',attackerZhili:null,attackerLevel:null})}
  function infernoScrollDamage(args){return fireTacticDamage({...args,tactic:'inferno',attackerZhili:null,attackerLevel:null})}

  function aiStrategyDecision({turn,lastStrategyTurn=null,cooldown=3,hasPhysicalAttack=false,emergencyHeal=false,role='',zhili=0}){
    if(hasPhysicalAttack)return'attack';
    if(Number.isFinite(lastStrategyTurn)&&turn-lastStrategyTurn<Math.max(1,cooldown))return'cooldown';
    if(emergencyHeal)return'recover';
    if(role==='前锋'||zhili<55)return'advance';
    return'offensive'
  }

  function learnedStrategies({troop,level,override=null}){
    if(Array.isArray(override))return[...override];
    return(ORIGINAL_STRATEGY_LEARNING[troop]||[]).filter(entry=>level>=entry.level).map(entry=>entry.id)
  }

  function retaliationTargetId({aiType,provokedBy,provokedTurn,currentTurn,actorX,actorY,detectionRange=3,candidates=[]}){
    if(aiType!==0)return null;
    const provoker=provokedTurn===currentTurn&&provokedBy?candidates.find(unit=>unit?.id===provokedBy&&unit.hp>0):null;
    if(provoker)return provoker.id;
    if(!Number.isFinite(actorX)||!Number.isFinite(actorY))return null;
    const local=candidates.filter(unit=>unit?.hp>0&&Number.isFinite(unit.x)&&Number.isFinite(unit.y)).map(unit=>({unit,distance:Math.abs(unit.x-actorX)+Math.abs(unit.y-actorY)})).filter(entry=>entry.distance<=detectionRange).sort((a,b)=>a.distance-b.distance||(a.unit.hp/a.unit.maxHp)-(b.unit.hp/b.unit.maxHp)||(a.unit.spawnOrder??0)-(b.unit.spawnOrder??0));
    return local[0]?.unit.id||null
  }

  return{TROOP_BASE,ORIGINAL_STRATEGY_LEARNING,FIRE_TACTIC_POWER,derivedStats,affinityPercent,physicalDamage,physicalMoraleDamage,applyMoraleLoss,confusionRecoveryChance,hitRate,experienceGain,transportHealingExperience,terrainRecovery,strategyAbility,militaryBandStrategyRecovery,adjacentMilitaryBandRecovery,militaryBandAttackAura,fireTacticDamage,fireScrollDamage,infernoScrollDamage,aiStrategyDecision,learnedStrategies,retaliationTargetId}
})();

if(typeof module!=='undefined'&&module.exports)module.exports=BattleRules;
