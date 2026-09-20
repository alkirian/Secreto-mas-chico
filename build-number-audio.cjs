const fs=require('fs'),path=require('path');
const files=['01-uno','02-dos','03-tres','04-cuatro','05-cinco','06-seis'];
const clips=files.map(name=>fs.readFileSync(path.join(__dirname,'dist/audio/numeros',name+'.mp3')).toString('base64'));
const chapterClips=Object.fromEntries(['ageIntro','ageReveal'].map(name=>[name,fs.readFileSync(path.join(__dirname,'dist/audio',name+'.mp3')).toString('base64')]));
fs.writeFileSync(path.join(__dirname,'dist/number-audio.js'),'window.numberVoiceData='+JSON.stringify(clips)+';\nwindow.chapterVoiceData='+JSON.stringify(chapterClips)+';\n'+fs.readFileSync(path.join(__dirname,'src/number-voice.js'),'utf8'));
