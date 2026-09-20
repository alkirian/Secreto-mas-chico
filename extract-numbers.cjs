const {spawnSync}=require('child_process');
const fs=require('fs');
const path=require('path');
const ffmpeg=require('ffmpeg-static');
const input=path.join(__dirname,'dialogo 3.mp4');
const output=path.join(__dirname,'dist','audio','numeros');
// Keep the hesitant aside with the third light.
const clips=[
  ['01-uno',3.82,4.55],
  ['02-dos',5.00,5.88],
  ['03-tres',6.32,7.45],
  ['04-cuatro',7.46,8.16],
  ['05-cinco',8.20,9.02],
  ['06-seis',9.07,9.95],
];
fs.mkdirSync(output,{recursive:true});
for(const [name,start,end] of clips){
  const duration=end-start;
  const file=path.join(output,name+'.mp3');
  const result=spawnSync(ffmpeg,['-v','error','-y','-i',input,'-ss',String(start),'-t',duration.toFixed(3),'-vn','-af',`afade=t=in:d=0.008,afade=t=out:st=${(duration-.015).toFixed(3)}:d=0.015`,'-ac','1','-ar','44100','-codec:a','libmp3lame','-b:a','128k',file],{encoding:'utf8'});
  if(result.status!==0)throw new Error(result.stderr||'Audio extraction failed');
  console.log(`${name}.mp3: ${duration.toFixed(2)} s, ${fs.statSync(file).size} bytes`);
}
