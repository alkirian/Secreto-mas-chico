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
