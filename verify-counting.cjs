const assert=require('assert');
const {g,tick}=require('./verify-movement.cjs');
g.reset();tick(3000);g.unlockLetters();g.setPos(6300,558);g.beginCounting();tick(1600);g.clearTalk();
assert(g.state.countActive);assert.equal(g.state.cinema.stage,null);
function jump(fromX,toX){const from=g.plats.find(p=>p.x===fromX),to=g.plats.find(p=>p.x===toX);assert(from&&to);let landed=false;
for(const delay of [24,36,48,60]){for(const offset of [50,85,120]){for(const p of g.plats)if(p.kind==='crumble')Object.assign(p,{y:p.baseY,age:0,falling:false,recover:0});
g.setPos(from.x+from.w-offset,from.y-62);g.p.ground=true;g.p.on=from;
for(let n=0;n<240;n++){const dx=to.x+to.w/2-g.p.x-19;g.update(1/120,{axis:Math.abs(dx)>12?Math.sign(dx):0,jump:true,jp:n===0||n===delay,act:false,pp:false});if(g.p.ground&&g.p.on===to){landed=true;break;}if(n>12&&g.p.ground)break;}if(landed)break;}if(landed)break;}
assert(landed,`counting route ${fromX} -> ${toX}`);}
function light(n){const v=g.lights[n-1];g.setPos(v.x-19,v.y-62);g.p.ground=true;tick(1,{act:true});}
light(2);assert.equal(g.state.countValue,0,'lights cannot be activated out of order');
jump(6520,7060);light(1);assert.equal(g.state.countValue,1);light(1);assert.equal(g.state.countValue,1,'no duplicate counting');
jump(7060,7540);jump(7540,7850);light(2);
assert(g.state.queue.some(l=>l.text==='Dos…')||g.state.dialog?.text==='Dos…','point counts during gameplay');
g.setPos(8300,1100);tick(1);assert.equal(g.p.x,7910);assert.equal(g.state.countValue,2,'fall preserves activated lights');
jump(7850,8350);jump(8350,8690);light(3);
jump(8690,9230);jump(9230,9520);jump(9520,9840);
const enemy=g.enemies.find(e=>e.min===9940);g.setPos(enemy.x,enemy.y-65);g.p.vy=350;tick(5,{jump:true});assert(!enemy.alive,'enemy on the fourth terrace can be stomped');light(4);
jump(9840,10500);jump(10500,10820);light(5);
assert.equal(g.plats.filter(p=>p.kind==='light').length,6,'point creates six bridge pieces');
for(const [a,b] of [[10820,11330],[11330,11485],[11485,11640],[11640,11795],[11795,11950],[11950,12105],[12105,12360]])jump(a,b);
light(6);assert.equal(g.state.countValue,6);assert.equal(g.state.cinema.stage,'ageReveal');assert(g.state.queue.some(v=>v.text==='Tenés seis años.'));assert(g.state.queue.every(v=>v.speaker!=='VOS'));
const x=g.p.x;tick(180,{axis:1,jump:true,jp:true});assert(Math.abs(g.p.x-x)<1,'age reveal owns controls');g.render();tick(4300);
assert(!g.state.countActive&&g.state.countComplete,'age reveal leads to next adventure');assert(g.p.x>=6520&&g.p.x<6600);assert(g.state.flags.calmDone,'old spoken age exchange is skipped');assert.equal(g.state.chapterFade,0);
g.reset();assert.equal(g.state.countValue,0);assert.equal(g.lights.length,0);assert(g.state.questActive,'replay begins at letters');
console.log('PASS: automatic chapter transition, ordered counting, 16 platform jumps, moving and fragile platforms, stomp, checkpoints, six-piece bridge, silent-player age reveal and replay');
