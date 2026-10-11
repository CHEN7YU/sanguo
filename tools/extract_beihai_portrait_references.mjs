import fs from 'node:fs';
import path from 'node:path';
import {decodeFace} from './koei_viewer/face-decoder.ts';

const root=path.resolve(import.meta.dirname,'..');
const output=path.join(root,'docs','original-audit','level-06-beihai-portraits');
const records=[
  {name:'赵云',characterId:53,faceId:3,slug:'zhao-yun'},
  {name:'糜竺',characterId:64,faceId:13,slug:'mi-zhu'},
  {name:'太史慈',characterId:149,faceId:85,slug:'taishi-ci'},
  {name:'孔融',characterId:7,faceId:195,slug:'kong-rong'},
  {name:'管亥',characterId:216,faceId:197,slug:'guan-hai'},
  {name:'孟肃',characterId:233,faceId:208,slug:'meng-su'}
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
console.log(`Decoded ${records.length} verified Beihai portrait references.`);
