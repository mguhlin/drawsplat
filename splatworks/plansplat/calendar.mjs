import {authorizeGoogle} from './drive.mjs';
import {connectionsAllowed} from '../shared/google-drive-auth.js';
import {active,addDays} from './model.mjs';
const API='https://www.googleapis.com/calendar/v3/calendars',SCOPE='https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/calendar.app.created';
const MARKER='PlanSplat managed calendar. Deadlines and study blocks sync from PlanSplat.';
const hash=async value=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value))),n=>n.toString(16).padStart(2,'0')).join('');
const safeText=value=>String(value||'').replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
function timed(date,time,minutes,timeZone){
 // Resolve local wall time in the calendar's zone, then add elapsed minutes.
 // This retains a study block's duration across daylight-saving transitions.
 const target=Date.parse(date+'T'+time+':00Z'),format=new Intl.DateTimeFormat('sv-SE',{timeZone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'});
 const wall=instant=>Object.fromEntries(format.formatToParts(instant).map(p=>[p.type,p.value]));
 const wallMillis=instant=>{const p=wall(instant);return Date.parse(`${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}:${p.second}Z`);};
 let instant=target;for(let i=0;i<4;i++){const next=target-(wallMillis(instant)-instant);if(next===instant)break;instant=next;}
 if(wallMillis(instant)!==target)throw Error(`The time ${date} ${time} does not exist in ${timeZone} because clocks change. Choose another time in PlanSplat.`);
 const iso=ms=>new Date(ms).toISOString().replace('.000Z','Z');
 return {start:{dateTime:iso(instant),timeZone},end:{dateTime:iso(instant+minutes*60000),timeZone}};
}
export async function calendarEvents(doc,timeZone){
 const events=[];
 for(const kind of ['tasks','blocks'])for(const r of active(doc,kind)){
  if(kind==='tasks'&&!r.dueDate||kind==='blocks'&&(!r.date||!r.startTime))continue;
  const task=kind==='tasks'?r:doc.tasks[r.taskId],course=doc.courses[r.courseId||task?.courseId],title=r.title||task?.title||'Study time';
  const event={summary:(kind==='tasks'?(r.status==='done'?'✓ ':'Due: '):'Study: ')+title,description:[kind==='tasks'?'Task deadline'+(r.dueTime?' (15-minute marker)':''):'Study block',course&&!course._deleted?'Course: '+course.name:'',kind==='tasks'?'Status: '+({todo:'To do',doing:'In progress',done:'Completed'}[r.status]||'To do'):'',kind==='tasks'?r.notes:'','Edit in PlanSplat: https://splatworks.org/plansplat/'].filter(Boolean).map(safeText).join('\n'),...(kind==='tasks'?!r.dueTime?{start:{date:r.dueDate},end:{date:addDays(r.dueDate,1)}}:timed(r.dueDate,r.dueTime,15,timeZone):timed(r.date,r.startTime,r.durationMinutes||25,timeZone)),transparency:kind==='tasks'?'transparent':'opaque'};
  const fingerprint=await hash(JSON.stringify(event));events.push({...event,id:'ps'+await hash(kind+':'+r.id),extendedProperties:{private:{splatworksApp:'plansplat',record:kind+':'+r.id,fingerprint}}});
 }
 return events;
}
export class CalendarSync{
 constructor({drive,getDoc,onState}){Object.assign(this,{drive,getDoc,onState});this.reset();}
 state(kind,message){this.onState({kind,message,connected:!!this.token,calendarId:this.calendarId||''});}
 reset(){this.generation=(this.generation||0)+1;this.abort?.abort();this.abort=new AbortController();clearTimeout(this.timer);this.token=null;this.calendarId='';this.expiry=0;this.again=false;this.running=null;this.state('off','Calendar is not connected.');}
 async request(url,options={}){
  connectionsAllowed();if(!this.token||Date.now()>=this.expiry){this.token=null;throw Error('Reconnect Google Calendar to send pending updates.');}
  const response=await fetch(url,{...options,signal:this.abort.signal,redirect:'error',headers:{'Content-Type':'application/json',...options.headers,Authorization:'Bearer '+this.token}});
  if(response.status===401){this.token=null;throw Error('Reconnect Google Calendar to send pending updates.');}
  if(!response.ok){let detail;try{detail=await response.json();}catch{}const error=Error(response.status===403?(['accessNotConfigured','SERVICE_DISABLED'].includes(detail?.error?.errors?.[0]?.reason)?'The site owner needs to enable Google Calendar. Your Drive planner is saved separately.':'Calendar permission was denied. Reconnect Calendar or check your school account permissions.'):response.status===404?'The PlanSplat calendar is unavailable. Disconnect Calendar, then connect again to recover.':`Calendar could not sync (${response.status}). Your planner is saved separately.`);error.status=response.status;error.apiReason=detail?.error?.errors?.[0]?.reason;throw error;}return response.status===204?null:response.json();
 }
 async connect(){
  if(this.connecting)return;if(!this.drive.account||!this.drive.token){this.state('error','Connect Google Drive before connecting Calendar.');return;}
  this.connecting=true;const generation=this.generation,accountId=this.drive.account.id,check=()=>{if(generation!==this.generation||this.drive.account?.id!==accountId)throw new DOMException('Account changed','AbortError');};
  try{
   this.state('connecting','Connecting Google Calendar…');const auth=await authorizeGoogle({scope:SCOPE,title:'Connect Google Calendar',message:'Use the same Google account as your planner. PlanSplat will create its own calendar for deadlines and study blocks. Edits sync from PlanSplat while this app is open.'});check();this.token=auth.access_token;this.expiry=Date.now()+Math.max(1,Number(auth.expires_in)||3600)*1000-10000;
   const {user}=await this.request('https://www.googleapis.com/drive/v3/about?fields=user(permissionId)');check();if(user?.permissionId!==accountId)throw Error('Choose the same Google account used for your Drive planner.');
   let settings=await this.drive.calendarSettings();check();let calendar;
   if(settings.calendarId){try{calendar=await this.request(API+'/'+encodeURIComponent(settings.calendarId));}catch(error){if(error.status!==404)throw error;}}
   check();if(calendar&&(calendar.id==='primary'||calendar.description!==MARKER))throw Error('This calendar is not managed by PlanSplat. No events were changed.');
   if(!calendar){calendar=await this.request(API,{method:'POST',body:JSON.stringify({summary:'PlanSplat',description:MARKER,timeZone:Intl.DateTimeFormat().resolvedOptions().timeZone||'UTC'})});check();if(!calendar.id||calendar.id==='primary')throw Error('Google did not create a separate PlanSplat calendar.');await this.drive.calendarSettings({calendarId:calendar.id});check();}
   this.calendarId=calendar.id;this.timeZone=calendar.timeZone||'UTC';await this.sync();
  }catch(error){if(error.name!=='AbortError'&&generation===this.generation){this.token=null;this.state('error',error.message);}}finally{this.connecting=false;}
 }
 changed(){clearTimeout(this.timer);if(this.token&&this.calendarId){this.state('pending','Calendar updates pending…');this.timer=setTimeout(()=>this.sync(),1800);}}
 async sync(){
  if(!this.token||!this.calendarId)return;if(this.running){this.again=true;return this.running;}
  const generation=this.generation,check=()=>{if(generation!==this.generation)throw new DOMException('Account changed','AbortError');};
  const run=async()=>{try{
   check();this.state('syncing','Updating Google Calendar…');const desired=await calendarEvents(this.getDoc(),this.timeZone);check();const base=API+'/'+encodeURIComponent(this.calendarId)+'/events',existing=new Map();let next='';
   do{const result=await this.request(base+'?privateExtendedProperty=splatworksApp%3Dplansplat&maxResults=2500'+(next?'&pageToken='+encodeURIComponent(next):''));check();for(const e of result.items||[])if(e.extendedProperties?.private?.splatworksApp==='plansplat'&&/^ps[0-9a-f]{64}$/.test(e.id))existing.set(e.id,e);next=result.nextPageToken||'';}while(next);
   for(const event of desired){check();const prior=existing.get(event.id);existing.delete(event.id);if(prior?.extendedProperties?.private?.fingerprint===event.extendedProperties.private.fingerprint)continue;
    if(prior)await this.request(base+'/'+event.id,{method:'PATCH',headers:prior.etag?{'If-Match':prior.etag}:{},body:JSON.stringify({...event,status:'confirmed'})});
    else try{await this.request(base,{method:'POST',body:JSON.stringify(event)});}catch(error){if(error.status!==409)throw error;check();const occupied=await this.request(base+'/'+event.id);check();if(occupied.status!=='cancelled'&&occupied.extendedProperties?.private?.splatworksApp!=='plansplat')throw Error('An event ID is already in use. No unrelated event was changed.');await this.request(base+'/'+event.id,{method:'PATCH',headers:occupied.etag?{'If-Match':occupied.etag}:{},body:JSON.stringify({...event,status:'confirmed'})});}
   }
   for(const event of existing.values()){check();await this.request(base+'/'+event.id,{method:'DELETE',headers:event.etag?{'If-Match':event.etag}:{}});}
   check();this.state('saved','Google Calendar is up to date.');
  }catch(error){if(error.name!=='AbortError'&&generation===this.generation)this.state('error',error.message);}finally{if(generation===this.generation)this.running=null;if(this.again&&generation===this.generation){this.again=false;this.changed();}}};
  this.running=navigator.locks?navigator.locks.request('plansplat-calendar-'+this.calendarId,run):run();return this.running;
 }
 disconnect(){this.reset();this.state('off','Calendar updates stopped. Existing events remain in Google Calendar.');}
}
