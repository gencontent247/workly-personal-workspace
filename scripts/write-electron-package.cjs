const fs=require('node:fs');fs.mkdirSync('dist-electron',{recursive:true});fs.writeFileSync('dist-electron/package.json',JSON.stringify({type:'commonjs'}));
