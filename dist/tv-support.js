// Settings and controller polling also work when WebGL is unavailable.
(() => {
  const nativeTV = new URLSearchParams(location.search).get('androidtv') === '1';
  const tv = nativeTV || /smart.?tv|tizen|web0s|webos|netcast|hbbtv|viera|bravia/i.test(navigator.userAgent || '');
  const mobile = !tv && (/Android|iPhone|iPad|iPod/i.test(navigator.userAgent || '') || (navigator.maxTouchPoints > 1 && /Macintosh/i.test(navigator.userAgent || '')));
  const valid = ['auto', 'high', 'balanced', 'low', '2d'];
  let preference = nativeTV ? '2d' : 'auto';
  try { preference = new URLSearchParams(location.search).get('quality') || (nativeTV ? '2d' : localStorage.getItem('secret-quality')) || 'auto'; } catch {}
  if (!valid.includes(preference)) preference = 'auto';
  const automatic = () => tv ? 'low' : mobile ? 'balanced' : 'high';
  let quality = preference === 'auto' ? automatic() : preference;
  let resolution = .8;
  let frames = 0, duration = 0, slowWindows = 0, warmup = nativeTV ? 5000 : 0;
  const listeners = [];
  function refresh() {
    document.querySelectorAll('.quality-select').forEach(el => { el.value = preference; });
    document.querySelectorAll('.quality-status').forEach(el => { el.textContent = quality === 'balanced' ? '3D móvil: conserva el escenario y ajusta la resolución para jugar fluido.' : quality === 'low' ? 'Modo liviano: menos efectos y menor resolución.' : quality === '2d' ? 'Modo 2D: máxima fluidez.' : '3D detallado: máxima calidad de imagen.'; });
    listeners.forEach(fn => fn(quality));
  }
  window.secretDisplay = {
    get quality() { return quality; },
    get preference() { return preference; },
    get mobile() { return mobile; },
    get resolution() { return quality === 'balanced' ? resolution : quality === 'low' ? .5 : 1; },
    frameInterval() { return nativeTV && quality === '2d' ? 1000 / 30 : 0; },
    subscribe(fn) { listeners.push(fn); fn(quality); },
    set(value) {
      if (!valid.includes(value)) return;
      preference = value; quality = value === 'auto' ? automatic() : value; resolution = .8;
      frames = duration = slowWindows = 0;
      warmup = nativeTV ? 5000 : 0;
      try { localStorage.setItem('secret-quality', value); } catch {}
      refresh();
    },
    sample(ms) {
      if (preference !== 'auto' || quality === '2d' || document.hidden || !(ms > 0 && ms < 1000)) return;
      if (warmup > 0) { warmup -= ms; return; }
      duration += ms; frames++;
      if (frames >= 90) {
        if (quality === 'balanced') {
          slowWindows = duration / frames > 25 ? slowWindows + 1 : 0;
          if (slowWindows >= 2) {
            if (resolution > .6) resolution = Math.max(.6, Math.round((resolution - .1) * 10) / 10);
            else quality = 'low';
            slowWindows = 0; refresh();
          }
        }
        else if (quality === 'high' && duration / frames > 25) { quality = 'low'; refresh(); }
        else if (nativeTV && quality === 'low') {
          slowWindows = duration / frames > 40 ? slowWindows + 1 : 0;
          if (slowWindows >= 2) { quality = '2d'; refresh(); }
        }
        frames = duration = 0;
      }
    }
  };
  document.querySelectorAll('.quality-select').forEach(el => { el.onchange = () => window.secretDisplay.set(el.value); });
  refresh();

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
        status('A: aceptar/saltar · X/B: acción/reiniciar · Start/Back: pausa · Y: gráficos · L1: sonido');
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
      status('Joystick conectado: ' + (gp.id || 'mando') + ' · A: aceptar/saltar · X/B: acción · Start: pausa · Y: gráficos · L1: sonido');
      return { connected: true, axis: Math.max(-1, Math.min(1, axis + dpad + (down(b[15]) ? 1 : 0) - (down(b[14]) ? 1 : 0))), jump: down(b[0]), action: down(b[2]) || down(b[1]), pause: down(b[9]) || down(b[8]), sound: down(b[4]), graphics: down(b[3]) };
    }
  };
  window.secretControls.read();
})();
