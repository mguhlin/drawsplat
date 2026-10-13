import {readFile,access} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
for(const app of ['writesplat','showsplat','gridsplat','listsplat','layoutsplat']){
 const folder=resolve(root,'splatworks',app),html=await readFile(resolve(folder,'index.html'),'utf8');
 if(!html.includes(`name="splatworks-app" content="${app}"`) || /(?:src|href)=["'][^"']*\/src\//.test(html))throw Error(`${app}: missing app identity or development entry point in deployed HTML`);
 for(const match of html.matchAll(/(?:src|href)=["']([^"']+\.(?:mjs|js|css)(?:\?[^"']*)?)["']/g)){
  const path=match[1].split('?')[0];if(/^https?:/.test(path))continue;
  await access(path.startsWith('/')?resolve(root,path.slice(1)):resolve(folder,path));
 }
 console.log(`${app}: built entry point and local resources verified`);
}
