const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const only3d = process.argv.includes('--3d');
if (only3d) console.log('Release scope: 3D game and shared systems; optional 2D renderer excluded.');
for (const file of fs.readdirSync(__dirname).filter(name => /^verify(?:-.+)?\.[cm]js$/.test(name) && name !== 'verify-all.cjs' && (!only3d || name !== 'verify-scene2d.cjs')).sort()) {
  console.log(`\n${file}`);
  const result = spawnSync(process.execPath, [path.join(__dirname, file)], { cwd: __dirname, stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status || 1);
}
