export const COLLECTIONS=['courses','tasks','habits','checkins','blocks','sessions'];
export const uid=()=>crypto.randomUUID();
export function today(now=new Date()){return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;}
export function dateObject(value){const [y,m,d]=value.split('-').map(Number);return new Date(y,m-1,d,12);}
export function validDate(value){return typeof value==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(value)&&today(dateObject(value))===value&&value>='1900-01-01'&&value<='2200-12-31';}
export function addDays(value,n){const date=dateObject(value);date.setDate(date.getDate()+n);return today(date);}
export function nextDate(date,repeat){if(!validDate(date))return '';if(repeat==='daily')return addDays(date,1);if(repeat==='weekdays'){let next=addDays(date,1);while([0,6].includes(dateObject(next).getDay()))next=addDays(next,1);return next;}if(repeat==='weekly')return addDays(date,7);if(repeat==='monthly'){const d=dateObject(date),day=d.getDate();d.setDate(1);d.setMonth(d.getMonth()+1);const end=new Date(d.getFullYear(),d.getMonth()+1,0,12).getDate();d.setDate(Math.min(day,end));return today(d);}return '';}
export function newPlanner(){return {app:'PlanSplat',version:1,id:uid(),counter:0,courses:{},tasks:{},habits:{},checkins:{},blocks:{},sessions:{},conflicts:{}};}
const idPattern=/^[A-Za-z0-9][A-Za-z0-9:_-]{0,199}$/;
const strings={title:300,name:150,code:40,color:7,teacher:150,location:200,courseId:200,taskId:200,habitId:200,notes:12000,url:2000,dueDate:10,dueTime:5,plannedDate:10,date:10,startTime:5,endTime:5,kind:20,status:20,repeat:20,completedAt:40,startedAt:40,seriesId:200};
const numberFields={priority:[1,4],estimatedMinutes:[0,1440],durationMinutes:[1,1440],minutes:[0,1440],weekday:[0,6]};
const allowed={courses:['name','code','color','teacher','location','days','startTime','endTime'],tasks:['title','courseId','kind','notes','url','dueDate','dueTime','plannedDate','estimatedMinutes','priority','status','repeat','completedAt','seriesId','checklist'],habits:['name','days','courseId'],checkins:['habitId','date','done'],blocks:['title','taskId','courseId','date','startTime','durationMinutes'],sessions:['taskId','startedAt','minutes']};
const clock=c=>c&&Number.isSafeInteger(c.n)&&c.n>=0&&c.n<1e12&&typeof c.by==='string'&&idPattern.test(c.by);
export function compareClock(a,b){return (a?.n||0)-(b?.n||0)||String(a?.by||'').localeCompare(String(b?.by||''));}
function checkRecord(kind,r,id){
 if(!r||typeof r!=='object'||Array.isArray(r)||r.id!==id||!idPattern.test(id)||!r._clock||typeof r._clock!=='object'||!r._base||typeof r._base!=='object')throw Error('Invalid planner record.');
 for(const [key,value]of Object.entries(r)){
  if(['id','_clock','_base'].includes(key))continue;if(key==='_deleted'){if(typeof value!=='boolean')throw Error('Invalid deletion record.');continue;}
  if(!allowed[kind].includes(key))throw Error('Unknown planner field: '+key);
  if(Object.hasOwn(strings,key)&&(typeof value!=='string'||value.length>strings[key]))throw Error('Invalid planner text.');
  if(Object.hasOwn(numberFields,key)&&(!Number.isFinite(value)||value<numberFields[key][0]||value>numberFields[key][1]))throw Error('Invalid planner number.');
  if(['date','dueDate','plannedDate'].includes(key)&&value&&!validDate(value))throw Error('Choose a valid date.');
  if(['startTime','endTime','dueTime'].includes(key)&&value&&!/^([01]\d|2[0-3]):[0-5]\d$/.test(value))throw Error('Choose a valid time.');
  if(key==='url'&&value&&!/^https?:\/\/[^\s<>"']+$/i.test(value))throw Error('Use an http or https resource link.');
  if(key==='color'&&!/^#[0-9a-f]{6}$/i.test(value))throw Error('Invalid course color.');
  if(key==='priority'&&!Number.isInteger(value))throw Error('Invalid priority.');
  if(key==='kind'&&!['assignment','exam','project','personal'].includes(value))throw Error('Invalid task type.');
  if(key==='status'&&!['todo','doing','done'].includes(value))throw Error('Invalid task status.');
  if(key==='repeat'&&!['none','daily','weekdays','weekly','monthly'].includes(value))throw Error('Invalid recurrence.');
  if(key==='days'&&(!Array.isArray(value)||value.length>7||value.some(n=>!Number.isInteger(n)||n<0||n>6)))throw Error('Invalid routine days.');
  if(key==='done'&&typeof value!=='boolean')throw Error('Invalid check-in.');
  if(key==='checklist'&&(!Array.isArray(value)||value.length>100||value.some(i=>!i||typeof i.id!=='string'||!idPattern.test(i.id)||typeof i.text!=='string'||i.text.length>300||typeof i.done!=='boolean')))throw Error('Invalid checklist.');
 }
 for(const [field,stamp]of Object.entries(r._clock))if(!Object.hasOwn(r,field)||!clock(stamp))throw Error('Invalid change stamp.');
 for(const [field,stamp]of Object.entries(r._base))if(!Object.hasOwn(r._clock,field)||stamp!==null&&!clock(stamp))throw Error('Invalid base stamp.');
 for(const field of Object.keys(r))if(!['id','_clock','_base'].includes(field)&&!clock(r._clock[field]))throw Error('Missing change stamp.');
 if(kind==='tasks'&&(typeof r.title!=='string'||!r.title.trim()))throw Error('Add a task title.');
 if(['courses','habits'].includes(kind)&&(typeof r.name!=='string'||!r.name.trim()))throw Error('Add a name.');
}
export function validatePlanner(input){
 if(!input||input.app!=='PlanSplat'||input.version!==1||!idPattern.test(input.id)||!Number.isSafeInteger(input.counter)||input.counter<0||input.counter>=1e12||JSON.stringify(input).length>6000000)throw Error('Choose a valid PlanSplat file under 6 MB.');
 const d=structuredClone(input);for(const kind of COLLECTIONS){if(!d[kind]||typeof d[kind]!=='object'||Array.isArray(d[kind])||Object.keys(d[kind]).length>(kind==='tasks'?10000:3000))throw Error('Planner record limit exceeded.');for(const [id,r]of Object.entries(d[kind]))checkRecord(kind,r,id);}
 const stamps=COLLECTIONS.flatMap(kind=>Object.values(d[kind]).flatMap(r=>Object.values(r._clock)));if(stamps.some(s=>s.n>d.counter))throw Error('Planner change history is inconsistent.');
 if(!d.conflicts||typeof d.conflicts!=='object'||Array.isArray(d.conflicts)||Object.keys(d.conflicts).length>1000||Object.values(d.conflicts).some(c=>!c||!COLLECTIONS.includes(c.kind)||!idPattern.test(c.recordId)||!allowed[c.kind].concat('_deleted').includes(c.field)||!clock(c.a?.stamp)||!clock(c.b?.stamp)))throw Error('Invalid conflict history.');
 return d;
}
export function put(doc,kind,values,client,id=values.id||uid()){
 if(!COLLECTIONS.includes(kind)||!idPattern.test(id)||!idPattern.test(client))throw Error('Invalid planner change.');
 const record=structuredClone(doc[kind][id]||{id,_clock:{},_base:{}}),stamp={n:doc.counter+1,by:client};
 for(const [key,value]of Object.entries(values)){if(key==='id')continue;if(JSON.stringify(record[key])===JSON.stringify(value))continue;record._base[key]=record._clock[key]||null;record._clock[key]=stamp;record[key]=structuredClone(value);}
 checkRecord(kind,record,id);doc.counter=stamp.n;doc[kind][id]=record;return record;
}
export const active=(doc,kind)=>Object.values(doc[kind]).filter(r=>!r._deleted);
export function remove(doc,kind,id,client){return put(doc,kind,{_deleted:true},client,id);}
export function completeTask(doc,id,client,now=new Date()){
 const task=doc.tasks[id];if(!task||task._deleted)return;
 const done=task.status!=='done';put(doc,'tasks',{status:done?'done':'todo',completedAt:done?now.toISOString():''},client,id);
 if(done&&task.repeat&&task.repeat!=='none'){
  const date=nextDate(task.dueDate||task.plannedDate||today(now),task.repeat),series=task.seriesId||id,nextId='r-'+series+'-'+date;
  if(!doc.tasks[nextId]){const copy=Object.fromEntries(allowed.tasks.filter(k=>Object.hasOwn(task,k)).map(k=>[k,structuredClone(task[k])]));Object.assign(copy,{seriesId:series,status:'todo',completedAt:'',dueDate:date,plannedDate:task.plannedDate?date:''});copy.checklist=(copy.checklist||[]).map(i=>({...i,done:false}));put(doc,'tasks',copy,client,nextId);}
 }
}
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
export function mergePlanners(left,right){
 const a=validatePlanner(left),b=validatePlanner(right),out=structuredClone(a);out.counter=Math.max(a.counter,b.counter);out.conflicts={...a.conflicts,...b.conflicts};
 for(const kind of COLLECTIONS)for(const [id,r]of Object.entries(b[kind])){
  const l=out[kind][id];if(!l){out[kind][id]=r;continue;}
  for(const [field,rs]of Object.entries(r._clock)){
   const ls=l._clock[field],order=compareClock(rs,ls);
   // Concurrent edits to the same base retain both alternatives for review.
   if(ls&&ls.by!==rs.by&&same(l._base[field],r._base[field])&&!same(l[field],r[field])){
    const pair=[{value:l[field],stamp:ls},{value:r[field],stamp:rs}].sort((x,y)=>compareClock(x.stamp,y.stamp)),key=[kind,id,field,...pair.map(x=>x.stamp.n+'-'+x.stamp.by)].join(':');out.conflicts[key]={kind,recordId:id,field,a:pair[0],b:pair[1]};
   }
   if(order>0){l[field]=structuredClone(r[field]);l._clock[field]=rs;l._base[field]=r._base[field];}
  }
 }
 // Resolved conflicts are superseded by a later explicit field change.
 for(const [key,c]of Object.entries(out.conflicts)){const stamp=out[c.kind][c.recordId]?._clock[c.field];if(stamp&&compareClock(stamp,c.a.stamp)>0&&compareClock(stamp,c.b.stamp)>0)delete out.conflicts[key];}
 return validatePlanner(out);
}
export function resolveConflict(doc,key,choice,client){const c=doc.conflicts[key];if(!c)return;doc.counter=Math.max(doc.counter,c.a.stamp.n,c.b.stamp.n);const r=doc[c.kind][c.recordId];delete r[c.field];r._clock[c.field]={n:0,by:client};put(doc,c.kind,{[c.field]:choice==='a'?c.a.value:c.b.value},client,c.recordId);delete doc.conflicts[key];}
export function quickTask(title,extras={}){return {title:title.trim(),courseId:'',kind:'assignment',notes:'',url:'',dueDate:'',dueTime:'',plannedDate:'',estimatedMinutes:25,priority:3,status:'todo',repeat:'none',completedAt:'',checklist:[],...extras};}
export function csvExport(doc){const esc=v=>'"'+String(v??'').replace(/"/g,'""')+'"';return [['Title','Course','Type','Due date','Due time','Study date','Minutes','Priority','Status','Notes'],...active(doc,'tasks').map(t=>[t.title,doc.courses[t.courseId]?.name||'',t.kind,t.dueDate,t.dueTime,t.plannedDate,t.estimatedMinutes,t.priority,t.status,t.notes])].map(row=>row.map(esc).join(',')).join('\r\n');}
export function calendarExport(doc){
 const esc=v=>String(v??'').replace(/\\/g,'\\\\').replace(/\n/g,'\\n').replace(/[,;]/g,c=>'\\'+c),stamp=new Date().toISOString().replace(/[-:]/g,'').replace(/\.\d{3}Z/,'Z'),lines=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//SplatWorks//PlanSplat//EN','CALSCALE:GREGORIAN'];
 for(const task of active(doc,'tasks').filter(t=>t.dueDate))lines.push('BEGIN:VEVENT','UID:'+esc(task.id)+'@plansplat.splatworks.org','DTSTAMP:'+stamp,'DTSTART;VALUE=DATE:'+task.dueDate.replace(/-/g,''),'DTEND;VALUE=DATE:'+addDays(task.dueDate,1).replace(/-/g,''),'SUMMARY:'+esc(task.title),'DESCRIPTION:'+esc((task.dueTime?'Due time: '+task.dueTime+'\n':'')+(task.notes||'')),'END:VEVENT');
 for(const block of active(doc,'blocks')){if(!block.date||!block.startTime)continue;const start=new Date(block.date+'T'+block.startTime+':00'),end=new Date(start.getTime()+block.durationMinutes*60000),format=d=>d.toISOString().replace(/[-:]/g,'').replace(/\.\d{3}Z/,'Z');lines.push('BEGIN:VEVENT','UID:'+esc(block.id)+'@plansplat.splatworks.org','DTSTAMP:'+stamp,'DTSTART:'+format(start),'DTEND:'+format(end),'SUMMARY:'+esc(block.title||doc.tasks[block.taskId]?.title||'Study time'),'END:VEVENT');}
 lines.push('END:VCALENDAR');return lines.map(line=>{let folded='',length=0;for(const char of line){const n=new TextEncoder().encode(char).length;if(length+n>74){folded+='\r\n ';length=1;}folded+=char;length+=n;}return folded;}).join('\r\n')+'\r\n';
}
