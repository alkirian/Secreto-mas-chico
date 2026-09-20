// Touch, fullscreen and screen mirroring help. Mirroring itself belongs to the OS.
(() => {
  const buttons = [...document.querySelectorAll('#touch [data-key]')];
  const pointers = new Map();
  let mode = 'title', wake = null, wakePending = false, previousFocus = null;
  const help = document.querySelector('#tvHelp');
  const status = document.querySelector('#displayStatus');
  function clear() {
    pointers.clear();
    buttons.forEach(button => button.classList.remove('pressed'));
  }
  function release(event) {
    const button = pointers.get(event.pointerId);
    pointers.delete(event.pointerId);
    if (button && ![...pointers.values()].includes(button)) button.classList.remove('pressed');
  }
  buttons.forEach(button => {
    button.addEventListener('pointerdown', event => {
      if (mode !== 'play' || (event.pointerType === 'mouse' && event.button !== 0)) return;
      event.preventDefault();
      pointers.set(event.pointerId, button);
      button.classList.add('pressed');
      try { button.setPointerCapture(event.pointerId); } catch {}
    });
    for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) button.addEventListener(type, release);
    button.addEventListener('contextmenu', event => event.preventDefault());
  });
  async function keepAwake() {
    if (mode !== 'play' || document.hidden || wake || wakePending || !navigator.wakeLock) return;
    wakePending = true;
    try {
      const lock = await navigator.wakeLock.request('screen');
      if (mode !== 'play' || document.hidden) { await lock.release(); return; }
      wake = lock;
      lock.addEventListener('release', () => { if (wake === lock) wake = null; });
    } catch { /* Unsupported, denied or power-saving mode: gameplay stays available. */ }
    finally { wakePending = false; }
  }
  function setMode(value) {
    if (mode === value) return;
    mode = value; clear();
    document.body.classList.toggle('game-paused', mode === 'pause');
    document.body.classList.toggle('touch-playing', mode === 'play');
    if (mode === 'play') keepAwake();
    else if (wake) { const lock = wake; wake = null; lock.release().catch(() => {}); }
  }
  async function fullscreen() {
    status.textContent = '';
    try {
      if (document.fullscreenElement) { await document.exitFullscreen(); return; }
      if (!document.documentElement.requestFullscreen) throw Error('unsupported');
      await document.documentElement.requestFullscreen();
      if (window.secretDisplay?.mobile) {
        try { await screen.orientation?.lock?.('landscape'); } catch {}
      }
    } catch { status.textContent = 'Si tu navegador no permite pantalla completa, girá el celular y ocultá su barra de navegación.'; }
  }
  document.querySelectorAll('[data-fullscreen]').forEach(button => button.addEventListener('click', fullscreen));
  document.querySelectorAll('[data-tv-help]').forEach(button => button.addEventListener('click', () => {
    previousFocus = button;
    window.dispatchEvent(new Event('secret:pause'));
    clear();
    if (!help.open) help.showModal();
  }));
  help.addEventListener('close', () => previousFocus?.focus());
  help.addEventListener('keydown', event => event.stopPropagation());
  document.querySelector('#closeTvHelp').addEventListener('click', () => help.close());
  window.addEventListener('blur', clear);
  window.addEventListener('pagehide', clear);
  document.addEventListener('visibilitychange', () => {
    clear();
    if (!document.hidden) keepAwake();
  });
  window.secretMobile = {
    clear, setMode, fullscreen,
    held(key) { for (const button of pointers.values()) if (button.dataset.key === key) return true; return false; }
  };
})();
