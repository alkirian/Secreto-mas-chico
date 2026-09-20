const fs = require('node:fs'), vm = require('node:vm'), assert = require('node:assert/strict');
const html = fs.readFileSync('dist/index.html', 'utf8');
assert(html.indexOf('src="mobile-support.js"') > 0 && html.indexOf('src="mobile-support.js"') < html.indexOf('src="game.js'), 'mobile controls must load before the game');
class Element extends EventTarget {
  constructor(key) { super(); this.dataset = { key }; this.classes = new Set(); this.classList = { add: v => this.classes.add(v), remove: v => this.classes.delete(v), toggle: (v, on) => on ? this.classes.add(v) : this.classes.delete(v) }; }
  setPointerCapture() {}
  focus() {}
  showModal() { this.open = true; }
  close() { this.open = false; this.dispatchEvent(new Event('close')); }
}
const buttons = ['ArrowLeft', 'ArrowRight', 'KeyE', 'Space'].map(key => new Element(key));
const elements = {}, document = new EventTarget(), window = new EventTarget();
Object.assign(document, { hidden: false, body: new Element(), documentElement: {}, querySelector: s => elements[s] ||= new Element(), querySelectorAll: s => s === '#touch [data-key]' ? buttons : [] });
let released = 0, requests = 0;
const navigator = { wakeLock: { async request() { requests++; const lock = new EventTarget(); lock.release = async () => { released++; lock.dispatchEvent(new Event('release')); }; return lock; } } };
vm.runInNewContext(fs.readFileSync('src/mobile-support.js', 'utf8'), { document, window, navigator, screen: {}, Event, Map });
const mobile = window.secretMobile;
function pointer(button, type, id) { const event = new Event(type, { cancelable: true }); Object.assign(event, { pointerId: id, pointerType: 'touch' }); button.dispatchEvent(event); }
(async () => {
  mobile.setMode('play'); await new Promise(setImmediate);
  pointer(buttons[1], 'pointerdown', 1); pointer(buttons[3], 'pointerdown', 2);
  assert(mobile.held('ArrowRight') && mobile.held('Space'), 'move and jump simultaneously');
  pointer(buttons[3], 'pointerdown', 3); pointer(buttons[3], 'pointerup', 2);
  assert(mobile.held('Space'), 'second finger still holds the same control');
  pointer(buttons[3], 'lostpointercapture', 3);
  assert(!mobile.held('Space') && mobile.held('ArrowRight'), 'lost capture clears only its button');
  pointer(buttons[1], 'pointercancel', 1); assert(!mobile.held('ArrowRight'));
  pointer(buttons[0], 'pointerdown', 4); mobile.setMode('pause'); await new Promise(setImmediate);
  assert(!mobile.held('ArrowLeft') && released === 1, 'pause clears input and releases wake lock');
  pointer(buttons[0], 'pointerdown', 5); assert(!mobile.held('ArrowLeft'), 'paused controls cannot start input');
  mobile.setMode('play'); await new Promise(setImmediate); assert.equal(requests, 2, 'resume reacquires wake lock');
  pointer(buttons[1], 'pointerdown', 6); window.dispatchEvent(new Event('blur')); assert(!mobile.held('ArrowRight'));
  await mobile.fullscreen(); assert(elements['#displayStatus'].textContent.includes('gir'), 'unsupported fullscreen offers a usable fallback');
  const box = { window: {}, navigator: { userAgent: 'Mozilla Android Mobile', getGamepads: () => [] }, location: { search: '' }, URLSearchParams, localStorage: { getItem: () => null, setItem() {} }, document: { hidden: false, querySelectorAll: () => [] } };
  vm.runInNewContext(fs.readFileSync('src/tv-support.js', 'utf8'), box);
  const display = box.window.secretDisplay;
  assert.equal(display.quality, 'balanced'); assert.equal(display.resolution, .8);
  for (let i = 0; i < 180; i++) display.sample(34);
  assert.equal(display.quality, 'balanced'); assert.equal(display.resolution, .7, 'resolution reduced before removing 3D details');
  for (let i = 0; i < 360; i++) display.sample(34);
  assert.equal(display.quality, 'low', 'sustained poor performance remains 3D');
  display.set('high'); for (let i = 0; i < 540; i++) display.sample(50);
  assert.equal(display.quality, 'high', 'manual detailed mode remains locked for mirroring');
  console.log('PASS: simultaneous touch, multiple pointers, cancellation, lost capture, pause/resume, wake lock, fullscreen fallback, mobile adaptive 3D and explicit high quality');
})().catch(error => { console.error(error); process.exitCode = 1; });
