const {spawnSync}=require('child_process');
const fs=require('fs');
const ffmpeg=require('ffmpeg-static');
const input='C:/Users/User/Desktop/MIO/Pequeño secreto/Boy_asking_for_help_20260920013111.mp4';
const out='C:/Users/User/Desktop/MIO/Pequeño secreto/dist/audio-intro.mp3';
const r=spawnSync(ffmpeg,['-y','-i',input,'-vn','-ac','1','-ar','44100','-codec:a','libmp3lame','-b:a','128k',out],{encoding:'utf8'});
if(r.status!==0){console.error(r.stderr);process.exit(r.status||1);}
console.log(JSON.stringify({output:out,bytes:fs.statSync(out).size}));
