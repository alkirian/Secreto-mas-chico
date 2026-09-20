const esbuild=require('esbuild');
esbuild.buildSync({entryPoints:['src/world3d.js'],bundle:true,minify:true,format:'iife',target:['chrome100','edge100'],outfile:'dist/world3d.js',legalComments:'eof'});
