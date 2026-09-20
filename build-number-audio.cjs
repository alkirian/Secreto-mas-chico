const fs=require('fs'),path=require('path');
const files=['1','2','3','4','5','6'];
const clips=files.map(name=>fs.readFileSync(path.join(__dirname,'sfx',name+'.mp3')).toString('base64'));
const chapterFiles={
  ageIntro:path.join(__dirname,'dist/audio/ageIntro.mp3'),
  ageReveal:path.join(__dirname,'dist/audio/ageReveal.mp3'),
  coopIntro:path.join(__dirname,'sfx/coop-intro.mp3')
};
const chapterClips=Object.fromEntries(Object.entries(chapterFiles).map(([name,file])=>[name,fs.readFileSync(file).toString('base64')]));
fs.writeFileSync(path.join(__dirname,'dist/number-audio.js'),'window.numberVoiceData='+JSON.stringify(clips)+';\nwindow.chapterVoiceData='+JSON.stringify(chapterClips)+';\n'+fs.readFileSync(path.join(__dirname,'src/number-voice.js'),'utf8'));
