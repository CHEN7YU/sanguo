import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';

const root=fileURLToPath(new URL('..',import.meta.url));
const game=fs.readFileSync(path.join(root,'game.js'),'utf8');
const assets={
  yanliang:{static:'assets/level-04-julu/units/yan-liang-mounted-v1.webp',animationRoot:'assets/level-05-jieqiao/core-animation/yanliang'},
  zhanghe:{static:'assets/level-04-julu/units/zhang-he-mounted-v1.webp',animationRoot:'assets/level-05-jieqiao/core-animation/zhanghe'},
  quyi:{static:'assets/level-04-qinghe/qu-yi-mounted-v2.webp',animationRoot:'assets/level-05-jieqiao/core-animation/quyi'}
};
const boundsSource=fs.readFileSync(path.join(root,'jieqiao-core-animation-bounds.js'),'utf8'),context={window:{}};
vm.runInNewContext(boundsSource,context);
const allBounds=context.window.JIEQIAO_CORE_ANIMATION_BOUNDS;
let total=0;

for(const [id,asset] of Object.entries(assets)){
  if(!game.includes(`${id}:'${asset.static}'`))throw new Error(`${id} does not use unique battlefield art`);
  const file=path.join(root,...asset.static.split('/'));
  if(!fs.existsSync(file)||fs.statSync(file).size<50000)throw new Error(`${id} battlefield art is missing or unexpectedly small`);
  for(const action of ['walk','attack','critical','block','hurt','death']){
    const animation=`${asset.animationRoot}/${id}-${action}-v1.webp`;
    if(!game.includes(animation))throw new Error(`${id} ${action} animation is not wired`);
    const animationFile=path.join(root,...animation.split('/'));
    if(!fs.existsSync(animationFile)||fs.statSync(animationFile).size<50000)throw new Error(`${id} ${action} animation is missing or unexpectedly small`);
    total+=fs.statSync(animationFile).size;
  }
  const bounds=allBounds[id];
  if(bounds.walk.length!==4||bounds.walk.some(row=>row.length!==4))throw new Error(`${id} walk bounds are not 4x4`);
  for(const action of ['attack','critical','block','hurt','death'])if(bounds[action].length!==5)throw new Error(`${id} ${action} bounds do not expose five frames`);
}
if(total>=5*1024*1024)throw new Error(`three general animation sets exceed 5 MiB: ${total}`);

console.log(`Named general art verified: Yan Liang, Zhang He and Qu Yi use unique mounted walk, attack, critical, block, hurt and defeat animations (${(total/1048576).toFixed(2)} MiB).`);
