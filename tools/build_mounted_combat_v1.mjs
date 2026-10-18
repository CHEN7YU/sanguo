import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const sharp=require('sharp');

const args=Object.fromEntries(process.argv.slice(2).map((v,i,a)=>v.startsWith('--')?[v.slice(2),a[i+1]]:null).filter(Boolean));
const sourceRoot=path.resolve(args['source-root']||'.');
const outputRoot=path.resolve(args['output-root']||'.');
const outputDir=path.join(outputRoot,'assets','mounted-combat-v1');
const GUTTER=2;
fs.mkdirSync(outputDir,{recursive:true});

const attacks={
  guan:'assets/guan-attack.webp',zhang:'assets/zhang-attack.webp',gongsun:'assets/gongsun-attack.webp',hua:'assets/hua-attack.webp',
  lvbu:'assets/lvbu-attack-v1.webp',zhangliao:'assets/zhangliao-attack-v1.webp',houcheng:'assets/houcheng-attack-v1.webp',
  zhaoyun:'assets/level-05-jieqiao/zhao-yun-animation/zhao-yun-attack-v2.webp',wenchou:'assets/level-05-jieqiao/wen-chou-animation/wen-chou-attack-v1.webp',
  yanliang:'assets/level-05-jieqiao/core-animation/yanliang/yanliang-attack-v1.webp',zhanghe:'assets/level-05-jieqiao/core-animation/zhanghe/zhanghe-attack-v1.webp',quyi:'assets/level-05-jieqiao/core-animation/quyi/quyi-attack-v1.webp',
  taishici:'assets/level-06-beihai/animation/taishi-ci/taishi-ci-attack-v2.webp',caocao:'assets/level-08-xiaopei/units/caocao-action-v1.webp',
  xiahoudun:'assets/level-08-xiaopei/units/xiahoudun-action-v1.webp',xiahouyuan:'assets/level-07-xuzhou/units/xiahouyuan-action-v1.webp',yuejin:'assets/level-07-xuzhou/units/yuejin-action-v1.webp'
};
const criticals={
  zhaoyun:'assets/level-05-jieqiao/zhao-yun-animation/zhao-yun-critical-v2.webp',wenchou:'assets/level-05-jieqiao/wen-chou-animation/wen-chou-critical-v1.webp',
  yanliang:'assets/level-05-jieqiao/core-animation/yanliang/yanliang-critical-v1.webp',zhanghe:'assets/level-05-jieqiao/core-animation/zhanghe/zhanghe-critical-v1.webp',quyi:'assets/level-05-jieqiao/core-animation/quyi/quyi-critical-v1.webp'
};
const extras={
  huaFriendly:{source:'assets/friendly/hua-attack-friendly-v1.webp',file:'hua-attack-friendly.webp',kind:'friendlyAttack',key:'hua',cols:5,rows:1},
  zhaoyunDirectional:{source:'assets/level-05-jieqiao/zhao-yun-animation/zhao-yun-directional-attack-v2.webp',file:'zhaoyun-directional-attack.webp',kind:'directionalAttack',key:'zhaoyun',cols:5,rows:4}
};

