import fs from 'node:fs';
import {decodeFace} from './koei_viewer/face-decoder.ts';
const ids=[3,112,113,124,115,114,134,135,118,123,158,143];
fs.mkdirSync('./assets-master/level-05-jieqiao/original-faces',{recursive:true});
for(const id of ids){const name=String(id).padStart(3,'0');const data=new Uint8Array(fs.readFileSync(`./tools/koei_viewer/FACEDAT/${name}.UNPACKED`));const decoded=decodeFace(data);fs.writeFileSync(`./assets-master/level-05-jieqiao/original-faces/${name}.rgba`,decoded.pixels);}
console.log(`decoded ${ids.length}`);
