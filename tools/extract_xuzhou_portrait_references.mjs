import fs from 'node:fs';
import path from 'node:path';
import {decodeFace} from '../tools/koei_viewer/face-decoder.ts';

const root=path.resolve(import.meta.dirname,'..');
const output=path.join(root,'docs','original-audit','level-07-xuzhou-portraits');
const records=[
  {name:'于禁',characterId:62,faceId:39,slug:'yu-jin'},
  {name:'乐进',characterId:217,faceId:40,slug:'yue-jin'},
  {name:'李典',characterId:115,faceId:41,slug:'li-dian'},
  {name:'郭嘉',characterId:61,faceId:34,slug:'guo-jia'},
  {name:'曹洪',characterId:19,faceId:31,slug:'cao-hong'},
  {name:'夏侯渊',characterId:17,faceId:29,slug:'xiahou-yuan'},
  {name:'陶谦',characterId:15,faceId:189,slug:'tao-qian'},
  {name:'糜芳',characterId:81,faceId:14,slug:'mi-fang'},
  {name:'孙乾',characterId:63,faceId:12,slug:'sun-qian'},
  {name:'太史慈',characterId:149,faceId:85,slug:'taishi-ci'}
];
fs.mkdirSync(output,{recursive:true});
for(const record of records){
  const id=String(record.faceId).padStart(3,'0');
  const source=path.join(root,'tools','koei_viewer','FACEDAT',`${id}.UNPACKED`);
  const decoded=decodeFace(new Uint8Array(fs.readFileSync(source)));
  const target=path.join(output,`${record.slug}-face-${id}.rgba`);
  fs.writeFileSync(target,decoded.pixels);
  record.reference=path.relative(root,target).replaceAll('\\','/').replace(/\.rgba$/,'.png');
}
fs.writeFileSync(path.join(output,'portrait-provenance.json'),JSON.stringify({
  source:'BAKDATA.R3 character record byte 14 -> FACEDAT.R3 portrait record',
  formula:'0x1100 + characterId * 21, face id at +14',
  portraits:records
},null,2));
console.log(`Decoded ${records.length} verified Xuzhou portrait references.`);
