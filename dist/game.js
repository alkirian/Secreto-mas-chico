(()=>{'use strict';
const canvas=document.querySelector('#game'),c=canvas.getContext('2d'),W=1600,H=900,$=s=>document.querySelector(s),keys=new Set();
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),lerp=(a,b,t)=>a+(b-a)*t;
let mode='title',t=0,cam=0,last=0,acc=0,muted=false,audio,introAudio=null,nameAudio=null,musicAudio=null,beat=0,prevJump=false,prevAction=false,prevPause=false,buffer=0,coyote=0,shake=0,ending=0,dialog=null,queue=[],flags={},particles=[],platforms=[],checkpoint={x:180,y:660},padActive=false;
let walls=[],ropes=[],enemies=[],letters=[],lettersComplete=false,letterBanner=0,hint='',hintTime=0;
let entrance=1,questActive=true,doorTime=0,doorPassed=false;
const QUEST_DOOR=6070;
let cinema={stage:null,blend:0,time:0,closing:false},orbPhase=0;
let player={x:180,y:660,vx:0,vy:0,w:38,h:62,ground:false,face:1,squash:0},orb={x:340,y:560,vx:0,vy:0},gate=false,switchOn=false,bridge=false,finalBridge=false,selection=1,wrong=0;
function rect(x,y,w,h,kind='stone',extra={}){platforms.push({x,y,w,h,kind,...extra});}
function level(first=true){questActive=first;doorTime=0;doorPassed=false;platforms=[];walls=[];ropes=[];enemies=[];letters=[];lettersComplete=false;letterBanner=0;rect(-500,730,1350,400);rect(1010,700,380,400);rect(1510,640,270,450);rect(1910,690,500,400);rect(2460,600,220,38,'moving',{baseY:600,amp:55,speed:1.1});rect(2800,690,1070,500);rect(3890,710,460,450);rect(4410,610,200,32);rect(4690,510,210,32);rect(4950,410,300,32);rect(4380,770,1200,300);rect(5310,640,220,32);rect(5580,710,1070,400);
// Every elevated ledge belongs to a traversable upper route.
rect(1160,530,170,28);rect(1420,415,180,28);rect(1700,430,160,28);rect(1940,510,170,28);
letter('C',640,670);letter('O',1220,466);letter('T',1480,351);letter('I',1760,366);
rect(6470,710,540,340);wall(6950,350,90,360);rect(7200,350,220,34);
rope(7800,65,405);rect(8200,465,250,450);rect(8540,340,170,32);rect(8820,450,170,32);
rect(9100,570,420,400);rect(9700,470,180,34,'moving',{baseY:470,amp:65,speed:1.15});
rect(10040,560,300,400);wall(10300,220,85,340);rect(10560,220,240,32);
rope(11180,25,350);rect(11600,390,270,500);rect(12000,530,220,360);
rect(12390,410,190,32);rect(12700,540,220,360);rect(13090,400,180,32,'moving',{baseY:400,amp:50,speed:1});
rect(13420,540,250,360);rect(13830,650,3400,400);
enemy(1120,700,1035,1330);enemy(1990,690,1940,2350);enemy(4220,710,3950,4310);
enemy(4600,770,4440,4860);enemy(8260,465,8210,8390);enemy(9200,570,9130,9460);
enemy(11680,390,11620,11810);enemy(12760,540,12720,12860);enemy(13500,540,13440,13600);
if(first)buildLetterQuest();
}
function buildLetterQuest(){
platforms=[];walls=[];ropes=[];enemies=[];letters=[];
rect(-500,730,1200,400);wall(500,630,65,100);rect(840,670,200,400);rect(1170,620,360,450);
letter('C',1350,558);
rect(1530,730,480,400);wall(1650,180,70,390);wall(1920,180,70,550);
rect(2180,260,180,32);rect(2490,350,180,32);rect(2790,410,340,400);letter('O',2950,348);
for(const [x,y] of [[3290,430],[3590,470],[3890,410],[4190,490]])rect(x,y,160,28,'crumble',{baseY:y,age:0,falling:false,recover:0});
rect(4490,620,570,420);letter('T',4600,558);
rect(5060,620,1500,440);wall(5160,500,70,120);wall(5490,455,80,165);wall(5820,510,70,110);
letter('I',6300,558);enemy(920,670,855,990);
}
function leaveLetterQuest(){const name=letters;level(false);letters=name;lettersComplete=true;checkpoint={x:1950,y:628};Object.assign(player,{x:1950,y:628,vx:0,vy:0,on:null,ground:false});cam=1380;orb.x=2060;orb.y=600;orb.vx=orb.vy=0;}
function updateQuest(dt,I){
doorTime=Math.max(0,doorTime-dt);
for(const p of platforms.filter(p=>p.kind==='crumble')){
if(p.falling){p.recover+=dt;p.y+=650*dt;if(p.recover>3){p.y=p.baseY;p.age=0;p.falling=false;p.recover=0;}}
else if(p.age>0){p.age+=dt;if(p.age>.65){p.falling=true;burst(p.x+p.w/2,p.y,'#e8b376',12);}}
}
if(player.ground&&player.x>4740&&player.x<4920&&I.act){doorTime=7.5;showHint('¡La puerta está abierta! Tenés 7,5 segundos.');tone(830,.2);}
if(player.x>QUEST_DOOR+65&&doorTime>0)doorPassed=true;
if(!doorPassed&&doorTime===0&&player.x+38>QUEST_DOOR)player.x=QUEST_DOOR-38;
for(const spot of [{id:'qC',x:1250,y:558,end:1500},{id:'qO',x:2850,y:348,end:3070},{id:'qT',x:4510,y:558,end:4800}])event(spot.id,player.ground&&player.x>=spot.x&&player.x<spot.end&&Math.abs(player.y-spot.y)<8,()=>{checkpoint={x:spot.x,y:spot.y};});
event('qWalls',player.x>1500,()=>showHint('Entrá por debajo · Saltá de una pared a la otra'));
event('qFragile',player.x>2850,()=>showHint('Las plataformas doradas caen al pisarlas. ¡Seguí saltando!'));
event('qButton',player.x>4670,()=>showHint('E / Ⓧ sobre el botón · Abrí la puerta y corré'));
if(lettersComplete&&player.x>6460&&!dialog&&!queue.length)leaveLetterQuest();
}
function wall(x,y,w,h){const p={x,y,w,h,kind:'wall',solid:true};walls.push(p);platforms.push(p);}
function rope(x,y,len){ropes.push({x,y,len,angle:-.45,speed:0,tipX:x-Math.sin(.45)*len,tipY:y+Math.cos(.45)*len});}
function enemy(x,floor,min,max){enemies.push({x,y:floor-36,w:46,h:36,min,max,dir:1,alive:true,speed:65});}
function letter(char,x,y){letters.push({char,x,y,collected:false,bob:Math.random()*Math.PI*2});}
level();
function showHint(message){hint=message;hintTime=6;}
function respawn(){burst(player.x+19,Math.min(player.y,850),'#b3dce1',20);Object.assign(player,{x:checkpoint.x,y:checkpoint.y,vx:0,vy:0,ground:false,on:null,airJump:true,wall:0,rope:null,ropeCooldown:.4,invincible:1.2,wallLock:0});buffer=coyote=0;shake=6;}
function collectLetters(){
const p=player;
for(const item of letters){
if((item.char==='I'&&questActive&&!doorPassed)||item.collected||p.x+p.w<item.x-30||p.x>item.x+30||p.y+p.h<item.y-32||p.y>item.y+32)continue;
item.collected=true;burst(item.x,item.y,'#ffdc77',28);tone(790,.16,'sine',.055);showHint(`Encontraste la ${item.char}`);
if(!flags.firstLetter){flags.firstLetter=true;say(['¿Una letra?']);}
}
if(!lettersComplete&&letters.length&&letters.every(item=>item.collected)){
lettersComplete=true;letterBanner=7;dialog=null;queue=[];burst(player.x+19,player.y-24,'#ffdc77',55);tone(660,.3,'triangle',.06);tone(990,.55,'sine',.04);
beginCinema('name',[{text:'Coti.',d:1.45},{text:'¿Ese es tu nombre?',d:1.75},{text:'No sabía que las letras podían guardar a alguien.',d:3.4},{text:'Algún día quisiera aprender a leer como vos.',d:3.3}]);
}
}
function stepPhysics(dt,I,locked){
const p=player;hintTime=Math.max(0,hintTime-dt);p.invincible=Math.max(0,(p.invincible||0)-dt);p.ropeCooldown=Math.max(0,(p.ropeCooldown||0)-dt);p.wallLock=Math.max(0,(p.wallLock||0)-dt);
const axis=locked?0:I.axis;
if(questActive)updateQuest(dt,locked?{act:false}:I);
for(const r of ropes){r.speed+=(-2.2*Math.sin(r.angle)+(p.rope===r?axis*2.6:0))*dt;r.speed*=Math.exp(-.12*dt);r.angle=clamp(r.angle+r.speed*dt,-1.02,1.02);r.tipX=r.x+Math.sin(r.angle)*r.len;r.tipY=r.y+Math.cos(r.angle)*r.len;}
if(I.jp)buffer=.14;else buffer-=dt;coyote=p.ground?.12:coyote-dt;
if(p.ground)p.airJump=true;
if(!p.rope&&I.act&&!locked&&p.ropeCooldown<=0){const r=ropes.find(r=>Math.hypot(p.x+19-r.tipX,p.y+12-r.tipY)<90);if(r){p.rope=r;p.vx=p.vy=0;p.ground=false;p.on=null;p.airJump=true;tone(560,.1);showHint('← → Balancearte · SALTO para soltarte');}}
if(p.rope){const r=p.rope;p.x=r.tipX-19;p.y=r.tipY+20;p.vx=p.vy=0;
if(I.jp&&!locked){p.rope=null;p.ropeCooldown=.5;p.vx=Math.cos(r.angle)*r.speed*r.len+axis*130;p.vy=-660;p.wallLock=.26;p.airJump=true;buffer=0;burst(p.x+19,p.y,'#a8f1dc');}else return;}
if(p.wallLock<=0)p.vx=lerp(p.vx,axis*350,1-Math.exp(-(p.ground?19:8)*dt));if(Math.abs(axis)>.1)p.face=Math.sign(axis);
if(buffer>0&&!locked){let launched=false;
if(coyote>0){p.vy=-720;p.airJump=true;launched=true;}
else if(p.wall){p.vx=-p.wall*430;p.vy=-730;p.wallLock=.19;p.airJump=true;launched=true;showHint('¡Salto en pared! Podés volver a saltar en el aire.');}
else if(I.jp&&p.airJump!==false){p.vy=-670;p.airJump=false;launched=true;burst(p.x+19,p.y+62,'#d4f4e6',18);tone(650,.17,'triangle');}
if(launched){p.ground=false;p.on=null;coyote=buffer=0;p.squash=-.2;tone(340,.13,'triangle');}}
if(!I.jump&&p.vy< -300)p.vy=lerp(p.vy,-300,1-Math.exp(-18*dt));p.vy+=1780*dt;
const oldX=p.x,oldY=p.y;p.x=clamp(p.x+p.vx*dt,20,16900);p.wall=0;
for(const w of walls){if(p.y+p.h>w.y+3&&p.y<w.y+w.h-3){if(oldX+p.w<=w.x+4&&p.x+p.w>=w.x){p.x=w.x-p.w;p.wall=1;p.vx=0;}else if(oldX>=w.x+w.w-4&&p.x<=w.x+w.w){p.x=w.x+w.w;p.wall=-1;p.vx=0;}}}
if(p.wall&&p.vy>120){p.vy=120;if(Math.random()<dt*18)burst(p.x+(p.wall>0?38:0),p.y+40,'#79b6b2',1);}
p.y+=p.vy*dt;p.ground=false;p.on=null;
for(const plat of platforms){if(plat.falling)continue;if(p.x+p.w<=plat.x||p.x>=plat.x+plat.w)continue;
if(p.vy>=0&&oldY+p.h<=plat.y+5&&p.y+p.h>=plat.y){if(p.vy>180){p.squash=.22;burst(p.x+19,plat.y,'#80bdbb',7);tone(110,.08,'triangle',.025);}p.y=plat.y-p.h;p.vy=0;p.ground=true;p.on=plat;p.airJump=true;if(plat.kind==='crumble'&&plat.age===0)plat.age=.001;}
else if(plat.solid&&p.vy<0&&oldY>=plat.y+plat.h&&p.y<plat.y+plat.h){p.y=plat.y+plat.h;p.vy=0;}}
if(questActive&&!doorPassed&&doorTime===0&&p.x+38>QUEST_DOOR)p.x=QUEST_DOOR-38;if(!questActive&&!gate&&p.x+38>3745&&p.x<3830)p.x=3707;if(!questActive&&!switchOn&&p.x+38>5520&&p.x<5580)p.x=5482;
for(const e of enemies){if(!e.alive)continue;e.x+=e.dir*e.speed*dt;if(e.x<e.min||e.x>e.max){e.x=clamp(e.x,e.min,e.max);e.dir*=-1;}
if(p.x+p.w>e.x&&p.x<e.x+e.w&&p.y+p.h>e.y&&p.y<e.y+e.h){
if(p.vy>0&&oldY+p.h<=e.y+14){e.alive=false;p.y=e.y-p.h;p.vy=I.jump?-650:-470;p.ground=false;p.on=null;p.airJump=true;burst(e.x+23,e.y+15,'#c29bff',26);shake=4;tone(220,.14,'triangle');tone(720,.2);}
else if(p.invincible<=0){respawn();return;}}}
collectLetters();if(p.y>1020){respawn();event('fall',true,()=>say(['Estoy acá. ¡Otra vez!']));}
}
function tone(freq=440,d=.12,type='sine',volume=.05){if(muted||!audio)return;const o=audio.createOscillator(),g=audio.createGain();o.type=type;o.frequency.setValueAtTime(freq,audio.currentTime);g.gain.setValueAtTime(0,audio.currentTime);g.gain.linearRampToValueAtTime(volume,audio.currentTime+.012);g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+d);o.connect(g).connect(audio.destination);o.start();o.stop(audio.currentTime+d);}
function initAudio(){if(!audio){try{audio=new (window.AudioContext||window.webkitAudioContext)();}catch{}}audio?.resume();}
function playIntroAudio(){if(typeof Audio==='undefined')return;if(!introAudio){introAudio=new Audio('audio-intro.mp3');introAudio.preload='auto';introAudio.volume=.95;}introAudio.currentTime=0;introAudio.muted=muted;introAudio.play().catch(error=>{if(error.name==='AbortError')return;$('#announcer').textContent='Presioná una tecla para escuchar la conversación.';});}
function playNameAudio(){if(typeof Audio==='undefined')return;if(!nameAudio){nameAudio=new Audio('audio-coti.mp3');nameAudio.preload='auto';nameAudio.volume=.98;}nameAudio.currentTime=0;nameAudio.muted=muted;if(musicAudio)musicAudio.volume=.1;nameAudio.play().catch(error=>{if(error.name==='AbortError')return;$('#announcer').textContent='Presioná una tecla para escuchar la conversación.';});}
function playMusic(){if(typeof Audio==='undefined')return;if(!musicAudio){musicAudio=new Audio('G-Yerro - Hidden Beauty II.mp3');musicAudio.preload='auto';musicAudio.loop=true;musicAudio.volume=.32;}musicAudio.muted=muted;musicAudio.play().catch(()=>{$('#announcer').textContent='Presioná una tecla para escuchar la música.';});}
function stopMusic(){if(musicAudio){musicAudio.pause();musicAudio.currentTime=0;}}
function stopIntroAudio(){if(introAudio){introAudio.pause();introAudio.currentTime=0;}}
function stopNameAudio(){if(nameAudio){nameAudio.pause();nameAudio.currentTime=0;}if(musicAudio)musicAudio.volume=.32;}
function burst(x,y,color='#ffd67e',n=14){for(let i=0;i<n;i++)particles.push({x,y,vx:(Math.random()-.5)*180,vy:-Math.random()*150,life:.5+Math.random()*.5,max:1,color,r:2+Math.random()*4});}
function say(lines){for(const line of lines)queue.push(typeof line==='string'?{text:line,d:Math.max(2.4,line.length*.063)}:line);}
function event(id,condition,fn){if(condition&&!flags[id]){flags[id]=true;fn();}}
function beginCinema(stage,lines){cinema.stage=stage;cinema.time=0;cinema.closing=false;queue=[];const lead=stage==='intro'?.35:stage==='name'?.18:1.2;dialog={text:'',d:lead,left:lead};buffer=0;player.rope=null;if(stage==='intro'){playIntroAudio();if(entrance>0)introAudio?.pause();}if(stage==='name')playNameAudio();say(lines);}
function animateOrb(dt){
orbPhase+=dt;const phase=orbPhase;const cycle=phase%15,orbit=mode!=='title'&&entrance===0&&cycle>8&&cycle<12.8,theta=(cycle-8)/4.8*Math.PI*2;
let tx,ty,tz;
if(orbit){tx=player.x+19+Math.cos(theta)*88;ty=player.y-14+Math.sin(theta)*24;tz=30+Math.sin(theta)*70;}
else{const ahead=cinema.stage?75:110;const sway=Math.sin(phase*.83)*25+Math.sin(phase*.31)*22;tx=player.x+19+player.face*(ahead+sway);ty=player.y-20+Math.sin(phase*1.65)*20+Math.sin(phase*.6)*8;tz=45+Math.sin(phase*.85)*18;}
if(!cinema.stage&&!questActive){if(bridge&&player.x>2140&&player.x<2700){tx=2510+Math.sin(phase*2)*20;ty=554+Math.cos(phase*2.2)*18;}
else if(!gate&&player.x>3070){tx=Math.min(player.x+120,3700)+Math.sin(phase)*22;ty=500+Math.sin(phase*1.8)*24;}
else if(player.x>4440&&player.x<4650){tx=player.x+100+Math.sin(phase)*30;ty=player.y-65+Math.sin(phase*2)*20;}}
const distance=Math.hypot(tx-orb.x,ty-orb.y);if(distance>950){orb.x=player.x-110;orb.y=player.y-25;orb.vx=orb.vy=0;}
// A damped spring carries momentum through each change of intention.
orb.vx+=(tx-orb.x)*19*dt;orb.vy+=(ty-orb.y)*19*dt;orb.vx*=Math.exp(-5.7*dt);orb.vy*=Math.exp(-5.7*dt);orb.x+=orb.vx*dt;orb.y+=orb.vy*dt;orb.z=lerp(orb.z||45,tz,1-Math.exp(-4*dt));
if(Math.random()<dt*18)particles.push({x:orb.x,y:orb.y,vx:-orb.vx*.04,vy:8,life:.75,max:.75,color:'#ffd97d',r:2});
}
function start(){if(mode==='play')return;entrance=mode==='title'?1:0;initAudio();playMusic();mode='play';$('#cover').classList.add('departing');$('#start').disabled=true;$('#pause').classList.add('hidden');document.body.classList.add('playing');beginCinema('intro',[{text:'Hola. Necesito ayuda.',speaker:'PUNTO',d:2.35},{text:'Estoy buscando a alguien especial.',speaker:'PUNTO',d:2.45},{text:'Pero aún no sé su nombre.',speaker:'PUNTO',d:2.35},{text:'¿Me acompañás?',speaker:'PUNTO',d:2.65}]);}
function reset(){mode='restart';entrance=0;stopIntroAudio();stopNameAudio();stopMusic();level();player={x:180,y:660,vx:0,vy:0,w:38,h:62,ground:false,face:1,squash:0};orb={x:340,y:560,vx:0,vy:0};flags={};queue=[];dialog=null;gate=switchOn=bridge=finalBridge=false;ending=0;cam=0;checkpoint={x:180,y:660};particles=[];buffer=coyote=0;selection=1;hintTime=0;hint='';cinema={stage:null,blend:0,time:0,closing:false};orbPhase=0;start();}
function pause(){if(mode==='play'){mode='pause';musicAudio?.pause();if(cinema.stage==='intro')introAudio?.pause();if(cinema.stage==='name')nameAudio?.pause();$('#pause').classList.remove('hidden');$('#resume').focus();}else if(mode==='pause'){mode='play';playMusic();if(cinema.stage==='intro'&&entrance===0)introAudio?.play().catch(()=>{});if(cinema.stage==='name')nameAudio?.play().catch(()=>{});$('#pause').classList.add('hidden');}}
$('#start').onclick=start;$('#resume').onclick=pause;$('#restart').onclick=reset;$('#sound').onclick=()=>{muted=!muted;introAudio&&(introAudio.muted=muted);nameAudio&&(nameAudio.muted=muted);musicAudio&&(musicAudio.muted=muted);$('#sound').textContent='Sonido: '+(muted?'no':'sí');};$('#full').onclick=()=>{if(document.fullscreenElement)document.exitFullscreen?.();else document.documentElement.requestFullscreen?.().catch(()=>{});};
addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Space','Enter'].includes(e.code))e.preventDefault();keys.add(e.code);if(e.code==='KeyF'&&!e.repeat)$('#full').click();});addEventListener('keyup',e=>keys.delete(e.code));addEventListener('blur',()=>{keys.clear();if(mode==='play')pause();});document.addEventListener('visibilitychange',()=>{if(document.hidden&&mode==='play')pause();});
document.querySelectorAll('[data-key]').forEach(b=>{b.onpointerdown=e=>{e.preventDefault();b.setPointerCapture(e.pointerId);keys.add(b.dataset.key);};b.onpointerup=b.onpointercancel=()=>keys.delete(b.dataset.key);});
function input(){let axis=(keys.has('ArrowRight')||keys.has('KeyD')?1:0)-(keys.has('ArrowLeft')||keys.has('KeyA')?1:0),jump=keys.has('Space')||keys.has('ArrowUp')||keys.has('KeyW'),action=keys.has('KeyE')||keys.has('Enter'),p=keys.has('Escape');let gp;try{gp=Array.from(navigator.getGamepads?.()||[]).find(g=>g?.connected);}catch{}if(gp){padActive=true;const a=gp.axes[0]||0;axis+=Math.abs(a)>.2?a:0;axis+=(gp.buttons[15]?.pressed?1:0)-(gp.buttons[14]?.pressed?1:0);jump||=gp.buttons[0]?.pressed;action||=gp.buttons[2]?.pressed||gp.buttons[1]?.pressed;p||=gp.buttons[9]?.pressed;$('#pad').textContent='Joystick conectado · Ⓐ Saltar · Ⓧ Acción';}const out={axis:clamp(axis,-1,1),jump,jp:jump&&!prevJump,act:action&&!prevAction,pp:p&&!prevPause};prevJump=jump;prevAction=action;prevPause=p;return out;}
function update(dt,I){t+=dt;if(I.pp)pause();if(mode==='title'){animateOrb(dt);particles=particles.filter(p=>(p.life-=dt)>0);if(I.jp||I.act)start();return;}if(mode==='pause'){if(I.jp)pause();else if(I.act)reset();return;}if(mode==='end'){ending+=dt;animateOrb(dt);if(ending<4){stepPhysics(dt,{...I,axis:.1,jump:false,jp:false,act:false},false);cam=lerp(cam,player.x-570,1-Math.exp(-4*dt));}return;}
letterBanner=Math.max(0,letterBanner-dt);
if(entrance>0){entrance=Math.max(0,entrance-dt/2.6);animateOrb(dt);particles=particles.filter(p=>(p.life-=dt)>0);if(entrance===0){cinema.blend=1;$('#cover').classList.add('hidden');if(cinema.stage==='intro')introAudio?.play().catch(()=>{});}return;}
cinema.time+=dt;cinema.blend=lerp(cinema.blend,cinema.stage&&!cinema.closing?1:0,1-Math.exp(-2.5*dt));
if(dialog){dialog.left-=dt;if(dialog.left<=0)dialog=null;}if(!dialog&&queue.length){dialog=queue.shift();dialog.left=dialog.d;$('#announcer').textContent=dialog.text;tone(700+Math.random()*180,.08,'sine',.025);}
const locked=!!cinema.stage;
if(cinema.stage&&!dialog&&!queue.length&&!cinema.closing){if(cinema.stage==='final'){mode='end';ending=0;document.body.classList.remove('playing');return;}cinema.closing=true;if(cinema.stage==='middle')flags.calmDone=true;}
if(cinema.closing&&cinema.blend<.025){if(cinema.stage==='intro')stopIntroAudio();if(cinema.stage==='name')stopNameAudio();cinema.stage=null;cinema.closing=false;cinema.blend=0;buffer=0;}

for(const p of platforms)if(p.kind==='moving'){const old=p.y;p.y=p.baseY+Math.sin(t*p.speed)*p.amp;if(player.on===p)player.y+=p.y-old;}
if(cinema.stage){const walking=cinema.stage==='final';stepPhysics(dt,{...I,axis:walking?.105:0,jump:false,jp:false,act:false},!walking);}else stepPhysics(dt,I,locked);
player.squash*=Math.exp(-12*dt);shake*=Math.exp(-8*dt);
if(!questActive){
event('path',!cinema.stage&&player.x>550,()=>{say(['Por acá.']);showHint('SALTO dos veces · Doble salto');});
event('cp1',player.x>1050&&player.x<1350&&player.ground,()=>{checkpoint={x:1050,y:620};});
event('cp2',lettersComplete&&player.x>1950&&player.x<2350&&player.ground,()=>{checkpoint={x:1950,y:610};});
event('stompHint',player.x>930,()=>showHint('Saltá sobre los bichitos para deshacerlos.')); event('hard',player.x>1020,()=>say(['Ese parece difícil.']));event('well',lettersComplete&&player.x>1950,()=>{say(['Sí que sabés, Coti.']);burst(orb.x,orb.y);});
event('bridge',player.x>2130,()=>{bridge=true;rect(2340,690,150,30,'light');rect(2680,690,130,30,'light');say(['Yo también puedo ayudar.']);});
event('numbers',player.x>2930,()=>{checkpoint={x:2860,y:600};say(['Hmm…','Yo todavía no entiendo mucho de esto.']);});
if(player.x>3090&&player.x<3710&&!gate){selection=clamp(Math.floor((player.x-3100)/195),0,2);if(I.act){if(selection===1){gate=true;say(['¿Cómo supiste?','Después me vas a tener que enseñar.']);burst(3745,570,'#ffda87',35);tone(660,.4);tone(990,.7);checkpoint={x:3880,y:610};}else{wrong=1;say(['Probemos otro.']);tone(180,.16,'triangle');}}}wrong=Math.max(0,wrong-dt);
event('maze',player.x>4050,()=>say(['¿Por dónde?']));event('orbWrong',player.x>4490,()=>say(['Por ahí no era.']));event('deadEnd',player.x>5090&&player.y<440,()=>say(['Bueno… probemos abajo.']));
if(!switchOn&&player.x>5130&&player.x<5410&&player.y>650&&I.act){switchOn=true;say(['Sabía que lo ibas a encontrar.']);burst(5310,740,'#8bfff0',30);tone(520,.4);}
event('calm',player.x>5840&&player.ground,()=>{checkpoint={x:5680,y:640};beginCinema('middle',[{text:'Esperá.',d:2.3},{text:'¿Hace cuánto que sabés hacer todas estas cosas?',d:4},{text:'Tengo seis años.',speaker:'VOS',d:3},{text:'¿Seis?',d:2.5},{text:'Eso es muchísimo.',d:3},{text:'Después me vas a tener que enseñar.',d:3.5}]);});
event('last',player.x>6280,()=>say(['¡Vamos!']));event('finalBridge',player.x>6380,()=>{finalBridge=true;checkpoint={x:6520,y:640};say(['Ahora viene lo bueno.']);});
event('wallHint',player.x>6680,()=>{showHint('Contra la pared: SALTO · Repetí para trepar');say(['¿También podés subir por ahí?']);});
event('ropeHint',player.x>7160,()=>{showHint('En el aire, E / Ⓧ cerca del extremo de la soga');say(['¡Agarrate!']);});
for(const spot of [{id:'tower',x:7210,y:288,end:7370},{id:'rope1',x:8210,y:403,end:8400},{id:'garden',x:9120,y:508,end:9460},{id:'tower2',x:10570,y:158,end:10770},{id:'rope2',x:11620,y:328,end:11830},{id:'lastRun',x:12720,y:478,end:12870}])event('cp_'+spot.id,player.ground&&player.x>=spot.x&&player.x<spot.end&&Math.abs(player.y-spot.y)<8,()=>{checkpoint={x:spot.x,y:spot.y};burst(player.x+19,player.y+30,'#a0e7d8',8);});
event('almost',player.x>13830,()=>say(['Falta poquito.']));
event('finale',player.x>14500&&player.ground,()=>{beginCinema('final',[{text:'Creo que ya está.',d:3},{text:'Ya encontré a quien estaba buscando.',d:3.7},'Alguien que sepa jugar.','Encontrar caminos.','Y seguir intentando.',{text:'Yo todavía no sé hacer todas esas cosas.',d:3.5},{text:'Soy demasiado chiquito.',d:3.2},{text:'Pero estoy creciendo.',d:4},{text:'Y algún día…',d:2.8},{text:'me vas a tener que enseñar.',d:4},{text:'Yo te enseño.',speaker:'VOS',d:3},{text:'Creo que elegí bien.',d:3.5}]);});
}
animateOrb(dt);
for(const p of particles){p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=70*dt;p.life-=dt;}particles=particles.filter(p=>p.life>0);
cam=lerp(cam,clamp(player.x-570+player.vx*.35,0,15600),1-Math.exp(-4*dt));
}
function round(x,y,w,h,r,fill){c.fillStyle=fill;c.beginPath();c.roundRect(x,y,w,h,r);c.fill();}
function ellipse(x,y,rx,ry,fill){c.fillStyle=fill;c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fill();}
function text(s,x,y,size=28,color='#f4f1db',align='center',font='system-ui'){c.fillStyle=color;c.font=`500 ${size}px ${font}`;c.textAlign=align;c.fillText(s,x,y);}
function background(){const g=c.createLinearGradient(0,0,0,900);g.addColorStop(0,'#071224');g.addColorStop(.55,'#102f40');g.addColorStop(1,'#16434b');c.fillStyle=g;c.fillRect(0,0,W,H);
for(let i=0;i<90;i++){const x=((i*179.7-cam*.08)%1700+1700)%1700,y=35+(i*71.9)%420;ellipse(x,y,1+(i%3)*.4,1+(i%3)*.4,`rgba(197,230,222,${.2+.18*Math.sin(t*.6+i)})`);}
const moonX=1210-cam*.025;const halo=c.createRadialGradient(moonX,180,15,moonX,180,190);halo.addColorStop(0,'#9ad4cb26');halo.addColorStop(1,'#8debd000');c.fillStyle=halo;c.fillRect(moonX-200,0,400,400);ellipse(moonX,180,53,53,'#a8cec8');ellipse(moonX-22,163,49,49,'#102638');
for(let layer=0;layer<3;layer++){c.fillStyle=['#143547','#16404d','#17464f'][layer];c.beginPath();c.moveTo(0,900);for(let x=0;x<=1650;x+=35){const wx=x+cam*(.08+layer*.13);const y=470+layer*80+Math.sin(wx*.003+layer)*70+Math.sin(wx*.008+layer)*30;c.lineTo(x,y);}c.lineTo(1650,900);c.fill();}
for(let i=0;i<18;i++){let x=i*230-cam*.3;x=((x%4200)+4200)%4200-400;if(x>1700)continue;let h=150+(i*79)%220;c.fillStyle='#163b49';c.fillRect(x,640-h,44,h);c.fillRect(x-12,630-h,68,20);if(i%2===0){c.strokeStyle='#204653';c.lineWidth=24;c.beginPath();c.arc(x+100,640-h+70,78,Math.PI,0);c.stroke();}}
for(let i=0;i<38;i++){const x=((i*131.3-cam*.6+t*5)%1700+1700)%1700,y=320+(i*53)%450+Math.sin(t+i)*16;ellipse(x,y,2,2,`rgba(104,231,201,${.2+Math.sin(t+i)*.16})`);}}
function adventureArt(){
for(const w of walls){round(w.x+10,w.y+10,w.w-20,w.h-20,4,'#38646b');for(let y=w.y+25;y<w.y+w.h;y+=34){c.strokeStyle='#a4dace';c.lineWidth=3;c.beginPath();c.moveTo(w.x+22,y+10);c.lineTo(w.x+w.w/2,y);c.lineTo(w.x+w.w-22,y+10);c.stroke();}}
for(const r of ropes){ellipse(r.x,r.y,15,12,'#a3c6b7');c.strokeStyle='#beab83';c.lineWidth=6;c.beginPath();c.moveTo(r.x,r.y);c.lineTo(r.tipX,r.tipY);c.stroke();c.strokeStyle='#eff5cd';c.lineWidth=3;c.beginPath();c.arc(r.tipX,r.tipY,15,0,Math.PI*2);c.stroke();if(Math.hypot(player.x+19-r.tipX,player.y+12-r.tipY)<130&&!player.rope)text(padActive?'Ⓧ':'E',r.tipX+40,r.tipY,28,'#fff2b1');}
for(const e of enemies){if(!e.alive)continue;const b=Math.sin(t*8+e.min)*2;ellipse(e.x+23,e.y+37,29,6,'#0004');for(let i=0;i<3;i++)ellipse(e.x+7+i*16,e.y+32,5,7,'#503d73');ellipse(e.x+23,e.y+18+b,27,19,'#9070af');ellipse(e.x+23,e.y+8+b,20,9,'#bea2d4');ellipse(e.x+14+e.dir*2,e.y+19+b,4,5,'#241e3b');ellipse(e.x+30+e.dir*2,e.y+19+b,4,5,'#241e3b');}
}
function terrain(){for(const p of platforms){if(p.x+p.w<cam-30||p.x>cam+1630)continue;const light=p.kind==='light';if(light){c.shadowColor='#7befdc';c.shadowBlur=22;}round(p.x,p.y,p.w,Math.min(p.h,310),8,light?'#386e70':'#173441');c.shadowBlur=0;round(p.x,p.y,p.w,7,3,light?'#a7f3d9':'#6b9f98');if(!light){c.fillStyle='#244954';for(let x=p.x+20;x<p.x+p.w-20;x+=75){c.fillRect(x,p.y+24,40,3);c.fillRect(x+20,p.y+70,2,27);}c.strokeStyle='#4d8e82';c.lineWidth=3;for(let x=p.x+15;x<p.x+p.w;x+=42){c.beginPath();c.moveTo(x,p.y);c.quadraticCurveTo(x-8,p.y-18,x-14,p.y-21);c.moveTo(x,p.y);c.quadraticCurveTo(x+8,p.y-26,x+12,p.y-28);c.stroke();}}}
// Broken stone gateway and its illuminated number plates.
round(3720,390,50,320,5,'#2b515b');round(3830,390,50,320,5,'#2b515b');round(3700,374,200,38,8,'#668d8d');if(!gate){c.fillStyle='#89e6d777';c.fillRect(3770,410,60,290);for(let y=430;y<700;y+=32){c.fillStyle='#b4fff0';c.fillRect(3788,y,24,4);}}
if(!gate){round(3060,330,620,100,14,'#071c2ce8');text('4123 → 4133 → 4143 → ?',3370,390,36,'#d8e9df');['4144','4153','4243'].forEach((v,i)=>{const nums=['4144','4153','4243'];round(3100+i*195,586,175,72,10,selection===i?'#d9c48b':'#284955');text(nums[i],3187+i*195,634,36,selection===i?'#162a33':'#d7e4df');});if(player.x>3070&&player.x<3745)text(wrong?'Mirá cuánto cambia cada número.':padActive?'Ⓧ Elegir':'E · Elegir',3380,530,26,wrong?'#ffb3a0':'#bde1d6');}
round(5495,540,34,230,4,'#38616a');if(!switchOn){c.fillStyle='#8ce8d678';c.fillRect(5529,570,28,200);}round(5200,738,100,32,8,switchOn?'#b2f4cd':'#cd9c66');ellipse(5250,732,17,9,switchOn?'#b8ffdb':'#ffda87');if(!switchOn&&player.x>4940&&player.y>620)text(padActive?'Ⓧ Activar':'E · Activar',5245,696,25);
// The upper branch loops back to the switch below.
text('↘',5180,372,48,'#73b9af');if(bridge){ellipse(2510,568,25,25,'#213b46');ellipse(2510,568,11,11,'#ffe2a0');}
for(const x of [250,2000,2910,4070,5630,6330,8350,9140]){c.strokeStyle='#487b7d';c.lineWidth=5;c.beginPath();c.moveTo(x,730);c.lineTo(x,595);c.quadraticCurveTo(x,567,x+25,577);c.stroke();const glow=c.createRadialGradient(x+25,588,2,x+25,588,65);glow.addColorStop(0,'#8eeee343');glow.addColorStop(1,'#8eeee300');c.fillStyle=glow;c.fillRect(x-45,520,140,140);ellipse(x+25,588,8,12,'#a3e6d3');}}
function character(){const p=player;ellipse(p.x+19,p.y+65,28,7,'#06132155');c.save();if(p.invincible>0)c.globalAlpha=.5+.5*Math.abs(Math.sin(t*20));c.translate(p.x+19,p.y+62);c.scale(1+p.squash,1-p.squash);let run=Math.sin(t*17)*Math.min(Math.abs(p.vx)/330,1)*7;round(-15,-18,12,20+run,5,'#101e2a');round(4,-18,12,20-run,5,'#101e2a');round(-20,-46,40,34,12,'#92b8b4');round(-22,-51,44,12,5,'#f28473');c.fillStyle='#e57467';c.beginPath();c.moveTo(-p.face*15,-48);c.quadraticCurveTo(-p.face*40,-50+Math.sin(t*12)*4,-p.face*48,-33+Math.sin(t*8)*6);c.lineTo(-p.face*15,-36);c.fill();round(-17,-72,34,30,11,'#f1ceb0');round(-19,-77,38,15,7,'#263b48');round(-21,-67,10,16,3,'#263b48');ellipse(p.face*8,-57,2.8,3.2,'#23323b');if(p.rope){round(-23,-80,10,48,5,'#b3c9be');round(13,-80,10,48,5,'#b3c9be');round(-22,-85,44,8,4,'#f1ceb0');}else{round(p.face*13-5,-35,11,22,5,'#b3c9be');}c.restore();}
function companion(){const glow=c.createRadialGradient(orb.x,orb.y,1,orb.x,orb.y,100);glow.addColorStop(0,'#ffda7555');glow.addColorStop(.4,'#ffcc6a16');glow.addColorStop(1,'#ffc65b00');c.fillStyle=glow;c.fillRect(orb.x-100,orb.y-100,200,200);c.save();c.translate(orb.x,orb.y);c.rotate(clamp(orb.vx*.001,-.3,.3));const breath=Math.sin(t*3)*1.3;c.shadowBlur=20;c.shadowColor='#ffcc65';ellipse(0,0,16+breath,18-breath,'#ffd779');c.shadowBlur=0;ellipse(-4,-5,7,6,'#ffe8a1');const look=clamp((player.x-orb.x)*.035,-4,4);if(Math.sin(t*.7)> .995){round(-7+look,1,5,2,1,'#6c492e');round(3+look,1,5,2,1,'#6c492e');}else{ellipse(-5+look,1,2.3,3,'#67452b');ellipse(5+look,1,2.3,3,'#67452b');}c.restore();}
function cinematicOverlay(){
const amount=cinema.blend;if(amount<=.005)return;c.fillStyle='#02060c';c.fillRect(0,0,W,98*amount);c.fillRect(0,H-160*amount,W,160*amount);
if(!dialog||!dialog.text||cinema.closing)return;c.globalAlpha=Math.min(1,amount*1.5);text(dialog.speaker||'PUNTO',800,773,18,dialog.speaker==='VOS'?'#9cd6d8':'#ffda87');
c.font='500 31px system-ui';const words=dialog.text.split(' '),lines=[];let line='';for(const word of words){if(c.measureText(line+word).width>1220){lines.push(line.trim());line='';}line+=word+' ';}lines.push(line.trim());lines.forEach((line,i)=>text(line,800,818+i*39,31,'#f1efe4'));c.globalAlpha=1;
}
function bubble(){if(!dialog||!dialog.text||cinema.stage||cinema.blend>.01)return;const s=dialog.text;c.font='500 30px system-ui';const maxWidth=650,words=s.split(' '),lines=[];let line='';for(const w of words){if(c.measureText(line+w).width>maxWidth){lines.push(line.trim());line='';}line+=w+' ';}lines.push(line.trim());const bw=Math.max(...lines.map(l=>c.measureText(l).width))+58,bh=lines.length*41+28,x=clamp(orb.x-cam-bw/2,60,W-bw-60),y=clamp(orb.y-bh-55,65,620);c.shadowColor='#0005';c.shadowBlur=22;round(x,y,bw,bh,16,'#eef1df');c.shadowBlur=0;c.fillStyle='#eef1df';c.beginPath();let tip=clamp(orb.x-cam,x+24,x+bw-24);c.moveTo(tip-10,y+bh-1);c.lineTo(tip+10,y+bh-1);c.lineTo(tip,y+bh+12);c.fill();lines.forEach((l,i)=>text(l,x+bw/2,y+42+i*41,30,'#18303a'));}
function worldLabels(){
c.save();
if((!lettersComplete||letterBanner>0)&&cinema.blend<.05){const x=54,y=54;round(x,y,292,78,14,'#071b2bdd');text(lettersComplete?'COTI':'ENCONTRÁ LAS LETRAS',x+146,y+24,14,lettersComplete?'#ffe18c':'#b7d8d3');letters.forEach((item,i)=>{const bx=x+38+i*67;round(bx,y+37,50,31,7,item.collected?'#ffd875':'#1b4151');text(item.char,bx+25,y+60,24,item.collected?'#263641':'#8db7b6');});}
c.restore();
if(questActive){
if(player.x>4500){round(1030,54,500,78,14,'#071b2bdd');text(doorPassed?'¡PASASTE!':doorTime>0?'PUERTA · '+doorTime.toFixed(1)+' s':'BOTÓN · E / Ⓧ',1280,103,28,doorTime>0?'#ffcf78':'#cce7dc');}
c.save();c.translate(-cam,0);round(4770,606,110,14,5,doorTime>0?'#8ef2d7':'#ffd875');text('E / Ⓧ',4825,585,25,'#ffe6a8');c.restore();return;}
c.save();c.translate(-cam,0);
if(!gate){round(3060,330,620,100,14,'#071c2ce8');text('4123 → 4133 → 4143 → ?',3370,390,36,'#d8e9df');['4144','4153','4243'].forEach((v,i)=>{round(3100+i*195,586,175,72,10,selection===i?'#d9c48b':'#284955');text(v,3187+i*195,634,36,selection===i?'#162a33':'#d7e4df');});if(player.x>3070&&player.x<3745)text(wrong?'Mirá cuánto cambia cada número.':padActive?'Ⓧ Elegir':'E · Elegir',3380,530,26,wrong?'#ffb3a0':'#bde1d6');}
if(!switchOn&&player.x>4940&&player.y>620)text(padActive?'Ⓧ Activar':'E · Activar',5245,696,25);
for(const r of ropes)if(Math.hypot(player.x+19-r.tipX,player.y+12-r.tipY)<130&&!player.rope)text(padActive?'Ⓧ':'E',r.tipX+40,r.tipY,28,'#fff2b1');
c.restore();
}
function render(){c.clearRect(0,0,W,H);if(window.secretWorld){window.secretWorld.draw({t,cam,player,orb,platforms,walls,ropes,enemies,letters,lettersComplete,questActive,doorTime,doorPassed,particles,gate,switchOn,bridge,mode,cinema,entrance,speaker:dialog?.speaker});if(mode!=='title'&&entrance===0&&cinema.blend<.05)worldLabels();}else{background();c.save();c.translate(-cam+(Math.random()-.5)*shake,0);terrain();adventureArt();for(const p of particles){c.globalAlpha=clamp(p.life/p.max,0,1);ellipse(p.x,p.y,p.r,p.r,p.color);}c.globalAlpha=1;character();companion();c.restore();}if(mode==='play'||mode==='pause')bubble();if(mode==='play'&&!cinema.stage&&cinema.blend<.01&&hintTime>0){round(260,800,1080,58,14,'#061b2ce8');text(hint,800,838,27,'#cce7dc');}const vignette=c.createRadialGradient(800,380,250,800,450,950);vignette.addColorStop(0,'#02091600');vignette.addColorStop(1,'#02091677');c.fillStyle=vignette;c.fillRect(0,0,W,H);
if(!window.secretWorld&&entrance>0){c.fillStyle=`rgba(2,6,12,${entrance})`;c.fillRect(0,0,W,H);c.save();const e=entrance*entrance*(3-2*entrance);c.translate(1100*e,470*e);c.scale(1+1.7*e,1+1.7*e);c.translate(-199*e,-660*e);character();companion();c.restore();}
if(mode==='play'||mode==='pause')cinematicOverlay();
if(mode==='end'){c.fillStyle=`rgba(4,12,25,${Math.min(ending/3,.97)})`;c.fillRect(0,0,W,H);if(ending>2){c.globalAlpha=clamp((ending-2)/2,0,1);text('EL SECRETO MÁS CHIQUITO',800,295,25,'#8dafb9');c.globalAlpha=1;}if(ending>5){c.globalAlpha=clamp((ending-5)/2,0,1);text('Vos también estás por aprender algo nuevo…',800,400,35,'#dae2da','center','Georgia');c.globalAlpha=1;}if(ending>8){c.globalAlpha=clamp((ending-8)/2,0,1);text('Cómo se siente ser',800,510,54,'#f4efdf','center','Georgia');text('PRIMO MAYOR.',800,610,80,'#ffda87','center','Georgia');ellipse(800,710+Math.sin(t*2)*5,9,10,'#ffda87');c.globalAlpha=1;}}
}
let pendingInput={jp:false,act:false,pp:false};
function frame(ms){const elapsed=Math.min((ms-last)/1000,.05);last=ms;acc+=elapsed;const I=input();for(const k of ['jp','act','pp']){pendingInput[k] ||= I[k];I[k]=pendingInput[k];}let first=true;while(acc>=1/120){update(1/120,first?I:{...I,jp:false,act:false,pp:false});first=false;pendingInput={jp:false,act:false,pp:false};acc-=1/120;}render();requestAnimationFrame(frame);}requestAnimationFrame(frame);
// Read-only diagnostics for checking progress and runtime health.
window.gameStatus=()=>({questActive,doorTime,doorPassed,entrance,cinematic:cinema.stage,cinemaBlend:cinema.blend,orb:{x:orb.x,y:orb.y,z:orb.z},letters:letters.map(item=>({char:item.char,collected:item.collected})),lettersComplete,doubleJump:player.airJump,wall:player.wall,rope:!!player.rope,enemies:enemies.filter(e=>e.alive).length,mode,x:Math.round(player.x),y:Math.round(player.y),gate,switchOn,bridge,finalBridge,flags:{...flags},platforms:platforms.length});
})();




