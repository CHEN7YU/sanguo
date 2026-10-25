(()=>{
  'use strict';
  const root=document.getElementById('startupLoader');
  if(!root)return;
  const bar=document.getElementById('startupLoaderBar');
  const percent=document.getElementById('startupLoaderPercent');
  const status=document.getElementById('startupLoaderStatus');
  const detail=document.getElementById('startupLoaderDetail');
  const retry=document.getElementById('startupLoaderRetry');
  let registered=0,settled=0,failed=0,sealed=false,finished=false;
  let pageLoaded=document.readyState==='complete',shown=6;
  let resolveReady;
  const ready=new Promise(resolve=>{resolveReady=resolve});

  function paint(value,message,description){
    shown=Math.max(shown,Math.min(100,Math.round(value)));
    bar.style.width=`${shown}%`;
    root.setAttribute('aria-valuenow',String(shown));
    percent.textContent=`${shown}%`;
    if(message)status.textContent=message;
    if(description!==undefined)detail.textContent=description;
  }

  function fail(message){
    if(finished)return;
    root.classList.add('startup-loader-error');
    status.textContent='部分资源载入失败';
    detail.textContent=message||'请检查网络后重新加载。';
    retry.hidden=false;
  }

  function finish(){
    if(finished||failed||!sealed||settled<registered||!pageLoaded)return;
    finished=true;
    paint(100,'整军完毕','即将进入三国志昭烈传');
    setTimeout(()=>root.classList.add('startup-loader-leaving'),180);
    setTimeout(()=>{
      root.hidden=true;
      root.setAttribute('aria-hidden','true');
      resolveReady();
    },620);
  }

  function update(){
    if(finished)return;
    if(!sealed){
      paint(Math.min(24,8+registered*.16),'正在检查游戏程序','准备战场、人物与剧情资源');
      return;
    }
    const ratio=registered?settled/registered:1;
    paint(25+ratio*72,'正在载入游戏资源',`${settled} / ${registered} 项已完成`);
    if(failed){fail(`${failed} 项资源未能载入，请检查网络后重试。`);return}
    finish();
  }

  function trackImage(image,src){
    registered++;
    let complete=false;
    const settle=ok=>{
      if(complete)return;
      complete=true;
      settled++;
      if(!ok)failed++;
      update();
    };
    image.addEventListener('load',()=>settle(true),{once:true});
    image.addEventListener('error',()=>settle(false),{once:true});
    image.src=src;
    if(image.complete)queueMicrotask(()=>settle(image.naturalWidth>0));
    update();
    return image;
  }

  function seal(){sealed=true;update()}
  retry.addEventListener('click',()=>location.reload());
  addEventListener('load',()=>{pageLoaded=true;update()},{once:true});
  addEventListener('error',event=>{
    const tag=event.target?.tagName;
    if(tag==='SCRIPT'||tag==='LINK')fail(`${tag==='SCRIPT'?'游戏程序':'界面样式'}载入失败，请重新加载。`);
  },true);
  addEventListener('unhandledrejection',()=>fail('游戏初始化遇到错误，请重新加载。'));
  setTimeout(()=>{
    if(finished||failed)return;
    root.classList.add('startup-loader-slow');
    detail.textContent='网络速度较慢，仍在继续载入；也可以重新加载。';
    retry.hidden=false;
  },30000);
  paint(6,'正在连接战场','首次打开需要载入游戏程序与当前资源');
  window.ZhaolieStartup={ready,trackImage,seal,fail};
})();