function isolatePrimaryCell(src,srcW,srcH,x0,y0,cellW,cellH,dst,dstW,dx0,dy0){
  const n=cellW*cellH,labels=new Int32Array(n),queue=new Int32Array(n),sizes=[0];let label=0,totalOpaque=0;
  for(let y=0;y<cellH;y++)for(let x=0;x<cellW;x++){const local=y*cellW+x,alpha=src[((y0+y)*srcW+x0+x)*4+3];if(alpha>2)totalOpaque++;if(alpha<=2||labels[local])continue;label++;let head=0,tail=0;queue[tail++]=local;labels[local]=label;let size=0;
    while(head<tail){const p=queue[head++],py=Math.floor(p/cellW),px=p-py*cellW;size++;for(let oy=-1;oy<=1;oy++)for(let ox=-1;ox<=1;ox++){if(!ox&&!oy)continue;const nx=px+ox,ny=py+oy;if(nx<0||ny<0||nx>=cellW||ny>=cellH)continue;const q=ny*cellW+nx;if(labels[q])continue;const a=src[((y0+ny)*srcW+x0+nx)*4+3];if(a<=2)continue;labels[q]=label;queue[tail++]=q}}
    sizes[label]=size;
  }
  let primary=0;for(let i=1;i<sizes.length;i++)if(sizes[i]>(sizes[primary]||0))primary=i;
  let minX=cellW,minY=cellH,maxX=-1,maxY=-1,kept=0;
  for(let y=0;y<cellH;y++)for(let x=0;x<cellW;x++){const local=y*cellW+x;if(labels[local]!==primary)continue;const si=((y0+y)*srcW+x0+x)*4,di=((dy0+y)*dstW+dx0+x)*4;dst[di]=src[si];dst[di+1]=src[si+1];dst[di+2]=src[si+2];dst[di+3]=src[si+3];kept++;minX=Math.min(minX,x);minY=Math.min(minY,y);maxX=Math.max(maxX,x);maxY=Math.max(maxY,y)}
  if(!kept)throw new Error(`empty primary component at ${x0},${y0}`);
  return{bounds:[minX,minY,maxX-minX+1,maxY-minY+1],retained:kept/Math.max(1,totalOpaque),components:sizes.slice(1).filter(n=>n>=20).length};
}

async function clean({source,file,kind,key,cols=5,rows=1}){
  const input=path.join(sourceRoot,source),decoded=await sharp(input).ensureAlpha().raw().toBuffer({resolveWithObject:true}),{width,height}=decoded.info;
  const cellW=Math.floor(width/cols),cellH=Math.floor(height/rows),outCellW=cellW+GUTTER*2,outCellH=cellH+GUTTER*2,outW=outCellW*cols,outH=outCellH*rows,dst=Buffer.alloc(outW*outH*4),bounds=[];let minRetained=1,removedComponents=0;
  for(let row=0;row<rows;row++){const rowBounds=[];for(let col=0;col<cols;col++){const stat=isolatePrimaryCell(decoded.data,width,height,col*cellW,row*cellH,cellW,cellH,dst,outW,col*outCellW+GUTTER,row*outCellH+GUTTER);rowBounds.push([stat.bounds[0]+GUTTER,stat.bounds[1]+GUTTER,stat.bounds[2],stat.bounds[3]]);minRetained=Math.min(minRetained,stat.retained);removedComponents+=Math.max(0,stat.components-1)}bounds.push(rowBounds)}
  if(minRetained<.72)throw new Error(`${key} ${kind}: retained ratio too low ${minRetained.toFixed(3)}`);
  const out=path.join(outputDir,file);await sharp(dst,{raw:{width:outW,height:outH,channels:4}}).webp({quality:88,alphaQuality:100,smartSubsample:true}).toFile(out);
  console.log(`${kind.padEnd(17)} ${key.padEnd(10)} ${width}x${height} -> ${outW}x${outH}, removed ${removedComponents}, retained >= ${(minRetained*100).toFixed(1)}%`);
  return rows===1?bounds[0]:bounds;
}

const manifest={attack:{},critical:{},directionalAttack:{}};
for(const [key,source] of Object.entries(attacks))manifest.attack[key]=await clean({source,file:`${key}-attack.webp`,kind:'attack',key});
for(const [key,source] of Object.entries(criticals))manifest.critical[key]=await clean({source,file:`${key}-critical.webp`,kind:'critical',key});
for(const spec of Object.values(extras)){const bounds=await clean(spec);if(spec.kind==='directionalAttack')manifest.directionalAttack[spec.key]=bounds}
const js=`// Generated by tools/build_mounted_combat_v1.mjs.\nwindow.MOUNTED_COMBAT_CLEAN_BOUNDS=${JSON.stringify(manifest)};\n`;
fs.writeFileSync(path.join(outputRoot,'mounted-combat-bounds-v1.js'),js);
fs.writeFileSync(path.join(outputDir,'manifest.json'),JSON.stringify(manifest,null,2));
console.log('mounted combat cleanup complete');
