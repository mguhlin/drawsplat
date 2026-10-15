'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),inventory=require('../data/privacy-inventory.json');
for(const c of inventory.components){
 const text=fs.readFileSync(path.join(root,c.entry),'utf8');
 if(!text.includes('js/privacy-controls.js'))throw Error('Missing controls: '+c.entry);
 if(crypto.createHash('sha256').update(text).digest('hex')!==c.entrySha256)throw Error('Stale inventory: '+c.entry);
}
for(const slug of ['brain-sort','clock-wizard','step-splat','toneshifter','vibe-check']){
 const text=fs.readFileSync(path.join(root,'solutions',slug,'index.html'),'utf8');
 if(/localStorage\.setItem\(STORAGE_KEY, JSON\.stringify\(s\)\)/.test(text))throw Error('Persistent API key: '+slug);
 if(!text.includes('apiKey: ""'))throw Error('Missing session-key protection: '+slug);
}
console.log('Privacy control and inventory coverage:',inventory.components.length,'registered destinations');
