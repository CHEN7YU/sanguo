import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import {fileURLToPath} from 'node:url';
import {decodeFace} from './koei_viewer/face-decoder.ts';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const source=path.join(root,'tools/koei_viewer/FACEDAT');
const output=path.join(root,'docs/original-audit/level-04-qinghe-portraits');
fs.mkdirSync(output,{recursive:true});
const crcTable=Array.from({length:256},(_,n)=>{let c=n;for(let k=0;k<8;k++)c=(c&1)?0xedb88320^(c>>>1):c>>>1;return c>>>0});
const chunk=(type,data)=>{const tag=Buffer.from(type),body=Buffer.concat([tag,data]);let crc=0xffffffff;for(const byte of body)crc=crcTable[(crc^byte)&255]^(crc>>>8);const length=Buffer.alloc(4),tail=Buffer.alloc(4);length.writeUInt32BE(data.length);tail.writeUInt32BE((crc^0xffffffff)>>>0);return Buffer.concat([length,body,tail])};
function encodePng(width,height,rgb){
  const header=Buffer.alloc(13);header.writeUInt32BE(width,0);header.writeUInt32BE(height,4);header[8]=8;header[9]=2;
  const stride=width*3,scanlines=Buffer.alloc((stride+1)*height);for(let y=0;y<height;y++)rgb.copy(scanlines,y*(stride+1)+1,y*stride,(y+1)*stride);
  return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',header),chunk('IDAT',zlib.deflateSync(scanlines,{level:9})),chunk('IEND',Buffer.alloc(0))]);
}
for(const [slug,name,id] of [['yan-gang','严纲',109],['qu-yi','麴义',128]]){
  const input=path.join(source,`${String(id).padStart(3,'0')}.UNPACKED`);
  const face=decodeFace(new Uint8Array(fs.readFileSync(input)));
  const rgb=Buffer.alloc(face.width*face.height*3);
  for(let i=0,j=0;i<face.pixels.length;i+=4){rgb[j++]=face.pixels[i];rgb[j++]=face.pixels[i+1];rgb[j++]=face.pixels[i+2]}
  const file=path.join(output,`${slug}-face-${id}.png`);
  fs.writeFileSync(file,encodePng(face.width,face.height,rgb));
  console.log(`${name}: ${file}`);
}
