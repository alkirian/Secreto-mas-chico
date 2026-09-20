const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const drawn=[],elements={},noop=()=>{};
const ctx=new Proxy({fillText:s=>drawn.push(s),measureText:s=>({width:s.length*12}),createLinearGradient:()=>({addColorStop:noop}),createRadialGradient:()=>({addColorStop:noop})},{get:(o,k)=>o[k]||noop,set:(o,k,v)=>(o[k]=v,true)});
const element=s=>elements[s]??={getContext:()=>ctx,classList:{add:noop,remove:noop},focus:noop};
let visualSpeaker;
const box={console,Math,Set,window:{secretWorld:{draw:s=>visualSpeaker=s.speaker}},document:{querySelector:element,querySelectorAll:()=>[],body:element('body'),addEventListener:noop},navigator:{},addEventListener:noop,requestAnimationFrame:noop};
const expose=`window.qaText={say,beginCinema,coopDialogue,bubble,cinematicOverlay,render,showHint,
pop(){dialog=queue.shift();if(dialog)dialog.left=dialog.d;},clear(){dialog=null;queue=[];},
get queue(){return queue;},get voice(){return chapterVoice;},
coopBridge(){continueAfterCounting();skipCinema();mode='play';queue=[];dialog=null;const p=platforms.find(p=>p.coopStep===1);player.x=p.x-100;orb.x=p.x+p.w/2;orb.y=p.y-85;for(let i=0;i<80;i++)guidePlatform(1/60,'coopStep');return {bridge:coop.bridge,hidden:p.hidden};},
play(){mode='play';cinema.stage=null;cinema.blend=0;entrance=0;},setDialog(d){dialog=d;cinema.blend=1;}
};})();`;
vm.runInNewContext(fs.readFileSync('dist/game.js','utf8').replace('})();',expose),box);
const q=box.window.qaText;
q.say(['Voy adelante. Vos seguime.']);q.pop();q.bubble();assert.equal(drawn.length,0,'unrecorded orb dialogue is hidden');
q.clear();q.say(['Uno…'],'number');q.pop();q.bubble();assert(drawn.includes('Uno…'),'recorded counting retains its subtitle');
drawn.length=0;
q.setDialog({text:'Sin grabación',speaker:'VOS'});q.cinematicOverlay();assert.equal(drawn.length,0,'unrecorded cinematic subtitles are hidden');
q.beginCinema('intro',[{text:'Hola. Necesito ayuda.',d:2.35}]);assert.equal(q.queue[0].voice,'intro');q.pop();q.bubble();assert(drawn.includes('Hola. Necesito ayuda.'));
q.beginCinema('coopIntro',q.coopDialogue());
assert.equal(q.voice.lines.length,4,'all four recorded cooperation lines are subtitled');
assert(q.voice.lines.every(line=>line.voice==='coopIntro'));
assert.equal(q.queue.length,0,'recorded lines must not run again as a silent tail');
drawn.length=0;
const bridge=q.coopBridge();assert.equal(bridge.bridge,1);assert.equal(bridge.hidden,false,'bridge formation remains functional');
assert.equal(q.queue[0].text,'Uno…');assert(!q.queue[0].voice,'bridge counting has no recording');
q.pop();q.play();q.showHint('Texto de gameplay sin audio');q.render();
assert(!drawn.some(s=>s.includes('Uno')||s.includes('PUENTE')||s.includes('Texto de gameplay')||s.includes('ETAPA')),'silent bridge narration, HUD and hints are not drawn');
assert.equal(visualSpeaker,null,'orb does not talk visually for an unrecorded line');
console.log('PASS: recorded subtitles retained; silent bridge counting, dialogue, HUD and hints hidden; bridge progression unchanged');
