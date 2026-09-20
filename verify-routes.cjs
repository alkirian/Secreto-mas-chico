const assert=require('assert');const {g,tick}=require('./verify-movement.cjs');g.leaveLetterQuest();g.unlockLetters();g.enemies.forEach(e=>e.alive=false);
function jumpRoute(fromX,toX){const from=g.plats.find(p=>p.x===fromX),to=g.plats.find(p=>p.x===toX);assert(from&&to);let success=false;
for(const delay of [20,30,40,50,60]){for(const offset of [55,85,120]){g.setPos(from.x+from.w-offset,from.y-62);g.p.ground=true;g.p.on=from;
for(let n=0;n<230;n++){const dx=to.x+to.w/2-(g.p.x+19);g.stepPhysics(1/120,{axis:Math.abs(dx)>14?Math.sign(dx):0,jump:true,jp:n===0||n===delay,act:false},false);if(g.p.ground&&g.p.on===to){success=true;break;}if(n>12&&g.p.ground)break;}if(success)break;}if(success)break;}assert(success,`Unreachable jump ${fromX} -> ${toX}`);}
for(const pair of [[1010,1160],[1160,1420],[1420,1700],[1700,1940],[6950,7200],[8200,8540],[8540,8820],[8820,9100],[9100,9700],[9700,10040],[10300,10560],[11600,12000],[12000,12390],[12390,12700],[12700,13090],[13090,13420],[13420,13830]])jumpRoute(...pair);
for(const w of g.walls){
// Steering toward the summit permits landing on the narrow wall from either side.
for(const side of [1,-1]){g.setPos(side===1?w.x-65:w.x+w.w+27,w.y+w.h-62);g.p.ground=true;let reached=false;
for(let n=0;n<1600;n++){const dx=w.x+w.w/2-(g.p.x+19),axis=g.p.y+62>w.y?side:Math.max(-1,Math.min(1,dx/50));g.stepPhysics(1/120,{axis,jump:true,jp:n===0||(!!g.p.wall&&n%24===0),act:false},false);if(g.p.ground&&g.p.on===w){reached=true;break;}}
assert(reached,'Wall summit must be reachable from either side');}
// Holding forward throughout the climb now carries the player to the next ledge.
const next=g.plats.find(p=>p.x>w.x+w.w&&p.y===w.y);assert(next);
g.setPos(w.x-65,w.y+w.h-62);g.p.ground=true;let advanced=false,previousX=g.p.x;
for(let n=0;n<500;n++){g.stepPhysics(1/120,{axis:1,jump:true,jp:n===0||!!g.p.wall,act:false},false);assert(g.p.x>=previousX,'wall climb never forces backward movement');previousX=g.p.x;if(g.p.ground&&g.p.on===next){advanced=true;break;}}
assert(advanced,'holding forward clears the wall and reaches the next ledge');
}
for(const [i,fromX,toX] of [[0,7200,8200],[1,10560,11600]]){const r=g.ropes[i],from=g.plats.find(p=>p.x===fromX),to=g.plats.find(p=>p.x===toX);r.angle=0;r.speed=0;r.tipX=r.x;r.tipY=r.y+r.len;g.setPos(from.x+from.w-55,from.y-62);g.p.ground=true;g.p.ropeCooldown=0;let attached=false,released=false,releaseAt=-1,landed=false;
for(let n=0;n<1600;n++){const near=Math.hypot(g.p.x+19-r.tipX,g.p.y+12-r.tipY)<85;const release=g.p.rope===r&&r.angle>.55&&r.speed>0;if(release){released=true;releaseAt=n;}
const dx=to.x+to.w/2-(g.p.x+19);g.stepPhysics(1/120,{axis:released?(Math.abs(dx)>15?Math.sign(dx):0):1,jump:true,jp:n===0||(!attached&&n===45)||release||(released&&n===releaseAt+38),act:near&&!attached},false);
attached ||= g.p.rope===r;if(g.p.ground&&g.p.on===to){landed=true;break;}if(n>100&&!g.p.rope&&g.p.x<from.x)break;}assert(attached,'Rope must be catchable from ledge');assert(landed,'Rope gap must be crossable');}
console.log('PASS: 17 actual platform trajectories, both complete wall climbs and both full rope crossings');
