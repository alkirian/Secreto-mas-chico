// Settings and controller polling also work when WebGL is unavailable.
(() => {
  const nativeTV = new URLSearchParams(location.search).get('androidtv') === '1';
  const tv = nativeTV || /smart.?tv|tizen|web0s|webos|netcast|hbbtv|viera|bravia/i.test(navigator.userAgent || '');
  const mobile = !tv && (/Android|iPhone|iPad|iPod/i.test(navigator.userAgent || '') || (navigator.maxTouchPoints > 1 && /Macintosh/i.test(navigator.userAgent || '')));
  // Detailed graphics are fixed on every device, including older saved settings.
  window.secretDisplay = {
    get quality() { return 'high'; },
    get preference() { return 'high'; },
    get mobile() { return mobile; },
    get resolution() { return 1; },
    frameInterval() { return 0; },
    subscribe(fn) { fn('high'); },
    set() {},
    sample() {}
  };

  let selected = null, lastText = '';
  const down = b => typeof b === 'number' ? b > .5 : !!(b && (b.pressed || b.value > .5));
  const activity = g => Array.from(g.buttons || []).some(down) || Array.from(g.axes || []).slice(0, 2).some(a => Math.abs(a) > .25);
  function status(text) {
    if (text === lastText) return;
    lastText = text;
    document.querySelectorAll('.pad-status').forEach(el => { el.textContent = text; });
  }
  window.secretControls = {
    read() {
      if (nativeTV) {
        status('↕ Menús · A: aceptar/saltar · B: volver · X: acción · Start: pausa · L1: sonido');
        return { connected: false }; // Android supplies keyboard events directly.
      }
      const get = navigator.getGamepads || navigator.webkitGetGamepads;
      let pads = [];
      if (!get) status('Este navegador no ofrece acceso al joystick. Se necesita otro navegador o dispositivo.');
      else {
        try { pads = Array.from(get.call(navigator) || []).filter(g => g && g.connected !== false); }
        catch { status('El navegador bloqueó el joystick. Abrí el juego directamente por HTTPS.'); return { connected: false }; }
        if (!pads.length) status('Conectá el joystick y presioná un botón con esta página abierta.');
      }
      const gp = pads.find(g => Array.from(g.buttons || []).some(down)) || pads.find(g => activity(g)) || pads.find(g => g.index === selected) || pads[0];
      if (!gp) { selected = null; return { connected: false }; }
      selected = gp.index;
      const b = gp.buttons || [], a = gp.axes || [];
      const axis = Number.isFinite(a[0]) && Math.abs(a[0]) > .2 ? a[0] : 0;
      // Some USB controllers expose the D-pad as axes 6/7 instead of buttons.
      const dpad = gp.mapping !== 'standard' && a.length >= 8 && Math.abs(a[6]) <= 1 && Math.abs(a[6]) > .5 ? Math.sign(a[6]) : 0;
      status('Joystick conectado: ' + (gp.id || 'mando') + ' · A: aceptar/saltar · X/B: acción · Start: pausa · L1: sonido');
      return { connected: true, axis: Math.max(-1, Math.min(1, axis + dpad + (down(b[15]) ? 1 : 0) - (down(b[14]) ? 1 : 0))), vertical: Math.max(-1,Math.min(1,(Math.abs(a[1]||0)>.5?a[1]:0)+(gp.mapping!=='standard'&&a.length>=8&&Math.abs(a[7])<=1&&Math.abs(a[7])>.5?Math.sign(a[7]):0)+(down(b[13])?1:0)-(down(b[12])?1:0))), back: down(b[1]), confirm: down(b[2]), jump: down(b[0]), action: down(b[2]) || down(b[1]), pause: down(b[9]) || down(b[8]), sound: down(b[4]), graphics: false };
    }
  };
  window.secretControls.read();
})();

