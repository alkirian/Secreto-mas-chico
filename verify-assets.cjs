const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const root = path.join(__dirname, 'dist');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const required = new Set(['THREE-LICENSE.txt', 'fonts/OFL.txt']);
for (const match of read('index.html').matchAll(/(?:src|href)="([^"]+)"/g)) required.add(match[1]);
for (const match of read('style.css').matchAll(/url\(['"]?([^)'"\s]+)['"]?\)/g)) required.add(match[1]);
for (const match of read('game.js').matchAll(/new Audio\(['"]([^'"]+)['"]\)/g)) required.add(match[1]);
for (const url of required) {
  if (/^(data:|https?:)/.test(url)) continue;
  const relative = url.split('?')[0];
  let directory = root;
  for (const part of relative.split('/')) {
    assert(fs.readdirSync(directory).includes(part), `Missing asset or incorrect case: ${url}`);
    directory = path.join(directory, part);
  }
  assert(fs.statSync(directory).size > 0, `Empty asset: ${url}`);
}
const box = { window: {} };
vm.runInNewContext(read('number-audio.js'), box);
assert.equal(box.window.numberVoiceData.length, 6);
for (let n = 1; n <= 6; n++) {
  assert(Buffer.from(box.window.numberVoiceData[n - 1], 'base64').equals(fs.readFileSync(path.join(__dirname, 'sfx', `${n}.mp3`))), `Wrong voice for ${n}`);
}
const chapters = { ageIntro: 'dist/audio/ageIntro.mp3', ageReveal: 'dist/audio/ageReveal.mp3', coopIntro: 'sfx/coop-intro.mp3' };
for (const [name, file] of Object.entries(chapters)) {
  assert(Buffer.from(box.window.chapterVoiceData[name], 'base64').equals(fs.readFileSync(path.join(__dirname, file))), `Wrong chapter voice: ${name}`);
}
for (const file of ['Banda.mp3', 'Wind.mp3']) {
  assert(fs.readFileSync(path.join(root, file)).equals(fs.readFileSync(path.join(__dirname, 'sfx', file))), `Outdated background audio: ${file}`);
}
console.log('PASS: production asset paths/case, fonts/licenses, six number voices, three chapter voices, music and wind');
