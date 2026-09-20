import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createBoy} from './src/boy.js';

// Only canvas painting is stubbed; geometry, joints and transforms are real Three.js.
const noop=()=>{};
globalThis.document={createElement:()=>({getContext:()=>new Proxy({createRadialGradient:()=>({addColorStop:noop})},{get:(o,k)=>o[k]||noop,set:(o,k,v)=>(o[k]=v,true)})})};
const state=()=>({t:0,player:{x:0,y:0,ground:true,face:1,vx:0,vy:0},orb:{x:130,y:-15,z:65},cinema:{stage:'intro'}});
function tick(b,s,n=120,rate=60){for(let i=0;i<n;i++){s.t+=1/rate;b.update(s);}b.root.updateMatrixWorld(true);}
const boy=createBoy(),s=state();
for(const stage of ['intro','name','ageIntro','ageReveal','coopIntro','coopOutro','middle','final']){
  s.cinema.stage=stage;
  for(const [dx,dy,dz] of [[100,0,60],[-100,-20,50],[15,30,-120],[-5,-30,-120]]){
    s.orb={x:19+dx,y:-6+dy,z:25+dz};tick(boy,s,180);
    const target=new THREE.Vector3(s.orb.x,900-s.orb.y,s.orb.z);
    const forward=new THREE.Vector3(0,0,1).transformDirection(boy.root.matrixWorld);
    const bodyTarget=target.clone().sub(boy.root.position);bodyTarget.y=0;bodyTarget.normalize();
    assert(forward.angleTo(bodyTarget)<.025,`${stage}: body faces orb including its depth`);
    const eyeOrigin=boy.head.localToWorld(new THREE.Vector3(0,13,0));
    const gaze=new THREE.Vector3(0,0,1).transformDirection(boy.head.matrixWorld);
    assert(gaze.angleTo(target.sub(eyeOrigin).normalize())<.12,`${stage}: head tracks orb height and depth`);
  }
}
s.orb={x:19,y:-6,z:125};tick(boy,s,180);
let previousYaw=boy.root.rotation.y,maxTurn=0;
for(let i=0;i<720;i++){
  s.orb.x=19+Math.sin(i/120)*100;s.orb.z=25+Math.cos(i/120)*100;
  tick(boy,s,1);maxTurn=Math.max(maxTurn,Math.abs(boy.root.rotation.y-previousYaw));previousYaw=boy.root.rotation.y;
}
assert(maxTurn<.2,'orb crossing the back does not snap the body through a full turn');

// Compare the same movement at different frame rates, including feet clearance.
function running(rate){const b=createBoy(),st=state();st.cinema.stage=null;st.player.vx=320;tick(b,st,rate*3,rate);return {b,st};}
const slow=running(30),fast=running(120);
assert(Math.abs(slow.b.root.rotation.y-fast.b.root.rotation.y)<.025,'turning is frame rate independent');
assert(Math.abs(slow.b.legs[0].thigh.rotation.x-fast.b.legs[0].thigh.rotation.x)<.16,'gait speed is frame rate independent');
const {b,st}=fast;let footMin=Infinity,footMax=-Infinity,kneeRange=[];
for(let i=0;i<120;i++){
  tick(b,st,1);kneeRange.push(b.legs[0].knee.rotation.x);
  for(const leg of b.legs){const foot=leg.ankle.localToWorld(new THREE.Vector3(0,-3.5,2));footMin=Math.min(footMin,foot.y-b.root.position.y);footMax=Math.max(footMax,foot.y-b.root.position.y);}
}
assert(footMin>-.8&&footMin<1.5,'support foot stays near the floor');
assert(footMax>4,'swinging foot clears the floor');
assert(Math.max(...kneeRange)-Math.min(...kneeRange)>.5,'knees articulate while running');
st.player.ground=false;st.player.vy=-500;tick(b,st,30);const takeoff=b.legs[1].knee.rotation.x;
st.player.vy=600;tick(b,st,30);assert(b.legs[1].knee.rotation.x<takeoff-.35,'descent opens the legs for landing');
st.player.ground=true;st.player.vx=0;st.player.vy=0;tick(b,st,120);
assert(Math.abs(b.legs[0].thigh.rotation.x)<.02,'running pose settles after stopping');
const transforms=()=>{const values=[];b.root.traverse(o=>values.push(...o.position,...o.quaternion,...o.scale));return values;};
const paused=transforms();for(let i=0;i<40;i++)b.update(st);assert.deepEqual(transforms(),paused,'paused time freezes the pose');
st.player.rope={};tick(b,st,60);assert(b.arms.every(a=>a.shoulder.rotation.x<-2.5),'rope pose raises both attached arms');
st.player.rope=null;st.player.ground=false;st.player.wall=1;tick(b,st,60);assert(b.arms.every(a=>a.shoulder.rotation.x<-1),'wall pose reaches forward');
assert(transforms().every(Number.isFinite),'all rig transforms remain finite');
console.log('PASS: 8 cinematic stages, 3D head/body tracking, continuous orbit, frame rates, run clearance, jumping, landing, pause, ropes and walls');
