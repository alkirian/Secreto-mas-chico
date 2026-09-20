const assert=require('assert');
const {g,tick}=require('./verify-movement.cjs');
g.reset();tick(3000);g.unlockLetters();g.setPos(12520,508);g.beginCounting();g.skipCinema();g.continueAfterCounting();g.skipCinema();
assert.equal(g.state.coop.open,false);
g.setPos(14980,508);tick(100,{axis:1});assert(g.p.x<15080,'closed door blocks the player');
g.setPos(14840,508);tick(500);assert(g.state.coop.open,'companion crosses while player holds plate');
g.setPos(14990,508);tick(90,{axis:1});assert(g.p.x>15170,'open door permits crossing');
function jump(fromX,toX){const from=g.plats.find(p=>p.x===fromX),to=g.plats.find(p=>p.x===toX);let landed=false;
for(const delay of [24,36,48,60]){for(const offset of [45,75,110]){
g.setPos(Math.min(from.x+from.w-offset,to.x-90),from.y-62);g.p.ground=true;g.p.on=from;tick(200);
for(let n=0;n<260;n++){const dx=to.x+to.w/2-g.p.x-19;g.update(1/120,{axis:Math.abs(dx)>10?Math.sign(dx):0,jump:true,jp:n===0||n===delay,act:false,pp:false});if(g.p.ground&&g.p.on===to){landed=true;break;}if(n>12&&g.p.ground)break;}if(landed)break;}if(landed)break;}
assert(landed,`cooperative route ${fromX} -> ${toX}`);}
for(const [a,b] of [[13160,13360],[13360,13640],[13640,13940],[13940,14240],[14240,14540],[14540,15600],[15600,15940],[15940,16360],[16360,16740]])jump(a,b);
g.setPos(17142,508);g.p.ground=true;let climbed=false;
for(let n=0;n<700;n++){g.update(1/120,{axis:1,jump:true,jp:n===0||!!g.p.wall,act:false,pp:false});if(g.p.ground&&g.p.on?.x===17250){climbed=true;break;}}
assert(climbed,'wall climb reaches bridge departure');
for(const [a,b] of [[17250,17700],[17700,17990],[17990,18280],[18280,18570],[18570,18860],[18860,19150],[19150,19400]])jump(a,b);
assert.equal(g.state.coop.bridge,6);assert(g.plats.filter(p=>p.coopStep).every(p=>!p.hidden));
tick(20);assert.equal(g.state.cinema.stage,'coopOutro');g.skipCinema();
g.setPos(20200,508);tick(3);assert.equal(g.state.cinema.stage,'final');tick(6500);assert.equal(g.state.mode,'end');
g.reset();assert.equal(g.state.coop,null,'restart clears cooperative progress');
console.log('PASS: cooperation plate and door, 16 platform jumps, wall climb, six illuminated bridge steps, ending and reset');
