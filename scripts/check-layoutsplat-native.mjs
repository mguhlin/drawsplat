import{readFile}from'node:fs/promises';import{createHash}from'node:crypto';import{resolve,dirname}from'node:path';import{fileURLToPath}from'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');let count=0;
for(const name of ['publisher','quark']){const folder=resolve(root,'splatworks/layoutsplat',name),manifest=JSON.parse(await readFile(resolve(folder,'SHA256.json'),'utf8'));for(const [file,hash]of Object.entries(manifest)){if(createHash('sha256').update(await readFile(resolve(file.startsWith('splatworks/')?root:folder,file))).digest('hex')!==hash)throw Error(`${name}: ${file} hash mismatch`);count++;}}
console.log(`Verified ${count} native layout decoder/source/notice files.`);