// Shared menu navigation for browser gamepads and Android's keyboard bridge.
(() => {
  if (!document.createElement || !window.addEventListener) return;
  const held = new Set();
  const commands = new Set(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space','Enter','KeyE','KeyB','Escape','KeyP','KeyM']);
  let root = null, focused = null, picker = null, previous = {}, repeatAt = 0, direction = '', draining = false;
  const visible = el => !el.disabled && el.getClientRects().length > 0;
  function activeRoot() {
    const dialog = document.querySelector('dialog[open]');
    if (dialog) return dialog;
    const mode = window.gameStatus?.().mode;
    return mode === 'title' ? document.querySelector('#cover') : mode === 'pause' ? document.querySelector('#pause') : null;
  }
  function items() { return root ? Array.from(root.querySelectorAll('button,select,a[href]')).filter(visible) : []; }
  function focus(el) {
    focused?.classList.remove('pad-focus'); focused = el;
    if (el) { el.classList.add('pad-focus'); el.focus({preventScroll:true}); el.scrollIntoView({block:'nearest'}); }
  }
  function move(step) {
    const list = items(); if (!list.length) return;
    const current = list.indexOf(focused);
    focus(list[(Math.max(0,current) + step + list.length) % list.length]);
  }
  function closePicker(commit) {
    if (!picker) return;
    const {select,box,options,index} = picker;
    if (commit) { select.value = options[index].value; select.dispatchEvent(new Event('change',{bubbles:true})); }
    box.remove(); picker = null; focus(select);
  }
  function paintPicker() {
    picker.rows.forEach((row,index) => { row.classList.toggle('pad-choice',index===picker.index); row.setAttribute('aria-selected',String(index===picker.index)); });
    picker.rows[picker.index]?.scrollIntoView({block:'nearest'});
  }
  function openPicker(select) {
    const options = Array.from(select.options).filter(o=>!o.disabled); if (!options.length) return;
    const box = document.createElement('div'); box.className='pad-picker'; box.setAttribute('role','listbox'); box.setAttribute('aria-label','Calidad de gráficos');
    const rows = options.map((option,index)=>{const row=document.createElement('button');row.type='button';row.textContent=option.textContent;row.setAttribute('role','option');row.onclick=()=>{picker.index=index;closePicker(true);};box.append(row);return row;});
    picker={select,options,box,rows,index:Math.max(0,options.findIndex(o=>o.value===select.value))};
    select.parentElement.append(box);paintPicker();
  }
  for (const panel of [document.querySelector('#pause')]) {
    if (!panel) continue;
    const audioButton=document.createElement('button');audioButton.type='button';audioButton.textContent='Sonido: sí';
    audioButton.onclick=()=>{document.querySelector('#sound').click();audioButton.textContent=document.querySelector('#sound').textContent;};
    panel.append(audioButton);
    if(panel.id==='pause') {const full=document.createElement('button');full.type='button';full.textContent='Pantalla completa';full.onclick=()=>document.querySelector('#full').click();panel.append(full);}
    const help=document.createElement('div');help.className='pad-menu-help';help.textContent='↕ Elegir · A Confirmar · B Volver';panel.append(help);
  }
  window.addEventListener('keydown',event=>{
    const code=event.code || event.key;
    if (!commands.has(code) || (!activeRoot() && !held.has(code))) return;
    event.preventDefault();event.stopImmediatePropagation();held.add(code);window.secretMenus?.handle();
  },true);
  window.addEventListener('keyup',event=>{
    const code=event.code || event.key;
    if (held.has(code)) {event.preventDefault();event.stopImmediatePropagation();held.delete(code);window.secretMenus?.handle();}
  },true);
  window.addEventListener('blur',()=>{held.clear();previous={};draining=false;closePicker(false);});
  window.secretMenus={
    handle(gp={}) {
      const currentRoot=activeRoot();
      const state={up:held.has('ArrowUp')||gp.vertical<-.5,down:held.has('ArrowDown')||gp.vertical>.5,
        left:held.has('ArrowLeft')||gp.axis<-.5,right:held.has('ArrowRight')||gp.axis>.5,
        accept:held.has('Space')||held.has('Enter')||held.has('KeyE')||!!gp.jump||!!gp.confirm,
        back:held.has('KeyB')||held.has('Escape')||!!gp.back,pause:held.has('KeyP')||!!gp.pause,
        sound:held.has('KeyM')||!!gp.sound,graphics:held.has('KeyY')||!!gp.graphics};
      const edge=key=>state[key]&&!previous[key];
      if (currentRoot!==root) {closePicker(false);focused?.classList.remove('pad-focus');root=currentRoot;focused=null;direction='';if(root)focus(items()[0]);else draining=Object.values(previous).some(Boolean);}
      if (!root) {previous=state;if(draining){draining=Object.values(state).some(Boolean);return true;}return false;}
      if (document.activeElement && items().includes(document.activeElement) && document.activeElement!==focused && !picker) focus(document.activeElement);
      const nextDirection=['up','down','left','right'].find(key=>state[key])||'';
      const now=performance.now();
      if(nextDirection && (nextDirection!==direction || now>=repeatAt)) {
        const step=nextDirection==='up'||nextDirection==='left'?-1:1;
        if(picker){picker.index=(picker.index+step+picker.options.length)%picker.options.length;paintPicker();}
        else move(step);
        repeatAt=now+(nextDirection===direction?180:420);
      }
      direction=nextDirection;
      if(edge('back')) {if(picker)closePicker(false);else if(root.tagName==='DIALOG')root.close();else if(root.id==='pause')document.querySelector('#resume').click();}
      else if(edge('pause') && root.id==='pause'){closePicker(false);document.querySelector('#resume').click();}
      else if(edge('accept')) {if(picker)closePicker(true);else if(focused?.tagName==='SELECT')openPicker(focused);else focused?.click();}

      else if(edge('sound')) document.querySelector('#sound')?.click();
      previous=state;return true;
    }
  };
  const style=document.createElement('style');style.textContent='.pad-focus{outline:4px solid #ffda87!important;outline-offset:5px!important}.quality-label{position:relative}.pad-picker{position:absolute;z-index:100;left:0;top:100%;min-width:260px;max-height:45vh;overflow:auto;display:flex;flex-direction:column;gap:4px;padding:10px;background:#102537;border:2px solid #ffda87;border-radius:12px;box-shadow:0 10px 30px #0009}.pad-picker button{font:18px system-ui;padding:10px 15px;background:#19364b;color:#eef1df;text-align:left;border-radius:6px}.pad-picker .pad-choice{background:#ffda87;color:#14212b;outline:2px solid white}';document.head.append(style);
})();

// Canvas view of the live game state: no separate level or collision map.
(() => {
  const random=n=>{const v=Math.sin(n*127.1+311.7)*43758.5453;return v-Math.floor(v);};
  const finalLift=s=>s.mode==='end'?1:s.cinema?.stage==='final'?Math.min(1,s.cinema.time/5)**2*(3-2*Math.min(1,s.cinema.time/5)):0;
  const seen=(s,x,w=0)=>x+w>s.cam-160&&x<s.cam+1760;
  function rect(c,x,y,w,h,color){c.fillStyle=color;c.fillRect(x,y,w,h);}
  function oval(c,x,y,rx,ry,color){c.fillStyle=color;c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fill();}
  function poly(c,points,color){c.fillStyle=color;c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fill();}
  function line(c,points,color,width=3){c.strokeStyle=color;c.lineWidth=width;c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.stroke();}
  function badge(c,label,x,y,color='#ffe17e',size=62){
    rect(c,x-size/2-3,y-size/2-3,size+6,size+6,color);rect(c,x-size/2,y-size/2,size,size,'#1d3850');
    c.fillStyle=color;c.font=`bold ${Math.round(size*.72)}px Georgia`;c.textAlign='center';c.textBaseline='middle';c.fillText(String(label),x,y+2);c.textBaseline='alphabetic';
  }
  function lever(c,x,y,on){
    rect(c,x-55,y-12,110,24,'#b49561');rect(c,x-19,y-48,38,48,'#34566a');oval(c,x,y-48,16,16,'#b49561');
    const tip=x+(on?48:-48);line(c,[[x,y-48],[tip,y-111]],'#ffdf96',12);rect(c,tip-24,y-123,48,24,on?'#adf9c9':'#ffd587');
  }
  function gate(c,x,y,h,closed,color){
    rect(c,x-65,y-h,34,h,'#34566a');rect(c,x+31,y-h,34,h,'#34566a');rect(c,x-75,y-h-15,150,30,'#91b1ac');
    if(closed){c.save();c.globalAlpha=.55;rect(c,x-36,y-h+10,72,h-10,color);c.restore();}
  }
  const wallStates=new Map();
  function magicWall(c,x,y,h,closed,color,t){
    const state=wallStates.get(x)||{time:t,a:0};const dt=Math.max(0,Math.min(t-state.time,.05));state.time=t;
    state.a+=((closed?0:1)-state.a)*(1-Math.exp(-dt*4));wallStates.set(x,state);const a=state.a;
    for(let row=0;row<7;row++)for(let col=0;col<3;col++){
      const side=col===1?(row%2?1:-1):col-1;
      const px=x+(col-1)*32+side*a*(100+row*9),py=y-(row+.5)*h/7-a*(h+45-(row+.5)*h/7+Math.sin(t*1.2+row+col)*14);
      c.save();c.translate(px,py);c.rotate(a*side*(.18+Math.sin(t+row)*.1));rect(c,-15,-h/14+2,30,h/7-3,['#657579','#768487','#52676e'][(row+col)%3]);
      line(c,[[-13,-h/14+4],[12,-h/14+4]],'#a7b7b4',2);c.shadowColor=color;c.shadowBlur=8+a*12;rect(c,-1.5,-8,3,16,color);c.restore();
    }
  }
  function background(c,s){
    const sky=c.createLinearGradient(0,0,0,900);sky.addColorStop(0,'#071224');sky.addColorStop(1,'#173e47');c.fillStyle=sky;c.fillRect(0,0,1600,900);
    for(let i=0;i<55;i++)oval(c,((i*179.7-s.cam*.08)%1700+1700)%1700,35+(i*71.9)%420,1.5,1.5,'#779f9e');
    const mx=1260-s.cam*.035;oval(c,mx,165,61,61,'#b5c6bd');
    for(let i=0;i<12;i++){const a=i*2.399,r=15+random(i)*35;oval(c,mx+Math.cos(a)*r,165+Math.sin(a)*r,3+random(i+7)*8,3+random(i+7)*7,'#91a69f');}
    const lift=finalLift(s);
    if(lift){c.save();c.globalAlpha=lift;const rays=c.createLinearGradient(1050,100,650,800);rays.addColorStop(0,'#c4def040');rays.addColorStop(1,'#bddfff00');poly(c,[[1050,100],[1450,820],[180,820]],rays);c.restore();}
    c.save();c.globalAlpha=1-lift;
    // Same repeating forest spacing and broad crowns as the 3D groves.
    const first=Math.floor((s.cam-1500)/290),last=Math.ceil((s.cam+2600)/290);
    for(let i=Math.max(0,first);i<=Math.min(83,last);i++){
      const x=i*290-700-s.cam+94,height=420+random(i+310)*230;
      rect(c,x-14,870-height,28,height,'#263d36');
      line(c,[[x,650],[x-75,520],[x-145,485]],'#263d36',14);line(c,[[x,570],[x+65,460],[x+110,425]],'#263d36',12);
      for(let j=0;j<5;j++)oval(c,x+(j-2)*67,870-height-20+(j%2)*45,135,92,j%2?'#294c40':'#213e36');
    }
    c.restore();
  }
  function terrain(c,s){
    for(const p of s.platforms){
      if(p.disabled||(p.hidden&&!(p.formation>0))||!seen(s,p.x,p.w))continue;
      c.save();const progress=p.formation??(p.hidden?0:1),forming=progress<1;
      c.translate(p.x+(p.age>0&&!p.falling?Math.sin(s.t*75)*3:0),p.y+(forming?350*(1-progress):0)+finalLift(s)*650);
      if(forming)c.globalAlpha=.3+progress*.7;
      if(p.kind==='wall'){
        rect(c,0,0,p.w,p.h,'#4a5352');
        for(let y=0;y<p.h;y+=48){const h=Math.min(48,p.h-y),mid=p.w*(.3+random(y+p.x)*.4);poly(c,[[0,y],[p.w,y],[mid,y+h]],y%96?'#59615b':'#65716e');line(c,[[0,y+h],[mid,y+h*.55],[p.w,y+h]],'#374340',2);}
        rect(c,0,0,p.w,5,'#7e8b73');
      }else{
        const height=Math.min(225,65+p.w*.095),count=Math.max(3,Math.ceil(p.w/65)),edge=[];
        for(let i=count;i>=0;i--)edge.push([p.w*.21+p.w*.58*i/count,height*(.75+random(p.x+i*3)*.35)]);
        poly(c,[[0,0],[p.w,0],[p.w,height*.45],...edge,[0,height*.45]],'#765039');
        for(let i=0;i<count;i++){const x=p.w*i/count,w=p.w/count;poly(c,[[x,13],[x+w,13],[p.w*.21+(x+w*.6)*.58,height*(.75+random(p.x+i*3)*.35)]],i%2?'#59432d':'#654834');}
        // The exact front edge is y=0, matching the collider and the 3D island.
        poly(c,[[0,0],[14,-25],[p.w+14,-25],[p.w,0]],'#60894a');rect(c,0,0,p.w,12,'#527c39');
        for(let x=10;x<p.w;x+=28){const h=10+random(x+p.x)*14;line(c,[[x,0],[x-3,-h],[x+4,0]],'#81a85b',2);}
        for(let i=0;i<Math.ceil(p.w/100);i++){const x=15+random(p.x+i)*Math.max(1,p.w-30);line(c,[[x,height*.65],[x-9,height+15],[x+4,height+28]],'#594632',2);}
        if(p.kind==='light'||p.kind==='moving'){oval(c,p.w/2,32,10,10,'#8ef2d7');oval(c,p.w/2,32,6,6,'#35534e');}
        if(p.kind==='crumble')for(let x=20;x<p.w;x+=65)line(c,[[x,5],[x+8,24],[x+2,39]],'#30231d',3);
      }
      c.restore();
    }
  }
  function objects(c,s){
    if(finalLift(s)>.9)return;
    for(const v of s.vines||[])if(seen(s,v.x-120,260)){
      const h=v.bottom-v.top;
      for(let i=0;i<5;i++){
        const end=v.x+(i-2)*45;
        line(c,[[v.x,v.bottom-55],[v.x+(i-2)*18,v.bottom-18],[end,v.bottom-3],[end+(i-2)*12,v.bottom+15]],'#765638',9-i*.8);
      }
      for(let strand=0;strand<3;strand++){
        const points=[];for(let y=0;y<=h;y+=10)points.push([v.x+Math.sin(y*.035+strand*2.1)*12,v.bottom-y]);
        line(c,points,['#476936','#739647','#a3ba65'][strand],12-strand*3);
      }
      line(c,[[v.x,v.top+30],[v.x+14,v.top-12],[v.x+58,v.top-9]],'#739647',8);
      for(let y=v.bottom-65,i=0;y>v.top;y-=43,i++){
        const side=i%2?1:-1,x=v.x+side*9,sway=Math.sin(s.t*1.5+i)*3;
        line(c,[[x,y],[x+side*36,y-12+sway]],'#80964e',3);
        poly(c,[[x+side*15,y-5],[x+side*34,y-31+sway],[x+side*65,y-29+sway],[x+side*49,y-4],[x+side*30,y+5]],i%3?'#83ab53':'#abc773');
        line(c,[[x+side*20,y-6],[x+side*58,y-26+sway]],'#c2d68a',1.5);
      }
    }
    // Collected letters disappear in both renderers, from the same array.
    for(const item of s.letters)if(!item.collected&&seen(s,item.x,80))badge(c,item.char,item.x,item.y-Math.sin(s.t*2+item.bob)*8,'#ffe17e');
    if(s.questActive||s.countActive){
      if(seen(s,6030,150)){magicWall(c,6106,620,370,s.questActive&&s.doorTime<=0,'#ffc75b',s.t);}
      if(s.questActive&&seen(s,4770,110))lever(c,4825,616,s.doorTime>0);
    }else if(!s.coop){
      if(seen(s,3690,170))gate(c,3770,710,320,!s.gate,'#8ef2d7');
      if(seen(s,5460,170))magicWall(c,5540,770,240,!s.switchOn,'#ffd786',s.t);
      if(seen(s,5195,110))lever(c,5250,750,s.switchOn);
    }
    if(s.countActive)for(const item of s.countLights){
      if(!seen(s,item.x-50,100))continue;
      const next=item.n===s.countValue+1,color=item.lit?'#c4ffdf':next?'#63b8a5':'#294956';
      rect(c,item.x-50,item.y-10,100,10,'#b49561');rect(c,item.x-7,item.y-69,15,64,'#34566a');
      badge(c,item.n,item.x,item.y-132-Math.sin(s.t*1.8+item.n)*4,item.lit||next?'#e1fff3':'#64807f',62);
      for(let i=0;i<item.n;i++)oval(c,item.x+(i-(item.n-1)/2)*19,item.y-78,7,7,color);
    }
    for(const r of s.ropes)if(seen(s,Math.min(r.x,r.tipX)-80,Math.abs(r.x-r.tipX)+160)){
      rect(c,r.x-85,r.y-20,170,25,'#34566a');line(c,[[r.x-70,r.y-10],[r.x,r.y+5],[r.x+70,r.y-10]],'#b49561',6);
      line(c,[[r.x,r.y],[r.tipX,r.tipY]],'#c2a978',6);oval(c,r.tipX,r.tipY,15,15,'#8ef2d7');oval(c,r.tipX,r.tipY,10,10,'#173e47');
    }
    for(const e of s.enemies)if(e.alive&&seen(s,e.x,54)){
      for(let i=0;i<3;i++)oval(c,e.x+7+i*16,e.y+32,5,7,'#443c61');oval(c,e.x+23,e.y+18,24,17,'#816399');oval(c,e.x+23,e.y+7,23,10,'#c0a5d2');
      for(const x of [-8,8])oval(c,e.x+23+x,e.y+17,3.3,3.3,'#211e3b');
    }
    if(s.coop){
      if(seen(s,14900,450)){
        const a=s.coop.wallAmount||0;
        for(let row=0;row<7;row++)for(let col=0;col<3;col++){
          const side=col===1?(row%2?1:-1):col-1;
          const x=15125+(col-1)*32+side*a*(100+row*9);
          const y=570-((row+.5)*50+a*(395-(row+.5)*50+Math.sin(s.t*1.2+row+col)*14));
          rect(c,x-15,y-23,30,47,['#657579','#768487','#52676e'][(row+col)%3]);
          rect(c,x-1,y-8,3,16,'#ffdc86');
        }
      }
    }
  }
  function boy(c,s){
    const p=s.player,drift=s.mode==='end'?Math.min(1,(s.ending||0)/6):0,x=(p.x+19)*(1-drift)+(s.cam+1160)*drift,y=p.y+62-finalLift(s)*(127+Math.sin(s.t*1.45)*5),climb=p.vine?Math.sin(p.y*.075)*6:0,run=finalLift(s)>.5?0:p.vine?climb:Math.sin(s.t*17)*Math.min(Math.abs(p.vx)/330,1)*7;
    c.save();c.translate(x,y);c.scale(1+p.squash,1-p.squash);if(p.invincible>0)c.globalAlpha=.5+.5*Math.abs(Math.sin(s.t*20));
    rect(c,-13,-21,11,18+run,'#394853');rect(c,3,-21,11,18-run,'#394853');rect(c,-15,-4+run,15,5,'#d1d2bd');rect(c,2,-4-run,16,5,'#d1d2bd');
    rect(c,-17,-47,34,29,'#8bafbe');rect(c,-21,-43,8,p.vine?-20-climb:p.rope?-29:25,'#9ebdc8');rect(c,13,-43,8,p.vine?-20+climb:p.rope?-29:25,'#9ebdc8');
    oval(c,0,-62,17,20,'#efd0b1');oval(c,-3,-75,18,10,'#704528');oval(c,-15,-66,6,13,'#704528');
    for(let i=0;i<4;i++)oval(c,-14+i*8,-76+(i%2)*3,7,7,'#704528');
    oval(c,7*p.face,-61,4,5,'#fff7e8');oval(c,8*p.face,-60,2.6,3.5,'#684331');c.restore();
  }
  window.secretScene2D={background,terrain,objects,boy};
})();
