// Source-book resources are data. They are sanitized again before preview/export.
export function localBookPath(path){return typeof path==='string'&&path.length<=1000&&path.length>0&&!/^[/.]|[\\\u0000-\u001f\u007f?#:]|(?:^|\/)\.{1,2}(?:\/|$)/.test(path);}
export function validateBookSource(book){
 const fail=()=>{throw Error('Invalid or oversized ebook source project.');};
 if(!book||book.version!==1||!Array.isArray(book.chapters)||!book.chapters.length||book.chapters.length>500||!Array.isArray(book.styles)||book.styles.length>100||!Array.isArray(book.resources)||book.resources.length>500)fail();
 const paths=new Set();let bytes=0;
 for(const [kind,items]of [['chapter',book.chapters],['style',book.styles],['resource',book.resources]])for(const item of items){
  if(!item||!localBookPath(item.path)||paths.has(item.path)||/^(mimetype$|META-INF(?:\/|$))/i.test(item.path))fail();paths.add(item.path);
  const value=kind==='chapter'?item.xhtml:kind==='style'?item.css:item.data;
  if(typeof value!=='string'||value.length>(kind==='resource'?22000000:kind==='style'?2000000:8000000))fail();bytes+=value.length;
  if(kind==='chapter'&&(typeof item.title!=='string'||item.title.length>200||item.linear!==undefined&&typeof item.linear!=='boolean'||item.navigation!==undefined&&typeof item.navigation!=='boolean'))fail();
  if(kind==='resource'&&(!['audio/mpeg','audio/mp4','video/mp4','video/webm','video/ogg','text/vtt','image/png','image/jpeg','image/gif','image/webp','font/ttf','font/otf','font/woff','font/woff2','application/vnd.ms-opentype','application/font-sfnt','application/font-woff'].includes(item.type)||!/^[A-Za-z0-9+/]*={0,2}$/.test(item.data)))fail();
 }
 if(bytes>128000000||book.chapters.filter(c=>c.navigation).length>1||!book.chapters.some(c=>!c.navigation&&c.linear!==false))fail();return book;
}
export function bookPath(base,href){
 if(typeof href!=='string'||!href||/^[a-z][a-z\d+.-]*:|^\/\/|[\\\0]/i.test(href))return null;
 try{const url=new URL(href,'https://epub.invalid/'+base);if(url.origin!=='https://epub.invalid')return null;const path=decodeURIComponent(url.pathname.slice(1));return localBookPath(path)?{path,hash:url.hash}:null;}catch{return null;}
}
