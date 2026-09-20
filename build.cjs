const path=require('path'),esbuild=require('esbuild');
require('./build-number-audio.cjs');
esbuild.buildSync({absWorkingDir:__dirname,entryPoints:[path.join(__dirname,'src/world3d.js')],bundle:true,minify:true,format:'iife',target:['chrome100','edge100'],outfile:path.join(__dirname,'dist/world3d.js'),legalComments:'eof'});
