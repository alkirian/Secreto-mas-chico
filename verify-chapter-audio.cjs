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
vm.runInContext(fs.readFileSync('dist/game.js','utf8').replace('})();','window.qa={initAudio,beginCinema,beginCounting,updateChapterVoice,skipCinema,pause,reset,collectCount,get voice(){return chapterVoice},get dialog(){return dialog},get queued(){return queue.length},setup(){mode="play";cinema.stage=null;countValue=5;const v=countLights[5];Object.assign(player,{x:v.x-19,y:v.y-62,ground:true});}};})();'),box);
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
context.currentTime+=5.1;q.updateChapterVoice(.01);assert.equal(q.dialog.text,'Las letras guardaban tu nombre');
const node=played.at(-1).node;q.skipCinema();assert(node.stopped);assert.equal(q.voice,null);
q.beginCinema('coopIntro',[{text:'Ya me enseñaste a leer tu nombre.',d:6.2},{text:'Y a contar hasta seis.',d:3.57},'Ahora quiero ayudarte yo.','Aunque sea chiquito… algo debo poder hacer.']);
assert.equal(q.voice.lines.length,2);assert.equal(q.queued,2,'the remaining cooperation dialogue follows the new recording');
q.updateChapterVoice(1.3);q.updateChapterVoice(.01);await flush();
assert.equal(played.at(-1).size,fs.statSync('sfx/coop-intro.mp3').size);
q.skipCinema();
q.beginCounting();q.reset();assert.equal(q.voice,null,'reset cancels voice and pending playback');
console.log('PASS: question/reflection/cooperation sources, subtitle clock, queued dialogue, pause/resume, skip and reset');
})().catch(e=>{console.error(e);process.exitCode=1;});
