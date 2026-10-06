import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';

const root=fileURLToPath(new URL('..',import.meta.url));
const levelFiles=['level-01.js','level-02.js','level-03-guangchuan.js','level-03-xindu.js','level-04-julu.js'];
const dedicated=new Set(['liu','guan','zhang','gongsun','tao','hua','lvbu','zhangliao','houcheng','songxian','weixu','yanliang','zhanghe']);
const friendlyFile={
  hua:'hua-squad-friendly-v1.webp',
  infantry:'infantry-squad-friendly-v1.webp',
  archer:'archer-squad-friendly-v1.webp',
  officer:'officer-squad-friendly-v1.webp',
  support:'support-friendly-v1.webp',
  martial:'martial-artist-friendly-v1.webp',
  bandit:'bandit-friendly-v1.webp'
};
const visualKey=u=>u.troop==='cavalry'?'hua':u.troop==='archer'?'archer':u.troop==='martial'?'martial':u.troop==='bandit'?'bandit':u.troop==='support'?'support':u.role!=='前锋'?'officer':'infantry';

const report=[];
for(const file of levelFiles){
  const context={window:{}};
  vm.runInNewContext(fs.readFileSync(path.join(root,file),'utf8'),context,{filename:file});
  const level=Object.values(context.window).find(value=>value&&Array.isArray(value.units));
  assert.ok(level,`${file}: level data must load`);
  const friendlyIds=new Set(level.units.filter(u=>u.side==='ally'||u.side==='guest').map(u=>u.id));
  for(const event of level.timedEvents||[])for(const spawn of event.spawns||[])if(spawn.side==='ally'||spawn.side==='guest')friendlyIds.add(spawn.unitId);
  const audited=[];
  for(const id of friendlyIds){
    const unit=level.units.find(u=>u.id===id);
    assert.ok(unit,`${level.name}: friendly event unit ${id} must exist in units`);
    if(dedicated.has(unit.id)){audited.push(`${unit.name}=专属形象`);continue}
    const key=visualKey(unit),fileName=friendlyFile[key];
    assert.ok(fileName,`${level.name}/${unit.name}: no friendly visual mapping for ${key}`);
    const asset=path.join(root,'assets','friendly',fileName);
    assert.ok(fs.existsSync(asset),`${level.name}/${unit.name}: missing ${fileName}`);
    assert.ok(fs.statSync(asset).size>30_000,`${level.name}/${unit.name}: ${fileName} is not production artwork`);
    audited.push(`${unit.name}=${fileName}`);
  }
  report.push(`${level.name}: ${audited.join('、')}`);
}

console.log('All current-level friendly units resolve to visible artwork.');
for(const line of report)console.log(`- ${line}`);
