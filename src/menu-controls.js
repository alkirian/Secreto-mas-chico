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
