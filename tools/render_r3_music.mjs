import fs from 'node:fs';
import path from 'node:path';

const input=process.argv[2],outputDir=process.argv[3];
if(!input||!outputDir)throw new Error('usage: node render_r3_music.mjs MUSIC.R3 output-dir');
const bank=fs.readFileSync(input),songCount=bank.readUInt16LE(0),dataBase=2+songCount*6;
const ids=(process.argv[4]||'2,11,12').split(',').map(Number).filter(Number.isFinite),sampleRate=11025;

function songBytes(id){const offset=bank.readUInt32LE(2+id*6),length=bank.readUInt16LE(6+id*6);return bank.subarray(dataBase+offset,dataBase+offset+length)}
function parseTrack(song,start,defaultTempo){
  let p=start,t=0,lastRun=12,lastGate=10,volume=.22,tempo=defaultTempo,events=[],steps=0,repeatStart=-1,repeatCount=new Map();
  while(p<song.length&&steps++<24000&&t<130){
    const op=song[p++];
    if(op===0xff)break;
    if(op===0xf8||op===0xfe||op===0xc0||op===0xc1||op===0xbe)continue;
    if(op===0xf2){tempo=song[p++]||tempo;continue}
    if(op===0xf0){const v=song[p++];volume=Math.max(.035,Math.min(.28,(72-v)/170));continue}
    if(op===0xf4){p+=2;continue}
    if(op===0xf7){p+=2;continue}
    if(op===0xd0){repeatStart=p;continue}
    if(op>=0xd1&&op<=0xd7&&repeatStart>=0){const wanted=op-0xcf,key=p,count=repeatCount.get(key)||0;if(count<wanted-1){repeatCount.set(key,count+1);p=repeatStart}else{repeatCount.delete(key);repeatStart=-1}continue}
    if(op>=0xc0){continue}
    let note=op;
    if(op<0x60){if(p+1>=song.length)break;lastRun=song[p++]||1;lastGate=song[p++]||lastRun}else note=op-0x60;
    const tick=Math.max(.008,tempo/2812.5),run=lastRun*tick,gate=Math.max(.012,Math.min(lastGate,lastRun*1.15)*tick);
    if(note>0&&note<0x60)events.push({time:t,duration:gate,midi:note+12,amp:volume});t+=run;
  }
  return events
}
function render(id){
  const song=songBytes(id),starts=Array.from({length:7},(_,i)=>song.readUInt16LE(i*2)).filter(Boolean),tempo=song[starts[0]]===0xf2?song[starts[0]+1]:72,tracks=starts.map((start,i)=>parseTrack(song,start,tempo).map(e=>({...e,track:i}))),events=tracks.flat(),duration=Math.min(130,Math.max(...events.map(e=>e.time+e.duration),20)+1.5),samples=new Float32Array(Math.ceil(duration*sampleRate));
  for(const e of events){const begin=Math.floor(e.time*sampleRate),end=Math.min(samples.length,Math.ceil((e.time+e.duration)*sampleRate)),freq=440*Math.pow(2,(e.midi-69)/12),attack=Math.min(.018,e.duration*.18),release=Math.min(.07,e.duration*.3),panGain=.8+(e.track%3)*.08;
    for(let i=begin;i<end;i++){const local=(i-begin)/sampleRate,left=e.duration-local,env=Math.min(1,local/attack,left/release),phase=2*Math.PI*freq*local,carrier=Math.sin(phase)+.24*Math.sin(phase*2)+.09*Math.sin(phase*3);samples[i]+=carrier*e.amp*env*panGain}}
  let peak=.001;for(const v of samples)peak=Math.max(peak,Math.abs(v));const gain=.86/peak,data=Buffer.alloc(samples.length*2);for(let i=0;i<samples.length;i++)data.writeInt16LE(Math.round(Math.max(-1,Math.min(1,samples[i]*gain))*32767),i*2);
  const wav=Buffer.alloc(44+data.length);wav.write('RIFF',0);wav.writeUInt32LE(36+data.length,4);wav.write('WAVEfmt ',8);wav.writeUInt32LE(16,16);wav.writeUInt16LE(1,20);wav.writeUInt16LE(1,22);wav.writeUInt32LE(sampleRate,24);wav.writeUInt32LE(sampleRate*2,28);wav.writeUInt16LE(2,32);wav.writeUInt16LE(16,34);wav.write('data',36);wav.writeUInt32LE(data.length,40);data.copy(wav,44);
  const out=path.join(outputDir,`original-music-${id}.wav`);fs.writeFileSync(out,wav);console.log(`${out}: ${duration.toFixed(1)}s, ${events.length} notes`)
}
fs.mkdirSync(outputDir,{recursive:true});ids.forEach(render);
