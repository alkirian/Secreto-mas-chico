const fs=require('fs'),path=require('path'),esbuild=require('esbuild');
require('./build-number-audio.cjs');
for(const name of ['Banda.mp3','Wind.mp3'])fs.copyFileSync(path.join(__dirname,'sfx',name),path.join(__dirname,'dist',name));
esbuild.buildSync({absWorkingDir:__dirname,entryPoints:[path.join(__dirname,'src/world3d.js')],bundle:true,minify:true,format:'iife',target:['chrome100','edge100'],outfile:path.join(__dirname,'dist/world3d.js'),legalComments:'eof'});
require('./verify-assets.cjs');
