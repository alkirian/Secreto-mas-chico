const assert=require('assert');
const {g,tick}=require('./verify-movement.cjs');
g.reset();tick(3000);g.clearTalk();g.enemies.forEach(e=>e.alive=false);
function restore(){for(const p of g.plats)if(p.kind==='crumble')Object.assign(p,{y:p.baseY,age:0,falling:false,recover:0});}
function jump(fromX,toX){const from=g.plats.find(p=>p.x===fromX),to=g.plats.find(p=>p.x===toX);let landed=false;
for(const delay of [24,36,48,60]){for(const offset of [50,85,120]){restore();g.setPos(from.x+from.w-offset,from.y-62);g.p.ground=true;g.p.on=from;
for(let n=0;n<230;n++){const dx=to.x+to.w/2-g.p.x-19;g.stepPhysics(1/120,{axis:Math.abs(dx)>12?Math.sign(dx):0,jump:true,jp:n===0||n===delay,act:false},false);if(g.p.ground&&g.p.on===to){landed=true;break;}if(n>12&&g.p.ground)break;}if(landed)break;}if(landed)break;}assert(landed,`letter route ${fromX} -> ${toX}`);}
for(const pair of [[-500,840],[840,1170],[1920,2180],[2180,2490],[2490,2790],[2790,3290],[3290,3590],[3590,3890],[3890,4190],[4190,4490]])jump(...pair);
// Walking into the roots grabs the vine, with no timing or action button.
g.setPos(1740,668);g.p.ground=true;
for(let n=0;n<100&&!g.p.vine;n++)g.stepPhysics(1/120,{axis:1,jump:false,jp:false,act:false},false);
assert(g.p.vine,'approaching roots automatically grabs the vine');
tick(100,{jump:true},true);const restingY=g.p.y;
assert(restingY<550,'holding jump climbs');tick(240,{},true);
assert.equal(g.p.y,restingY,'letting go rests without slipping');
g.stepPhysics(1/120,{axis:1,jump:true,jp:true,act:true},true);
assert(g.p.vine&&g.p.y===restingY,'locked controls preserve the grip');
tick(30,{down:true},true);assert(g.p.y>restingY+40,'down gently descends');
tick(1,{act:true,axis:-1},true);assert(!g.p.vine,'action releases grip');
tick(10,{},true);assert(!g.p.vine,'release cooldown prevents immediate re-grab');
g.setPos(1861,450);g.p.vineCooldown=0;tick(1,{},true);assert(g.p.vine);
g.respawn();assert(!g.p.vine,'respawn clears grip');
g.setPos(1861,668);g.p.vineCooldown=0;tick(1,{},true);tick(400,{jump:true},true);
assert(!g.p.vine&&g.p.ground&&g.p.on?.x===1920,'holding jump alone reaches the exit ledge');
assert.equal(g.state.checkpoint.x,1950,'summit saves a checkpoint');
g.setPos(1950,1050);tick(1,{},true);assert.equal(g.p.x,1950,'fall after summit returns to its ledge');
restore();const fragile=g.plats.find(p=>p.kind==='crumble');g.setPos(fragile.x+40,fragile.y-63);g.p.vy=100;tick(2,{},true);assert(fragile.age>0,'landing starts warning');tick(82,{},true);assert(fragile.falling,'fragile platform falls');g.setPos(4510,558);tick(400,{},true);assert(!fragile.falling&&fragile.y===fragile.baseY,'platform reforms for retries');
g.setPos(6040,558);tick(30,{axis:1},true);assert(g.p.x<=6032,'closed door blocks');
g.setPos(4800,558);g.p.ground=true;tick(1,{act:true},true);assert(g.state.doorOpen,'lever opens door');
let jumpAge=-1;
for(let n=0;n<850&&!g.state.doorPassed;n++){let jp=false;const obstacle=g.walls.find(w=>w.x>=5100&&w.x>g.p.x&&w.x-g.p.x<155);
if(g.p.ground&&obstacle){jp=true;jumpAge=0;}else if(jumpAge>=0){jumpAge++;if(jumpAge===35)jp=true;}
g.stepPhysics(1/120,{axis:1,jump:true,jp,act:false},false);}
assert(g.state.doorPassed,'obstacle route reaches the open door');
for(const item of g.letters){g.setPos(item.x-19,item.y-50);tick(1,{},true);}
assert(g.state.lettersComplete,'all four letters unlock name dialogue');assert.equal(g.state.cinema.stage,'name','name discovery enters cinematic mode');assert.equal(g.state.dialog.text,'','cinematic opens before the first line');assert(g.state.dialog.left<.2,'voice starts with the cinematic');assert.deepEqual(Array.from(g.state.queue,l=>l.text),['Coti.','¿Ese es tu nombre?','No sabía que las letras podían guardar a alguien.','Algún día quisiera aprender a leer como vos.']);
const discoveryX=g.p.x;tick(1450,{axis:1,jp:true,jump:true});assert.equal(g.state.cinema.stage,'ageIntro','name cinematic leads directly to age question');assert(g.state.countActive&&!g.state.questActive,'second stage opens automatically');assert(Math.abs(g.p.x-discoveryX)<1,'transition retains player position and blocks input');assert(g.state.queue.every(v=>v.speaker!=='VOS'),'only the point speaks');tick(1800);assert.equal(g.state.cinema.stage,null,'counting begins after the question');assert(!g.state.flags.numbers&&!g.state.flags.calm,'legacy story does not interrupt the new stage');
g.reset();tick(3000);g.clearTalk();g.setPos(4800,558);g.p.ground=true;tick(1,{act:true},true);tick(7200,{},true);assert(g.state.doorOpen,'door remains open after a full minute');tick(1,{act:true},true);assert(g.state.doorOpen,'repeated activation does not close door');g.respawn();assert(g.state.doorOpen,'respawn preserves the open door');g.setPos(6040,558);tick(60,{axis:1},true);assert(g.state.doorPassed,'door can be crossed long after activation');g.reset();assert(!g.state.doorOpen,'restart resets the lever and closes the door');
console.log('PASS: separated letters, ten jumps, automatic vine grip/climb/rest/descent/release/exit/checkpoint, falling platforms, obstacle route, permanent lever door, respawn and restart');
