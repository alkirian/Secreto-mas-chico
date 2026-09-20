const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const noop=()=>{},elements={},drawn=[];
const context=new Proxy({fillText:s=>drawn.push(s),measureText:s=>({width:s.length*12}),createLinearGradient:()=>({addColorStop:noop}),createRadialGradient:()=>({addColorStop:noop})},{get:(o,k)=>o[k]||noop,set:(o,k,v)=>(o[k]=v,true)});
const element=id=>elements[id]??={getContext:()=>context,classList:{add:noop,remove:noop,toggle:noop},focus:noop};
const box={console,Math,Set,window:{},document:{querySelector:element,querySelectorAll:()=>[],body:element('body'),addEventListener:noop},navigator:{},addEventListener:noop,requestAnimationFrame:noop};
const expose=`window.qa={beginCounting,skipCinema,collectCount,stepPhysics,updateParticles,worldLabels,reset,
get player(){return player},get orb(){return orb},get lights(){return countLights},get particles(){return particles},get value(){return countValue},get checkpoint(){return checkpoint},get cinema(){return cinema},
play(){mode='play';cinema.stage=null;},setTime(value){t=value;},clearParticles(){particles=[];}};})();`;
vm.runInNewContext(fs.readFileSync('dist/game.js','utf8').replace('})();',expose),box);
const q=box.window.qa,input={axis:0,jump:false,jp:false,act:false,pp:false};
q.beginCounting();
function touch(n,airborne=false){const light=q.lights[n-1];Object.assign(q.player,{x:light.x-19,y:light.y-(airborne?140:62),vx:0,vy:0,ground:!airborne,on:null,rope:null});q.collectCount();}
touch(1);assert.equal(q.value,0,'cinematic cannot collect a light');q.skipCinema();q.play();
touch(2);assert.equal(q.value,0,'touching a later light does not advance the count');
Object.assign(q.player,{x:q.lights[0].x-19,y:q.lights[0].y-230});q.collectCount();assert.equal(q.value,0,'no activation above the number');
Object.assign(q.player,{x:q.lights[0].x-120,y:q.lights[0].y-62});q.collectCount();assert.equal(q.value,0,'nearby is not contact');
for(let n=1;n<=6;n++){
  q.setTime(n*4);touch(n,n===1);assert.equal(q.value,n,'contact activates without action input');
  const magic=q.particles.filter(p=>p.magic);assert(magic.some(p=>p.magic==='player')&&magic.some(p=>p.magic==='orb'),'both companions receive magic');
  const amount=magic.length;touch(n);assert.equal(q.particles.filter(p=>p.magic).length,amount,'a lit light cannot repeat its effect');
  if(n===1){
    q.updateParticles(.6);const particle=q.particles.find(p=>p.magic==='player'),before={x:particle.x,y:particle.y};
    q.player.x+=90;q.player.y-=20;q.updateParticles(0);assert.equal(particle.x-before.x,90);assert.equal(particle.y-before.y,-20);
    assert(q.particles.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y)&&Number.isFinite(p.z)&&p.opacity>=0&&p.opacity<=1),'finite, smoothly faded 3D ribbons');
    q.worldLabels();assert(!drawn.includes('E')&&!drawn.includes('Ⓧ'),'counting no longer asks for an action button');
  }
  if(n<6){
    Object.assign(q.player,{x:q.lights[n-1].x+200,y:1100,vx:0,vy:0,on:null,ground:false});
    q.stepPhysics(1/120,input,false);
    assert.equal(q.player.x,q.lights[n-1].homeX,'fall returns to the last activated number');
    assert.equal(q.player.y,q.lights[n-1].y-62);assert.equal(q.value,n,'fall keeps progress');
    assert(q.lights.slice(0,n).every(v=>v.lit),'earlier lights stay on');
  }
  q.updateParticles(4);assert.equal(q.particles.filter(p=>p.magic).length,0,'magic expires instead of accumulating');
}
assert.equal(q.cinema.stage,'ageReveal','touching six starts the reveal');
q.reset();assert.equal(q.value,0);assert(!q.particles.some(p=>p.magic),'restart clears effects');
console.log('PASS: contact/airborne activation without buttons, ordered unique lights, all checkpoints, no action prompt, following magic on both companions and cleanup');
