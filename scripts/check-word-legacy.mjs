import{readFile}from'node:fs/promises';import{createHash}from'node:crypto';
const root=new URL('../splatworks/shared/word-legacy/',import.meta.url),manifest=JSON.parse(await readFile(new URL('SHA256.json',root),'utf8'));
for(const[name,hash]of Object.entries(manifest)){const actual=createHash('sha256').update(await readFile(new URL(name,root))).digest('hex');if(actual!==hash)throw Error('Word decoder/source hash mismatch: '+name);}
console.log('Verified '+Object.keys(manifest).length+' Word decoder, source and license files.');
