const fs=require('fs'),vm=require('vm'),assert=require('assert');
const played=[],media=[],elements={};
let context;
class Media{
  constructor(src){this.src=src;this.currentTime=0;this.paused=true;this.ended=false;this.volume=1;this.muted=false;this.loop=false;media.push(this);}
  play(){this.paused=false;return Promise.resolve();}
  pause(){this.paused=true;}
}
class Context{
  constructor(){context=this;this.currentTime=0;this.destination={};this.gains=[];}
  resume(){return Promise.resolve();}
  decodeAudioData(bytes){assert(bytes.byteLength>10000);return Promise.resolve({bytes:bytes.byteLength,duration:1});}
  createGain(){const g={gain:{value:1},connect(){}};this.gains.push(g);return g;}
  createBufferSource(){return {connect(){},disconnect(){},start(at,offset){played.push({bytes:this.buffer.bytes,offset,node:this});},stop(){}};}
}
const element=id=>elements[id]??={getContext:()=>({}),classList:{add(){},remove(){}},focus(){}};
const box={console,Math,Set,Uint8Array,atob,Audio:Media,window:{AudioContext:Context},document:{querySelector:element,querySelectorAll:()=>[],body:element('body'),addEventListener(){}},navigator:{},addEventListener(){},requestAnimationFrame(){}};
vm.createContext(box);
vm.runInContext(fs.readFileSync('dist/number-audio.js','utf8'),box);
vm.runInContext(fs.readFileSync('dist/game.js','utf8').replace('})();','window.qa={initAudio,beginCounting,collectCount,pause,stopNumberAudio,setBackgroundMix,updateBackgroundMix,startAudio(){mode="title";start();},setup(n){mode="play";cinema.stage=null;const v=countLights[n-1];Object.assign(player,{x:v.x-19,y:v.y-62,ground:true});}};})();'),box);
const flush=()=>new Promise(resolve=>setImmediate(resolve));
(async()=>{
  const q=box.window.qa;q.initAudio();q.beginCounting();
  const files=['1','2','3','4','5','6'];
  q.setup(2);q.collectCount({act:true});await flush();assert.equal(played.length,0);
  for(let n=1;n<=6;n++){
    q.setup(n);q.collectCount({act:true});await flush();
    assert.equal(played.at(-1).bytes,fs.statSync('sfx/'+files[n-1]+'.mp3').size);
    const count=played.length;q.collectCount({act:true});await flush();assert.equal(played.length,count);
  }
  context.currentTime=.2;q.pause();q.pause();await flush();assert.equal(played.at(-1).offset,.2);
  elements['#sound'].onclick();assert.equal(context.gains[5].gain.value,0);
  elements['#sound'].onclick();assert.equal(context.gains[5].gain.value,.98);
  q.stopNumberAudio();q.pause();q.pause();const count=played.length;await flush();assert.equal(played.length,count);
  q.startAudio();await flush();
  const wind=media.find(clip=>clip.src==='Wind.mp3'),music=media.find(clip=>clip.src==='Banda.mp3');
  assert(wind&&!wind.paused&&wind.loop&&wind.volume===.55,'Wind must start with the game, loop and be audible');
  assert(music&&!music.paused&&music.loop,'The replacement music must start with the game');
  q.setBackgroundMix(.1,.18);q.updateBackgroundMix(.1);
  assert(wind.volume<.55&&wind.volume>.18&&music.volume<.32&&music.volume>.1,'ducking begins with a gradual fade');
  for(let i=0;i<120;i++)q.updateBackgroundMix(1/60);
  assert(Math.abs(wind.volume-.18)<.004&&Math.abs(music.volume-.1)<.004,'fade reaches the voice mix');
  q.setBackgroundMix();q.updateBackgroundMix(.1);
  assert(wind.volume>.18&&wind.volume<.55&&music.volume>.1&&music.volume<.32,'background returns gradually after the voice');
  console.log('PASS: six matching light voices, Banda/Wind start, smooth ducking, pause, resume, mute and cancellation');
})().catch(error=>{console.error(error);process.exitCode=1;});
