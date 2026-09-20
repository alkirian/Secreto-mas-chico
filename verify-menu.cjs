const fs=require('fs'),vm=require('vm'),assert=require('assert');
const noop=()=>{},ctx=new Proxy({measureText:s=>({width:s.length*16}),createLinearGradient:()=>({addColorStop:noop}),createRadialGradient:()=>({addColorStop:noop})},{get:(o,k)=>o[k]||noop,set:(o,k,v)=>(o[k]=v,true)}),els={};
const element=s=>els[s]??=(s==='#game'?{getContext:()=>ctx}:{classList:{add:noop,remove:noop},focus:noop});
const sandbox={console,Math,Set,document:{querySelector:element,querySelectorAll:()=>[],body:{classList:{add:noop,remove:noop}},addEventListener:noop},navigator:{},window:{},addEventListener:noop,requestAnimationFrame:noop};
let src=fs.readFileSync('dist/game.js','utf8').replace('})();','window.test={update,start,reset,render,stepPhysics,respawn,get p(){return player},get plats(){return platforms},get walls(){return walls},get ropes(){return ropes},get enemies(){return enemies},get letters(){return letters},get state(){return {entrance,mode,gate,switchOn,bridge,finalBridge,flags,checkpoint,queue,dialog,cinema,orb,lettersComplete}},setPos(x,y){Object.assign(player,{x,y,vx:0,vy:0,ground:false,on:null,wall:0,wallLock:0,rope:null,airJump:true,invincible:0});buffer=coyote=0;},clearTalk(){queue=[];dialog=null;}};})();');vm.runInNewContext(src,sandbox);
const g=sandbox.window.test,I={axis:0,jump:false,jp:false,act:false,pp:false};
const tick=(n,inp={},physics=false)=>{for(let i=0;i<n;i++){const v={...I,...inp,jp:i===0&&!!inp.jp,act:i===0&&!!inp.act};physics?g.stepPhysics(1/120,v,false):g.update(1/120,v);}};

assert.equal(g.state.mode,'title');tick(600);assert.equal(g.p.x,180);
g.start();const initialX=g.p.x,initialY=g.p.y;let previousBlend=0;
for(let frame=0;frame<120;frame++){tick(1,{axis:1,jump:true,jp:true});const blend=g.state.cinema.blend;assert(blend>=previousBlend&&blend-previousBlend<.01,'cinematic bars ease in without a cut');previousBlend=blend;}
assert(g.state.cinema.blend>.25,'cinematic framing is already entering during the reveal');assert.equal(g.p.x,initialX,'reveal locks movement');assert(g.state.entrance>0&&g.state.entrance<1);assert.equal(g.state.cinema.time,0,'dialogue waits for reveal');
const reveal=g.state.entrance;g.start();assert.equal(g.state.entrance,reveal,'double activation cannot restart reveal');
tick(1,{pp:true});const paused=g.state.entrance;tick(60);assert.equal(g.state.entrance,paused,'pause freezes reveal');tick(1,{pp:true});
for(let frame=0;frame<240;frame++){const previous=g.state.cinema.blend;tick(1);assert(Math.abs(g.state.cinema.blend-previous)<.01,'no framing jump at the reveal boundary');assert.equal(g.p.y,initialY,'hero stays grounded across menu and cinema');assert.equal(g.p.squash,0,'intro does not trigger a landing animation');}
assert.equal(g.state.entrance,0);assert(g.state.cinema.blend>.99,'camera stays continuous into intro');assert.equal(g.state.cinema.stage,'intro');
tick(2200);assert.equal(g.state.cinema.stage,null);tick(60,{axis:1});assert(g.p.x>initialX+40,'gameplay follows intro');g.reset();assert.equal(g.state.cinema.stage,'intro');assert.equal(g.state.entrance,0,'restart goes directly to intro');console.log('PASS: menu, reveal, input lock, double activation, pause, camera continuity, intro and replay');
