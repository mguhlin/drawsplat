(function(root){
 function parseRosterCSV(text){
  if(text.length>1024*1024)throw new Error('CSV must be smaller than 1 MB.');
  text=text.replace(/^\uFEFF/,'');const table=[];let row=[],field='',quoted=false,closed=false;
  for(let i=0;i<text.length;i++){const c=text[i];if(quoted){if(c==='"'&&text[i+1]==='"'){field+='"';i++;}else if(c==='"'){quoted=false;closed=true;}else field+=c;}
   else if(c==='"'){if(field||closed)throw new Error('Unexpected quote in CSV.');quoted=true;}
   else if(c===','){row.push(field);field='';closed=false;}
   else if(c==='\n'||c==='\r'){if(c==='\r'&&text[i+1]==='\n')i++;row.push(field);if(row.some(x=>x.trim()))table.push(row);row=[];field='';closed=false;}
   else{if(closed&&c.trim())throw new Error('Unexpected text after a quoted field.');if(!closed)field+=c;}
  }
  if(quoted)throw new Error('CSV contains an unclosed quote.');row.push(field);if(row.some(x=>x.trim()))table.push(row);
  const headers=(table.shift()||[]).map(h=>h.trim().toLowerCase());
  if(new Set(headers).size!==headers.length||!['teacher_email','class_name'].every(h=>headers.includes(h)))throw new Error('Include unique teacher_email and class_name headers. Optional: teacher_name, student_email, student_name.');
  if(!table.length||table.length>2000)throw new Error('Import 1–2000 data rows.');
  return table.map((cells,i)=>{if(cells.length!==headers.length)throw new Error('Row '+(i+2)+' has the wrong number of columns.');return Object.fromEntries(headers.map((h,index)=>[h,cells[index].trim()]));});
 }
 if(typeof module!=='undefined')module.exports={parseRosterCSV};else root.DrawSplatRosterCSV={parseRosterCSV};
})(typeof window!=='undefined'?window:globalThis);
