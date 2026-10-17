import patterns from './hyphenation/patterns-en-us.mjs';
let trie;const words=new Map(),texts=new Map();
function dictionary(){
 if(trie)return trie;trie=new Map();
 for(const pattern of patterns.split(/\r?\n/)){
  if(!pattern||/^[A-Z%]/.test(pattern)||pattern.includes('/'))continue;
  const letters=[],weights=[0];for(const c of pattern){if(/\d/.test(c))weights[weights.length-1]=Number(c);else{letters.push(c);weights.push(0);}}
  let node=trie;for(const c of letters){if(!node.has(c))node.set(c,new Map());node=node.get(c);}node.weights=weights;
 }return trie;
}
export function englishHyphenPoints(word){
 const lower=word.toLowerCase();if(words.has(lower))return words.get(lower);
 if(!/^[a-z]{6,80}$/.test(lower))return [];
 const padded='.'+lower+'.',weights=new Uint8Array(padded.length+1),root=dictionary();
 for(let i=0;i<padded.length;i++){let node=root;for(let j=i;j<padded.length;j++){node=node.get(padded[j]);if(!node)break;if(node.weights)node.weights.forEach((weight,k)=>{weights[i+k]=Math.max(weights[i+k],weight);});}}
 const points=[];for(let i=2;i<=lower.length-3;i++)if(weights[i+1]%2)points.push(i);
 if(words.size>=4000)words.delete(words.keys().next().value);words.set(lower,points);return points;
}
export function hyphenatedSlice(text,start,end,style){
 if(style.hyphens!=='auto'||!/^en(?:-US)?$/i.test(style.language||'en'))return text.slice(start,end);
 let positions=texts.get(text);if(!positions){positions=[];for(const match of text.matchAll(/(?<![\p{L}\p{N}])[A-Za-z]{6,80}(?![\p{L}\p{N}])/gu)){if(match[0]===match[0].toUpperCase())continue;for(const point of englishHyphenPoints(match[0]))positions.push(match.index+point);}if(texts.size>=8)texts.delete(texts.keys().next().value);texts.set(text,positions);}
 let value='',offset=start;for(const point of positions){if(point<=start)continue;if(point>=end)break;value+=text.slice(offset,point)+'\u00ad';offset=point;}return value+text.slice(offset,end);
}
