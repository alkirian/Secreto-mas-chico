const assert=require('assert');
const {g,tick}=require('./verify-movement.cjs');
g.reset();tick(3000);g.clearTalk();g.enemies.forEach(e=>e.alive=false);
function restore(){for(const p of g.plats)if(p.kind==='crumble')Object.assign(p,{y:p.baseY,age:0,falling:false,recover:0});}
function jump(fromX,toX){const from=g.plats.find(p=>p.x===fromX),to=g.plats.find(p=>p.x===toX);let landed=false;
for(const delay of [24,36,48,60]){for(const offset of [50,85,120]){restore();g.setPos(from.x+from.w-offset,from.y-62);g.p.ground=true;g.p.on=from;
for(let n=0;n<230;n++){const dx=to.x+to.w/2-g.p.x-19;g.stepPhysics(1/120,{axis:Math.abs(dx)>12?Math.sign(dx):0,jump:true,jp:n===0||n===delay,act:false},false);if(g.p.ground&&g.p.on===to){landed=true;break;}if(n>12&&g.p.ground)break;}if(landed)break;}if(landed)break;}assert(landed,`letter route ${fromX} -> ${toX}`);}
for(const pair of [[-500,840],[840,1170],[1920,2180],[2180,2490],[2490,2790],[2790,3290],[3290,3590],[3590,3890],[3890,4190],[4190,4490]])jump(...pair);
// Climb the shaft by alternating actual contacts with both walls.
g.setPos(1780,668);g.p.ground=true;let axis=1,left=false,right=false,escaped=false;
for(let n=0;n<2600;n++){const contact=g.p.wall;if(contact){left ||= contact===-1;right ||= contact===1;axis=-contact;}
if(g.p.y+62<180)axis=1;
g.stepPhysics(1/120,{axis,jump:true,jp:n===0||!!contact,act:false},false);
if(g.p.ground&&g.p.on?.x===1920){escaped=true;break;}}
assert(left&&right&&escaped,'alternating wall jumps reach shaft exit');
restore();const fragile=g.plats.find(p=>p.kind==='crumble');g.setPos(fragile.x+40,fragile.y-63);g.p.vy=100;tick(2,{},true);assert(fragile.age>0,'landing starts warning');tick(82,{},true);assert(fragile.falling,'fragile platform falls');g.setPos(4510,558);tick(400,{},true);assert(!fragile.falling&&fragile.y===fragile.baseY,'platform reforms for retries');
g.setPos(6040,558);tick(30,{axis:1},true);assert(g.p.x<=6032,'closed timed door blocks');
g.setPos(4800,558);g.p.ground=true;tick(1,{act:true},true);assert(g.state.doorTime>7,'button opens door');
let jumpAge=-1;
for(let n=0;n<850&&!g.state.doorPassed;n++){let jp=false;const obstacle=g.walls.find(w=>w.x>=5100&&w.x>g.p.x&&w.x-g.p.x<155);
if(g.p.ground&&obstacle){jp=true;jumpAge=0;}else if(jumpAge>=0){jumpAge++;if(jumpAge===35)jp=true;}
g.stepPhysics(1/120,{axis:1,jump:true,jp,act:false},false);}
assert(g.state.doorPassed,'obstacle sprint reaches door before timeout');
for(const item of g.letters){g.setPos(item.x-19,item.y-50);tick(1,{},true);}
assert(g.state.lettersComplete,'all four letters unlock name dialogue');assert(g.state.queue.some(l=>l.text==='Coti.'),'name reveal plays');
g.reset();tick(3000);g.clearTalk();g.setPos(4800,558);g.p.ground=true;tick(1,{act:true},true);tick(930,{},true);assert.equal(g.state.doorTime,0,'door closes on timeout');tick(1,{act:true},true);assert(g.state.doorTime>7,'button can reopen door');
console.log('PASS: separated letters, ten jumps, alternating wall shaft, falling platforms, timed obstacle sprint, timeout and retry');
