import { mkdir, copyFile, cp, writeFile } from 'node:fs/promises';
await mkdir('_site', { recursive:true });
const files = ['index.html','style.css','script.js','gallery.js','videos.js','favicon.png','frame.png','goto.png','product-sans.ttf','sullin-profile.png','twitter.png','watermark.png','window-top.png','xcom.png','youtube.png'];
for (const file of files) await copyFile(file, `_site/${file}`);
await cp('cursors','_site/cursors',{recursive:true});
await cp('data','_site/data',{recursive:true});
await writeFile('_site/deployment-config.js','window.sullinDeployment = { static: true };\n');
await writeFile('_site/.nojekyll','');
