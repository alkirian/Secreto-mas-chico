const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const calls=[],noop=()=>{};
const c=new Proxy({measureText:s=>({width:s.length*12}),createLinearGradient:()=>({addColorStop:noop}),createRadialGradient:()=>({addColorStop:noop})},{get:(o,k)=>o[k]||((...args)=>calls.push({op:k,args,color:o.fillStyle})),set:(o,k,v)=>(o[k]=v,true)});
const elements={};const element=id=>elements[id]??={getContext:()=>c,classList:{add:noop,remove:noop},focus:noop};
const box={window:{},document:{querySelector:element,querySelectorAll:()=>[],body:{classList:{add:noop,remove:noop}},addEventListener:noop},navigator:{},console,Math,Set,addEventListener:noop,requestAnimationFrame:noop};
vm.createContext(box);vm.runInContext(fs.readFileSync('src/scene2d.js','utf8'),box);
vm.runInContext(fs.readFileSync('dist/game.js','utf8').replace('})();','window.qa2d={state:scene2DState,beginCounting,continueAfterCounting,render};})();'),box);
const api=box.window.secretScene2D,game=box.window.qa2d;
const draw=(s,part='objects')=>{calls.length=0;const before=JSON.stringify(s);api[part](c,s);assert.equal(JSON.stringify(s),before,'drawing must not alter map or collisions');return calls;};
const rectAt=(x,y,w)=>calls.some(call=>call.op==='fillRect'&&call.args[0]===x&&call.args[1]===y&&(w===undefined||call.args[2]===w));
let s=game.state();
for(const letter of s.letters){draw({...s,cam:letter.x-800});assert(calls.some(call=>call.op==='fillText'&&call.args[0]===letter.char),'uncollected letter is visible');}
const collected={...s.letters[0],collected:true};draw({...s,cam:collected.x-800,letters:[collected]});assert(!calls.some(call=>call.op==='fillText'),'collected letter disappears');
draw({...s,cam:5300,doorTime:0});assert(rectAt(6070,260,72),'closed timed curtain matches the real door position');
draw({...s,cam:5300,doorTime:5});assert(!rectAt(6070,260,72),'open door is not drawn as solid');
draw({...s,cam:2800});assert(!rectAt(3734,400,72),'legacy number gate does not appear during the letter quest');
for(const p of s.platforms){draw({...s,cam:p.x-800,platforms:[p]},'terrain');assert(calls.some(call=>call.op==='translate'&&call.args[0]===p.x&&call.args[1]===p.y),'each real platform and wall uses its collider origin');}
game.beginCounting();s=game.state();
for(const item of s.countLights){draw({...s,cam:item.x-800});assert(calls.some(call=>call.op==='fillText'&&call.args[0]===String(item.n)),'number beacon is visible');assert(rectAt(item.x-50,item.y-10,100),'beacon stands at real activation point');}
game.continueAfterCounting();s=game.state();
draw({...s,cam:14400});assert(rectAt(14800,560,140),'cooperative pressure plate is visible');assert(calls.some(call=>call.op==='ellipse'&&call.args[0]===15240&&call.args[1]===535),'cooperative lamp is visible');
const hidden=s.platforms.find(p=>p.coopReveal);
draw({...s,cam:hidden.x-800,platforms:[hidden]},'terrain');assert.equal(calls.length,0,'unformed platforms stay invisible');
draw({...s,cam:hidden.x-800,platforms:[{...hidden,formation:.5}]},'terrain');assert(calls.some(call=>call.op==='translate'&&call.args[1]===hidden.y+175),'forming platforms rise toward their actual position');
draw({...s,cam:14800,platforms:s.walls.filter(p=>p.x===15080).map(p=>({...p,disabled:true}))},'terrain');assert.equal(calls.length,0,'opened cooperative walls disappear');
game.render();
console.log('PASS: shared collider coordinates, all letters and six beacons, timed gate, cooperation plate/lamp, formation, disabled walls, no stale gate and no state mutation');
