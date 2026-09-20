const fs=require('fs'),path=require('path'),esbuild=require('esbuild');
require('./build-number-audio.cjs');
fs.writeFileSync(path.join(__dirname,'dist/tv-support.js'),['tv-support.js','menu-controls.js','scene2d.js'].map(name=>fs.readFileSync(path.join(__dirname,'src',name),'utf8')).join('\n'));
fs.copyFileSync(path.join(__dirname,'src/mobile-support.js'),path.join(__dirname,'dist/mobile-support.js'));
for(const name of ['Banda.mp3','Wind.mp3'])fs.copyFileSync(path.join(__dirname,'sfx',name),path.join(__dirname,'dist',name));
esbuild.buildSync({absWorkingDir:__dirname,entryPoints:[path.join(__dirname,'src/world3d.js')],bundle:true,minify:true,format:'iife',target:['chrome100','edge100'],outfile:path.join(__dirname,'dist/world3d.js'),legalComments:'eof'});
require('./verify-assets.cjs');
