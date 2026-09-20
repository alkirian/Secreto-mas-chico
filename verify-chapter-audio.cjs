const fs=require('fs'),vm=require('vm'),assert=require('assert');
const elements={},played=[];let context;
class Context{
constructor(){context=this;this.currentTime=0;this.destination={};}
resume(){return Promise.resolve();}
decodeAudioData(bytes){return Promise.resolve({duration:20,size:bytes.byteLength});}
createGain(){return {gain:{value:1},connect(){}};}
createBufferSource(){return {connect(){},disconnect(){},stop(){this.stopped=true;},start(at,offset){played.push({node:this,offset,size:this.buffer.size});}};}
}
const noop=()=>{},element=id=>elements[id]??={getContext:()=>({}),classList:{add:noop,remove:noop},focus:noop};
const box={console,Math,Set,Uint8Array,atob,window:{AudioContext:Context},document:{querySelector:element,querySelectorAll:()=>[],body:element('body'),addEventListener:noop},navigator:{},addEventListener:noop,requestAnimationFrame:noop};
vm.createContext(box);vm.runInContext(fs.readFileSync('dist/number-audio.js','utf8'),box);
assert.equal(Buffer.from(box.window.chapterVoiceData.coopIntro,'base64').byteLength,fs.statSync('sfx/coop-intro.mp3').size);
assert.equal(Buffer.from(box.window.chapterVoiceData.final,'base64').byteLength,fs.statSync('sfx/final-dialog.mp3').size);
vm.runInContext(fs.readFileSync('dist/game.js','utf8').replace('})();','window.qa={initAudio,beginCinema,beginCounting,finalDialogue,coopDialogue,updateChapterVoice,skipCinema,pause,reset,collectCount,get voice(){return chapterVoice},get dialog(){return dialog},get queued(){return queue.length},setup(){mode="play";cinema.stage=null;countValue=5;const v=countLights[5];Object.assign(player,{x:v.x-19,y:v.y-62,ground:true});}};})();'),box);
const flush=()=>new Promise(r=>setImmediate(r));
(async()=>{
const q=box.window.qa;q.initAudio();q.beginCounting();
q.updateChapterVoice(1.3);assert.equal(played.length,0,'camera lead precedes question');q.updateChapterVoice(.01);await flush();
assert.equal(played.at(-1).size,fs.statSync('dist/audio/ageIntro.mp3').size);
context.currentTime=1;q.updateChapterVoice(.01);assert(q.dialog.text.includes('¿me enseñás'));
q.setup();q.pause();const before=q.voice.clip.currentTime;context.currentTime=7;assert.equal(q.voice.clip.currentTime,before,'pause freezes audio clock');q.pause();await flush();assert.equal(played.at(-1).offset,before);
elements['#sound'].onclick();q.skipCinema(); // setup cleared cinema for pause; stop explicitly via next scene
q.beginCounting();q.skipCinema();assert.equal(q.voice,null,'skip cancels pending voice');
q.setup();q.collectCount({act:true});await flush();const six=played.length;
q.updateChapterVoice(1);assert.equal(played.length,six,'six has time to finish');q.updateChapterVoice(.3);q.updateChapterVoice(.01);await flush();
assert.equal(played.at(-1).size,fs.statSync('dist/audio/ageReveal.mp3').size);
context.currentTime+=5.4;q.updateChapterVoice(.01);assert.equal(q.dialog.text,'Las letras guardaban tu nombre');
const node=played.at(-1).node;q.skipCinema();assert(node.stopped);assert.equal(q.voice,null);
q.beginCinema('coopIntro',q.coopDialogue());
assert.equal(q.voice.lines.length,4);assert.equal(q.queued,0,'all cooperation dialogue belongs to the recording');
q.updateChapterVoice(1.3);q.updateChapterVoice(.01);await flush();
assert.equal(played.at(-1).size,fs.statSync('sfx/coop-intro.mp3').size);
const coopStart=context.currentTime;
for(const [time,text] of [[.3,'Ya me enseñaste a leer tu nombre.'],[2.8,'Y a contar hasta seis.'],[4.5,'Ahora quiero ayudarte yo.'],[6.6,'Aunque sea chiquito… algo debo poder hacer.']]){context.currentTime=coopStart+time;q.updateChapterVoice(.01);assert.equal(q.dialog.text,text);}
q.skipCinema();
const finalLines=q.finalDialogue();q.beginCinema('final',finalLines);
assert.equal(q.voice.lines.length,11);assert.equal(q.queued,0);assert.equal(q.voice.lines[0].text,'Coti.');assert.equal(q.voice.lines.at(-1).text,'¿Me guardás un lugar para jugar?');
q.updateChapterVoice(1.3);q.updateChapterVoice(.01);await flush();
assert.equal(played.at(-1).size,fs.statSync('sfx/final-dialog.mp3').size);
const finalStart=context.currentTime,finalNode=played.at(-1).node;
for(const [time,text] of [[.1,null],[.3,'Coti.'],[1.1,null],[1.6,'Ya sé que sos vos.'],[5.9,'Quería conocerte antes de llegar.'],[13.2,'Ni contar hasta seis sin ayuda.'],[19,'Y cuando salga…'],[20.5,'vas a ser mi primo mayor.'],[23,'¿Me guardás un lugar para jugar?'],[25.5,null]]){context.currentTime=finalStart+time;q.updateChapterVoice(.01);assert.equal(q.dialog?.text??null,text);assert(q.voice,'gaps and audio tail retain the scene');assert(!finalNode.stopped,'subtitle end must never truncate the recording');}
finalNode.onended();q.updateChapterVoice(.01);assert.equal(q.voice,null,'the recording ending releases the scene');
q.skipCinema();
q.beginCounting();q.reset();assert.equal(q.voice,null,'reset cancels voice and pending playback');
console.log('PASS: question/reflection/cooperation/final sources, exact final subtitles, subtitle clock, pause/resume, skip and reset');
})().catch(e=>{console.error(e);process.exitCode=1;});
