(()=>{'use strict';
const canvas=document.querySelector('#game'),c=canvas.getContext('2d'),W=1600,H=900,$=s=>document.querySelector(s),keys=new Set();
window.secretDisplay?.subscribe(quality=>{const scale=quality==='2d'?.4:quality==='low'?.6:quality==='balanced'?(window.secretDisplay.resolution||.8):1;canvas.width=W*scale;canvas.height=H*scale;c.setTransform(scale,0,0,scale,0,0);});
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),lerp=(a,b,t)=>a+(b-a)*t;
// Gameplay foley is intentionally silent; voices, music and ambient audio remain active.
let gameSfx=null;
function syncGameSfx(){}
let mode='title',t=0,cam=0,last=0,acc=0,muted=false,audio,introAudio=null,nameAudio=null,numberAudio=null,numberResume=false,musicAudio=null,ambientAudio=null,beat=0,prevJump=false,prevAction=false,prevPause=false,prevSound=false,prevGraphics=false,buffer=0,coyote=0,shake=0,ending=0,dialog=null,queue=[],flags={},particles=[],platforms=[],checkpoint={x:180,y:660},padActive=false;
let musicTarget=.32,ambientTarget=.55;
let walls=[],ropes=[],vines=[],enemies=[],letters=[],lettersComplete=false,letterBanner=0,hint='',hintTime=0;
let entrance=1,questActive=true,doorTime=0,doorPassed=false;
let countActive=false,countLights=[],countValue=0,countComplete=false,chapterFade=0;
let coop=null;
let chapterVoice=null;
const QUEST_DOOR=6070;
let cinema={stage:null,blend:0,time:0,closing:false},orbPhase=0;
let player={x:180,y:668,vx:0,vy:0,w:38,h:62,ground:true,face:1,squash:0},orb={x:340,y:560,vx:0,vy:0},gate=false,switchOn=false,bridge=false,finalBridge=false,selection=1,wrong=0;
function rect(x,y,w,h,kind='stone',extra={}){platforms.push({x,y,w,h,kind,...extra});}
function level(first=true){coop=null;questActive=first;countActive=false;if(first){countLights=[];countValue=0;countComplete=false;chapterFade=0;}doorTime=0;doorPassed=false;platforms=[];walls=[];ropes=[];vines=[];player.vine=null;enemies=[];letters=[];lettersComplete=false;letterBanner=0;rect(-500,730,1350,400);rect(1010,700,380,400);rect(1510,640,270,450);rect(1910,690,500,400);rect(2460,600,220,38,'moving',{baseY:600,amp:55,speed:1.1});rect(2800,690,1070,500);rect(3890,710,460,450);rect(4410,610,200,32);rect(4690,510,210,32);rect(4950,410,300,32);rect(4380,770,1200,300);rect(5310,640,220,32);rect(5580,710,1070,400);
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
platforms=[];walls=[];ropes=[];vines=[];enemies=[];letters=[];
rect(-500,730,1200,400);wall(500,630,65,100);rect(840,670,200,400);rect(1170,620,360,450);
letter('C',1350,558);
rect(1530,730,480,400);rect(1920,180,150,32);
vines.push({x:1880,top:180,bottom:730,exitX:1950});
rect(2180,260,180,32);rect(2490,350,180,32);rect(2790,410,340,400);letter('O',2950,348);
for(const [x,y] of [[3290,430],[3590,470],[3890,410],[4190,490]])rect(x,y,160,28,'crumble',{baseY:y,age:0,falling:false,recover:0});
rect(4490,620,570,420);letter('T',4600,558);
rect(5060,620,1500,440);wall(5160,500,70,120);wall(5490,455,80,165);wall(5820,510,70,110);
letter('I',6300,558);enemy(920,670,855,990);
}
function leaveLetterQuest(){const name=letters;level(false);letters=name;lettersComplete=true;checkpoint={x:1950,y:628};Object.assign(player,{x:1950,y:628,vx:0,vy:0,on:null,ground:false});cam=1380;orb.x=2060;orb.y=600;orb.vx=orb.vy=0;}
function beginCounting(){
prepareNumberAudio();
questActive=false;countActive=true;countValue=0;countComplete=false;countLights=[];letterBanner=0;
rect(6520,620,360,440);rect(7060,570,320,440);
rect(7540,470,170,32);rect(7850,390,340,500);
rect(8350,460,200,32,'moving',{baseY:460,amp:45,speed:1.15});rect(8690,490,360,500);
for(const [x,y] of [[9230,470],[9520,420]])rect(x,y,170,28,'crumble',{baseY:y,age:0,falling:false,recover:0});
rect(9840,510,380,480);rect(10500,410,180,32);rect(10820,320,340,560);
rect(12360,570,800,480);
for(const [i,x,y,homeX] of [[1,7200,570,7120],[2,8000,390,7910],[3,8860,490,8750],[4,10020,510,9860],[5,10980,320,10880],[6,12550,570,12420]])countLights.push({n:i,x,y,homeX,lit:false});
enemy(9990,510,9940,10160);checkpoint={x:6300,y:558};
const shotTime=cinema.time;beginCinema('ageIntro',[{text:'Coti, ¿me enseñás cuántos años tenés?',d:3.55}]);cinema.time=shotTime;
}
function collectCount(){
if(!countActive||cinema.stage||countComplete)return;
// Touch the lamp's body or number, including during a jump; no action button.
const item=countLights.find(v=>!v.lit&&v.n===countValue+1&&player.x+player.w>v.x-42&&player.x<v.x+42&&player.y+player.h>v.y-155&&player.y<v.y);
if(!item)return;
if(item.n!==countValue+1){showHint('Primero encendé el '+(countValue+1)+'.');return;}
item.lit=true;item.litAt=t;countValue=item.n;checkpoint={x:item.homeX,y:item.y-player.h};
countMagic(item);playNumberAudio(item.n);
dialog=null;queue=[];say([['Uno…','Dos…','Tres.','Cuatro.','Cinco…','¡Seis!'][item.n-1]],'number');
showHint(item.n<6?'¡'+item.n+'! Buscá la siguiente luz.':'¡Seis luces!');
if(item.n===3)say(['¡Ya voy entendiendo!']);
if(item.n===5){for(let i=0;i<6;i++)rect(11330+i*155,365+i*26,100,30,'light');say(['Uno, dos, tres… ¡Mirá! Puedo hacer un camino.']);}
if(item.n===6){countComplete=true;beginCinema('ageReveal',ageRevealDialogue());}
}
function continueAfterCounting(){
countActive=false;coop={open:false,charge:0,wallAmount:0,wallPassed:false,bridge:0,target:null,done:false};gate=switchOn=bridge=finalBridge=true;
// Continue from the sixth light, keeping the same ground and camera position.
rect(13160,570,720,500);
for(const [x,y] of [[13360,460],[13640,380],[13940,410],[14240,490]])rect(x,y,190,32,'light',{hidden:true,coopReveal:true});
rect(14540,570,850,500);wall(15080,220,90,350);
rect(15600,480,210,36);rect(15940,370,240,36);rect(16360,470,220,36);rect(16740,570,560,500);
wall(17180,330,70,240);rect(17250,330,220,36);
for(let i=0;i<6;i++)rect(17700+i*290,350+i*35,170,30,i===2?'moving':'light',{hidden:true,coopStep:i+1,baseY:420,amp:28,speed:1});
rect(19400,570,4200,500);
checkpoint={x:12500,y:508};
beginCinema('coopIntro',coopDialogue());
}
function guidePlatform(dt,field){
const route=platforms.filter(v=>v[field]&&!v.retired);
let current=coop.guide;
if(current&&!route.includes(current))current=null;
if(current&&!current.hidden&&player.x+38>=current.x&&Math.abs(player.y+62-current.y)<135)current=null;
if(!current){const next=route.find(v=>v.hidden);if(next&&next.x-player.x<600)current=next;}
coop.guide=current;
if(!current)return;
coop.target={x:current.x+current.w/2,y:current.y-85};
if(current.hidden&&Math.hypot(orb.x-coop.target.x,orb.y-coop.target.y)<55){
current.formation=Math.min(1,(current.formation||0)+dt/1.25);orb.magic=1;
if(current.formation===1){current.hidden=false;burst(current.x+current.w/2,current.y,'#ffe3a0',32);
if(current.coopStep){coop.bridge=current.coopStep;say([['Uno…','Dos…','Tres…','Cuatro…','Cinco…','¡Seis! Me acordé.'][current.coopStep-1]]);}}
}
}
function updateCoop(dt){
if(!coop)return;
// Retire stones only after a safe landing ahead; preserve the respawn foothold.
for(const stone of platforms){
if(!stone.coopReveal&&!stone.coopStep)continue;
const checkpointHere=checkpoint.x+38>stone.x&&checkpoint.x<stone.x+stone.w;
if(!stone.hidden&&!stone.retired&&player.ground&&player.on!==stone&&!checkpointHere&&player.x>stone.x+stone.w+90){stone.retired=true;stone.hidden=true;stone.formation=1;}
if(stone.retired)stone.formation=Math.max(0,(stone.formation||0)-dt/1.6);
}
if(cinema.stage)return;
const p=player;
event('coopGuide',p.x>13180,()=>{say(['Voy adelante. Vos seguime.']);showHint('ETAPA 3 · Ahora te ayudo yo · Seguí su luz');});
coop.target=null;orb.magic=0;
if(p.x<14500)guidePlatform(dt,'coopReveal');
event('coopWait',p.x>13800,()=>say(['Desde acá te veo.','Tranquilo. Te espero.']));
if(p.ground&&p.x>14540&&p.x<15000)checkpoint={x:14600,y:508};
event('coopStone',p.x>14500,()=>{say(['Ese muro nos tapa el camino.','Esperá… voy a intentar levantar las piedras.']);showHint('Acercate al muro y dejá que el orbe abra el paso');});
if(coop.wallPassed&&p.x<15000)coop.wallPassed=false;
if(!coop.wallPassed&&p.x>14500&&p.x<15400){
  coop.target=coop.open?{x:15300,y:440}:{x:15010,y:400};
  if(!coop.open&&Math.hypot(orb.x-15010,orb.y-400)<55){
    orb.magic=1;coop.charge+=dt;
    if(coop.charge>.6)coop.wallAmount=Math.min(1,coop.wallAmount+dt/1.4);
    if(coop.wallAmount===1){coop.open=true;burst(15125,400,'#ffe29b',36);say(['¡Ahora! Pasá, yo las sostengo.']);}
  }
  if(coop.open)orb.magic=1;
}
if(coop.open&&p.x>15220&&orb.x>15220){
  coop.wallPassed=true;coop.open=false;coop.charge=0;
  checkpoint={x:15250,y:508};
  event('coopReunion',true,()=>say(['¡Pudimos! Las piedras vuelven a su lugar.']));
}
if(coop.wallPassed)coop.wallAmount=Math.max(0,coop.wallAmount-dt/1.6);
for(const w of walls.filter(v=>v.x===15080))w.disabled=coop.open||(coop.wallPassed&&coop.wallAmount>0);
if(p.ground&&p.x>16740&&p.x<17180)checkpoint={x:16800,y:508};
event('coopClimb',p.x>16800,()=>showHint('SALTO contra la pared · Después, doble salto hacia la luz'));
if(p.x>17000&&p.x<19420)guidePlatform(dt,'coopStep');
if(p.ground&&player.on?.coopStep)checkpoint={x:player.on.x+35,y:player.on.kind==='moving'?player.on.baseY-125:player.on.y-62};
event('coopOutro',p.x>19420&&p.ground,()=>{coop.done=true;coop.target=null;checkpoint={x:19440,y:508};flags.coopFinal=true;beginCinema('final',finalDialogue());});
event('coopFinal',coop.done&&p.x>20100&&p.ground,()=>beginCinema('final',finalDialogue()));
}
function updateFragile(dt){
for(const p of platforms.filter(p=>p.kind==='crumble')){
if(p.falling){p.recover+=dt;p.y+=650*dt;if(p.recover>3){p.y=p.baseY;p.age=0;p.falling=false;p.recover=0;}}
else if(p.age>0){p.age+=dt;if(p.age>.65){p.falling=true;burst(p.x+p.w/2,p.y,'#e8b376',12);}}
}
}
function updateQuest(dt,I){
doorTime=Math.max(0,doorTime-dt);
if(player.ground&&player.x>4740&&player.x<4920&&I.act){doorTime=7.5;showHint('¡La puerta está abierta! Tenés 7,5 segundos.');tone(830,.2);}
if(player.x>QUEST_DOOR+65&&doorTime>0)doorPassed=true;
if(!doorPassed&&doorTime===0&&player.x+38>QUEST_DOOR)player.x=QUEST_DOOR-38;
for(const spot of [{id:'qC',x:1250,y:558,end:1500},{id:'qO',x:2850,y:348,end:3070},{id:'qT',x:4510,y:558,end:4800}])event(spot.id,player.ground&&player.x>=spot.x&&player.x<spot.end&&Math.abs(player.y-spot.y)<8,()=>{checkpoint={x:spot.x,y:spot.y};});
event('qWalls',player.x>1500,()=>showHint('Acercate a la planta · Mantené SALTO para trepar'));
event('qFragile',player.x>2850,()=>showHint('Las plataformas doradas caen al pisarlas. ¡Seguí saltando!'));
event('qButton',player.x>4670,()=>showHint('Enter / Ⓧ junto a la palanca · Abrí el muro y corré'));
}
function wall(x,y,w,h){const p={x,y,w,h,kind:'wall',solid:true};walls.push(p);platforms.push(p);}
function rope(x,y,len){ropes.push({x,y,len,angle:-.45,speed:0,tipX:x-Math.sin(.45)*len,tipY:y+Math.cos(.45)*len});}
function enemy(x,floor,min,max){enemies.push({x,y:floor-36,w:46,h:36,min,max,dir:1,alive:true,speed:65});}
function letter(char,x,y){letters.push({char,x,y,collected:false,revealedAt:0,bob:Math.random()*Math.PI*2});}
level();
function showHint(message){hint=message;hintTime=6;}
function respawn(){burst(player.x+19,Math.min(player.y,850),'#b3dce1',20);Object.assign(player,{x:checkpoint.x,y:checkpoint.y,vx:0,vy:0,ground:false,on:null,airJump:true,wall:0,wallJumpDir:0,vine:null,vineCooldown:.4,rope:null,ropeCooldown:.4,invincible:1.2,wallLock:0});buffer=coyote=0;shake=6;}
function collectLetters(){
const p=player;
for(const item of letters){
if((item.char==='I'&&questActive&&!doorPassed)||item.collected||p.x+p.w<item.x-30||p.x>item.x+30||p.y+p.h<item.y-32||p.y>item.y+32)continue;
item.collected=true;item.revealedAt=t;burst(item.x,item.y,'#ffdc77',28);tone(790,.16,'sine',.055);showHint(`Encontraste la ${item.char}`);
if(!flags.firstLetter){flags.firstLetter=true;say(['¿Una letra?']);}
}
if(!lettersComplete&&letters.length&&letters.every(item=>item.collected)){
lettersComplete=true;letterBanner=7;dialog=null;queue=[];burst(player.x+19,player.y-24,'#ffdc77',55);tone(660,.3,'triangle',.06);tone(990,.55,'sine',.04);
beginCinema('name',[{text:'Coti.',d:1.45},{text:'¿Ese es tu nombre?',d:1.75},{text:'No sabía que las letras podían guardar a alguien.',d:3.4},{text:'Algún día quisiera aprender a leer como vos.',d:3.3}]);
}
}
// A forgiving, stationary grip: holding jump climbs; releasing it rests safely.
function stepVine(dt,I,locked){
const p=player;p.vineCooldown=Math.max(0,(p.vineCooldown||0)-dt);
if(p.vine&&!vines.includes(p.vine))p.vine=null;
if(!p.vine&&!p.rope&&!locked&&p.vineCooldown<=0){
const v=vines.find(v=>Math.abs(p.x+p.w/2-v.x)<64&&p.y+p.h>v.top+24&&p.y<v.bottom-12);
if(v){p.vine=v;p.vx=p.vy=0;p.wall=p.wallLock=p.wallJumpDir=0;p.ground=false;p.on=null;p.airJump=true;buffer=coyote=0;showHint('Mantené SALTO para trepar · Soltalo para descansar · ACCIÓN para soltarte');}
}
if(!p.vine)return false;
const v=p.vine;p.vx=p.vy=0;p.ground=false;p.on=null;buffer=coyote=0;
p.x=lerp(p.x,v.x-p.w/2,1-Math.exp(-20*dt));
if(!locked&&I.act){p.vine=null;p.vineCooldown=.65;p.vx=(I.axis||0)*260;p.vy=-160;p.wallLock=.18;return false;}
const direction=locked?0:I.down?1:I.jump?-1:0;
p.vy=direction*185;p.y=clamp(p.y+p.vy*dt,v.top-p.h,v.bottom-p.h);
if(direction<0&&p.y<=v.top-p.h){
p.vine=null;p.vineCooldown=.7;p.x=v.exitX;p.y=v.top-p.h;p.vy=0;p.ground=true;
p.on=platforms.find(f=>f.y===v.top&&p.x>=f.x&&p.x+p.w<=f.x+f.w);
checkpoint={x:p.x,y:p.y};showHint('¡Arriba! Seguí hacia la siguiente letra.');
}else if(direction>0&&p.y>=v.bottom-p.h){p.vine=null;p.vineCooldown=.7;p.vy=0;p.ground=true;}
return true;
}
function stepPhysics(dt,I,locked){
const p=player;hintTime=Math.max(0,hintTime-dt);p.invincible=Math.max(0,(p.invincible||0)-dt);p.ropeCooldown=Math.max(0,(p.ropeCooldown||0)-dt);p.wallLock=Math.max(0,(p.wallLock||0)-dt);
const axis=locked?0:I.axis;
if(questActive)updateQuest(dt,locked?{act:false}:I);
if(questActive||countActive)updateFragile(dt);
if(stepVine(dt,I,locked))return;
for(const r of ropes){r.speed+=(-2.2*Math.sin(r.angle)+(p.rope===r?axis*2.6:0))*dt;r.speed*=Math.exp(-.12*dt);r.angle=clamp(r.angle+r.speed*dt,-1.02,1.02);r.tipX=r.x+Math.sin(r.angle)*r.len;r.tipY=r.y+Math.cos(r.angle)*r.len;}
if(I.jp)buffer=.14;else buffer-=dt;coyote=p.ground?.12:coyote-dt;
if(p.ground)p.airJump=true;
if(!p.rope&&I.act&&!locked&&p.ropeCooldown<=0){const r=ropes.find(r=>Math.hypot(p.x+19-r.tipX,p.y+12-r.tipY)<90);if(r){p.rope=r;p.vx=p.vy=0;p.ground=false;p.on=null;p.airJump=true;tone(560,.1);showHint('← → Balancearte · SALTO para soltarte');}}
if(p.rope){const r=p.rope;p.x=r.tipX-19;p.y=r.tipY+20;p.vx=p.vy=0;
if(I.jp&&!locked){p.rope=null;p.ropeCooldown=.5;p.wallJumpDir=0;p.vx=Math.cos(r.angle)*r.speed*r.len+axis*130;p.vy=-660;p.wallLock=.26;p.airJump=true;buffer=0;burst(p.x+19,p.y,'#a8f1dc');}else return;}
if(p.wallLock<=0)p.vx=lerp(p.vx,axis*350,1-Math.exp(-(p.ground?19:8)*dt));if(Math.abs(axis)>.1)p.face=Math.sign(axis);
if(buffer>0&&!locked){let launched=false;
if(coyote>0){p.wallJumpDir=0;p.vy=-720;p.airJump=true;launched=true;}
// Wall jumps lift the player; horizontal movement always follows their input.
else if(p.wall){p.wallJumpDir=0;p.wallLock=0;p.vx=axis*350;p.vy=-730;p.airJump=true;launched=true;}
else if(I.jp&&p.airJump!==false){p.wallJumpDir=0;p.vy=-670;p.airJump=false;launched=true;burst(p.x+19,p.y+62,'#d4f4e6',18);tone(650,.17,'triangle');}
if(launched){p.ground=false;p.on=null;coyote=buffer=0;p.squash=-.2;tone(340,.13,'triangle');}}
if(!I.jump&&p.vy< -300)p.vy=lerp(p.vy,-300,1-Math.exp(-18*dt));p.vy+=1780*dt;
const oldX=p.x,oldY=p.y;p.x=clamp(p.x+p.vx*dt,20,coop?22900:16900);p.wall=0;
for(const w of walls){if(w.disabled)continue;if(p.y+p.h>w.y+3&&p.y<w.y+w.h-3){if(oldX+p.w<=w.x+4&&p.x+p.w>=w.x){p.x=w.x-p.w;p.wall=1;p.wallJumpDir=0;p.vx=0;}else if(oldX>=w.x+w.w-4&&p.x<=w.x+w.w){p.x=w.x+w.w;p.wall=-1;p.wallJumpDir=0;p.vx=0;}}}
if(p.wall&&p.vy>120){p.vy=120;if(Math.random()<dt*18)burst(p.x+(p.wall>0?38:0),p.y+40,'#79b6b2',1);}
p.y+=p.vy*dt;p.ground=false;p.on=null;
for(const plat of platforms){if(plat.falling||plat.hidden||plat.disabled)continue;if(p.x+p.w<=plat.x||p.x>=plat.x+plat.w)continue;
if(p.vy>=0&&oldY+p.h<=plat.y+5&&p.y+p.h>=plat.y){if(p.vy>180){p.squash=.22;burst(p.x+19,plat.y,'#80bdbb',7);tone(110,.08,'triangle',.025);}p.y=plat.y-p.h;p.vy=0;p.ground=true;p.on=plat;p.airJump=true;if(plat.kind==='crumble'&&plat.age===0)plat.age=.001;}
else if(plat.solid&&p.vy<0&&oldY>=plat.y+plat.h&&p.y<plat.y+plat.h){p.y=plat.y+plat.h;p.vy=0;}}
if(questActive&&!doorPassed&&doorTime===0&&p.x+38>QUEST_DOOR)p.x=QUEST_DOOR-38;if(!questActive&&!countActive&&!gate&&p.x+38>3745&&p.x<3830)p.x=3707;if(!questActive&&!countActive&&!switchOn&&p.x+38>5520&&p.x<5580)p.x=5482;
for(const e of enemies){if(!e.alive)continue;e.x+=e.dir*e.speed*dt;if(e.x<e.min||e.x>e.max){e.x=clamp(e.x,e.min,e.max);e.dir*=-1;}
if(p.x+p.w>e.x&&p.x<e.x+e.w&&p.y+p.h>e.y&&p.y<e.y+e.h){
if(p.vy>0&&oldY+p.h<=e.y+14){e.alive=false;p.y=e.y-p.h;p.vy=I.jump?-650:-470;p.ground=false;p.on=null;p.airJump=true;burst(e.x+23,e.y+15,'#c29bff',26);shake=4;tone(220,.14,'triangle');tone(720,.2);}
else if(p.invincible<=0){respawn();return;}}}
collectLetters();if(!locked)collectCount();if(p.y>1020){respawn();event('fall',true,()=>say(['Estoy acá. ¡Otra vez!']));}
}
function tone(freq=440,d=.12,type='sine',volume=.05){if(muted||!audio)return;const o=audio.createOscillator(),g=audio.createGain();o.type=type;o.frequency.setValueAtTime(freq,audio.currentTime);g.gain.setValueAtTime(0,audio.currentTime);g.gain.linearRampToValueAtTime(volume,audio.currentTime+.012);g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+d);o.connect(g).connect(audio.destination);o.start();o.stop(audio.currentTime+d);}
function initAudio(){if(!audio){try{audio=new (window.AudioContext||window.webkitAudioContext)();}catch{}}audio?.resume().catch(console.warn);prepareNumberAudio();}
function playIntroAudio(){if(typeof Audio==='undefined')return;if(!introAudio){introAudio=new Audio('audio-intro.mp3');introAudio.preload='auto';introAudio.volume=.95;}introAudio.currentTime=0;introAudio.muted=muted;introAudio.play().catch(error=>{if(error.name==='AbortError')return;$('#announcer').textContent='Presioná una tecla para escuchar la conversación.';});}
function playNameAudio(){if(typeof Audio==='undefined')return;if(!nameAudio){nameAudio=new Audio('audio-coti.mp3');nameAudio.preload='auto';nameAudio.volume=.98;}nameAudio.currentTime=0;nameAudio.muted=muted;setBackgroundMix(.1,.18);nameAudio.play().catch(error=>{if(error.name==='AbortError')return;$('#announcer').textContent='Presioná una tecla para escuchar la conversación.';});}
function playMusic(){if(typeof Audio==='undefined')return;if(!musicAudio){musicAudio=new Audio('Banda.mp3');musicAudio.preload='auto';musicAudio.loop=true;musicAudio.volume=.32;}musicAudio.muted=muted;musicAudio.play().catch(()=>{$('#announcer').textContent='Presioná una tecla para escuchar la música.';});}
function playAmbient(){if(typeof Audio==='undefined')return;if(!ambientAudio){ambientAudio=new Audio('Wind.mp3');ambientAudio.preload='auto';ambientAudio.loop=true;ambientAudio.volume=.55;}ambientAudio.muted=muted;ambientAudio.play().catch(()=>{$('#announcer').textContent='Presioná una tecla para escuchar el ambiente.';});}
function setBackgroundMix(music=.32,ambient=.55){musicTarget=music;ambientTarget=ambient;}
function updateBackgroundMix(dt){const amount=1-Math.exp(-2.4*dt);if(musicAudio)musicAudio.volume=lerp(musicAudio.volume,musicTarget,amount);if(ambientAudio)ambientAudio.volume=lerp(ambientAudio.volume,ambientTarget,amount);}
function stopBackgroundAudio(){for(const clip of [musicAudio,ambientAudio])if(clip){clip.pause();clip.currentTime=0;}}
const numberClips=[];
function prepareNumberAudio(){if(!audio||numberClips.length||!window.createNumberVoice)return;for(const data of window.numberVoiceData)numberClips.push(window.createNumberVoice(audio,data));}
function stopNumberAudio(){numberResume=false;if(numberAudio){numberAudio.pause();numberAudio.currentTime=0;numberAudio=null;}}
function playNumberAudio(n){initAudio();stopNumberAudio();numberAudio=numberClips[n-1]||null;if(!numberAudio){console.error('No se cargaron las voces de los números');showHint('Recargá el juego para cargar las voces.');return;}numberAudio.muted=muted;numberAudio.play().catch(error=>{console.error('No se pudo reproducir el número',n,error);showHint('No se pudo reproducir la voz. Activá el sonido y volvé a intentar.');});}
function stopIntroAudio(){if(introAudio){introAudio.pause();introAudio.currentTime=0;}}
function stopNameAudio(){if(nameAudio){nameAudio.pause();nameAudio.currentTime=0;}setBackgroundMix();}
function stopChapterVoice(){chapterVoice?.clip?.pause();chapterVoice=null;setBackgroundMix();}
function beginChapterVoice(stage,lineCount=queue.length){
stopChapterVoice();
const data=window.chapterVoiceData?.[stage],clip=audio&&data&&window.createNumberVoice?window.createNumberVoice(audio,data):null;
let end=0;const lines=queue.splice(0,lineCount).map(line=>{const start=line.start??end;end=line.end??(start+line.d);return {...line,start,end};});
chapterVoice={clip,lines,lead:1.2,started:false,time:0,wait:0};
if(stage==='ageReveal')dialog={text:'¡Seis!',d:1.2,left:1.2,voice:'number'};
if(clip)clip.muted=muted;
setBackgroundMix(.1,.18);
}
function updateChapterVoice(dt){
const voice=chapterVoice;if(!voice)return;
if(voice.lead>0){voice.lead-=dt;return;}
if(!voice.started){voice.started=true;voice.clip?.play().catch(()=>{if(chapterVoice===voice){voice.clip?.pause();voice.clip=null;}});}
voice.wait+=dt;
if(voice.clip){voice.time=voice.clip.currentTime;if(voice.clip.ended){stopChapterVoice();dialog=null;$('#announcer').textContent='';return;}if(voice.wait>8&&voice.time===0){voice.clip.pause();voice.clip=null;}}
else voice.time+=dt;
const line=voice.lines.find(line=>voice.time>=line.start&&voice.time<line.end);
if($('#announcer').textContent!==(line?.text||''))$('#announcer').textContent=line?.text||'';
dialog=line?{...line,left:line.end-voice.time}:null;
// Silence between cues is intentional. Only the audio's end releases the scene.
if(!voice.clip&&voice.time>=(voice.lines.at(-1)?.end||0))stopChapterVoice();
}
// Two short ribbons spiral around both companions, using the shared particle pool.
function countMagic(item){
const strands=window.secretDisplay?.quality==='low'||window.secretDisplay?.quality==='2d'?10:18;
for(const target of ['player','orb'])for(let i=0;i<strands;i++)for(let tail=0;tail<3;tail++){
const life=2.4+i/strands*.35;
particles.push({x:item.x,y:item.y-78,z:40,vx:0,vy:0,life,max:life,r:tail?2.2:3.8,color:i%3===0?'#ffe7a0':i%3===1?'#a0ffe1':'#94ddff',magic:target,phase:i/strands*Math.PI*2,tail,originX:item.x,originY:item.y-78,opacity:0});
}
}
function updateParticles(dt){
for(const p of particles){
p.life-=dt;
if(p.magic){
const elapsed=p.max-p.life,progress=clamp(elapsed/p.max,0,1),gather=1-Math.pow(1-clamp(elapsed/.42,0,1),3);
const target=p.magic==='player'?{x:player.x+19,y:player.y+27,z:30}:orb;
const angle=p.phase+elapsed*4.8-p.tail*.13,radius=(p.magic==='player'?43:36)*(1+progress*.35);
p.x=lerp(p.originX,target.x+Math.cos(angle)*radius,gather);
p.y=lerp(p.originY,target.y+Math.sin(angle*2)*15+(1-progress)*35-progress*58,gather);
p.z=(target.z||0)+Math.sin(angle)*radius;
p.opacity=Math.sin(Math.PI*progress)*(1-p.tail*.25);
}else{p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=70*dt;}
}
particles=particles.filter(p=>p.life>0);
}
function burst(x,y,color='#ffd67e',n=14){for(let i=0;i<n;i++)particles.push({x,y,vx:(Math.random()-.5)*180,vy:-Math.random()*150,life:.5+Math.random()*.5,max:1,color,r:2+Math.random()*4});}
// Only lines explicitly associated with a recording are presented as dialogue.
// Keep silent scene timing so camera paths and progression remain unchanged.
function say(lines,voice=null){for(const line of lines)queue.push({...(typeof line==='string'?{text:line,d:Math.max(2.4,line.length*.063)}:line),voice});}
// Cue boundaries from local word transcription + silence detection on the MP3s.
// Ends include a short reading hold; starts follow speech, not the previous cue.
function timedDialogue(cues){return cues.map(([start,end,text])=>({text,start,end,d:end-start}));}
function ageRevealDialogue(){return timedDialogue([[.97,1.98,'Ahora entiendo.'],[1.98,4.96,'Los números también pueden contar cosas sobre alguien.'],[5.28,7.24,'Las letras guardaban tu nombre'],[7.28,9.53,'y los números guardan cuánto creciste.']]);}
function coopDialogue(){return timedDialogue([[.28,2.45,'Ya me enseñaste a leer tu nombre.'],[2.63,4.15,'Y a contar hasta seis.'],[4.39,6.08,'Ahora quiero ayudarte yo.'],[6.48,9.35,'Aunque sea chiquito… algo debo poder hacer.']]);}
function finalDialogue(){return timedDialogue([[.27,.94,'Coti.'],[1.55,2.92,'Ya sé que sos vos.'],[3.55,5.46,'La persona que estaba buscando.'],[5.8,7.76,'Quería conocerte antes de llegar.'],[8.48,11.17,'Yo todavía no puedo saltar como vos.'],[11.85,12.65,'Ni leer.'],[13.07,15.26,'Ni contar hasta seis sin ayuda.'],[15.66,18.2,'Estoy creciendo en la panza de mi mamá.'],[18.92,20.16,'Y cuando salga…'],[20.41,22.16,'vas a ser mi primo mayor.'],[22.91,24.77,'¿Me guardás un lugar para jugar?']]);}
function event(id,condition,fn){if(condition&&!flags[id]){flags[id]=true;fn();}}
function updateSkipButton(){const button=$('#skipCinema');if(button?.classList?.toggle)button.classList.toggle('hidden',mode!=='play'||!cinema.stage);}
function skipCinema(){if(mode!=='play'||!cinema.stage)return;const skipped=cinema.stage;stopChapterVoice();if(skipped==='ageReveal')stopNumberAudio();queue=[];dialog=null;cinema.closing=false;cinema.blend=0;buffer=0;if(skipped==='intro'){stopIntroAudio();entrance=0;$('#cover').classList.add('hidden');cinema.stage=null;updateSkipButton();showHint('Cinemática omitida.');return;}if(skipped==='middle'){flags.calmDone=true;cinema.stage=null;updateSkipButton();showHint('Cinemática omitida.');return;}if(skipped==='name'){stopNameAudio();cinema.stage=null;updateSkipButton();beginCounting();return;}if(skipped==='ageIntro'){cinema.stage=null;updateSkipButton();showHint('ETAPA 2 · Tocá las luces del 1 al 6');return;}if(skipped==='ageReveal'){stopNameAudio();cinema.stage=null;chapterFade=2;updateSkipButton();return;}if(skipped==='coopIntro'||skipped==='coopOutro'){cinema.stage=null;updateSkipButton();return;}if(skipped==='final'){mode='end';ending=0;document.body.classList.remove('playing');updateSkipButton();}}
function beginCinema(stage,lines){cinema.stage=stage;cinema.time=0;cinema.closing=false;queue=[];const lead=stage==='intro'?.35:stage==='name'?.18:1.2;dialog={text:'',d:lead,left:lead};buffer=0;player.rope=null;player.vine=null;updateSkipButton();if(stage==='intro'){playIntroAudio();if(entrance>0)introAudio?.pause();}if(stage==='name')playNameAudio();const voicedLines=['intro','name','ageIntro','ageReveal','coopIntro','final'].includes(stage)?lines.length:0;say(lines.slice(0,voicedLines),stage);say(lines.slice(voicedLines));if(['ageIntro','ageReveal','coopIntro','final'].includes(stage))beginChapterVoice(stage);}
function animateOrb(dt){
orbPhase+=dt;const phase=orbPhase;const cycle=(cinema.stage?cinema.time:phase)%15,orbit=mode!=='title'&&entrance===0&&cycle>8&&cycle<12.8,theta=(cycle-8)/4.8*Math.PI*2;
let tx,ty,tz;
if(orbit){tx=player.x+19+Math.cos(theta)*88;ty=player.y-14+Math.sin(theta)*24;tz=30+Math.sin(theta)*70;}
else{const ahead=cinema.stage?lerp(75,110,entrance*entrance*(3-2*entrance)):110;const sway=Math.sin(phase*.83)*25+Math.sin(phase*.31)*22;tx=player.x+19+player.face*(ahead+sway);ty=player.y-20+Math.sin(phase*1.65)*20+Math.sin(phase*.6)*8;tz=45+Math.sin(phase*.85)*18;}
if(!cinema.stage&&!questActive&&!countActive){if(bridge&&player.x>2140&&player.x<2700){tx=2510+Math.sin(phase*2)*20;ty=554+Math.cos(phase*2.2)*18;}
else if(!gate&&player.x>3070){tx=Math.min(player.x+120,3700)+Math.sin(phase)*22;ty=500+Math.sin(phase*1.8)*24;}
else if(player.x>4440&&player.x<4650){tx=player.x+100+Math.sin(phase)*30;ty=player.y-65+Math.sin(phase*2)*20;}}
if(coop?.target&&!cinema.stage){tx=coop.target.x;ty=coop.target.y+Math.sin(phase*2)*8;tz=45;}
const distance=Math.hypot(tx-orb.x,ty-orb.y);if(distance>950){orb.x=player.x-110;orb.y=player.y-25;orb.vx=orb.vy=0;}
// A damped spring carries momentum through each change of intention.
const gust=.65+.35*Math.sin(t*1.15+orb.x*.006);orb.vx+=((tx-orb.x)*19-gust*105+Math.sin(t*2.3)*24)*dt;orb.vy+=((ty-orb.y)*19+Math.sin(t*1.8-orb.x*.008)*48*gust)*dt;orb.vx*=Math.exp(-5.7*dt);orb.vy*=Math.exp(-5.7*dt);orb.x+=orb.vx*dt;orb.y+=orb.vy*dt;orb.z=lerp(orb.z||45,tz,1-Math.exp(-4*dt));
if(Math.random()<dt*18)particles.push({x:orb.x,y:orb.y,vx:-orb.vx*.04,vy:8,life:.75,max:.75,color:'#ffd97d',r:2});
}
function start(){if(mode==='play')return;keys.clear();window.secretMobile?.clear();entrance=mode==='title'?1:0;initAudio();playAmbient();playMusic();mode='play';window.secretMobile?.setMode(mode);$('#cover').classList.add('departing');$('#start').disabled=true;$('#pause').classList.add('hidden');document.body.classList.add('playing');beginCinema('intro',[{text:'Hola. Necesito ayuda.',speaker:'PUNTO',d:2.35},{text:'Estoy buscando a alguien especial.',speaker:'PUNTO',d:2.45},{text:'Pero aún no sé su nombre.',speaker:'PUNTO',d:2.35},{text:'¿Me acompañás?',speaker:'PUNTO',d:2.65}]);}
function reset(){gameSfx?.reset();mode='restart';entrance=0;stopIntroAudio();stopNameAudio();stopBackgroundAudio();stopNumberAudio();stopChapterVoice();level();player={x:180,y:660,vx:0,vy:0,w:38,h:62,ground:false,face:1,squash:0};orb={x:340,y:560,vx:0,vy:0};flags={};queue=[];dialog=null;gate=switchOn=bridge=finalBridge=false;ending=0;cam=0;checkpoint={x:180,y:660};particles=[];buffer=coyote=0;selection=1;hintTime=0;hint='';cinema={stage:null,blend:0,time:0,closing:false};orbPhase=0;start();}
function pause(){keys.clear();window.secretMobile?.clear();if(mode==='play'){mode='pause';syncGameSfx();window.secretMobile?.setMode(mode);chapterVoice?.clip?.pause();musicAudio?.pause();ambientAudio?.pause();numberResume=!!numberAudio&&!numberAudio.paused&&!numberAudio.ended;numberAudio?.pause();if(cinema.stage==='intro')introAudio?.pause();if(cinema.stage==='name')nameAudio?.pause();$('#pause').classList.remove('hidden');$('#resume').focus();}else if(mode==='pause'){mode='play';syncGameSfx();window.secretMobile?.setMode(mode);playMusic();playAmbient();if(chapterVoice?.started)chapterVoice.clip?.play().catch(()=>{if(chapterVoice)chapterVoice.clip=null;});if(numberResume){numberResume=false;numberAudio?.play().catch(()=>{});}if(cinema.stage==='intro'&&entrance===0)introAudio?.play().catch(()=>{});if(cinema.stage==='name')nameAudio?.play().catch(()=>{});$('#pause').classList.add('hidden');}}
if(document.createElement){const skipButton=document.createElement('button');skipButton.id='skipCinema';skipButton.className='skip-cinema hidden';skipButton.type='button';skipButton.innerHTML='Saltar cinemática <span>Esc</span>';document.querySelector('main')?.append(skipButton);if(typeof setInterval==='function')setInterval(updateSkipButton,250);}
function toggleSound(){muted=!muted;syncGameSfx();if(chapterVoice?.clip)chapterVoice.clip.muted=muted;introAudio&&(introAudio.muted=muted);nameAudio&&(nameAudio.muted=muted);musicAudio&&(musicAudio.muted=muted);ambientAudio&&(ambientAudio.muted=muted);numberAudio&&(numberAudio.muted=muted);$('#sound').textContent='Sonido: '+(muted?'no':'sí');showHint(muted?'Sonido apagado.':'Sonido activado.');}$('#start').onclick=start;$('#resume').onclick=pause;$('#restart').onclick=reset;const skipCinemaButton=$('#skipCinema');if(skipCinemaButton)skipCinemaButton.onclick=skipCinema;$('#sound').onclick=toggleSound;$('#pauseButton').onclick=()=>{if(mode==='play')pause();};addEventListener('secret:pause',()=>{if(mode==='play')pause();});$('#full').onclick=()=>{if(window.secretMobile)return window.secretMobile.fullscreen();if(document.fullscreenElement)document.exitFullscreen?.();else document.documentElement.requestFullscreen?.().catch(()=>{});};
function keyCode(e){return (e.code&&e.code!=='Unidentified'?e.code:null)||({ArrowLeft:'ArrowLeft',ArrowRight:'ArrowRight',ArrowUp:'ArrowUp',ArrowDown:'ArrowDown',Enter:'Enter',' ':'Space',Escape:'Escape',Back:'Escape',GoBack:'Escape'})[e.key]||({13:'Enter',32:'Space',37:'ArrowLeft',38:'ArrowUp',39:'ArrowRight',40:'ArrowDown',27:'Escape',10009:'Escape',461:'Escape'})[e.keyCode];}
addEventListener('keydown',e=>{if(e.target?.tagName==='SELECT')return;const code=keyCode(e);if(e.target?.tagName==='BUTTON'&&['Enter','Space'].includes(code))return;if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Space','Enter'].includes(code))e.preventDefault();if(code==='Escape'&&!e.repeat&&cinema.stage){e.preventDefault();skipCinema();return;}if(code==='KeyF'&&!e.repeat){$('#full').click();return;}if(code==='KeyM'&&!e.repeat){toggleSound();return;}keys.add(code);});addEventListener('keyup',e=>keys.delete(keyCode(e)));addEventListener('blur',()=>{keys.clear();if(mode==='play')pause();});document.addEventListener('visibilitychange',()=>{if(document.hidden){keys.clear();window.secretMobile?.clear();if(mode==='play')pause();}});
function input(){const held=code=>keys.has(code)||!!window.secretMobile?.held(code);const atLever=mode==='play'&&!cinema.stage&&(questActive?player.ground&&player.x>4740&&player.x<4920:!countActive&&player.x>5130&&player.x<5410&&player.y>650);let down=held('ArrowDown')||held('KeyS');let axis=(held('ArrowRight')||held('KeyD')?1:0)-(held('ArrowLeft')||held('KeyA')?1:0),jump=held('Space')||held('ArrowUp')||held('KeyW'),action=held('Enter')||held('NumpadEnter')||(atLever?!!window.secretMobile?.held('KeyE'):held('KeyE')||held('KeyB')),p=held('Escape')||held('KeyP'),sound=held('KeyM'),graphics=held('KeyY');const gp=window.secretControls?.read()||{};padActive=!!gp.connected;if(padActive){axis+=gp.axis||0;down||=gp.vertical>.5;jump||=gp.jump;action||=gp.action;p||=gp.pause;sound||=gp.sound;graphics||=gp.graphics;}const out={axis:clamp(axis,-1,1),down:!!down,jump:!!jump,jp:!!jump&&!prevJump,act:!!action&&!prevAction,pp:!!p&&!prevPause,mp:!!sound&&!prevSound,yp:!!graphics&&!prevGraphics};prevJump=!!jump;prevAction=!!action;prevPause=!!p;prevSound=!!sound;prevGraphics=!!graphics;if(window.secretMenus?.handle(gp)){keys.clear();return {axis:0,jump:false,jp:false,act:false,pp:false,mp:false,yp:false};}return out;}
function update(dt,I){t+=dt;updateBackgroundMix(dt);if(I.mp)toggleSound();if(I.pp)pause();syncGameSfx();gameSfx?.update(dt,player);if(mode==='title'){animateOrb(dt);particles=particles.filter(p=>(p.life-=dt)>0);if(I.jp||I.act)start();return;}if(mode==='pause'){if(I.jp)pause();else if(I.act)reset();return;}if(mode==='end'){ending+=dt;animateOrb(dt);if(ending<4){stepPhysics(dt,{...I,axis:.1,jump:false,jp:false,act:false},false);cam=lerp(cam,player.x-570,1-Math.exp(-4*dt));}return;}
letterBanner=Math.max(0,letterBanner-dt);
if(chapterFade>0){const before=chapterFade;chapterFade=Math.max(0,chapterFade-dt);if(before>1&&chapterFade<=1)continueAfterCounting();animateOrb(dt);return;}
if(entrance>0){entrance=Math.max(0,entrance-dt/2.6);cinema.blend=1-entrance*entrance*(3-2*entrance);animateOrb(dt);particles=particles.filter(p=>(p.life-=dt)>0);if(entrance===0){$('#cover').classList.add('hidden');if(cinema.stage==='intro')introAudio?.play().catch(()=>{});}return;}
cinema.time+=dt;cinema.blend=lerp(cinema.blend,cinema.stage&&!cinema.closing?1:0,1-Math.exp(-2.5*dt));
if(chapterVoice)updateChapterVoice(dt);else if(dialog){dialog.left-=dt;if(dialog.left<=0)dialog=null;}if(!chapterVoice&&!dialog&&queue.length){dialog=queue.shift();dialog.left=dialog.d;$('#announcer').textContent=dialog.voice?dialog.text:'';if(dialog.voice)tone(700+Math.random()*180,.08,'sine',.025);}
const locked=!!cinema.stage;
if(cinema.stage&&!chapterVoice&&!dialog&&!queue.length&&!cinema.closing){if(cinema.stage==='name'){stopNameAudio();beginCounting();}else if(cinema.stage==='final'){mode='end';ending=0;document.body.classList.remove('playing');updateSkipButton();return;}else{cinema.closing=true;if(cinema.stage==='middle')flags.calmDone=true;}}
if(cinema.closing&&cinema.blend<.025){const finished=cinema.stage;if(finished==='intro')stopIntroAudio();if(finished==='name')stopNameAudio();cinema.stage=null;cinema.closing=false;cinema.blend=0;buffer=0;if(finished==='ageIntro')showHint('ETAPA 2 · Tocá las luces del 1 al 6');if(finished==='ageReveal'){chapterFade=2;return;}}

for(const p of platforms)if(p.kind==='moving'){const old=p.y;p.y=p.baseY+Math.sin(t*p.speed)*p.amp;if(player.on===p)player.y+=p.y-old;}
if(cinema.stage){const walking=cinema.stage==='final';stepPhysics(dt,{...I,axis:walking?.105:0,jump:false,jp:false,act:false},!walking);}else stepPhysics(dt,I,locked);
updateCoop(dt);
player.squash*=Math.exp(-12*dt);shake*=Math.exp(-8*dt);
if(!questActive&&!countActive&&!coop){
event('path',!cinema.stage&&player.x>550,()=>{say(['Por acá.']);showHint('SALTO dos veces · Doble salto');});
event('cp1',player.x>1050&&player.x<1350&&player.ground,()=>{checkpoint={x:1050,y:620};});
event('cp2',lettersComplete&&player.x>1950&&player.x<2350&&player.ground,()=>{checkpoint={x:1950,y:610};});
event('stompHint',player.x>930,()=>showHint('Saltá sobre los bichitos para deshacerlos.')); event('hard',player.x>1020,()=>say(['Ese parece difícil.']));event('well',lettersComplete&&player.x>1950,()=>{say(['Sí que sabés, Coti.']);burst(orb.x,orb.y);});
event('bridge',player.x>2130,()=>{bridge=true;rect(2340,690,150,30,'light');rect(2680,690,130,30,'light');say(['Yo también puedo ayudar.']);});
event('numbers',player.x>2930,()=>{checkpoint={x:2860,y:600};say(['Hmm…','Yo todavía no entiendo mucho de esto.']);});
if(player.x>3090&&player.x<3710&&!gate){selection=clamp(Math.floor((player.x-3100)/195),0,2);if(I.act){if(selection===1){gate=true;say(['¿Cómo supiste?','Después me vas a tener que enseñar.']);burst(3745,570,'#ffda87',35);tone(660,.4);tone(990,.7);checkpoint={x:3880,y:610};}else{wrong=1;say(['Probemos otro.']);tone(180,.16,'triangle');}}}wrong=Math.max(0,wrong-dt);
event('maze',player.x>4050,()=>say(['¿Por dónde?']));event('orbWrong',player.x>4490,()=>say(['Por ahí no era.']));event('deadEnd',player.x>5090&&player.y<440,()=>say(['Bueno… probemos abajo.']));
if(!switchOn&&player.x>5130&&player.x<5410&&player.y>650&&I.act){switchOn=true;say(['Sabía que lo ibas a encontrar.']);burst(5310,740,'#8bfff0',30);tone(520,.4);}
event('calm',player.x>5840&&player.ground,()=>{checkpoint={x:5680,y:640};beginCinema('middle',[{text:'Esperá.',d:2.3},{text:'Sabés hacer un montón de cosas.',d:3.5},{text:'Algún día me vas a tener que enseñar.',d:3.5}]);});
event('last',player.x>6280,()=>say(['¡Vamos!']));event('finalBridge',player.x>6380,()=>{finalBridge=true;checkpoint={x:6520,y:640};say(['Ahora viene lo bueno.']);});
event('wallHint',player.x>6680,()=>{showHint('Contra la pared: SALTO · Repetí para trepar');say(['¿También podés subir por ahí?']);});
event('ropeHint',player.x>7160,()=>{showHint('En el aire, E / Ⓧ cerca del extremo de la soga');say(['¡Agarrate!']);});
for(const spot of [{id:'tower',x:7210,y:288,end:7370},{id:'rope1',x:8210,y:403,end:8400},{id:'garden',x:9120,y:508,end:9460},{id:'tower2',x:10570,y:158,end:10770},{id:'rope2',x:11620,y:328,end:11830},{id:'lastRun',x:12720,y:478,end:12870}])event('cp_'+spot.id,player.ground&&player.x>=spot.x&&player.x<spot.end&&Math.abs(player.y-spot.y)<8,()=>{checkpoint={x:spot.x,y:spot.y};burst(player.x+19,player.y+30,'#a0e7d8',8);});
event('almost',player.x>13830,()=>say(['Falta poquito.']));
event('finale',player.x>14500&&player.ground,()=>beginCinema('final',finalDialogue()));
}
animateOrb(dt);
updateParticles(dt);
cam=lerp(cam,clamp(player.x-570+player.vx*.35,0,coop?21600:15600),1-Math.exp(-4*dt));
}
function round(x,y,w,h,r,fill){c.fillStyle=fill;c.beginPath();c.roundRect(x,y,w,h,r);c.fill();}
function ellipse(x,y,rx,ry,fill){c.fillStyle=fill;c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fill();}
function text(s,x,y,size=28,color='#f4f1db',align='center',font='system-ui'){c.fillStyle=color;c.font=`500 ${size}px ${font}`;c.textAlign=align;c.fillText(s,x,y);}
function scene2DState(){return {t,cam,player,orb,platforms,walls,ropes,vines,enemies,letters,countLights,countValue,questActive,countActive,coop,gate,switchOn,doorTime,cinema,mode,ending};}
function background(){window.secretScene2D?.background(c,scene2DState());}
function terrain(){window.secretScene2D?.terrain(c,scene2DState());}
function adventureArt(){window.secretScene2D?.objects(c,scene2DState());}
function character(){window.secretScene2D?.boy(c,scene2DState());}
function companion(){
const lift=mode==='end'?1:cinema.stage==='final'?clamp(cinema.time/5,0,1):0,flight=mode==='end'?clamp(ending/6,0,1):0;
c.save();c.translate(lerp(orb.x,cam+1024,flight),lerp(orb.y-lift*100,148,flight));c.scale(1-flight*.96,1-flight*.96);const gust=.65+.35*Math.sin(t*1.15+orb.x*.006);
function haze(x,y,r,color,alpha){const g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,'rgba('+color+','+alpha+')');g.addColorStop(.28,'rgba('+color+','+(alpha*.48)+')');g.addColorStop(.65,'rgba('+color+','+(alpha*.1)+')');g.addColorStop(1,'rgba('+color+',0)');c.fillStyle=g;c.fillRect(x-r,y-r,r*2,r*2);}
haze(0,0,90,'255,190,85',.28);for(let i=4;i>=0;i--){const u=(i+1)/5;haze((-orb.vx*.075-gust*22)*u+Math.sin(t*1.8+i)*4,(-orb.vy*.06-12)*u,24-i*2,'255,211,132',.22);}haze(0,0,37,'255,234,176',.95);haze(-2,-3,24,'255,246,214',.85);
for(let i=0;i<7;i++){const age=(t*.3+i/7)%1;haze(Math.cos(i*2.399)*(17+age*19)+gust*age*26-orb.vx*.09*age,Math.sin(i*2.399)*13-age*38-orb.vy*.06*age,3,'255,226,160',Math.sin(age*Math.PI)*.65);}
c.rotate(clamp(orb.vx*.001-gust*.12,-.3,.3));const look=clamp((player.x-orb.x)*.022,-2.5,2.5),cycle=t%5.7,blink=Math.max(0,1-Math.abs(cycle-4.6)/.11,.85*(1-Math.abs(cycle-4.88)/.08));
for(const side of [-1,1]){haze(side*10,4,7,'255,150,125',.48);ellipse(side*5.5+look,-1,2.4,3.2*(1-blink*.9),'#513426');if(blink<.5)ellipse(side*5.5+look-.7,-2.3,.8,1,'#fff8de');}c.strokeStyle='#815039';c.lineWidth=1;c.lineCap='round';c.beginPath();c.moveTo(-2+look*.65,4);c.quadraticCurveTo(look*.65,7,2+look*.65,4);c.stroke();c.restore();}
function cinematicOverlay(){
const exit=mode==='end'?clamp(ending/3.5,0,1):0;const amount=cinema.blend*(1-exit*exit*(3-2*exit));if(amount<=.005)return;c.fillStyle='#02060c';c.fillRect(0,0,W,98*amount);c.fillRect(0,H-160*amount,W,160*amount);
if(mode==='end'||!dialog?.voice||!dialog.text||cinema.closing||(dialog.speaker||'PUNTO')==='PUNTO')return;c.globalAlpha=Math.min(1,amount*1.5);text(dialog.speaker||'PUNTO',800,773,18,dialog.speaker==='VOS'?'#9cd6d8':'#ffda87');
c.font='500 31px system-ui';const words=dialog.text.split(' '),lines=[];let line='';for(const word of words){if(c.measureText(line+word).width>1220){lines.push(line.trim());line='';}line+=word+' ';}lines.push(line.trim());lines.forEach((line,i)=>text(line,800,818+i*39,31,'#f1efe4'));c.globalAlpha=1;
}
function bubble(){if(!dialog?.voice||!dialog.text||(dialog.speaker||'PUNTO')!=='PUNTO')return;const s=dialog.text;c.font='500 30px system-ui';const maxWidth=cinema.stage?530:650,words=s.split(' '),lines=[];let line='';for(const w of words){if(c.measureText(line+w).width>maxWidth){lines.push(line.trim());line='';}line+=w+' ';}lines.push(line.trim());const bw=Math.max(...lines.map(l=>c.measureText(l).width))+58,bh=lines.length*41+28,screen=window.orbScreenPosition?.(),ox=screen?.x??orb.x-cam,oy=screen?.y??orb.y,x=clamp(ox-bw/2,36,W-bw-36),y=clamp(oy-bh-58,42,H-bh-48);c.shadowColor='#0008';c.shadowBlur=22;round(x,y,bw,bh,16,'#eef1df');c.shadowBlur=0;c.fillStyle='#eef1df';c.beginPath();let tip=clamp(ox,x+24,x+bw-24);c.moveTo(tip-10,y+bh-1);c.lineTo(tip+10,y+bh-1);c.lineTo(tip,Math.min(H-25,y+bh+13));c.fill();lines.forEach((l,i)=>text(l,x+bw/2,y+42+i*41,30,'#18303a'));}
function controlLabels(){const touch=!padActive&&(window.secretDisplay?.mobile||!!window.matchMedia?.('(any-pointer:coarse)').matches);return {action:padActive?'Ⓧ':touch?'Acción':'Enter',jump:padActive?'Ⓐ':touch?'Saltar':'ESPACIO',move:padActive?'Palanca / cruceta':touch?'◀  ▶':'← → / A D',verb:touch?'Tocá':'Pulsá'};}
function worldLabels(){
if(coop)return;
if(countActive){
round(54,88,570,64,16,'#071b2be8');
for(let i=1;i<=6;i++){const x=85+(i-1)*87;round(x,96,72,40,9,i<=countValue?'#b6f5d9':i===countValue+1?'#496d72':'#1c3946');text(String(i),x+36,126,28,i<=countValue?'#173e3e':'#e3f4e8');}
const next=countLights.find(v=>!v.lit);if(next){const sx=next.x-cam;if(sx>W-80){text(next.n+' →',W-150,112,24,'#b6f5d9');}else if(sx<80)text('← '+next.n,150,192,24,'#b6f5d9');}
c.save();c.translate(-cam,0);for(const v of countLights){}c.restore();return;
}
c.save();
if((!lettersComplete||letterBanner>0)&&cinema.blend<.05){const x=54,y=54;round(x,y,292,78,14,'#071b2bdd');letters.forEach((item,i)=>{const bx=x+38+i*67,reveal=item.collected?clamp((t-(item.revealedAt||0))*4,0,1):0,ease=1-Math.pow(1-reveal,3);round(bx,y+37,50,31,7,item.collected?'#ffd875':'#1b4151');if(!item.collected){round(bx+16,y+60,18,2,1,'#49717a');return;}c.save();c.globalAlpha=ease;c.translate(bx+25,y+60);c.scale(.55+ease*.45,.55+ease*.45);text(item.char,0,0,24,'#263641');c.restore();});}
c.restore();
if(questActive){
const controls=controlLabels();
if(!flags.firstLetter){round(330,150,940,112,16,'#071b2be8');text(controls.move+' · Moverte     '+(controls.jump==='Saltar'?'↑':controls.jump)+' · Saltar',800,192,27,'#f4e7bd');text(controls.verb+' '+controls.jump+' otra vez en el aire: doble salto',800,235,26,'#c9efb4');}
if(player.vine){round(390,150,820,60,14,'#071b2bdd');text('Mantené '+controls.jump+' para trepar · '+controls.action+' para soltarte',800,190,25,'#c9efb4');}
if(player.x>4500){round(1030,54,500,78,14,'#071b2bdd');text(doorPassed?'✓':doorTime>0?doorTime.toFixed(1)+' s':controls.action+' · Abrir',1280,103,28,doorTime>0?'#ffcf78':'#cce7dc');}
c.save();c.translate(-cam,0);text(controls.action,4825,445,25,'#ffe6a8');c.restore();return;}
c.save();c.translate(-cam,0);
if(!gate){round(3060,330,620,100,14,'#071c2ce8');text('4123 → 4133 → 4143 → ?',3370,390,36,'#d8e9df');['4144','4153','4243'].forEach((v,i)=>{round(3100+i*195,586,175,72,10,selection===i?'#d9c48b':'#284955');text(v,3187+i*195,634,36,selection===i?'#162a33':'#d7e4df');});if(player.x>3070&&player.x<3745)text(padActive?'Ⓧ':'E',3380,530,26,wrong?'#ffb3a0':'#bde1d6');}
if(!switchOn&&player.x>4940&&player.y>620)text(padActive?'Ⓧ':'Enter',5245,578,25);
for(const r of ropes)if(Math.hypot(player.x+19-r.tipX,player.y+12-r.tipY)<130&&!player.rope)text(padActive?'Ⓧ':'E',r.tipX+40,r.tipY,28,'#fff2b1');
c.restore();
}
function render(){c.clearRect(0,0,W,H);if(window.secretWorld){window.secretWorld.draw({t,cam,player,orb,coop,platforms,walls,ropes,vines,enemies,letters,lettersComplete,questActive,countActive,countLights,countValue,doorTime,doorPassed,particles,gate,switchOn,bridge,mode,cinema,entrance,ending,speaker:dialog?.voice&&dialog.text?(dialog.speaker||'PUNTO'):null});if(mode!=='title'&&entrance===0&&cinema.blend<.05)worldLabels();}else{background();c.save();c.translate(-cam+(Math.random()-.5)*shake,0);terrain();adventureArt();for(const p of particles){c.globalAlpha=p.opacity??clamp(p.life/p.max,0,1);ellipse(p.x,p.y,p.r,p.r,p.color);}c.globalAlpha=1;character();companion();c.restore();if(mode!=='title'&&entrance===0&&cinema.blend<.05)worldLabels();}const vignette=c.createRadialGradient(800,380,250,800,450,950);vignette.addColorStop(0,'#02091600');vignette.addColorStop(1,'#02091677');c.fillStyle=vignette;c.fillRect(0,0,W,H);
if(!window.secretWorld&&entrance>0){c.fillStyle=`rgba(2,6,12,${entrance})`;c.fillRect(0,0,W,H);c.save();const e=entrance*entrance*(3-2*entrance);c.translate(1100*e,470*e);c.scale(1+1.7*e,1+1.7*e);c.translate(-199*e,-660*e);character();companion();c.restore();}
if(mode==='play'||mode==='pause'){cinematicOverlay();bubble();}else if(mode==='end')cinematicOverlay();
if(chapterFade>0){c.fillStyle=`rgba(2,6,12,${1-Math.abs(chapterFade-1)})`;c.fillRect(0,0,W,H);}
if(mode==='end'){
const reveal=clamp((ending-6)/3,0,1);
c.save();c.globalAlpha=reveal;
const aura=c.createRadialGradient(440,435,25,440,435,355);aura.addColorStop(0,'#ffcf8626');aura.addColorStop(.55,'#e7a2cf12');aura.addColorStop(1,'#ffd89400');c.fillStyle=aura;c.fillRect(70,65,740,740);
for(let i=0;i<22;i++){const angle=i*2.399+t*.075,r=205+Math.sin(i*7.3)*65,x=440+Math.cos(angle)*r*1.25,y=435+Math.sin(angle)*r*.9;const shimmer=.3+.7*(.5+.5*Math.sin(t*1.5+i));c.globalAlpha=reveal*shimmer;c.shadowColor='#ffe5a1';c.shadowBlur=14;ellipse(x,y,1.5+(i%3)*.5,1.5+(i%3)*.5,'#ffe7ae');}
c.globalAlpha=reveal;c.shadowColor='#ffce8b55';c.shadowBlur=22;c.fillStyle='#ffe9be';c.font='700 100px Amatic';c.textAlign='center';c.fillText('Y así empieza',440,405);c.font='700 115px Amatic';c.fillText('nuestra historia',440,525);c.restore();

const star=window.secretWorld?.endStar||{x:lerp(1050,1024,clamp(ending/6,0,1)),y:lerp(460,148,clamp(ending/6,0,1)),flight:clamp(ending/6,0,1)};
const shine=clamp((star.flight-.65)/.35,0,1),pulse=1+Math.sin(t*2.7)*.14;
if(shine>0){c.save();c.globalAlpha=shine;const halo=c.createRadialGradient(star.x,star.y,0,star.x,star.y,48*pulse);halo.addColorStop(0,'#fff5c9cc');halo.addColorStop(.22,'#ffe69b55');halo.addColorStop(1,'#ffda8700');c.fillStyle=halo;c.fillRect(star.x-60,star.y-60,120,120);ellipse(star.x,star.y,3*pulse,4*pulse,'#fffbed');c.fillStyle='#fff5ce';c.beginPath();c.moveTo(star.x,star.y-15*pulse);c.lineTo(star.x+2,star.y-2);c.lineTo(star.x+11*pulse,star.y);c.lineTo(star.x+2,star.y+2);c.lineTo(star.x,star.y+15*pulse);c.lineTo(star.x-2,star.y+2);c.lineTo(star.x-11*pulse,star.y);c.lineTo(star.x-2,star.y-2);c.closePath();c.fill();c.restore();}}

}
let pendingInput={jp:false,act:false,pp:false};
let lastRender=0;function frame(ms){window.secretDisplay?.sample(ms-last);const elapsed=Math.min((ms-last)/1000,.05);last=ms;acc+=elapsed;const I=input();for(const k of ['jp','act','pp','mp','yp']){pendingInput[k] ||= I[k];I[k]=pendingInput[k];}let first=true;while(acc>=1/120){update(1/120,first?I:{...I,jp:false,act:false,pp:false,mp:false,yp:false});first=false;pendingInput={jp:false,act:false,pp:false,mp:false,yp:false};acc-=1/120;}const renderInterval=window.secretDisplay?.frameInterval?.()||0;if(!renderInterval||ms-lastRender>=renderInterval){render();lastRender=ms;}window.secretMobile?.setMode(mode);requestAnimationFrame(frame);}requestAnimationFrame(frame);
// Read-only diagnostics for checking progress and runtime health.
window.gameStatus=()=>({coop:coop?{open:coop.open,bridge:coop.bridge,done:coop.done}:null,questActive,countActive,countValue,countComplete,countLights:countLights.map(v=>({n:v.n,lit:v.lit})),doorTime,doorPassed,entrance,cinematic:cinema.stage,cinemaBlend:cinema.blend,orb:{x:orb.x,y:orb.y,z:orb.z},letters:letters.map(item=>({char:item.char,collected:item.collected})),lettersComplete,doubleJump:player.airJump,wall:player.wall,vine:!!player.vine,rope:!!player.rope,enemies:enemies.filter(e=>e.alive).length,mode,x:Math.round(player.x),y:Math.round(player.y),gate,switchOn,bridge,finalBridge,flags:{...flags},platforms:platforms.length});
})();
