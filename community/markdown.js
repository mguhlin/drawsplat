/* Shared minimal-CommonMark renderer for Community posts/replies and the
 * Admin queue. Loaded before community.js / admin.js by both pages.
 * Escapes HTML first so every later transform operates on safe text.
 * Supported: fenced code (```), inline code (`), bold (** __), italic (* _),
 * headings (# ## ###), links [t](u) (http/https/mailto only), auto-links,
 * lists (- * 1.), blockquotes (>), paragraphs, line breaks. */
function renderMarkdown(s){
  if(s==null) return '';
  const esc=v=>String(v).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  let html=esc(s);
  const codeBlocks=[];
  html=html.replace(/```([a-zA-Z0-9_-]*)\n?([\s\S]*?)```/g,(_m,_lang,code)=>{
    codeBlocks.push(code.replace(/\n$/,''));
    return ' CB'+(codeBlocks.length-1)+' ';
  });
  const inlineCode=[];
  html=html.replace(/`([^`\n]+)`/g,(_m,code)=>{
    inlineCode.push(code);
    return ' IC'+(inlineCode.length-1)+' ';
  });
  html=html.replace(/^### (.+)$/gm,'<h4>$1</h4>');
  html=html.replace(/^## (.+)$/gm,'<h3>$1</h3>');
  html=html.replace(/^# (.+)$/gm,'<h2>$1</h2>');
  html=html.replace(/\*\*([^*\n]+)\*\*/g,'<strong>$1</strong>');
  html=html.replace(/__([^_\n]+)__/g,'<strong>$1</strong>');
  html=html.replace(/(^|[^\*])\*([^*\n]+)\*(?!\*)/g,'$1<em>$2</em>');
  html=html.replace(/(^|[^_])_([^_\n]+)_(?!_)/g,'$1<em>$2</em>');
  html=html.replace(/\[([^\]\n]+)\]\(([^)\s]+)\)/g,(_m,text,url)=>{
    if(!/^(https?:\/\/|mailto:)/i.test(url)) return text;
    return '<a href="'+url+'" target="_blank" rel="noopener noreferrer">'+text+'</a>';
  });
  html=html.replace(/(^|[\s(])(https?:\/\/[^\s<]+[^\s<.,;:!?)\]'"])/g,'$1<a href="$2" target="_blank" rel="noopener noreferrer">$2</a>');
  html=html.replace(/(^|\n)((?:&gt; ?[^\n]*\n?)+)/g,(_m,pre,block)=>{
    return pre+'<blockquote>'+block.replace(/^&gt; ?/gm,'').replace(/\n+$/,'')+'</blockquote>';
  });
  html=html.replace(/(?:^|\n)((?:[-*] [^\n]+\n?)+)/g,(_m,block)=>{
    const items=block.trim().split('\n').map(l=>'<li>'+l.replace(/^[-*] /,'')+'</li>').join('');
    return '\n<ul>'+items+'</ul>';
  });
  html=html.replace(/(?:^|\n)((?:\d+\. [^\n]+\n?)+)/g,(_m,block)=>{
    const items=block.trim().split('\n').map(l=>'<li>'+l.replace(/^\d+\. /,'')+'</li>').join('');
    return '\n<ol>'+items+'</ol>';
  });
  html=html.split(/\n{2,}/).map(block=>{
    const trimmed=block.trim();
    if(!trimmed) return '';
    if(/^<(h\d|ul|ol|blockquote|pre)/.test(trimmed)) return trimmed;
    return '<p>'+trimmed.replace(/\n/g,'<br>')+'</p>';
  }).join('');
  html=html.replace(/ IC(\d+) /g,(_m,i)=>'<code>'+esc(inlineCode[+i])+'</code>');
  html=html.replace(/ CB(\d+) /g,(_m,i)=>'<pre><code>'+esc(codeBlocks[+i])+'</code></pre>');
  return html;
}
