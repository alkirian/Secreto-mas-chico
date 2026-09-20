const fs=require('fs'),vm=require('vm'),assert=require('assert');
const noop=()=>{},ctx=new Proxy({measureText:s=>({width:s.length*16}),createLinearGradient:()=>({addColorStop:noop}),createRadialGradient:()=>({addColorStop:noop})},{get:(o,k)=>o[k]||noop,set:(o,k,v)=>(o[k]=v,true)}),els={};
const element=s=>els[s]??=(s==='#game'?{getContext:()=>ctx}:{classList:{add:noop,remove:noop},focus:noop});
const sandbox={console,Math,Set,document:{querySelector:element,querySelectorAll:()=>[],body:{classList:{add:noop,remove:noop}},addEventListener:noop},navigator:{},window:{},addEventListener:noop,requestAnimationFrame:noop};
let src=fs.readFileSync('dist/game.js','utf8').replace('})();','window.test={continueAfterCounting,skipCinema,leaveLetterQuest,beginCounting,update,start,reset,render,stepPhysics,respawn,get p(){return player},get plats(){return platforms},get walls(){return walls},get ropes(){return ropes},get enemies(){return enemies},get letters(){return letters},get lights(){return countLights},get state(){return {coop,mode,gate,switchOn,bridge,finalBridge,flags,checkpoint,queue,dialog,cinema,orb,lettersComplete,questActive,doorTime,doorPassed,countActive,countValue,countComplete,chapterFade}},unlockLetters(){letters.forEach(item=>item.collected=true);lettersComplete=true;},setPos(x,y){Object.assign(player,{x,y,vx:0,vy:0,ground:false,on:null,wall:0,wallLock:0,rope:null,airJump:true,invincible:0});buffer=coyote=0;},clearTalk(){queue=[];dialog=null;}};})();');vm.runInNewContext(src,sandbox);
const g=sandbox.window.test,I={axis:0,jump:false,jp:false,act:false,pp:false};
const tick=(n,inp={},physics=false)=>{for(let i=0;i<n;i++){const v={...I,...inp,jp:i===0&&!!inp.jp,act:i===0&&!!inp.act};physics?g.stepPhysics(1/120,v,false):g.update(1/120,v);}};
g.start();tick(2800);assert(g.p.ground);tick(35,{jump:true,jp:true});const beforeSecond=g.p.y;tick(25,{jump:true,jp:true});assert(g.p.y<beforeSecond-70,'second jump gains height');assert.equal(g.p.airJump,false);const v=g.p.vy;tick(1,{jump:true,jp:true});assert(g.p.vy>v,'third jump denied');tick(180);assert(g.p.ground);
// Subsequent adventure checks start after the dedicated letter stage.
g.leaveLetterQuest();
g.setPos(1000,1050);tick(1);assert.equal(g.p.x,1950,'fall respawn');
g.setPos(2200,590);tick(1);assert(g.state.bridge);g.setPos(3110,620);tick(1,{act:true});assert(!g.state.gate,'wrong number');g.setPos(3330,620);tick(1,{act:true});assert(g.state.gate,'correct number');g.setPos(5250,708);tick(1,{act:true});assert(g.state.switchOn,'maze switch');
g.clearTalk();g.setPos(5900,640);tick(1);tick(4000);assert(g.state.flags.calmDone,'calm resolves');
for(const w of g.walls)for(const side of [1,-1]){
const x=side===1?w.x-38:w.x+w.w;
function contact(){g.setPos(x,w.y+70);g.p.vy=500;tick(1,{axis:side},true);assert.equal(g.p.wall,side);assert(g.p.vy<=120);}
contact();const y=g.p.y;tick(12,{axis:side,jump:true,jp:true},true);
assert.equal(g.p.x,x,'holding toward the wall climbs without forced backward movement');
assert(g.p.y<y-50);assert(g.p.airJump,'wall jump restores aerial jump');assert.equal(g.p.wallLock,0,'wall jump does not lock steering');
tick(1,{axis:-side,jump:true},true);assert((g.p.x-x)*side<0,'player can immediately steer away');
contact();tick(12,{axis:0,jump:true,jp:true},true);assert.equal(g.p.x,x,'neutral wall jump goes straight up');
contact();tick(1,{axis:-side,jump:true,jp:true},true);assert(g.p.vx*side<0,'jumping away follows requested direction');
}
for(const r of g.ropes){g.setPos(r.tipX-19,r.tipY-12);g.p.ropeCooldown=0;tick(1,{act:true},true);assert.equal(g.p.rope,r);tick(70,{axis:1},true);const x=g.p.x;tick(1,{axis:1,jp:true,jump:true},true);assert(!g.p.rope);assert(g.p.vy<0);assert(g.p.vx>100,'rope launch transfers speed');tick(20,{axis:1,jump:true},true);assert(g.p.x>x);tick(1,{jp:true,jump:true},true);assert.equal(g.p.airJump,false);}
const e=g.enemies[0];g.setPos(e.x,e.y-65);g.p.vy=350;tick(5,{jump:true},true);assert(!e.alive);assert(g.p.vy<0,'stomp bounce');const other=g.enemies[1];g.setPos(other.x-20,other.y);tick(1,{},true);assert.equal(g.p.x,g.state.checkpoint.x,'side collision');assert(g.p.invincible>0);
g.setPos(6500,638);tick(1);assert(g.state.finalBridge);g.setPos(14550,588);tick(2);assert(g.state.flags.finale);tick(7000);assert.equal(g.state.mode,'end');g.render();const count=g.plats.length;g.reset();assert(g.state.questActive,'restart returns to letter quest');assert(g.enemies.every(e=>e.alive));assert.equal(g.ropes.length,0);assert(!g.state.gate);
console.log('PASS: double jump, third-jump limit, landing, respawn, puzzle, maze, both walls, both ropes, stomp, damage, final and reset');
module.exports={g,tick};


