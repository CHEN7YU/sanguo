const BattleRules=(()=>{
  const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
  const TROOP_BASE={
    infantry:{attack:40,defense:40,hp:500,hpGrowth:50,move:4},
    archer:{attack:30,defense:40,hp:500,hpGrowth:40,move:4},
    cavalry:{attack:60,defense:30,hp:500,hpGrowth:60,move:6},
    // Other base classes already present in chapter-one deployments. Keeping
    // them in the same authoritative table prevents an NPC turn from aborting
    // when a bandit/support/martial unit reaches the stat calculator.
    bandit:{attack:50,defense:40,hp:540,hpGrowth:40,move:5},
    support:{attack:20,defense:30,hp:400,hpGrowth:40,move:5},
    transport:{attack:20,defense:30,hp:400,hpGrowth:40,move:5},
    martial:{attack:60,defense:40,hp:500,hpGrowth:50,move:5}
  };
  const ORIGINAL_STRATEGY_LEARNING={
    // Original PC version, base troop tiers.  Higher-tier skills are added
    // when the corresponding promotion system is implemented.
    infantry:[{id:'fire',level:6},{id:'falseReport',level:10},{id:'encourage',level:15}],
    cavalry:[{id:'whirlwind',level:10},{id:'falseReport',level:20}],
    archer:[{id:'vortex',level:6},{id:'fortify',level:10},{id:'recover',level:15}],
    bandit:[],support:[],transport:[],martial:[]
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

  function fireScrollDamage({targetZhili,targetLevel,targetTroop,targetInForest=false,randomRoll=0,targetHp=Infinity}){
    let base=Math.max(1,200-strategyAbility(targetZhili,targetLevel));
    if(['support','transport','sorcerer'].includes(targetTroop))base=Math.floor(base/2);
    if(targetInForest)base+=Math.floor(base/4);
    const spread=Math.floor(base/50),bonus=clamp(Math.floor(randomRoll),0,spread);
    return Math.min(targetHp,base+bonus)
  }

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

  return{TROOP_BASE,ORIGINAL_STRATEGY_LEARNING,derivedStats,affinityPercent,physicalDamage,physicalMoraleDamage,applyMoraleLoss,confusionRecoveryChance,hitRate,experienceGain,terrainRecovery,strategyAbility,militaryBandStrategyRecovery,adjacentMilitaryBandRecovery,fireScrollDamage,aiStrategyDecision,learnedStrategies}
})();

if(typeof module!=='undefined'&&module.exports)module.exports=BattleRules;
