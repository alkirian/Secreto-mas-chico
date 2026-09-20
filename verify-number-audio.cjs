const fs=require('fs'),vm=require('vm'),assert=require('assert');
const played=[],elements={};
let context;
class Context{
  constructor(){context=this;this.currentTime=0;this.destination={};this.gains=[];}
  resume(){return Promise.resolve();}
  decodeAudioData(bytes){assert(bytes.byteLength>10000);return Promise.resolve({bytes:bytes.byteLength,duration:1});}
  createGain(){const g={gain:{value:1},connect(){}};this.gains.push(g);return g;}
  createBufferSource(){return {connect(){},disconnect(){},start(at,offset){played.push({bytes:this.buffer.bytes,offset,node:this});},stop(){}};}
}
const element=id=>elements[id]??={getContext:()=>({}),classList:{add(){},remove(){}},focus(){}};
const box={console,Math,Set,Uint8Array,atob,window:{AudioContext:Context},document:{querySelector:element,querySelectorAll:()=>[],body:element('body'),addEventListener(){}},navigator:{},addEventListener(){},requestAnimationFrame(){}};
vm.createContext(box);
vm.runInContext(fs.readFileSync('dist/number-audio.js','utf8'),box);
vm.runInContext(fs.readFileSync('dist/game.js','utf8').replace('})();','window.qa={initAudio,beginCounting,collectCount,pause,stopNumberAudio,setup(n){mode="play";cinema.stage=null;const v=countLights[n-1];Object.assign(player,{x:v.x-19,y:v.y-62,ground:true});}};})();'),box);
const flush=()=>new Promise(resolve=>setImmediate(resolve));
(async()=>{
  const q=box.window.qa;q.initAudio();q.beginCounting();
  const files=['01-uno','02-dos','03-tres','04-cuatro','05-cinco','06-seis'];
  q.setup(2);q.collectCount({act:true});await flush();assert.equal(played.length,0);
  for(let n=1;n<=6;n++){
    q.setup(n);q.collectCount({act:true});await flush();
    assert.equal(played.at(-1).bytes,fs.statSync('dist/audio/numeros/'+files[n-1]+'.mp3').size);
    const count=played.length;q.collectCount({act:true});await flush();assert.equal(played.length,count);
  }
  context.currentTime=.2;q.pause();q.pause();await flush();assert.equal(played.at(-1).offset,.2);
  elements['#sound'].onclick();assert.equal(context.gains[5].gain.value,0);
  elements['#sound'].onclick();assert.equal(context.gains[5].gain.value,.98);
  q.stopNumberAudio();q.pause();q.pause();const count=played.length;await flush();assert.equal(played.length,count);
  console.log('PASS: all six collected lights start their matching voice; ordering, duplicates, pause/resume, mute and cancellation');
})().catch(error=>{console.error(error);process.exitCode=1;});
