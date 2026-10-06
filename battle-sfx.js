(function(global){
  'use strict';

  const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
  const safePan=value=>clamp(Number(value)||0,-.85,.85);

  function outputNode(ctx,destination,pan=0,gain=.9){
    const level=ctx.createGain();
    level.gain.value=gain;
    if(typeof ctx.createStereoPanner==='function'){
      const panner=ctx.createStereoPanner();
      panner.pan.value=safePan(pan);
      level.connect(panner).connect(destination);
    }else level.connect(destination);
    return level;
  }

  function tone(ctx,out,{at=0,frequency=220,to=80,duration=.16,gain=.06,type='sine'}={}){
    const now=ctx.currentTime+at,osc=ctx.createOscillator(),amp=ctx.createGain();
    osc.type=type;
    osc.frequency.setValueAtTime(Math.max(20,frequency),now);
    osc.frequency.exponentialRampToValueAtTime(Math.max(20,to),now+duration);
    amp.gain.setValueAtTime(Math.max(.0001,gain),now);
    amp.gain.exponentialRampToValueAtTime(.0001,now+duration);
    osc.connect(amp).connect(out);osc.start(now);osc.stop(now+duration+.02);
  }

  function noise(ctx,out,{at=0,duration=.12,gain=.06,frequency=800,to=240,q=.7,type='bandpass'}={}){
    const length=Math.max(16,Math.floor(ctx.sampleRate*duration)),buffer=ctx.createBuffer(1,length,ctx.sampleRate),data=buffer.getChannelData(0);
    for(let i=0;i<length;i++){const envelope=Math.pow(1-i/length,1.45);data[i]=(Math.random()*2-1)*envelope}
    const source=ctx.createBufferSource(),filter=ctx.createBiquadFilter(),amp=ctx.createGain(),now=ctx.currentTime+at;
    source.buffer=buffer;filter.type=type;filter.Q.value=q;
    filter.frequency.setValueAtTime(Math.max(40,frequency),now);
    filter.frequency.exponentialRampToValueAtTime(Math.max(40,to),now+duration);
    amp.gain.setValueAtTime(Math.max(.0001,gain),now);
    amp.gain.exponentialRampToValueAtTime(.0001,now+duration);
    source.connect(filter).connect(amp).connect(out);source.start(now);source.stop(now+duration+.02);
  }

  function weaponType(unit={}){
    const weapon=String(unit.weapon||''),troop=String(unit.troop||'');
    if(troop==='support')return 'gong';
    if(troop==='archer'||/[弓弩]/.test(weapon))return 'bow';
    if(/[枪矛槊戟]/.test(weapon))return 'spear';
    if(/剑/.test(weapon))return 'sword';
    if(/刀/.test(weapon))return 'saber';
    return troop==='cavalry'?'spear':'saber';
  }

  function charge(ctx,destination,{pan=0,critical=false}={}){
    if(!ctx||!destination)return;
    const out=outputNode(ctx,destination,pan,critical?1:.78);
    tone(ctx,out,{frequency:118,to:620,duration:.62,gain:.046,type:'sine'});
    tone(ctx,out,{frequency:235,to:1060,duration:.6,gain:.028,type:'triangle'});
    noise(ctx,out,{duration:.55,gain:.018,frequency:280,to:1850,q:1.2,type:'bandpass'});
  }

  function attack(ctx,destination,{kind='saber',pan=0,critical=false}={}){
    if(!ctx||!destination)return;
    const power=critical?1.22:1,out=outputNode(ctx,destination,pan,power);
    if(kind==='bow'){
      tone(ctx,out,{frequency:630,to:118,duration:.16,gain:.075,type:'triangle'});
      tone(ctx,out,{at:.012,frequency:1180,to:390,duration:.075,gain:.025,type:'square'});
      noise(ctx,out,{at:.055,duration:.25,gain:.025,frequency:2600,to:820,q:1.1,type:'bandpass'});
      return;
    }
    if(kind==='gong'){
      tone(ctx,out,{frequency:286,to:240,duration:.46,gain:.055,type:'sine'});
      tone(ctx,out,{frequency:574,to:508,duration:.38,gain:.032,type:'triangle'});
      noise(ctx,out,{duration:.055,gain:.026,frequency:1800,to:620,q:1.4,type:'bandpass'});
      return;
    }
    if(kind==='spear'){
      noise(ctx,out,{duration:.18,gain:.074,frequency:1900,to:260,q:.65,type:'bandpass'});
      tone(ctx,out,{frequency:205,to:72,duration:.12,gain:.035,type:'sawtooth'});
      return;
    }
    const sword=kind==='sword';
    noise(ctx,out,{duration:sword?.25:.3,gain:sword?.064:.078,frequency:sword?2900:2100,to:sword?350:220,q:.55,type:'bandpass'});
    tone(ctx,out,{frequency:sword?345:245,to:68,duration:sword?.17:.22,gain:.025,type:'sawtooth'});
  }

  function block(ctx,destination,{pan=0,heavy=false}={}){
    if(!ctx||!destination)return;
    const out=outputNode(ctx,destination,pan,heavy?1.08:.92);
    noise(ctx,out,{duration:.075,gain:.078,frequency:3600,to:1080,q:1.1,type:'bandpass'});
    const partials=heavy?[[570,285,.34,.075],[1135,520,.29,.06],[1980,870,.22,.045]]:[[760,370,.3,.064],[1510,710,.25,.052],[2490,1120,.19,.036]];
    for(const [frequency,to,duration,gain] of partials)tone(ctx,out,{frequency,to,duration,gain,type:'triangle'});
  }

  function impact(ctx,destination,{kind='saber',pan=0,critical=false,fatal=false}={}){
    if(!ctx||!destination)return;
    const power=(critical?1.22:1)*(fatal?1.08:1),out=outputNode(ctx,destination,pan,power);
    if(kind==='bow'){
      tone(ctx,out,{frequency:920,to:190,duration:.085,gain:.04,type:'square'});
      noise(ctx,out,{duration:.12,gain:.054,frequency:1450,to:280,q:.9,type:'bandpass'});
      tone(ctx,out,{at:.025,frequency:105,to:43,duration:.15,gain:.05,type:'sine'});
      return;
    }
    if(kind==='gong'){
      tone(ctx,out,{frequency:238,to:198,duration:.52,gain:.075,type:'sine'});
      tone(ctx,out,{frequency:477,to:421,duration:.44,gain:.038,type:'triangle'});
      noise(ctx,out,{duration:.09,gain:.032,frequency:1320,to:410,q:1.2,type:'bandpass'});
      return;
    }
    if(kind==='spear'){
      noise(ctx,out,{duration:.11,gain:.072,frequency:940,to:145,q:.65,type:'bandpass'});
      tone(ctx,out,{frequency:126,to:39,duration:.18,gain:.085,type:'sine'});
      tone(ctx,out,{frequency:280,to:82,duration:.075,gain:.028,type:'square'});
      return;
    }
    noise(ctx,out,{duration:.15,gain:.086,frequency:kind==='sword'?1520:1120,to:165,q:.6,type:'bandpass'});
    tone(ctx,out,{frequency:118,to:38,duration:.19,gain:.09,type:'sine'});
    if(kind==='sword')tone(ctx,out,{frequency:690,to:220,duration:.1,gain:.022,type:'triangle'});
  }

  function movementStep(ctx,destination,{pan=0,mounted=false,alternate=false,terrain='plain'}={}){
    if(!ctx||!destination)return;
    const soft=terrain==='forest'||terrain==='rough'||terrain==='hill',out=outputNode(ctx,destination,pan,mounted?.58:.32);
    if(mounted){
      tone(ctx,out,{frequency:alternate?132:112,to:alternate?61:49,duration:.09,gain:soft?.035:.055,type:'sine'});
      noise(ctx,out,{duration:.045,gain:soft?.018:.038,frequency:soft?540:1120,to:160,q:.75,type:'bandpass'});
      tone(ctx,out,{at:.055,frequency:alternate?98:118,to:43,duration:.075,gain:soft?.022:.038,type:'sine'});
    }else{
      noise(ctx,out,{duration:.065,gain:soft?.027:.035,frequency:soft?430:760,to:105,q:.55,type:'bandpass'});
      tone(ctx,out,{frequency:78,to:39,duration:.07,gain:.022,type:'sine'});
    }
  }

  function fall(ctx,destination,{pan=0,mounted=false}={}){
    if(!ctx||!destination)return;
    const out=outputNode(ctx,destination,pan,mounted?1.06:.86);
    tone(ctx,out,{frequency:mounted?92:108,to:31,duration:mounted?.34:.26,gain:mounted?.12:.09,type:'sine'});
    noise(ctx,out,{duration:mounted?.29:.2,gain:mounted?.095:.065,frequency:mounted?390:510,to:74,q:.45,type:'lowpass'});
    if(mounted)tone(ctx,out,{at:.075,frequency:148,to:44,duration:.24,gain:.055,type:'triangle'});
  }

  global.BattleSfx=Object.freeze({weaponType,charge,attack,block,impact,movementStep,fall});
})(window);
