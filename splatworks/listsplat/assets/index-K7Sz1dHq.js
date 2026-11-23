(function(){let e=document.createElement(`link`).relList;if(e&&e.supports&&e.supports(`modulepreload`))return;for(let e of document.querySelectorAll(`link[rel="modulepreload"]`))n(e);new MutationObserver(e=>{for(let t of e)if(t.type===`childList`)for(let e of t.addedNodes)e.tagName===`LINK`&&e.rel===`modulepreload`&&n(e)}).observe(document,{childList:!0,subtree:!0});function t(e){let t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),t.credentials=e.crossOrigin===`use-credentials`?`include`:e.crossOrigin===`anonymous`?`omit`:`same-origin`,t}function n(e){if(e.ep)return;e.ep=!0;let n=t(e);fetch(e.href,n)}})();var e=new Map,t=()=>globalThis.SplatDesktop||null,n={get length(){return e.size},key:t=>[...e.keys()][t]??null,getItem:t=>e.get(String(t))??null,setItem:(t,n)=>{e.set(String(t),String(n))},removeItem:t=>{e.delete(String(t))},clear:()=>e.clear()};function r(e){return e&&typeof e==`object`&&!Array.isArray(e)&&(e={...e},delete e.createdAt,delete e.updatedAt),JSON.stringify(e)}function i(e,n){let i=t();if(!i)return null;let a=()=>r(n.snapshot()),o=a(),s=e=>n.status?.(e),c={isDirty:()=>a()!==o||!!n.pending?.(),stamp:a,markSaved:e=>{o=e}};i.registerWorkspace(e,c);let l={get dirty(){return c.isDirty()},changed(){i.changed(e)},acceptCurrent(){o=a(),i.changed(e)},async beginReplace(){if(!await i.confirmReplace(e))return null;let t=()=>a()+JSON.stringify(n.pending?.()||!1),r=t(),o=i.beginOperation(),s=!1;return{verify(){if(r!==t())throw Error(`Your workspace changed while the file was opening. Your edits were kept; choose the file again.`)},finish(){s||(s=!0,o(),i.changed(e))}}},async save(){let t=i.beginOperation();try{let t=structuredClone(n.snapshot()),a=r(t),o=await n.file(t),l=await i.saveBlob(o.blob,o.name,{tool:e,stamp:a,complete:!0});return s(l?c.isDirty()?`Saved a copy. Newer changes still need saving.`:`Saved successfully.`:`Save cancelled. Your work is still open.`),i.changed(e),l}catch(e){return s(`Save failed: `+e.message+`. Your work is still open.`),!1}finally{t()}}};return i.registerCommands(e,{save:()=>l.save(),open:()=>n.open(),...n.help?{help:()=>n.help()}:{}}),i.registerFileReceiver?.(e,e=>n.openFile(e)),addEventListener(`desktop:export-result`,e=>{e.detail?.ok===!1&&s(e.detail.error?`Save failed: `+e.detail.error+`. Your work is still open.`:`Save cancelled. Your work is still open.`)}),l}var a=`https://www.googleapis.com/auth/drive.file`,o=null;function s(){if(window.SplatPrivacy?.getState().optionalConnections===!1)throw Error(`External connections are off. Enable them in Privacy before using Google Drive.`);if(navigator.onLine===!1)throw Error(`Google Drive needs an internet connection. You can still save to your device.`)}function c(){return s(),window.google?.accounts?.oauth2?Promise.resolve():o||(o=new Promise((e,t)=>{let n=document.createElement(`script`),r=()=>{clearTimeout(i),n.remove(),o=null,t(Error(`Google sign-in could not load. Check your connection and try again.`))},i=setTimeout(r,15e3);n.src=`https://accounts.google.com/gsi/client`,n.async=!0,n.onerror=r,n.onload=()=>{clearTimeout(i),window.google?.accounts?.oauth2?e():r()},document.head.append(n)}),o)}function l(e,t){return s(),new Promise((n,r)=>{let i=!1,o=(e,a)=>{i||(i=!0,clearTimeout(c),t.removeEventListener(`abort`,s),e?r(e):n(a))},s=()=>o(new DOMException(`Cancelled`,`AbortError`)),c=setTimeout(()=>o(Error(`Google sign-in timed out. Try again.`)),12e4);if(t.addEventListener(`abort`,s,{once:!0}),t.aborted)s();else try{let t=window.google.accounts.oauth2;t.initTokenClient({client_id:e,scope:a,include_granted_scopes:!1,callback(e){e.error||!e.access_token?o(Error(`Google Drive permission was not granted. Your local work is unchanged.`)):t.hasGrantedAllScopes&&!t.hasGrantedAllScopes(e,a)||e.scope&&!e.scope.split(/\s+/).includes(a)?o(Error(`Allow access to the files you use with this app to continue.`)):o(null,e.access_token)},error_callback(){o(Error(`Google sign-in was closed or blocked. Allow the popup and try again.`))}}).requestAccessToken({prompt:`select_account`})}catch(e){o(e)}})}function u(e,t){return s(),typeof BroadcastChannel==`function`?new Promise((n,r)=>{let i=crypto.randomUUID(),o=new BroadcastChannel(`splat-drive-`+i),c=!1,l=(e,i)=>{c||(c=!0,o.postMessage({type:`close`}),o.close(),clearTimeout(d),t.removeEventListener(`abort`,u),e?r(e):n(i))},u=()=>l(new DOMException(`Cancelled`,`AbortError`)),d=setTimeout(()=>l(Error(`Google authorization timed out. Close the authorization window and try again.`)),12e4);if(t.addEventListener(`abort`,u,{once:!0}),t.aborted)u();else{o.onmessage=({data:t})=>{if(t&&!c&&(t.type===`ready`&&o.postMessage({type:`configure`,clientId:e}),t.type===`cancel`&&u(),t.type===`error`&&l(Error(`Google authorization was not completed. Your local work is preserved.`)),t.type===`token`&&typeof t.accessToken==`string`&&t.accessToken&&t.scope===a))try{s(),l(null,t.accessToken)}catch(e){l(e)}};try{let e=new URL(`../../splatworks/shared/google-drive-auth.html`,location.href);e.hash=i,window.open(e.href,`_blank`,`popup,width=540,height=620`)||l(Error(`The authorization window was blocked. Allow popups and try again.`))}catch(e){l(e)}}}):Promise.reject(Error(`This browser cannot open the authorization window. Save to your device instead.`))}var d=`31274545407-l338d2doafet21gv8u4qmq2jk3j03jq3.apps.googleusercontent.com`,f=null;function ee(e){return e||document.querySelector(`meta[name="google-drive-client-id"]`)?.content||(/^(splatworks\.org|drawsplat\.org)$/.test(location.hostname)?d:``)}async function te(e,t,n,r){s();let i=await fetch(e,{...t,signal:r,redirect:`error`,headers:{...t.headers,Authorization:`Bearer `+n}});if(!i.ok&&i.status!==308)throw i.status===401?Error(`Google authorization expired. Choose Save or Open again to sign in.`):i.status===403?Error(`Google Drive denied this action. Check your account permissions and school Workspace policy.`):Error(`Google Drive could not complete this action (`+i.status+`). Your local work is unchanged.`);return i}function ne(e){if(typeof e!=`string`||!/^[\w-]+$/.test(e))throw Error(`Google Drive did not return a usable file. Try saving again.`);return e}async function re(e,t,n,r){if(!(e instanceof Blob))throw Error(`The project file could not be prepared. Save a local copy and try again.`);let i=e.type||`application/octet-stream`,a=JSON.stringify({name:t,mimeType:i}),o,s=`https://www.googleapis.com/upload/drive/v3/files?fields=id&uploadType=`;if(e.size<=5242880){let t=`splatworks-`+crypto.randomUUID(),c=new Blob([`--`+t+`\r
Content-Type: application/json; charset=UTF-8\r
\r
`,a,`\r
--`+t+`\r
Content-Type: `+i+`\r
\r
`,e,`\r
--`+t+`--\r
`]);o=await te(s+`multipart`,{method:`POST`,body:c,headers:{"Content-Type":`multipart/related; boundary=`+t}},n,r)}else{let t=(await te(s+`resumable`,{method:`POST`,body:a,headers:{"Content-Type":`application/json; charset=UTF-8`,"X-Upload-Content-Type":i,"X-Upload-Content-Length":String(e.size)}},n,r)).headers.get(`Location`);if(!t)throw Error(`Google Drive did not start the upload. Try again.`);let c=new URL(t);if(c.origin!==`https://www.googleapis.com`||c.pathname!==`/upload/drive/v3/files`)throw Error(`Google Drive returned an unexpected upload address.`);o=await te(c.href,{method:`PUT`,body:e,headers:{"Content-Type":i}},n,r)}let c=ne((await o.json()).id);return{id:c,name:t,webViewLink:`https://drive.google.com/file/d/`+c+`/view`}}function ie(){if(document.getElementById(`splat-drive-styles`))return;let e=document.createElement(`style`);e.id=`splat-drive-styles`,e.textContent=`.splat-drive-dialog{box-sizing:border-box;width:min(32rem,calc(100vw - 2rem));max-height:calc(100dvh - 2rem);overflow:auto;margin:auto;padding:1.5rem;border:1px solid #cbd5e1;border-radius:1rem;background:#fff;color:#172036;font:16px/1.5 system-ui,sans-serif;box-shadow:0 24px 80px #0004;z-index:2147483647}.splat-drive-dialog::backdrop{background:#10172a99}.splat-drive-dialog h2{margin:0 0 .8rem;font-size:1.4rem;color:#172036}.splat-drive-dialog p{margin:.7rem 0}.splat-drive-dialog label{display:block;font-weight:650}.splat-drive-dialog input{box-sizing:border-box;display:block;width:100%;margin:.4rem 0;padding:.65rem;border:1px solid #94a3b8;border-radius:.5rem;background:#fff;color:#172036;font:inherit}.splat-drive-dialog button,.splat-drive-dialog a{font:inherit}.splat-drive-dialog button{padding:.65rem 1rem;border:1px solid #aab4c5;border-radius:.5rem;background:#f3f5fa;color:#172036;cursor:pointer}.splat-drive-dialog button[type=submit]{background:#5b21b6;border-color:#5b21b6;color:#fff}.splat-drive-dialog button:disabled{opacity:.55;cursor:wait}.splat-drive-dialog :focus-visible{outline:3px solid #d97706;outline-offset:3px}.splat-drive-dialog a{color:#5b21b6;text-decoration:underline}.splat-drive-actions{display:flex;flex-wrap:wrap;justify-content:flex-end;gap:.6rem;margin-top:1rem}.splat-drive-status{min-height:1.5em;overflow-wrap:anywhere}.splat-drive-dialog [hidden]{display:none!important}`,document.head.append(e)}function p(e,t){if(f)return Promise.reject(Error(`A Google Drive window is already open.`));ie();let n=document.activeElement,r=document.createElement(`dialog`);r.className=`splat-drive-dialog`,r.setAttribute(`aria-label`,t===`save`?`Save to Google Drive`:t===`open`?`Open from Google Drive`:`Connect Google Drive`),r.innerHTML=`<h2></h2><p class="splat-drive-note"></p><form><label>File name<input name="filename" maxlength="180" required></label><p class="splat-drive-status" role="status" aria-live="polite"></p><p class="splat-drive-result" hidden><a target="_blank" rel="noopener noreferrer">Open in Google Drive</a></p><div class="splat-drive-actions"><button type="button" data-close>Cancel</button><button type="submit" disabled></button></div></form>`;let i=r.querySelector(`form`),a=i.elements.filename,o=i.querySelector(`[type=submit]`),d=i.querySelector(`[data-close]`),p=r.querySelector(`[role=status]`),ae=r.querySelector(`.splat-drive-result`),oe=t===`save`?`Save to Google Drive`:t===`open`?`Open from Google Drive`:`Connect Google Drive`;if(r.querySelector(`h2`).textContent=oe,r.querySelector(`.splat-drive-note`).textContent=t===`save`?e.appName+` saves a new file copy to the Google account you choose. Local work stays here. Sharing is not enabled; manage access in Drive. You can download the file from Drive later.`:`Choose your Google account to `+(t===`open`?`reopen the last `+e.appName+` file saved from this browser.`:`connect `+e.appName+`.`)+` Access is limited to files you use with this app.`,e.note){let t=document.createElement(`p`);t.textContent=e.note,r.querySelector(`form`).before(t)}a.value=e.fileName||`project.json`,a.parentElement.hidden=t!==`save`,o.textContent=oe,document.body.append(r),f=r,r.showModal();let m,h=!1,g=null,se=new Promise(e=>{r.addEventListener(`close`,()=>{h=!0,m?.abort(),f=null,r.remove(),n instanceof HTMLElement&&n.isConnected&&n.focus(),e(g)},{once:!0})});d.onclick=()=>r.close();let ce=ee(e.clientId),le=e.authorizationWindow===!0||window.crossOriginIsolated===!0;try{if(s(),location.protocol!==`https:`&&!/^(localhost|127\.0\.0\.1)$/.test(location.hostname))throw Error(`Google Drive needs a hosted HTTPS site. Save to your device here.`);if(!ce)throw Error(`This site needs Google Drive setup. Ask your administrator to configure a Google OAuth client. Local saving is available.`);p.textContent=`Loading Google sign-in…`,(le?Promise.resolve():c()).then(()=>{h||(s(),p.textContent=`Choose `+oe+` to sign in and authorize this file transfer.`,o.disabled=!1)}).catch(e=>{h||(p.textContent=e.message)})}catch(e){p.textContent=e.message}return i.onsubmit=async n=>{if(n.preventDefault(),o.disabled||h)return;let i=a.value.replace(/[\x00-\x1f/\\]/g,`-`).trim(),c=e.fileName?.match(/(?:\.(?:grid|show|write|list|video)splat\.json|\.drawsplat-cmap\.json|\.[a-z0-9]{1,12})$/i)?.[0];if(i&&c&&!i.toLowerCase().endsWith(c.toLowerCase())&&(i+=c),t===`save`&&!i){a.focus();return}o.disabled=!0,a.disabled=!0,m=new AbortController;let f;try{p.textContent=`Choose your Google account and allow file access…`;let n=await(le?u(ce,m.signal):l(ce,m.signal));if(h)return;if(s(),f=setTimeout(()=>m.abort(),18e4),t===`save`){p.textContent=`Preparing your file…`;let t=await e.buildFile();if(!(t instanceof Blob))throw Error(`The file could not be prepared. Save a local copy and try again.`);clearTimeout(f);let r=Math.min(18e5,Math.max(18e4,Math.ceil(t.size/262144)*1e3+6e4));if(f=setTimeout(()=>m.abort(),r),p.textContent=`Uploading `+i+` (`+(t.size/1048576).toFixed(1)+` MB). Keep this tab open…`,g=await re(t,i,n,m.signal),h)return;ae.querySelector(`a`).href=g.webViewLink,ae.hidden=!1,p.textContent=`Saved `+i+` to Google Drive. Local work is preserved.`,d.textContent=`Done`,o.hidden=!0}else t===`open`?(p.textContent=`Opening your project…`,g=await(await te(`https://www.googleapis.com/drive/v3/files/`+ne(e.fileId)+`?alt=media`,{method:`GET`},n,m.signal)).blob(),r.close()):(g=!0,r.close())}catch(e){h||(g=null,p.textContent=e.name===`AbortError`?`The transfer stopped. Check Drive before retrying. Your local work is preserved.`:e.message,o.disabled=!1,a.disabled=!1)}finally{clearTimeout(f)}},se}function ae(e){return globalThis.SplatDesktop?Promise.reject(Error(`Use the browser edition for Google Drive connections.`)):p(e,`save`)}var oe={writesplat:`WriteSplat`,showsplat:`ShowSplat`,gridsplat:`GridSplat`,listsplat:`ListSplat`,layoutsplat:`LayoutSplat`},m={writesplat:[`doc`,`docx`,`odt`,`txt`,`text`,`md`,`markdown`,`html`,`htm`,`json`],showsplat:[`pptx`,`odp`,`pdf`,`html`,`htm`,`md`,`markdown`,`json`],gridsplat:[`xlsx`,`ods`,`csv`,`tsv`,`md`,`markdown`,`json`],listsplat:[`csv`,`tsv`,`json`],layoutsplat:[`layoutsplat`,`epub`,`json`]},h=6e5,g=`open-file`,se=()=>`drawsplat.imported-tab.`+location.pathname,ce,le=!1;typeof location<`u`&&(ce=new URL(location.href).searchParams.get(g));function ue(){if(typeof window>`u`)return!1;ce&&(le=!0);try{le?sessionStorage.setItem(se(),`1`):le=sessionStorage.getItem(se())===`1`}catch{}return le}function de(){return t()?n:ue()?window.sessionStorage:window.localStorage}function fe(e){let t=String(e).toLowerCase();for(let e of Object.keys(oe))if(t.endsWith(`.`+e+`.json`))return e;let n=t.split(`.`).pop();return[`layoutsplat`,`epub`].includes(n)?`layoutsplat`:[`doc`,`docx`,`odt`].includes(n)?`writesplat`:[`pptx`,`odp`].includes(n)?`showsplat`:[`xlsx`,`ods`].includes(n)?`gridsplat`:null}function pe(e){return e?.app===`LayoutSplat`&&Array.isArray(e?.pages)&&e?.stories?`layoutsplat`:Array.isArray(e?.slides)?`showsplat`:e?.document&&e?.teacher?`writesplat`:Array.isArray(e?.sheets)?`gridsplat`:Array.isArray(e?.schema?.tables)?`listsplat`:null}async function me(e,t){let n=e.name.toLowerCase().split(`.`).pop();if(!m[t]?.includes(n)){let n=fe(e.name);throw Error(n?`Open ${e.name} in ${oe[n]}.`:`${oe[t]} cannot open this file type. Use ${m[t].map(e=>`.`+e).join(`, `)}. For older Office files, save a current DOCX, XLSX, PPTX, or CSV copy first.`)}if(e.size>2e7)throw Error(`File imports are limited to 20 MB.`);if(![`doc`,`docx`,`odt`,`pptx`,`odp`,`xlsx`,`ods`,`pdf`,`layoutsplat`,`epub`].includes(n)){let t=new Uint8Array(await e.slice(0,512).arrayBuffer());if(t.includes(0)||t[0]===80&&t[1]===75&&t[2]===3&&t[3]===4)throw Error(`This looks like a binary file with a text filename. Use its original Office extension, or export text/CSV as UTF-8.`)}}function he(){return new Promise((e,t)=>{let n=indexedDB.open(`drawsplat-file-transfers`,1);n.onupgradeneeded=()=>n.result.createObjectStore(`files`,{keyPath:`id`}),n.onsuccess=()=>e(n.result),n.onerror=()=>t(Error(`Browser file transfer storage is unavailable. Open the correct app and choose the file there.`))})}async function ge(e){let t=await he();try{await new Promise((n,r)=>{let i=t.transaction(`files`,`readwrite`),a=i.objectStore(`files`),o=a.openCursor();o.onsuccess=()=>{let e=o.result;e&&(Date.now()-e.value.createdAt>h&&e.delete(),e.continue())},a.put(e),i.oncomplete=n,i.onerror=()=>r(i.error),i.onabort=()=>r(i.error)})}finally{t.close()}}async function _e(e,t){let n=await he();try{return await new Promise((r,i)=>{let a=n.transaction(`files`,`readwrite`),o=a.objectStore(`files`),s=o.get(e),c;s.onsuccess=()=>{c=s.result,c&&o.delete(e)},a.oncomplete=()=>{!c||c.app!==t||Date.now()-c.createdAt>h?i(Error(`This file transfer expired or is unavailable. Choose the file again in its matching app.`)):r(new File([c.file],c.name,{type:c.type,lastModified:c.modified}))},a.onerror=()=>i(a.error)})}finally{n.close()}}async function ve(e,n){let r=fe(e.name);if(!r&&!m[n]?.includes(e.name.toLowerCase().split(`.`).pop())&&(/\.(csv|tsv)$/i.test(e.name)?r=`gridsplat`:/\.pdf$/i.test(e.name)?r=`showsplat`:/\.(txt|text|md|markdown|html|htm)$/i.test(e.name)&&(r=`writesplat`)),!r&&/\.json$/i.test(e.name)&&e.size<=2e7)try{r=pe(JSON.parse(await e.text()))}catch{}if(!r||r===n)return!1;if(e.size>2e7)throw Error(`File imports are limited to 20 MB.`);if(t())return await t().openWorkspaceFile(r,e),!0;if(![`http:`,`https:`].includes(location.protocol))throw Error(`Open SplatWorks through a local web server to transfer files between apps.`);let i=window.open(`about:blank`,`_blank`);if(!i)throw Error(`Your browser blocked the new tab. Allow popups, then choose the file again to open it in ${oe[r]}.`);i.opener=null;let a=location.pathname.indexOf(`/splatworks/`),o=a>=0?location.pathname.slice(0,a)+`/splatworks/`:`/splatworks/`,s=new URL(o+r+`/`,location.origin),c=crypto.randomUUID?.()||`xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx`.replace(/[xy]/g,e=>{let t=crypto.getRandomValues(new Uint8Array(1))[0]&15;return(e===`x`?t:t&3|8).toString(16)});try{let t=await fetch(s,{cache:`no-cache`});if(!t.ok||!(await t.text()).includes(`name="splatworks-app" content="`+r+`"`))throw Error(`${oe[r]} is not available at this school address. Install or enable it, then choose the file there.`);return await ge({id:c,app:r,file:e,name:e.name,type:e.type,modified:e.lastModified,createdAt:Date.now()}),s.searchParams.set(g,c),i.location.href=s.href,!0}catch(e){throw i.close(),e}}async function ye(e){if(!ce)return null;let t=ce;ue(),ce=null;let n=new URL(location.href);if(n.searchParams.delete(g),history.replaceState(history.state,``,n),!/^[0-9a-f-]{36}$/i.test(t))throw Error(`Invalid file transfer. Choose the file again.`);return _e(t,e)}var be=`Save a project file before closing this imported tab. Your other projects have not been replaced.`,xe={text:``,longText:``,number:0,currency:0,percent:0,date:``,time:``,dateTime:``,checkbox:!1,rating:0,choice:``,multiSelect:``,email:``,phone:``,image:``,file:``,audio:``,link:``,calculation:``,autoNumber:``,createdAt:``,updatedAt:``};function _(e){return`${e}_${Math.random().toString(36).slice(2,10)}`}function Se(e,t=`text`){return{id:_(`field`),name:e,type:t,description:``,required:!1,hidden:!1,options:t===`choice`||t===`multiSelect`?[`Yes`,`No`]:void 0}}function v(e,t={}){let n=new Date().toISOString(),r=Object.fromEntries(e.map((e,r)=>e.primaryKey&&t[e.id]===void 0&&e.type===`text`?[e.id,_(`key`)]:e.type===`createdAt`||e.type===`updatedAt`?[e.id,t[e.id]??n]:e.type===`autoNumber`||e.primaryKey&&e.type===`number`?[e.id,t[e.id]??r+1]:t[e.id]===void 0&&e.defaultValue!=null&&e.defaultValue!==``?[e.id,ke(e.defaultValue,e.type,e.options).value]:[e.id,t[e.id]??xe[e.type]]));return{id:_(`record`),createdAt:n,updatedAt:n,values:r}}function Ce(e,t){let n=t.map(e=>Se(e));return{id:_(`table`),name:e,fields:n,records:[v(n)]}}function we(e=`Animal Research Database`){let t=new Date().toISOString(),n=Ce(`Animals`,[`Animal`,`Habitat`,`Diet`,`Interesting Fact`]);return n.records=[[`Axolotl`,`Freshwater lakes`,`Worms and insects`,`Has feathery external gills`],[`Red panda`,`Mountain forests`,`Bamboo and fruit`,`Uses a long tail for balance`],[`River otter`,`Rivers and wetlands`,`Fish and invertebrates`,`Moves easily between water and land`],[`Barn owl`,`Grasslands and farmland`,`Small animals`,`Has a heart-shaped face`],[`Monarch butterfly`,`Meadows and gardens`,`Nectar`,`Begins life as a caterpillar`],[`Green sea turtle`,`Coastal ocean`,`Seagrass and algae`,`Breathes air at the surface`],[`Honeybee`,`Meadows and gardens`,`Nectar and pollen`,`Visits flowers while gathering food`],[`Beaver`,`Rivers and ponds`,`Bark and aquatic plants`,`Builds with branches`],[`Giraffe`,`Savanna`,`Leaves`,`Has a long neck`],[`Bottlenose dolphin`,`Coastal ocean`,`Fish and squid`,`Breathes through a blowhole`],[`Tree frog`,`Forests and wetlands`,`Insects`,`Can rest on leaves and branches`],[`Desert tortoise`,`Desert`,`Grasses and wildflowers`,`Shelters in burrows`]].map(e=>v(n.fields,Object.fromEntries(n.fields.map((t,n)=>[t.id,e[n]])))),{app:`ListSplatTM`,version:1,createdAt:t,updatedAt:t,metadata:{title:e,author:``,className:``},schema:{tables:[n],relationships:[]},layouts:[{id:_(`layout`),name:`Table View`,tableId:n.id,mode:`table`,locked:!1},{id:_(`layout`),name:`Record Form`,tableId:n.id,mode:`form`,locked:!1},{id:_(`layout`),name:`Research Cards`,tableId:n.id,mode:`cards`,locked:!1}],teacher:{studentView:!1,notes:[`Ask students to add source notes before printing a report.`],rubric:[]}}}function Te(e,t,n=`text`){let r=Se(t.trim()||`New Field`,n);return{...e,fields:[...e.fields,r],records:e.records.map(e=>({...e,updatedAt:new Date().toISOString(),values:{...e.values,[r.id]:xe[n]}}))}}function Ee(e,t){return e.records.reduce((e,n)=>{let r=Number(n.values[t]);return Number.isFinite(r)?Math.max(e,r):e},0)+1}function De(e){let t={};return e.fields.filter(e=>e.type===`autoNumber`||e.primaryKey&&e.type===`number`).forEach(n=>{t[n.id]=Ee(e,n.id)}),t}function Oe(e){return{...e,records:[...e.records,v(e.fields,De(e))]}}function ke(e,t,n){let r=e==null?``:String(e);if(r.trim()===``)return{value:xe[t],lost:!1};switch(t){case`number`:case`currency`:case`percent`:case`rating`:{let e=Number(r.replace(/[$,%\s]/g,``));return Number.isFinite(e)?{value:t===`rating`?Math.max(0,Math.min(5,Math.round(e))):e,lost:!1}:{value:xe[t],lost:!0}}case`checkbox`:{let e=r.trim().toLowerCase();return[`true`,`yes`,`1`,`y`,`checked`].includes(e)?{value:!0,lost:!1}:[`false`,`no`,`0`,`n`].includes(e)?{value:!1,lost:!1}:{value:!1,lost:!0}}case`choice`:{let e=n?.find(e=>e.toLowerCase()===r.trim().toLowerCase());return e?{value:e,lost:!1}:{value:``,lost:!!(n&&n.length)}}case`date`:{let e=new Date(r);return Number.isNaN(e.getTime())?{value:``,lost:!0}:{value:e.toISOString().slice(0,10),lost:!1}}case`text`:case`longText`:case`link`:return{value:r,lost:!1};default:return{value:r,lost:!1}}}function Ae(e,t,n,r){return{...e,records:e.records.map(e=>({...e,values:{...e.values,[t]:ke(e.values[t],n,r).value}}))}}function je(e,t,n){return{...e,fields:e.fields.map(e=>e.id===t?{...e,...n}:e)}}function Me(e,t){let n=e.records.find(e=>e.id===t);return n?{...e,records:[...e.records,v(e.fields,{...n.values,...Object.fromEntries(e.fields.filter(e=>e.primaryKey&&e.type===`text`).map(e=>[e.id,_(`key`)])),...De(e)})]}:e}function Ne(e,t){return e.records.length<=1?e:{...e,records:e.records.filter(e=>e.id!==t)}}function Pe(e,t,n,r){let i=new Date().toISOString();return{...e,records:e.records.map(a=>a.id===t?{...a,updatedAt:i,values:Object.fromEntries(e.fields.map(e=>e.id===n?[e.id,r]:e.type===`updatedAt`?[e.id,i]:[e.id,a.values[e.id]]))}:a)}}function y(e,t){return{...e,updatedAt:new Date().toISOString(),schema:{...e.schema,tables:e.schema.tables.map(e=>e.id===t.id?t:e)}}}function Fe(e,t){let n=Ce(t.trim()||`New Table`,[`Name`,`Notes`]);return{...e,updatedAt:new Date().toISOString(),schema:{...e.schema,tables:[...e.schema.tables,n]},layouts:[...e.layouts,{id:_(`layout`),name:`${n.name} Table`,tableId:n.id,mode:`table`,locked:!1},{id:_(`layout`),name:`${n.name} Form`,tableId:n.id,mode:`form`,locked:!1}]}}function Ie(e,t,n){let r=n.trim()||`Table`;return{...e,updatedAt:new Date().toISOString(),schema:{...e.schema,tables:e.schema.tables.map(e=>e.id===t?{...e,name:r}:e)}}}function Le(e,t){let n=e.schema.tables.find(e=>e.id===t);if(!n)return{project:e,newTableId:t};let r=new Map(n.fields.map(e=>[e.id,_(`field`)])),i=n.fields.map(e=>({...e,id:r.get(e.id)})),a=n.records.map(e=>({id:_(`record`),createdAt:e.createdAt,updatedAt:e.updatedAt,values:Object.fromEntries(Object.entries(e.values).map(([e,t])=>[r.get(e)??e,t]))})),o={id:_(`table`),name:`${n.name} copy`,fields:i,records:a},s=e.schema.tables.findIndex(e=>e.id===t),c=[...e.schema.tables];return c.splice(s+1,0,o),{project:{...e,updatedAt:new Date().toISOString(),schema:{...e.schema,tables:c},layouts:[...e.layouts,{id:_(`layout`),name:`${o.name} Table`,tableId:o.id,mode:`table`,locked:!1},{id:_(`layout`),name:`${o.name} Form`,tableId:o.id,mode:`form`,locked:!1}]},newTableId:o.id}}function Re(e,t,n){let r=[...e.schema.tables],i=r.findIndex(e=>e.id===t),a=i+n;return i<0||a<0||a>=r.length?e:([r[i],r[a]]=[r[a],r[i]],{...e,updatedAt:new Date().toISOString(),schema:{...e.schema,tables:r}})}function ze(e,t){return e.schema.tables.length<=1?e:{...e,updatedAt:new Date().toISOString(),schema:{...e.schema,tables:e.schema.tables.filter(e=>e.id!==t),relationships:e.schema.relationships.filter(e=>e.fromTableId!==t&&e.toTableId!==t)},layouts:e.layouts.filter(e=>e.tableId!==t),views:(e.views??[]).filter(e=>e.tableId!==t)}}function Be(e){let t=new Date().toISOString();return{...e,createdAt:t,updatedAt:t,metadata:{...e.metadata,title:`${e.metadata.title} (template)`},schema:{...e.schema,tables:e.schema.tables.map(e=>({...e,records:[v(e.fields)]}))},views:[]}}function Ve(e,t){return e.fields.filter(e=>![`autoNumber`,`createdAt`,`updatedAt`,`calculation`].includes(e.type)).map(e=>String(t.values[e.id]??``).trim().toLowerCase()).join(``)}function He(e){let t=new Set,n=[];return e.records.forEach(r=>{let i=Ve(e,r);t.has(i)?n.push(r.id):t.add(i)}),n}function Ue(e){let t=new Set(He(e));if(!t.size)return e;let n=e.records.filter(e=>!t.has(e.id));return{...e,records:n.length?n:[e.records[0]]}}function We(e){return e.fields.filter(t=>![`autoNumber`,`createdAt`,`updatedAt`,`calculation`].includes(t.type)&&e.records.every(e=>String(e.values[t.id]??``).trim()===``))}function Ge(e){return e.schema.relationships.filter(t=>{let n=e.schema.tables.find(e=>e.id===t.fromTableId),r=e.schema.tables.find(e=>e.id===t.toTableId),i=n?.fields.some(e=>e.id===t.fromFieldId),a=r?.fields.some(e=>e.id===t.toFieldId);return!i||!a})}function Ke(e){let t=new Set(Ge(e).map(e=>e.id));return{...e,updatedAt:new Date().toISOString(),schema:{...e.schema,relationships:e.schema.relationships.filter(e=>!t.has(e.id))}}}function qe(e){function t(e,t){if(!e)throw Error(`This ListSplat project has invalid ${t}. Your open work has not changed.`)}function n(e,n){return t(e&&typeof e==`object`&&!Array.isArray(e),n),e}function r(e){return Array.isArray(e)&&e.every(e=>typeof e==`string`)}function i(e,r){return t(Array.isArray(e),r),e.map(e=>n(e,r))}function a(e,n){let r=i(e,n),a=new Set;for(let e of r)t(typeof e.id==`string`&&e.id.trim()&&!a.has(e.id),`${n} identifiers`),a.add(e.id);return r}function o(e,n,r,i){for(let a of n)e[a]!==void 0&&t(typeof e[a]===r&&(r!==`number`||Number.isFinite(e[a])),i)}function s(e){let r=n(e,`record values`);t(Object.values(r).every(e=>e===null||typeof e==`string`||typeof e==`boolean`||typeof e==`number`&&Number.isFinite(e)),`record values`)}let c=n(e,`project structure`);t(c.app===`ListSplatTM`&&c.version===1,`project format or version`),t(typeof c.createdAt==`string`&&typeof c.updatedAt==`string`,`project dates`);let l=n(c.metadata,`project metadata`);t([`title`,`author`,`className`].every(e=>typeof l[e]==`string`),`project metadata`);let u=n(c.schema,`table schema`),d=a(u.tables,`tables`);t(d.length>0,`tables`);for(let e of d){t(typeof e.name==`string`,`table names`);for(let n of a(e.fields,`fields`))t(typeof n.name==`string`&&typeof n.type==`string`&&Object.hasOwn(xe,n.type),`field names or types`),o(n,[`description`,`formula`,`defaultValue`,`customPattern`,`customMessage`],`string`,`field settings`),o(n,[`required`,`hidden`,`unique`,`primaryKey`,`readonly`],`boolean`,`field settings`),o(n,[`min`,`max`,`maxLength`],`number`,`field limits`),n.options!==void 0&&t(r(n.options),`field options`),n.pattern!==void 0&&t([`none`,`email`,`url`,`phone`,`custom`].includes(String(n.pattern)),`field patterns`);for(let r of a(e.records,`records`)){if(t(typeof r.createdAt==`string`&&typeof r.updatedAt==`string`,`record dates`),s(r.values),o(r,[`archived`],`boolean`,`record settings`),r.comments!==void 0)for(let e of a(r.comments,`comments`))t([`author`,`text`,`at`].every(t=>typeof e[t]==`string`),`comments`),o(e,[`teacherOnly`],`boolean`,`comments`);if(r.history!==void 0)for(let e of i(r.history,`record history`))t(typeof e.at==`string`,`record history`),s(e.values);r.rubricScores!==void 0&&t(Object.values(n(r.rubricScores,`rubric scores`)).every(e=>typeof e==`number`&&Number.isFinite(e)),`rubric scores`)}}for(let e of a(u.relationships,`relationships`))t([`name`,`fromTableId`,`fromFieldId`,`toTableId`,`toFieldId`].every(t=>typeof e[t]==`string`),`relationships`),o(e,[`enforceKeys`],`boolean`,`relationships`),e.cardinality!==void 0&&t([`one-to-many`,`one-to-one`].includes(String(e.cardinality)),`relationship cardinality`);let f=[`table`,`form`,`cards`,`gallery`,`list`,`kanban`,`calendar`,`labels`,`report`];for(let e of a(c.layouts,`layouts`)){t(typeof e.name==`string`&&typeof e.tableId==`string`&&f.includes(String(e.mode)),`layouts`),o(e,[`locked`],`boolean`,`layouts`);for(let n of[`fieldOrder`,`hiddenFieldIds`])e[n]!==void 0&&t(r(e[n]),`layout fields`);e.columnWidths!==void 0&&t(Object.values(n(e.columnWidths,`column widths`)).every(e=>typeof e==`number`&&Number.isFinite(e)),`column widths`)}if(c.views!==void 0)for(let e of a(c.views,`saved views`)){t([`name`,`tableId`,`search`,`searchFieldId`].every(t=>typeof e[t]==`string`)&&f.includes(String(e.mode)),`saved views`);for(let n of i(e.sortKeys,`saved sorting`))t(typeof n.fieldId==`string`&&[`asc`,`desc`].includes(String(n.direction)),`saved sorting`);if(e.find!==null){let r=n(e.find,`saved search`);t([`all`,`any`].includes(String(r.match)),`saved search`);for(let e of i(r.rules,`saved search rules`))t(typeof e.fieldId==`string`&&typeof e.value==`string`&&[`contains`,`equals`,`startsWith`,`endsWith`,`greaterThan`,`lessThan`,`between`,`isEmpty`,`isNotEmpty`].includes(String(e.operator)),`saved search rules`),o(e,[`value2`],`string`,`saved search rules`)}}if(c.rubricCriteria!==void 0)for(let e of a(c.rubricCriteria,`rubric criteria`))t(typeof e.label==`string`&&typeof e.max==`number`&&Number.isFinite(e.max),`rubric criteria`);let ee=n(c.teacher,`teacher settings`);t(typeof ee.studentView==`boolean`&&r(ee.notes)&&r(ee.rubric),`teacher settings`)}function Je(e){let t=[],n=``,r=0,i=e.trim();for(let e=0;e<i.length;e++){let a=i[e];if(a===`\\`&&[`|`,`\\`].includes(i[e+1]))n+=i[++e];else if(a==="`"){let t=1;for(;i[e+t]==="`";)t++;r?r===t&&(r=0):r=t,n+="`".repeat(t),e+=t-1}else a===`|`&&!r?(t.push(n.trim()),n=``):n+=a}return t.push(n.trim()),t[0]===``&&i.startsWith(`|`)&&t.shift(),t.at(-1)===``&&i.endsWith(`|`)&&t.pop(),t}function Ye(e){let t=e.replace(/^\uFEFF/,``).replace(/\r\n?/g,`
`).split(`
`),n=[],r=e=>{let t=Je(e);return t.length>0&&t.every(e=>/^:?-{3,}:?$/.test(e))};for(let e=0;e<t.length-1;e++){if(!(t[e].includes(`|`)||t[e+1].includes(`|`))||!r(t[e+1]))continue;let i=Je(t[e]);if(!i.length||i.length!==Je(t[e+1]).length)continue;let a=[i];for(e+=2;e<t.length&&t[e].trim()&&t[e].includes(`|`)&&!(e+1<t.length&&r(t[e+1]));){let n=Je(t[e]);a.push(i.map((e,t)=>n[t]??``)),e++}n.push(a),e--}return n}function Xe(e,t){if(!t.length||!t[0].length)throw Error(`No Markdown table selected.`);let n=t[0].map((e,t)=>Se(e.trim()||`Field ${t+1}`));return{id:_(`table`),name:e.trim()||`Imported Markdown`,fields:n,records:t.slice(1).map(e=>v(n,Object.fromEntries(n.map((t,n)=>[t.id,e[n]??``]))))}}function Ze(e){let t=e.split(/\r?\n/,1)[0]??``,n=[`,`,`	`,`;`],r=`,`,i=-1;for(let e of n){let n=t.split(e).length-1;n>i&&(i=n,r=e)}return r}function Qe(e,t=Ze(e)){let n=[],r=``,i=[],a=!1;for(let o=0;o<e.length;o+=1){let s=e[o],c=e[o+1];a&&s===`"`&&c===`"`?(r+=`"`,o+=1):s===`"`?a=!a:!a&&s===t?(i.push(r),r=``):!a&&(s===`
`||s===`\r`)?(s===`\r`&&c===`
`&&(o+=1),i.push(r),i.some(e=>e.length>0)&&n.push(i),i=[],r=``):r+=s}return i.push(r),i.some(e=>e.length>0)&&n.push(i),n}function $e(e,t){let n=Qe(t),r=(n[0]?.map((e,t)=>e.trim()||`Field ${t+1}`)??[`Field 1`]).map(e=>Se(e)),i=n.slice(1).map(e=>v(r,Object.fromEntries(r.map((t,n)=>[t.id,e[n]??``]))));return{id:`table_${Date.now().toString(36)}`,name:e,fields:r,records:i.length>0?i:[v(r)]}}function et(e){let t=e==null?``:String(e);return/[",\n\r]/.test(t)?`"${t.replaceAll(`"`,`""`)}"`:t}function tt(e){return[e.fields.map(e=>et(e.name)).join(`,`),...e.records.map(t=>e.fields.map(e=>et(t.values[e.id])).join(`,`))].join(`
`)}var nt=`listsplat.autosave.v1`;function rt(e){de().setItem(nt,JSON.stringify(e))}function it(){try{let e=de().getItem(nt);if(!e)return null;let t=JSON.parse(e);return qe(t),t}catch{return null}}function at(e,t,n){let r=new Blob([t],{type:n}),i=URL.createObjectURL(r),a=document.createElement(`a`);a.href=i,a.download=e,a.click(),URL.revokeObjectURL(i)}function ot(e){return e==null?``:String(e).trim().toLowerCase()}function st(e,t,n,r,i){return{id:_(`relationship`),name:e.trim()||`New Relationship`,fromTableId:t,fromFieldId:n,toTableId:r,toFieldId:i}}function ct(e,t){return{...e,updatedAt:new Date().toISOString(),schema:{...e.schema,relationships:[...e.schema.relationships,t]}}}function lt(e,t,n,r){let i=ot(n.values[e.fromFieldId]);return!i||t.id!==e.fromTableId||r.id!==e.toTableId?[]:r.records.filter(t=>ot(t.values[e.toFieldId])===i)}function ut(e,t){let n=e.schema.tables.find(e=>e.id===t.fromTableId),r=e.schema.tables.find(e=>e.id===t.toTableId),i=n?.fields.find(e=>e.id===t.fromFieldId),a=r?.fields.find(e=>e.id===t.toFieldId);return`${n?.name??`Table`}:${i?.name??`Field`} -> ${r?.name??`Table`}:${a?.name??`Field`}`}function dt(e){return e==null?``:String(e).trim().toLowerCase()}var ft=[`text`,`number`,`autoNumber`];function pt(e){let t=[];for(let n of e.schema.tables){let e=n.fields.filter(e=>e.primaryKey);e.length>1&&t.push(`${n.name}: choose only one primary key.`);for(let r of e){ft.includes(r.type)||t.push(`${n.name}.${r.name}: primary keys must use text, number, or automatic number.`);let e=new Set;for(let i of n.records){let a=dt(i.values[r.id]);a?e.has(a)&&t.push(`${n.name}.${r.name}: duplicate primary key “${a}”.`):t.push(`${n.name}.${r.name}: primary keys cannot be empty (record ${i.id}).`),e.add(a)}}}let n=new Set;for(let r of e.schema.relationships.filter(e=>e.enforceKeys)){let i=e.schema.tables.find(e=>e.id===r.fromTableId),a=e.schema.tables.find(e=>e.id===r.toTableId),o=i?.fields.find(e=>e.id===r.fromFieldId),s=a?.fields.find(e=>e.id===r.toFieldId);if(!i||!a||!o||!s){t.push(`${r.name}: a linked table or field is missing.`);continue}o.primaryKey||t.push(`${r.name}: the parent field must be a primary key.`),i.id===a.id&&t.push(`${r.name}: choose two different tables.`),ft.includes(s.type)&&s.type!==`autoNumber`&&o.type===`text`==(s.type===`text`)||t.push(`${r.name}: key types must match; use text with text, or number with number/automatic number.`);let c=`${a.id}:${s.id}`;n.has(c)&&t.push(`${r.name}: this foreign key already has a parent.`),n.add(c);let l=new Set(i.records.map(e=>dt(e.values[o.id])).filter(Boolean)),u=new Set;for(let e of a.records){let n=dt(e.values[s.id]);n?(l.has(n)||t.push(`${r.name}: foreign key “${n}” has no parent record.`),(r.cardinality===`one-to-one`||s.primaryKey)&&u.has(n)&&t.push(`${r.name}: one-to-one keys cannot repeat “${n}”.`),u.add(n)):(s.required||s.primaryKey)&&t.push(`${r.name}: a parent record is required (record ${e.id}).`)}}return t}function mt(e,t){let n=new Set(pt(e));return pt(t).find(e=>!n.has(e))??``}function ht(e,t){return e.records.map(e=>Number(e.values[t])).filter(e=>Number.isFinite(e))}function gt(e){return e.fields.filter(e=>[`number`,`currency`,`percent`].includes(e.type)).map(t=>{let n=ht(e,t.id),r=n.reduce((e,t)=>e+t,0);return{fieldId:t.id,fieldName:t.name,count:n.length,sum:r,average:n.length?r/n.length:0,minimum:n.length?Math.min(...n):0,maximum:n.length?Math.max(...n):0}})}function _t(e){let t=[],n=``,r=!1,i=0;for(let a=0;a<e.length;a+=1){let o=e[a],s=e[a-1];o===`"`&&s!==`\\`?(r=!r,n+=o):(!r&&o===`(`&&(i+=1),!r&&o===`)`&&--i,o===`,`&&!r&&i===0?(t.push(n.trim()),n=``):n+=o)}return(n.trim()||e.endsWith(`,`))&&t.push(n.trim()),t}function vt(e){let t=e.trim();if(t.startsWith(`"`)&&t.endsWith(`"`))return t.slice(1,-1).replace(/\\"/g,`"`)}function yt(e,t,n){let r=n.trim().toLowerCase(),i=e.fields.find(e=>e.name.toLowerCase()===r);return i?String(t.values[i.id]??``):``}function b(e,t,n){let r=n.trim();return/^[A-Z_]+\(.*\)$/i.test(r)?Tt(r,e,t):vt(n)??yt(e,t,n)}function x(e,t,n){let r=Number(b(e,t,n));return Number.isFinite(r)?r:0}function bt(e,t){let n=t.trim().toLowerCase(),r=e.fields.find(e=>e.name.toLowerCase()===n);return r?ht(e,r.id):[]}function xt(e){return Number.isFinite(e)?String(Number(e.toFixed(8))):`Formula error: not a number`}function St(e){return e.toLowerCase().replace(/\b[a-z]/g,e=>e.toUpperCase())}function Ct(e,t,n,r){if(!e)return[];let i=r.trim().toLowerCase(),a=e.schema.relationships.find(e=>e.fromTableId===t.id&&e.name.toLowerCase()===i),o=a?e.schema.tables.find(e=>e.id===a.toTableId):void 0;return a&&o?lt(a,t,n,o):[]}function wt(e,t,n,r,i){if(!e)return``;let a=e.schema.relationships.find(e=>e.fromTableId===t.id&&e.name.toLowerCase()===r.trim().toLowerCase()),o=a?e.schema.tables.find(e=>e.id===a.toTableId):void 0,s=Ct(e,t,n,r)[0],c=o?.fields.find(e=>e.name.toLowerCase()===i.trim().toLowerCase());return s&&c?String(s.values[c.id]??``):``}function Tt(e,t,n,r){let i=e.trim();if(!i)return``;let a=i.match(/^([A-Z_]+)\((.*)\)$/i);if(!a)return`Formula error: use a function like FIELD(Name)`;let o=a[1].toUpperCase(),s=_t(a[2]),c=s[0]??``;if(o===`FIELD`)return yt(t,n,c);if(o===`JOIN`)return s.map(e=>b(t,n,e)).join(``);if(o===`UPPER`)return b(t,n,c).toUpperCase();if(o===`LOWER`)return b(t,n,c).toLowerCase();if(o===`TITLECASE`)return St(b(t,n,c));if(o===`TRIM`)return b(t,n,c).trim();if(o===`LENGTH`)return String(b(t,n,c).length);if(o===`CONTAINS`)return b(t,n,c).toLowerCase().includes(b(t,n,s[1]??``).toLowerCase())?`Yes`:`No`;if(o===`IF_EMPTY`)return b(t,n,c).trim()?b(t,n,c):b(t,n,s[1]??``);if(o===`LOOKUP`)return wt(r,t,n,vt(c)??c,vt(s[1]??``)??s[1]??``);if(o===`COUNT_RELATED`)return String(Ct(r,t,n,vt(c)??c).length);if(o===`ADD`)return xt(s.reduce((e,r)=>e+x(t,n,r),0));if(o===`SUBTRACT`)return xt(s.slice(1).reduce((e,r)=>e-x(t,n,r),x(t,n,c)));if(o===`MULTIPLY`)return xt(s.reduce((e,r)=>e*x(t,n,r),1));if(o===`DIVIDE`){let e=x(t,n,s[1]??``);return e===0?`Formula error: divide by zero`:xt(x(t,n,c)/e)}if(o===`ROUND`){let e=Math.max(0,Math.min(6,Math.round(x(t,n,s[1]??`"0"`))));return String(Number(x(t,n,c).toFixed(e)))}if([`SUM`,`AVERAGE`,`MIN`,`MAX`,`COUNT`].includes(o)){let e=bt(t,c);return o===`SUM`?xt(e.reduce((e,t)=>e+t,0)):o===`AVERAGE`?xt(e.length?e.reduce((e,t)=>e+t,0)/e.length:0):o===`MIN`?xt(e.length?Math.min(...e):0):o===`MAX`?xt(e.length?Math.max(...e):0):String(e.length)}if(o===`COUNT_UNIQUE`){let e=c.trim().toLowerCase(),n=t.fields.find(t=>t.name.toLowerCase()===e);if(!n)return`0`;let r=new Set(t.records.map(e=>String(e.values[n.id]??``).trim().toLowerCase()).filter(Boolean));return String(r.size)}if(o===`PERCENT`){let e=x(t,n,s[1]??``);return e===0?`0`:xt(x(t,n,c)/e*100)}if(o===`LEFT`)return b(t,n,c).slice(0,Math.max(0,x(t,n,s[1]??`"0"`)));if(o===`RIGHT`){let e=Math.max(0,x(t,n,s[1]??`"0"`)),r=b(t,n,c);return e===0?``:r.slice(-e)}if(o===`MID`){let e=Math.max(0,x(t,n,s[1]??`"1"`)-1),r=Math.max(0,x(t,n,s[2]??`"0"`));return b(t,n,c).slice(e,e+r)}if(o===`SUBSTITUTE`)return b(t,n,c).split(b(t,n,s[1]??``)).join(b(t,n,s[2]??``));let l=e=>{let r=b(t,n,e).trim().toLowerCase();return r!==``&&![`no`,`false`,`0`].includes(r)};if(o===`IS_EMPTY`)return b(t,n,c).trim()===``?`Yes`:`No`;if(o===`NOT`)return l(c)?`No`:`Yes`;if(o===`AND`)return s.every(l)?`Yes`:`No`;if(o===`OR`)return s.some(l)?`Yes`:`No`;if(o===`IF`)return l(c)?b(t,n,s[1]??``):b(t,n,s[2]??``);let u=e=>{let r=b(t,n,e).trim();if(!r)return null;let i=new Date(r.length<=10?`${r}T00:00:00`:r);return Number.isNaN(i.getTime())?null:i};if(o===`TODAY`)return new Date().toISOString().slice(0,10);if(o===`YEAR`||o===`MONTH`||o===`DAY`){let e=u(c);return e?String(o===`YEAR`?e.getFullYear():o===`MONTH`?e.getMonth()+1:e.getDate()):``}if(o===`DAYS_BETWEEN`||o===`YEARS_BETWEEN`){let e=u(c),t=s[1]?u(s[1]):new Date;if(!e||!t)return``;let n=Math.round((t.getTime()-e.getTime())/864e5);return String(o===`DAYS_BETWEEN`?n:Math.floor(n/365.25))}return`Formula error: ${o} is not supported`}function S(e){return e==null?``:String(e)}function Et(e,t){let n=t.query.trim();if(!n)return e.records;let r=n.toLowerCase();return e.records.filter(n=>(t.fieldId===`all`?e.fields.map(e=>e.id):[t.fieldId]).some(e=>S(n.values[e]).toLowerCase().includes(r)))}function Dt(e,t){let n=Number(e),r=Number(t);return e!==``&&t!==``&&!Number.isNaN(n)&&!Number.isNaN(r)?n-r:e.localeCompare(t,void 0,{numeric:!0,sensitivity:`base`})}function Ot(e,t){return t.length?[...e].sort((e,n)=>{for(let r of t){let t=S(e.values[r.fieldId]).trim(),i=S(n.values[r.fieldId]).trim();if(t===``&&i!==``)return 1;if(t!==``&&i===``)return-1;let a=Dt(t,i)*(r.direction===`asc`?1:-1);if(a!==0)return a}return 0}):e}function kt(e,t){let n=S(e.values[t.fieldId]),r=n.trim().toLowerCase(),i=t.value.trim().toLowerCase(),a=Number(n),o=Number(t.value),s=n.trim()!==``&&t.value.trim()!==``&&!Number.isNaN(a)&&!Number.isNaN(o);switch(t.operator){case`contains`:return r.includes(i);case`equals`:return s?a===o:r===i;case`startsWith`:return r.startsWith(i);case`endsWith`:return r.endsWith(i);case`greaterThan`:return s?a>o:r>i;case`lessThan`:return s?a<o:r<i;case`between`:{let e=Number(t.value),n=Number(t.value2);return!Number.isNaN(e)&&!Number.isNaN(n)&&!Number.isNaN(a)?a>=Math.min(e,n)&&a<=Math.max(e,n):r>=i&&r<=(t.value2??``).trim().toLowerCase()}case`isEmpty`:return n.trim()===``;case`isNotEmpty`:return n.trim()!==``;default:return!0}}function At(e,t){return!t||t.rules.length===0?e:e.filter(e=>t.match===`all`?t.rules.every(t=>kt(e,t)):t.rules.some(t=>kt(e,t)))}function jt(e,t){let n=new Map;return e.records.forEach(e=>{let r=S(e.values[t]).trim().toLowerCase();r&&n.set(r,(n.get(r)??0)+1)}),e.records.filter(e=>{let r=S(e.values[t]).trim().toLowerCase();return r?(n.get(r)??0)>1:!1})}function Mt(e,t){return e.records.filter(e=>!S(e.values[t]).trim())}function Nt(e,t){if(!t.find)return[];let n=t.caseSensitive?`g`:`gi`,r=t.find.replace(/[.*+?^${}()|[\]\\]/g,`\\$&`),i=t.wholeWord?`\\b${r}\\b`:r,a=new RegExp(i,n),o=new Set(t.recordIds??e.records.map(e=>e.id)),s=[];return e.records.forEach(e=>{o.has(e.id)&&t.fieldIds.forEach(n=>{let r=S(e.values[n]),i=r.replace(a,t.replacement);i!==r&&s.push({recordId:e.id,fieldId:n,before:r,after:i})})}),s}function Pt(e,t){if(!t.find)return{table:e,count:0};let n=t.caseSensitive?`g`:`gi`,r=t.find.replace(/[.*+?^${}()|[\]\\]/g,`\\$&`),i=t.wholeWord?`\\b${r}\\b`:r,a=new RegExp(i,n),o=new Set(t.recordIds??e.records.map(e=>e.id)),s=0,c=e.records.map(e=>{if(!o.has(e.id))return e;let n=!1,r={...e.values};return t.fieldIds.forEach(e=>{let i=S(r[e]),o=i.replace(a,()=>(s+=1,t.replacement));o!==i&&(n=!0,r[e]=o)}),n?{...e,updatedAt:new Date().toISOString(),values:r}:e});return{table:{...e,records:c},count:s}}var Ft={email:/^[^\s@]+@[^\s@]+\.[^\s@]+$/,url:/^(https?:\/\/)?[^\s.]+\.[^\s]{2,}$/,phone:/^[+()\d][\d\s().-]{5,}$/};function It(e){return e==null?``:String(e)}function Lt(e,t,n,r){let i=Rt(e,t,n,r);return i&&e.customMessage?e.customMessage:i}function Rt(e,t,n,r){let i=It(t).trim();if(i===``)return e.required||e.primaryKey?`This field is required.`:``;if(e.maxLength&&i.length>e.maxLength)return`Keep this ${e.maxLength} characters or fewer.`;if(e.type===`email`&&!Ft.email.test(i))return`Enter a valid email address.`;if(e.type===`phone`&&!Ft.phone.test(i))return`Enter a valid phone number.`;if([`number`,`currency`,`percent`,`rating`].includes(e.type)){let t=Number(i);if(Number.isNaN(t))return`Enter a number.`;if(e.min!=null&&t<e.min)return`Must be at least ${e.min}.`;if(e.max!=null&&t>e.max)return`Must be at most ${e.max}.`}if([`text`,`longText`,`link`].includes(e.type)&&e.pattern&&e.pattern!==`none`){if(e.pattern===`custom`){if(e.customPattern)try{if(!new RegExp(e.customPattern).test(i))return`Does not match the required format.`}catch{}}else if(!Ft[e.pattern].test(i))return`Enter a valid ${e.pattern}.`}return(e.unique||e.primaryKey)&&n&&n.records.some(t=>t.id!==r&&It(t.values[e.id]).trim().toLowerCase()===i.toLowerCase())?`This value is already used in another record.`:``}function zt(e){let t=[];return e.fields.forEach(n=>{[`calculation`,`autoNumber`,`createdAt`,`updatedAt`,`image`].includes(n.type)||e.records.forEach(r=>{let i=Lt(n,r.values[n.id],e,r.id);i&&t.push({record:r,field:n,message:i})})}),t}function C(e,t,n,r,i,a){let o=$e(t,i);return o.id=_(`template`),o.fields=o.fields.map(e=>{let t=o.records.map(t=>String(t.values[e.id]??``).trim()).filter(Boolean),n=t.length&&t.every(e=>/^-?\d+(\.\d+)?$/.test(e))?`number`:t.length&&t.every(e=>/^\d{4}-\d{2}-\d{2}$/.test(e))?`date`:`text`;return{...e,type:n}}),o.records=o.records.map(e=>({...e,values:Object.fromEntries(o.fields.map(t=>[t.id,t.type===`number`?Number(e.values[t.id]):e.values[t.id]]))})),{id:e,title:t,gradeBand:n,goal:r,table:o,reflectionQuestions:a}}var Bt=[C(`classroom-library`,`Classroom Library Catalog`,`Grades 3–8`,`Compare genres and build a reading recommendation. Fictional book data.`,`Title,Author,Genre,Pages,Who would enjoy it?
The Lantern Map,Classroom sample author,Adventure,96,Readers who enjoy puzzles
River of Paper Boats,Classroom sample author,Realistic fiction,108,Readers who enjoy friendship stories
The Quiet Inventor,Classroom sample author,Biography-style fiction,120,Readers who enjoy making things
A Garden on Mars,Classroom sample author,Science fiction,132,Readers who enjoy puzzles
The Missing Moonstone,Classroom sample author,Mystery,144,Readers who enjoy friendship stories
A Pocket of Poems,Classroom sample author,Poetry,156,Readers who enjoy making things
The Clockwork Kite,Classroom sample author,Adventure,168,Readers who enjoy puzzles
Under the Library Stairs,Classroom sample author,Fantasy,180,Readers who enjoy friendship stories
The Last Snow Seed,Classroom sample author,Fantasy,192,Readers who enjoy making things
The Bicycle Orchestra,Classroom sample author,Realistic fiction,204,Readers who enjoy puzzles
The Secret of Willow Pond,Classroom sample author,Mystery,216,Readers who enjoy friendship stories
Our Neighborhood Stars,Classroom sample author,Realistic fiction,228,Readers who enjoy making things`,[`Which genre appears most often?`,`Sort by pages. Which three books would suit a short reading challenge?`]),C(`science-observations`,`Science Observation Log`,`Grades 3–8`,`Track a simulated plant investigation and compare measurements.`,`Date,Plant,Location,Height cm,Observation
2026-10-01,Bean A,Window,8.0,Two new leaves
2026-10-02,Bean B,Shelf,8.6,Stem leaning toward light
2026-10-03,Bean A,Window,9.2,Soil feels dry
2026-10-04,Bean B,Shelf,9.8,New leaf unfolding
2026-10-05,Bean A,Window,10.4,Two new leaves
2026-10-06,Bean B,Shelf,11.0,Stem leaning toward light
2026-10-07,Bean A,Window,11.6,Soil feels dry
2026-10-08,Bean B,Shelf,12.2,New leaf unfolding
2026-10-09,Bean A,Window,12.8,Two new leaves
2026-10-10,Bean B,Shelf,13.4,Stem leaning toward light
2026-10-11,Bean A,Window,14.0,Soil feels dry
2026-10-12,Bean B,Shelf,14.6,New leaf unfolding`,[`Compare growth in the two locations. What else should you measure?`,`Which observations are measurements and which are descriptions?`]),C(`state-facts`,`State Facts Database`,`Grades 4–8`,`Practice state/capital comparisons; research and add source notes.`,`State,Capital,Region,Map question
Texas,Austin,South,Locate the capital on a map
New Mexico,Santa Fe,West,Locate the capital on a map
Arizona,Phoenix,West,Locate the capital on a map
California,Sacramento,West,Locate the capital on a map
Colorado,Denver,West,Locate the capital on a map
Oregon,Salem,West,Locate the capital on a map
Washington,Olympia,West,Locate the capital on a map
Florida,Tallahassee,South,Locate the capital on a map
Georgia,Atlanta,South,Locate the capital on a map
Virginia,Richmond,South,Locate the capital on a map
Ohio,Columbus,Midwest,Locate the capital on a map
New York,Albany,Northeast,Locate the capital on a map`,[`Which states share a region?`,`Add a source field and verify each capital using your class atlas.`]),C(`book-reviews`,`Book Review Collection`,`Grades 3–8`,`Compare fictional reader opinions and support recommendations.`,`Book,Reviewer,Rating,Evidence from reading,Would recommend?
The Lantern Map,Alex,3,The character solves a problem,Maybe
River of Paper Boats,Sam,4,The setting changes the story,Yes
The Quiet Inventor,Jordan,5,The ending connects to the beginning,Yes
A Garden on Mars,Avery,3,The character solves a problem,Yes
The Missing Moonstone,Riley,4,The setting changes the story,Maybe
A Pocket of Poems,Morgan,5,The ending connects to the beginning,Yes
The Clockwork Kite,Casey,3,The character solves a problem,Yes
Under the Library Stairs,Taylor,4,The setting changes the story,Yes
The Last Snow Seed,Drew,5,The ending connects to the beginning,Maybe
The Bicycle Orchestra,Quinn,3,The character solves a problem,Yes
The Secret of Willow Pond,Jamie,4,The setting changes the story,Yes
Our Neighborhood Stars,Sky,5,The ending connects to the beginning,Yes`,[`Which books have the highest ratings?`,`What stronger evidence could a reviewer add?`]),C(`vocabulary-bank`,`Vocabulary Word Bank`,`Grades 2–8`,`Search useful words across subjects and revise example sentences.`,`Word,Definition,Example sentence,Subject
evaporate,Change from liquid to gas,Water can evaporate in sunlight,Science
compare,Describe similarities and differences,Compare the two characters,Reading
predict,Suggest what may happen using evidence,Predict the next plant height,Science
infer,Use clues to reach a conclusion,Infer how the character feels,Reading
estimate,Find an approximate amount,Estimate the number of beans,Math
fraction,A number representing part of a whole,One half is a fraction,Math
habitat,The place where an organism lives,Describe the pond habitat,Science
evidence,Information supporting a claim,Find evidence in the text,Reading
community,A group with something in common,Our class is a community,Social studies
resource,Something people can use,Water is a resource,Social studies
pattern,A repeated or predictable arrangement,Find a pattern in the data,Math
revise,Make changes to improve something,Revise the explanation,Writing`,[`Which words can be used in more than one subject?`,`Write a new sentence that makes each word meaning clear.`]),C(`survey-results`,`Simple Survey Results`,`Grades 3–8`,`Analyze simulated class preferences using counts and charts.`,`Question,Answer,Group,Count,Notes
Preferred reading spot,Window seat,Group 1,5,Simulated anonymous survey
Preferred reading spot,Carpet,Group 1,7,Simulated anonymous survey
Preferred reading spot,Desk,Group 1,4,Simulated anonymous survey
Preferred reading spot,Library corner,Group 1,8,Simulated anonymous survey
Preferred reading spot,Window seat,Group 2,7,Simulated anonymous survey
Preferred reading spot,Carpet,Group 2,4,Simulated anonymous survey
Preferred reading spot,Desk,Group 2,8,Simulated anonymous survey
Preferred reading spot,Library corner,Group 2,5,Simulated anonymous survey
Preferred reading spot,Window seat,Group 3,4,Simulated anonymous survey
Preferred reading spot,Carpet,Group 3,8,Simulated anonymous survey
Preferred reading spot,Desk,Group 3,5,Simulated anonymous survey
Preferred reading spot,Library corner,Group 3,7,Simulated anonymous survey`,[`Which spot has the largest total across groups?`,`What is the difference between a count and an individual answer?`]),C(`museum-cards`,`Museum Exhibit Cards`,`Grades 4–8`,`Curate a fictional classroom exhibit and print visitor labels.`,`Item,Creator or source,Year,Category,Why it matters
Clay bowl,Classroom sample collection,2026,Art,Shows a way to reuse materials
Woven bookmark,Classroom sample collection,2026,Design,Tells a story about a place
Paper lantern,Classroom sample collection,2026,Community,Combines function and decoration
Seed collection,Classroom sample collection,2026,Art,Shows a way to reuse materials
Cardboard bridge,Classroom sample collection,2026,Design,Tells a story about a place
Family recipe card,Classroom sample collection,2026,Community,Combines function and decoration
Painted tile,Classroom sample collection,2026,Art,Shows a way to reuse materials
Model canoe,Classroom sample collection,2026,Design,Tells a story about a place
Class poem,Classroom sample collection,2026,Community,Combines function and decoration
Recycled sculpture,Classroom sample collection,2026,Art,Shows a way to reuse materials
Neighborhood map,Classroom sample collection,2026,Design,Tells a story about a place
Handmade drum,Classroom sample collection,2026,Community,Combines function and decoration`,[`How would you arrange these objects for visitors?`,`Which labels need stronger source information?`]),C(`weather-watch`,`Weather Watch`,`Grades 2–8`,`Graph simulated weather and compare daily patterns.`,`Date,Temperature C,Sky,Rain mm,Wind
2026-10-01,22,Clear,0,Calm
2026-10-02,23,Partly cloudy,0,Light
2026-10-03,21,Cloudy,0,Breezy
2026-10-04,19,Rain,8,Calm
2026-10-05,20,Clear,1,Light
2026-10-06,24,Partly cloudy,0,Breezy
2026-10-07,25,Cloudy,0,Calm
2026-10-08,22,Rain,3,Light
2026-10-09,18,Clear,12,Breezy
2026-10-10,20,Partly cloudy,0,Calm
2026-10-11,23,Cloudy,0,Light
2026-10-12,21,Rain,2,Breezy`,[`Compare temperature on wet and dry days.`,`Why should you label temperature and rainfall units?`]),C(`garden-planner`,`School Garden Planner`,`Grades 3–8`,`Plan a fictional garden using space and supply counts.`,`Bed,Plant,Seed packets,Area m2,Team,Status
Bed 1,Beans,1,2,Team 1,Planned
Bed 2,Lettuce,2,3,Team 2,Planted
Bed 3,Carrots,3,4,Team 3,Growing
Bed 4,Peas,1,5,Team 4,Planned
Bed 5,Sunflowers,2,2,Team 1,Planted
Bed 6,Radishes,3,3,Team 2,Growing
Bed 7,Beans,1,4,Team 3,Planned
Bed 8,Lettuce,2,5,Team 4,Planted
Bed 9,Carrots,3,2,Team 1,Growing
Bed 10,Peas,1,3,Team 2,Planned
Bed 11,Sunflowers,2,4,Team 3,Planted
Bed 12,Radishes,3,5,Team 4,Growing`,[`How much space does each team use?`,`What fields would help plan watering?`]),C(`class-budget`,`Class Project Budget`,`Grades 4–10`,`Calculate a pretend project budget and discuss spending choices.`,`Supply,Category,Quantity,Unit cost,Priority
Card stock,Art,4,2.5,Essential
Markers,Building,12,1.25,Helpful
Glue sticks,Display,6,3,Optional
Tape rolls,Art,3,4.5,Essential
Craft sticks,Building,8,0.75,Helpful
Paint sets,Display,2,6,Optional
String spools,Art,10,1.5,Essential
Display boards,Building,5,2,Helpful
Storage box,Display,1,12,Optional
Paper cups,Art,20,0.5,Essential
Brushes,Building,7,1.75,Helpful
Labels,Display,9,2.25,Optional`,[`Add a calculation field for quantity multiplied by unit cost.`,`Which choices fit a pretend budget of 150?`]),C(`reading-goals`,`Reading Goal Tracker`,`Grades 3–8`,`Practice planning and summaries with fictional reading groups.`,`Reader alias,Book,Pages read,Page goal,Check-in date,Strategy
Alex,The Lantern Map,30,80,2026-10-01,Read with a partner
Sam,River of Paper Boats,35,86,2026-10-02,Pause to summarize
Jordan,The Quiet Inventor,40,92,2026-10-03,Keep a word list
Avery,A Garden on Mars,45,98,2026-10-04,Read with a partner
Riley,The Missing Moonstone,50,104,2026-10-05,Pause to summarize
Morgan,A Pocket of Poems,55,110,2026-10-06,Keep a word list
Casey,The Clockwork Kite,60,116,2026-10-07,Read with a partner
Taylor,Under the Library Stairs,65,122,2026-10-08,Pause to summarize
Drew,The Last Snow Seed,70,128,2026-10-09,Keep a word list
Quinn,The Bicycle Orchestra,75,134,2026-10-10,Read with a partner
Jamie,The Secret of Willow Pond,80,140,2026-10-11,Pause to summarize
Sky,Our Neighborhood Stars,85,146,2026-10-12,Keep a word list`,[`Calculate pages remaining for each reader.`,`What would make a goal achievable and useful?`]),C(`classroom-jobs`,`Classroom Jobs Rotation`,`Grades 2–8`,`Organize a pretend job rotation without real student information.`,`Job,Team,Week,Estimated minutes,Status
Materials helper,Team 1,1,3,Ready
Library organizer,Team 2,1,4,In progress
Plant care,Team 3,1,5,Done
Line leader,Team 4,1,6,Ready
Technology helper,Team 1,2,7,In progress
Board cleaner,Team 2,2,3,Done
Recycling helper,Team 3,2,4,Ready
Art organizer,Team 4,2,5,In progress
Timekeeper,Team 1,3,6,Done
Door greeter,Team 2,3,7,Ready
Supply checker,Team 3,3,3,In progress
Class messenger,Team 4,3,4,Done`,[`Does each team have a fair amount of work?`,`How could you rotate jobs next week?`]),C(`makerspace-inventory`,`Makerspace Inventory`,`Grades 3–10`,`Sort a fictional supply inventory and flag low stock.`,`Item,Category,Quantity,Reorder level,Storage
Cardboard sheets,Building,24,6,Bin 1
LED packs,Electronics,12,6,Bin 2
Felt squares,Art,8,6,Bin 3
Wheel sets,Building,6,6,Bin 4
Copper tape rolls,Electronics,30,6,Bin 1
Fabric bundles,Art,4,6,Bin 2
Craft sticks,Building,16,6,Bin 3
Battery holders,Electronics,10,6,Bin 4
Glue bottles,Art,5,6,Bin 1
Dowels,Building,20,6,Bin 2
Small motors,Electronics,3,6,Bin 3
Rubber bands,Art,18,6,Bin 4`,[`Which supplies are below the reorder level?`,`What fields would help track checkouts?`])];Bt.push(Vt(`library-loans`,`Library Books & Loans`,`Library Books`,`Book ID,Title,Genre
1,The Lantern Map,Adventure
2,River of Paper Boats,Realistic fiction
3,The Quiet Inventor,Biography-style fiction
4,A Garden on Mars,Science fiction
5,The Missing Moonstone,Mystery
6,A Pocket of Poems,Poetry
7,The Clockwork Kite,Adventure
8,Under the Library Stairs,Fantasy
9,The Last Snow Seed,Fantasy
10,The Bicycle Orchestra,Realistic fiction
11,The Secret of Willow Pond,Mystery
12,Our Neighborhood Stars,Realistic fiction`,`Library Loans`,`Loan ID,Book ID,Reader alias,Due date
1,1,Alex,2026-11-01
2,1,Sam,2026-11-02
3,2,Jordan,2026-11-03
4,2,Avery,2026-11-04
5,3,Riley,2026-11-05
6,3,Morgan,2026-11-06
7,4,Casey,2026-11-07
8,4,Taylor,2026-11-08
9,5,Drew,2026-11-09
10,5,Quinn,2026-11-10
11,6,Jamie,2026-11-11
12,6,Sky,2026-11-12`,`Explore one-to-many book loans with fictional readers and connected ID fields.`,[`Why can one book have several loan records?`,`Open a loan and use the parent arrow to inspect its book.`])),Bt.push(Vt(`science-trials`,`Investigations & Trials`,`Investigations`,`Investigation ID,Question,Team
1,Which paper holds the most coins?,Team 1
2,Does a ramp angle change distance?,Team 2
3,Which material absorbs more water?,Team 3
4,How does light affect a bean plant?,Team 4
5,Which design keeps ice longer?,Team 1
6,How does surface affect a rolling ball?,Team 2
7,Which bridge shape supports more mass?,Team 3
8,Does water temperature affect mixing?,Team 4
9,Which soil drains fastest?,Team 1
10,How does string length affect a pendulum?,Team 2
11,Which container reduces evaporation?,Team 3
12,Which wing shape travels farthest?,Team 4`,`Trial Results`,`Trial ID,Investigation ID,Trial,Result,Unit
1,1,1,10,coins
2,1,2,12,coins
3,2,1,14,cm
4,2,2,16,cm
5,3,1,18,ml
6,3,2,20,ml
7,4,1,22,cm
8,4,2,24,cm
9,5,1,26,minutes
10,5,2,28,minutes
11,6,1,30,cm
12,6,2,32,cm`,`Use connected investigations and simulated trial results to discuss repeat measurements.`,[`Compare repeated trials of the same investigation.`,`Why should measurements with different units be compared separately?`]));function Vt(e,t,n,r,i,a,o,s){let c=C(e,n,`Grades 3–10`,o,r,s),l=C(`${e}-children`,i,c.gradeBand,o,a,s).table;return c.table.fields[0]={...c.table.fields[0],primaryKey:!0,required:!0,unique:!0},l.fields[0]={...l.fields[0],primaryKey:!0,required:!0,unique:!0},{...c,title:t,relatedTables:[l],relationships:[{id:_(`relationship`),name:`${n} to ${i}`,fromTableId:c.table.id,fromFieldId:c.table.fields[0].id,toTableId:l.id,toFieldId:l.fields[1].id,enforceKeys:!0,cardinality:`one-to-many`}]}}function Ht(e){let t=e.fields.map(e=>({...e,id:_(`field`)}));return{...e,id:_(`table`),fields:t,records:e.records.map(n=>v(t,Object.fromEntries(e.fields.map((e,r)=>[t[r].id,n.values[e.id]??``]))))}}function Ut(e){let t=[e.table,...e.relatedTables??[]],n=t.map(Ht),r=(e,r)=>{let i=t.findIndex(t=>t.id===e);return{tableId:n[i].id,fieldId:n[i].fields[t[i].fields.findIndex(e=>e.id===r)].id}};return{tables:n,relationships:(e.relationships??[]).map(e=>{let t=r(e.fromTableId,e.fromFieldId),n=r(e.toTableId,e.toFieldId);return{...e,id:_(`relationship`),fromTableId:t.tableId,fromFieldId:t.fieldId,toTableId:n.tableId,toFieldId:n.fieldId}})}}var Wt=`drawsplat.language`,Gt=[{code:`en`,label:`English`,dir:`ltr`,htmlLang:`en`},{code:`es`,label:`Español`,dir:`ltr`,htmlLang:`es`},{code:`vi`,label:`Tiếng Việt`,dir:`ltr`,htmlLang:`vi`},{code:`ar`,label:`العربية`,dir:`rtl`,htmlLang:`ar`},{code:`zh`,label:`中文`,dir:`ltr`,htmlLang:`zh`},{code:`uh`,label:`हिन्दी / اردو`,dir:`ltr`,htmlLang:`hi`}],Kt={es:{New:`Nuevo`,"Save JSON":`Guardar JSON`,"Open JSON":`Abrir JSON`,"Export CSV":`Exportar CSV`,File:`Archivo`,Edit:`Editar`,Data:`Datos`,Layout:`Diseño`,Tools:`Herramientas`,View:`Vista`,Teacher:`Docente`,Help:`Ayuda`,Title:`Título`,Search:`Buscar`,In:`En`,"All fields":`Todos los campos`,Sort:`Ordenar`,"Choose field":`Elegir campo`,"New field":`Campo nuevo`,"Field name":`Nombre del campo`,Type:`Tipo`,"Add field":`Agregar campo`,"Add record":`Agregar registro`,Table:`Tabla`,Form:`Formulario`,Cards:`Tarjetas`,Gallery:`Galería`,Labels:`Etiquetas`,Report:`Informe`,"Upload image":`Subir imagen`,"No image yet":`Sin imagen todavía`},vi:{New:`Mới`,"Save JSON":`Lưu JSON`,"Open JSON":`Mở JSON`,"Export CSV":`Xuất CSV`,File:`Tệp`,Edit:`Sửa`,Data:`Dữ liệu`,Layout:`Bố cục`,Tools:`Công cụ`,View:`Xem`,Teacher:`Giáo viên`,Help:`Trợ giúp`,Title:`Tiêu đề`,Search:`Tìm`,Sort:`Sắp xếp`,Table:`Bảng`,Form:`Biểu mẫu`,Cards:`Thẻ`,Gallery:`Thư viện ảnh`,Labels:`Nhãn`,Report:`Báo cáo`},ar:{New:`جديد`,"Save JSON":`حفظ JSON`,"Open JSON":`فتح JSON`,"Export CSV":`تصدير CSV`,File:`ملف`,Edit:`تحرير`,Data:`بيانات`,Layout:`تخطيط`,Tools:`أدوات`,View:`عرض`,Teacher:`المعلم`,Help:`مساعدة`,Title:`العنوان`,Search:`بحث`,Sort:`فرز`,Table:`جدول`,Form:`نموذج`,Cards:`بطاقات`,Gallery:`معرض`,Labels:`ملصقات`,Report:`تقرير`},zh:{New:`新建`,"Save JSON":`保存 JSON`,"Open JSON":`打开 JSON`,"Export CSV":`导出 CSV`,File:`文件`,Edit:`编辑`,Data:`数据`,Layout:`布局`,Tools:`工具`,View:`视图`,Teacher:`教师`,Help:`帮助`,Title:`标题`,Search:`搜索`,Sort:`排序`,Table:`表格`,Form:`表单`,Cards:`卡片`,Gallery:`图库`,Labels:`标签`,Report:`报告`},uh:{New:`नया`,File:`फ़ाइल`,Edit:`संपादन`,Data:`डेटा`,Layout:`लेआउट`,Tools:`औज़ार`,View:`दृश्य`,Teacher:`शिक्षक`,Help:`सहायता`,Search:`खोज`,Table:`तालिका`,Form:`फ़ॉर्म`,Cards:`कार्ड`,Gallery:`गैलरी`,Labels:`लेबल`,Report:`रिपोर्ट`}},qt=document.querySelector(`#app`);if(!qt)throw Error(`ListSplatTM app root was not found.`);var w=qt,T=null,E=it()??we(),D=E.schema.tables[0].id,Jt=new Set,O=E.schema.tables[0].records[0]?.id??``,k=`table`,Yt=`Ready`;function Xt(e){if(t()){T?.changed(),Yt=T?.dirty?`Unsaved changes — use Save`:`Desktop workspace ready`;let e=w.querySelector(`[data-save-status]`);e&&(e.textContent=Yt);return}try{rt(e),Yt=`Saved locally`}catch{Yt=`Not saved — use File > Save .listsplat.json`}let n=w.querySelector(`[data-save-status]`);n&&(n.textContent=Yt)}var A=``,j=`all`,M=[],N=null,Zt={match:`all`,rules:[]},Qt=[],$t=``,en=[],P=new Set,F=null,tn=!1,nn=``,rn=``,an=``,on=``,sn=!1,cn=null,ln=`bar`,un=``,dn=`count`,fn=``,pn=null,mn=null,hn=null,I=[],gn=``,_n=`add`,L=new Set,R=`none`,vn=``,z=`Tip: Start with one table, then add relationships when your project needs them.`,yn=[],bn=[],xn=``,Sn=null,B=[],V=``,Cn=D,wn=E.schema.tables[1]?.id??D,H=null,Tn=``,En=`CSV`,Dn=``,On=`Imported Markdown`,kn=``,An=Mn();function U(e){return String(e??``).replaceAll(`&`,`&amp;`).replaceAll(`<`,`&lt;`).replaceAll(`>`,`&gt;`).replaceAll(`"`,`&quot;`).replaceAll(`'`,`&#39;`)}function jn(e){let t=(e||``).toLowerCase();return t.startsWith(`es`)?`es`:t.startsWith(`vi`)?`vi`:t.startsWith(`ar`)?`ar`:t.startsWith(`zh`)?`zh`:t===`uh`||t.startsWith(`ur`)||t.startsWith(`hi`)?`uh`:`en`}function Mn(){let e=new URLSearchParams(window.location.search);try{return jn(e.get(`lang`)||localStorage.getItem(Wt)||navigator.language)}catch{return jn(e.get(`lang`)||navigator.language)}}function Nn(e){return Gt.map(({code:t,label:n})=>`<option value="${t}"${t===e?` selected`:``}>${n}</option>`).join(``)}function W(e){return An===`en`?e:Kt[An][e]??e}function Pn(){let e=Gt.find(e=>e.code===An)??Gt[0];document.documentElement.lang=e.htmlLang,document.documentElement.dir=e.dir}function G(){return E.schema.tables.find(e=>e.id===D)??E.schema.tables[0]}function K(e){let t=Et(e,{query:A,fieldId:j});return t=t.filter(e=>tn?e.archived:!e.archived),t=At(t,N),L.size>0&&(t=t.filter(e=>L.has(e.id))),Ot(t,M.filter(t=>e.fields.some(e=>e.id===t.fieldId)))}function Fn(e){return e.records.filter(e=>e.archived).length}function In(){return!!A||!!(N&&N.rules.length)||L.size>0}function q(){A=``,N=null,L=new Set}function Ln(e){e.records.some(e=>e.id===O)||(O=e.records[0]?.id??``)}function J(e){let t=mt(E,e);t?(z=`Change blocked: ${t}`,V=t,$()):(E=e,Ln(G()),Xt(E),$())}function Y(e){yn=[{label:e,project:structuredClone(E)},...yn].slice(0,25),bn=[]}function Rn(e,t){let n=`${e}:${t}`;xn!==n&&(Y(`edit ${G().fields.find(e=>e.id===t)?.name??`cell`}`),xn=n,zn())}function zn(){let e=w.querySelector(`[data-action="undo-change"]`),t=w.querySelector(`[data-action="redo-change"]`);e&&(e.disabled=yn.length===0),t&&(t.disabled=bn.length===0)}function Bn(e){E=e,D=E.schema.tables.some(e=>e.id===D)?D:E.schema.tables[0].id,Ln(G()),Xt(E),$()}function Vn(){let e=yn[0];e?(bn=[{label:e.label,project:structuredClone(E)},...bn].slice(0,25),yn=yn.slice(1),z=`Undid ${e.label}.`,Bn(e.project)):(z=`Nothing to undo yet.`,$())}function Hn(){let e=bn[0];e?(yn=[{label:e.label,project:structuredClone(E)},...yn].slice(0,25),bn=bn.slice(1),z=`Redid ${e.label}.`,Bn(e.project)):(z=`Nothing to redo.`,$())}function X(e){D=e.id,J(y(E,e))}function Un(e,t){let n=G();Y(t),X({...n,records:n.records.map(t=>t.id===O?e(t):t)})}function Wn(){let e=[];w.querySelectorAll(`.rubric-def-row`).forEach(t=>{let n=t.dataset.critId??_(`crit`),r=t.querySelector(`[data-crit-label]`)?.value.trim()??``,i=Number(t.querySelector(`[data-crit-max]`)?.value)||4;r&&e.push({id:n,label:r,max:i})}),en=e}function Gn(){document.querySelectorAll(`.menu[open], .file-submenu[open]`).forEach(e=>{e.open=!1})}function Kn(e){J({...E,updatedAt:new Date().toISOString(),metadata:{...E.metadata,title:e||`Untitled Database`}})}async function qn(e=E){T&&e===E?await T.save():at(`${e.metadata.title||`listsplat-project`}.listsplat.json`,JSON.stringify(e,null,2),`application/json`)}function Jn(){at(`${G().name}.csv`,tt(G()),`text/csv;charset=utf-8`)}function Yn(){let e=G(),t=e.fields.filter(e=>!e.hidden),n=K(e),r=t.map(e=>et(e.name)).join(`,`),i=n.map(n=>t.map(t=>et(Z(e,n,t.id))).join(`,`)).join(`
`);at(`${e.name}-found.csv`,`${r}\n${i}`,`text/csv;charset=utf-8`),z=`Exported ${n.length} shown record${n.length===1?``:`s`} to CSV.`,$()}async function Xn(e){let t=await crypto.subtle.digest(`SHA-256`,new TextEncoder().encode(e));return Array.from(new Uint8Array(t)).map(e=>e.toString(16).padStart(2,`0`)).join(``)}async function Zn(){let e=G(),t=e.fields.filter(e=>!e.hidden&&e.type!==`image`),n=e.fields.find(e=>e.type===`image`&&!e.hidden),r=K(e),i=window.prompt(`Optional password to view (leave blank for none). This is a convenience gate, not encryption.`)??``,a=i?await Xn(i):``,o=r.map(r=>{let i=n?xr(Z(e,r,n.id)):``;return`<article class="card">${i?`<img src="${U(i)}" alt="">`:``}<h3>${U(wr(e,r))}</h3>${t.map(t=>`<p><strong>${U(t.name)}:</strong> ${U(String(pr(t,Z(e,r,t.id))))}</p>`).join(``)}</article>`}).join(``),s=`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${U(E.metadata.title)} — ${U(e.name)}</title>
<style>body{margin:0;font-family:system-ui,sans-serif;color:#1f2937;background:#f4f1ff}header{background:linear-gradient(110deg,#6d28d9,#a855f7);color:#fff;padding:20px 24px}main{max-width:1000px;margin:0 auto;padding:20px;display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:14px}.card{background:#fff;border:1px solid #e5e0ff;border-radius:12px;padding:14px;box-shadow:0 8px 18px rgba(31,41,55,.06)}.card img{width:100%;border-radius:8px;margin-bottom:8px}.card h3{margin:0 0 8px;color:#5b21b6}.card p{margin:2px 0;font-size:.9rem}#gate{position:fixed;inset:0;display:none;place-items:center;background:#0b1d33;color:#fff}body.locked #gate{display:grid}body.locked main,body.locked header{filter:blur(6px)}</style></head>
<body data-hash="${a}"><div id="gate"><div style="text-align:center"><p>This page is password protected.</p><input id="pw" type="password" placeholder="Password"> <button id="go">View</button></div></div>
<header><h1>${U(E.metadata.title)}</h1><p>${U(e.name)} · ${r.length} record${r.length===1?``:`s`} · read-only</p></header>
<main>${o}</main>
<script>const HASH=document.body.dataset.hash;async function sha(s){const b=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s));return Array.from(new Uint8Array(b)).map(x=>x.toString(16).padStart(2,'0')).join('')}if(HASH){document.body.classList.add('locked');document.getElementById('go').onclick=async()=>{if(await sha(document.getElementById('pw').value)===HASH)document.body.classList.remove('locked')};document.getElementById('pw').addEventListener('keydown',e=>{if(e.key==='Enter')document.getElementById('go').click()})}<\/script>
</body></html>`;at(`${e.name}-shared.html`,s,`text/html;charset=utf-8`),z=`Exported a read-only page with ${r.length} record${r.length===1?``:`s`}${a?` (password protected)`:``}.`,$()}function Qn(){let e=G(),t=e.fields.filter(e=>!e.hidden),n=K(e),r=e=>String(e??``).replace(/\|/g,`\\|`).replace(/\n/g,` `),i=`| ${t.map(e=>r(e.name)).join(` | `)} |`,a=`| ${t.map(()=>`---`).join(` | `)} |`,o=n.map(n=>`| ${t.map(t=>r(Z(e,n,t.id))).join(` | `)} |`).join(`
`);at(`${e.name}.md`,`# ${e.name}\n\n${i}\n${a}\n${o}\n`,`text/markdown;charset=utf-8`),z=`Exported a Markdown table.`,$()}function $n(){let e=G(),t=K(e),n=`<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><title>${U(E.metadata.title)}</title>
<style>body{font-family:system-ui,sans-serif;margin:32px;color:#1f2937}table{border-collapse:collapse;width:100%}th,td{border:1px solid #ccc;padding:8px;text-align:left}h1{color:#5b21b6}</style></head>
<body><h1>${U(E.metadata.title)}</h1><p>${U(e.name)} report from ListSplatTM.</p>
<table><thead><tr>${e.fields.map(e=>`<th>${U(e.name)}</th>`).join(``)}</tr></thead>
<tbody>${t.map(t=>`<tr>${e.fields.map(n=>`<td>${U(Z(e,t,n.id))}</td>`).join(``)}</tr>`).join(``)}</tbody></table></body></html>`;at(`${E.metadata.title||`listsplat-report`}.html`,n,`text/html;charset=utf-8`)}function er(){let e=E.schema.tables.map(e=>{let t=yr(e),n=t.reduce((e,t)=>e+t.missing,0),r=t.reduce((e,t)=>e+t.duplicates,0);return`
        <section>
          <h2>${U(e.name)}</h2>
          <p>${e.records.length} records, ${e.fields.length} fields, ${n} missing values, ${r} duplicate values.</p>
          <table>
            <thead><tr><th>Field</th><th>Type</th><th>Required</th><th>Description</th><th>Missing</th><th>Duplicates</th></tr></thead>
            <tbody>${e.fields.map(e=>{let n=t.find(t=>t.field.id===e.id);return`<tr><td>${U(e.name)}</td><td>${U(e.type)}</td><td>${e.required?`Yes`:`No`}</td><td>${U(e.description)}</td><td>${n?.missing??0}</td><td>${n?.duplicates??0}</td></tr>`}).join(``)}</tbody>
          </table>
        </section>
      `}).join(``),t=E.schema.relationships.length?`<ul>${E.schema.relationships.map(e=>`<li>${U(e.name)}: ${U(ut(E,e))}</li>`).join(``)}</ul>`:`<p>No relationships have been created yet.</p>`,n=E.teacher.notes.length?`<ul>${E.teacher.notes.map(e=>`<li>${U(e)}</li>`).join(``)}</ul>`:`<p>No teacher notes yet.</p>`,r=`<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><title>${U(E.metadata.title)} Project Packet</title>
<style>body{font-family:system-ui,sans-serif;margin:32px;color:#1f2937;line-height:1.5}h1,h2{color:#5b21b6}section{margin:0 0 28px}table{border-collapse:collapse;width:100%;margin-top:10px}th,td{border:1px solid #d8ccff;padding:8px;text-align:left;vertical-align:top}th{background:#f3edff;color:#4c1d95}.meta{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px}.meta div{border:1px solid #d8ccff;border-radius:8px;padding:12px;background:#faf8ff}</style></head>
<body>
  <h1>${U(E.metadata.title||`ListSplat Project`)} Project Packet</h1>
  <div class="meta">
    <div><strong>Author</strong><br>${U(E.metadata.author||`Not set`)}</div>
    <div><strong>Class</strong><br>${U(E.metadata.className||`Not set`)}</div>
    <div><strong>Tables</strong><br>${E.schema.tables.length}</div>
    <div><strong>Relationships</strong><br>${E.schema.relationships.length}</div>
  </div>
  <section><h2>Teacher Notes</h2>${n}</section>
  <section><h2>Relationships</h2>${t}</section>
  ${e}
</body></html>`;at(`${E.metadata.title||`listsplat`}-project-packet.html`,r,`text/html;charset=utf-8`)}async function tr(e){try{if(await ve(e,`listsplat`)){z=`Opened the file in its matching SplatWorks app.`,$();return}await me(e,`listsplat`),/\.json$/i.test(e.name)?await nr(e):ir(e),ue()&&(z=be,$())}catch(e){window.alert(e instanceof Error?e.message:`Could not open that file.`)}}async function nr(e){let t=await T?.beginReplace();if(!T||t)try{let n=JSON.parse(await e.text());qe(n),t?.verify(),D=n.schema.tables[0].id,O=n.schema.tables[0].records[0]?.id??``,J(n),T?.acceptCurrent()}catch(e){window.alert(e instanceof Error?e.message:`Could not open this ListSplat file.`)}finally{t?.finish()}}function rr(e,t,n){H=e,Tn=t,En=n;let r=G();I=e.fields.map(t=>{let n=e.records.slice(0,12).map(e=>String(e.values[t.id]??``)),i=r.fields.find(e=>e.name.trim().toLowerCase()===t.name.trim().toLowerCase());return{header:t.name,action:i?`existing`:`new`,type:na(n),fieldId:i?.id??``}}),gn=``,_n=`add`,R=`csvImport`,z=`Previewing ${e.records.length} ${n} records from ${t}.`,$()}function ir(e){e.text().then(t=>rr($e(e.name.replace(/\.csv$/i,``),t),e.name,`CSV`))}function ar(){let e=Ye(Dn);return e.length?e.map((e,t)=>`<option value="${t}">Table ${t+1}: ${U(e[0].join(` · `))} (${e.length-1} rows)</option>`).join(``):`<option value="">No tables found — include a header and --- separator row</option>`}function or(){let e=w.querySelector(`[data-markdown-table]`);e&&(e.innerHTML=ar());let t=w.querySelector(`[data-action="preview-markdown"]`);t&&(t.disabled=!Ye(Dn).length)}function sr(e){if(!H){R=`none`;return}ra();let t=H;if(Y(`CSV import`),e===`new`){let e=I.filter(e=>e.action!==`skip`).map((e,n)=>{let r=t.fields[I.indexOf(e)];return{field:Se(e.header||`Field ${n+1}`,e.type),sourceFieldId:r.id}}),n=t.records.map(t=>v(e.map(e=>e.field),Object.fromEntries(e.map(e=>[e.field.id,ke(t.values[e.sourceFieldId],e.field.type).value])))),r={id:_(`table`),name:t.name,fields:e.map(e=>e.field),records:n.length?n:[v(e.map(e=>e.field))]};D=r.id,O=r.records[0]?.id??``,H=null,q(),M=[],P=new Set,R=`none`,z=`Imported ${r.records.length} records from ${Tn}.`,J({...E,updatedAt:new Date().toISOString(),schema:{...E.schema,tables:[...E.schema.tables,r]},layouts:[...E.layouts,{id:_(`layout`),name:`${r.name} Table`,tableId:r.id,mode:`table`,locked:!1},{id:_(`layout`),name:`${r.name} Form`,tableId:r.id,mode:`form`,locked:!1}]});return}let n=G();I.forEach((e,t)=>{if(e.action===`new`){let r=Se(e.header||`Field ${t+1}`,e.type);n={...n,fields:[...n.fields,r]},e.fieldId=r.id}});let r=new Map(n.fields.map(e=>[e.id,e])),i=t.records.map(e=>v(n.fields,Object.fromEntries(I.filter(e=>e.action!==`skip`&&e.fieldId&&r.has(e.fieldId)).map((n,i)=>{let a=t.fields[I.indexOf(n)],o=r.get(n.fieldId);return[n.fieldId,ke(e.values[a.id],o.type,o.options).value]}))));H=null,R=`none`;let a=gn&&r.has(gn)?gn:``;if(a&&_n!==`add`){let e=e=>String(e.values[a]??``).trim().toLowerCase(),t=new Map(n.records.map(t=>[e(t),t.id])),r=[...n.records],o=0,s=0,c=0;i.forEach(n=>{let i=e(n),a=i?t.get(i):void 0;a&&_n===`skip`?c+=1:a&&_n===`update`?(r=r.map(e=>e.id===a?{...e,updatedAt:new Date().toISOString(),values:{...e.values,...n.values}}:e),s+=1):(r.push(n),i&&t.set(i,n.id),o+=1)}),z=`Import: ${o} added, ${s} updated, ${c} skipped.`,X({...n,records:r})}else z=`Appended ${i.length} CSV record${i.length===1?``:`s`} to ${n.name}.`,X({...n,records:[...n.records,...i]})}function cr(e){let t=Bt.find(t=>t.id===e);if(!t)return;let n=Ut(t),r=n.tables[0];Y(`template load`),D=r.id,O=r.records[0]?.id??``,z=`Loaded ${t.title}: ${n.tables.length} table(s), ${n.tables.reduce((e,t)=>e+t.records.length,0)} practice records. All people, books, observations, and measurements are fictional sample data.`,q(),M=[],P=new Set,k=`table`,J({...E,metadata:{...E.metadata,title:t.title},schema:{...E.schema,tables:[...E.schema.tables,...n.tables],relationships:[...E.schema.relationships,...n.relationships]},teacher:{...E.teacher,notes:t.reflectionQuestions}})}function lr(e){let t={key:`<circle cx="8" cy="8" r="5"/><path d="m12 12 9 9m-5-5 3-3m-6 0 3-3"/>`,table:`<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 10h18M9 10v10"/>`,form:`<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 8h6M9 12h6M9 16h3"/>`,cards:`<rect x="3" y="4" width="8" height="16" rx="2"/><rect x="14" y="4" width="7" height="16" rx="2"/>`,gallery:`<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8" cy="8" r="1"/><path d="m3 17 6-6 4 4 3-3 5 5"/>`,list:`<path d="M9 6h12M9 12h12M9 18h12M3 6h1M3 12h1M3 18h1"/>`,kanban:`<rect x="3" y="4" width="5" height="14" rx="1"/><rect x="10" y="4" width="5" height="10" rx="1"/><rect x="17" y="4" width="4" height="16" rx="1"/>`,calendar:`<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4M17 3v4M3 11h18M7 15h2M13 15h2"/>`,labels:`<path d="m3 3 9 0 9 9-9 9-9-9Z"/><circle cx="8" cy="8" r="1"/>`,report:`<path d="M5 3h10l4 4v14H5Z M14 3v5h5M9 17v-4M13 17v-7M16 17v-3"/>`,plus:`<path d="M12 5v14M5 12h14"/>`,save:`<path d="M5 3h12l4 4v14H3V3ZM7 3v6h10V3M7 21v-8h10v8"/>`,open:`<path d="M3 8V5h6l2 3h10l-3 12H3V8Z"/>`,export:`<path d="M12 3v12m-4-4 4 4 4-4M4 15v6h16v-6"/>`,search:`<circle cx="10" cy="10" r="6"/><path d="m15 15 6 6"/>`,sort:`<path d="M8 3v18m-4-4 4 4 4-4M14 5h7M14 10h5M14 15h3"/>`,check:`<path d="m5 12 4 4 10-10"/>`};return`<svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${t[e]??t.table}</svg>`}function ur(){w.querySelectorAll(`.modal`).forEach(e=>{e.insertAdjacentHTML(`afterbegin`,`<button type="button" class="dialog-close" data-action="close-dialog" aria-label="Close dialog" title="Close dialog">×</button>`)});let e={new:`plus`,"save-json":`save`,"open-json":`open`,"export-csv":`export`,"add-record":`plus`,"add-field":`plus`,find:`search`,"sort-dialog":`sort`,views:`cards`};w.querySelectorAll(`.quick-actions [data-action], .toolbar [data-action], [data-view-mode], .table-tab`).forEach(t=>{let n=t.dataset.viewMode??e[t.dataset.action??``]??(t.classList.contains(`table-tab`)?`table`:``);n&&t.insertAdjacentHTML(`afterbegin`,lr(n)),t.dataset.viewMode&&t.setAttribute(`aria-pressed`,String(t.classList.contains(`active`)))})}function dr(e,t){let n=([e,t])=>`<button type="button" data-action="${e}">${U(W(t))}</button>`;return`<details class="menu"><summary>${U(W(e))}</summary><div class="menu-panel">${t.map(e=>Array.isArray(e)?n(e):`<details class="file-submenu"><summary>${U(W(e.label))}</summary><div class="submenu-panel">${e.items.map(n).join(``)}</div></details>`).join(``)}</div></details>`}function fr(e=`text`){return[[`text`,`Short text`],[`longText`,`Long text`],[`number`,`Number`],[`currency`,`Currency`],[`percent`,`Percent`],[`date`,`Date`],[`time`,`Time`],[`dateTime`,`Date and time`],[`checkbox`,`Checkbox`],[`rating`,`Rating`],[`choice`,`Single choice`],[`multiSelect`,`Multiple choice`],[`email`,`Email`],[`phone`,`Phone`],[`link`,`Web address`],[`image`,`Image`],[`file`,`File attachment`],[`audio`,`Audio recording`],[`calculation`,`Calculation`],[`autoNumber`,`Auto number`],[`createdAt`,`Created time`],[`updatedAt`,`Updated time`]].map(([t,n])=>`<option value="${t}" ${e===t?`selected`:``}>${n}</option>`).join(``)}function Z(e,t,n){let r=e.fields.find(e=>e.id===n);return r?.type===`calculation`&&r.formula?Tt(r.formula,e,t,E):t.values[n]??``}function pr(e,t){if(t===``||t==null)return``;if(!e)return String(t);let n=typeof t==`number`?t:Number(t);return e.type===`currency`&&Number.isFinite(n)?n.toLocaleString(void 0,{style:`currency`,currency:`USD`}):e.type===`percent`&&Number.isFinite(n)?`${n.toLocaleString()}%`:e.type===`number`&&Number.isFinite(n)?n.toLocaleString():e.type===`checkbox`?t===!0||t===`true`?`Yes`:`No`:e.type===`file`?vi(String(t??``))?.name??``:e.type===`audio`?t?`Audio recording`:``:String(t)}function mr(){return E.layouts.find(e=>e.tableId===D&&e.mode===k)}function hr(e){return!!e}function Q(e){let t=new Set(mr()?.hiddenFieldIds??[]);return gr(e).filter(e=>!t.has(e.id))}function gr(e){let t=mr()?.fieldOrder??e.fields.map(e=>e.id),n=new Map(e.fields.map(e=>[e.id,e]));return[...t.map(e=>n.get(e)).filter(hr),...e.fields.filter(e=>!t.includes(e.id))].filter(e=>e&&!e.hidden)}function _r(e){return e.fields.filter(e=>e.type===`calculation`)}function vr(e){return _r(e).reduce((t,n)=>n.formula?t+e.records.filter(t=>String(Tt(n.formula??``,e,t,E)).startsWith(`Formula error:`)).length:t,0)}function yr(e){return e.fields.filter(e=>!e.hidden&&![`image`,`autoNumber`,`createdAt`,`updatedAt`,`calculation`].includes(e.type)).map(t=>({field:t,missing:Mt(e,t.id).length,duplicates:jt(e,t.id).length}))}function br(e){return Q(e).filter(e=>e.type===`image`)}function xr(e){let t=String(e??``);return/^(data:|https?:|blob:)/i.test(t)?t:``}function Sr(e,t){let n=br(e)[0];return n?xr(Z(e,t,n.id)):``}function Cr(e){let t=mr();t&&J({...E,updatedAt:new Date().toISOString(),layouts:E.layouts.map(n=>n.id===t.id?{...n,...e}:n)})}function wr(e,t){let n=e.fields.find(e=>!e.hidden)??e.fields[0],r=n?Z(e,t,n.id):``;return String(r||`Untitled record`)}function Tr(e,t){let n=E.schema.relationships.some(n=>n.enforceKeys&&n.toTableId===e.id&&n.toFieldId===t.id);return`${t.primaryKey?`<span class="key-badge primary-key" title="Primary key: unique, required identifier">${lr(`key`)} PK</span>`:``}${n?`<span class="key-badge foreign-key" title="Foreign key: links to a parent record">↗ FK</span>`:``}`}function Er(e,t){return E.schema.relationships.find(n=>n.enforceKeys&&n.toTableId===e&&n.toFieldId===t)}function Dr(e,t,n,r){let i=e.fields.find(e=>e.id===n),a=Z(e,t,n),o=`aria-label="${U(i?.name??`Field`)}, record ${r+1}" data-record-id="${t.id}" data-field-id="${n}"`,s=i&&![`checkbox`,`image`,`calculation`,`autoNumber`,`createdAt`,`updatedAt`].includes(i.type)?Lt(i,a,e,t.id):``,c=s?`cell-input cell-invalid`:`cell-input`,l=s?` title="${U(s)}"`:``,u=`${l}${i?.readonly?` readonly disabled`:``}${i?.maxLength?` maxlength="${i.maxLength}"`:``}`,d=Er(e.id,n);if(d){let e=E.schema.tables.find(e=>e.id===d.fromTableId),t=dt(a),n=e?.records.find(e=>dt(e.values[d.fromFieldId])===t),r=(e?.records??[]).filter(e=>dt(e.values[d.fromFieldId])).map(n=>{let r=n.values[d.fromFieldId],i=e?.fields.find(e=>e.id!==d.fromFieldId&&e.type===`text`),a=i?n.values[i.id]:``;return`<option value="${U(r)}" ${dt(r)===t?`selected`:``}>${U(a?`${a} · ${r}`:r)}</option>`}).join(``);return`<div class="foreign-key-cell"><select class="${c}" ${o}${i?.readonly?` disabled`:``}><option value="">Choose a parent…</option>${t&&!n?`<option selected value="${U(a)}">Missing parent: ${U(a)}</option>`:``}${r}</select>${n?`<button type="button" class="linked-record" data-action="open-related" data-rel-table="${e.id}" data-rel-record="${n.id}" title="Open linked record" aria-label="Open linked ${U(e.name)} record">↗</button>`:``}</div>`}if(i?.type===`checkbox`)return`<input class="cell-checkbox" type="checkbox" ${o} ${i.readonly?`disabled`:``} ${a===!0||a===`true`?`checked`:``}>`;if(i?.type===`multiSelect`){let e=i.options?.length?i.options:[`Yes`,`No`],r=new Set(String(a??``).split(`,`).map(e=>e.trim()).filter(Boolean));return`<div class="multi-cell${s?` cell-invalid`:``}" ${o}${s?` title="${U(s)}"`:``}>${e.map(e=>`<label class="multi-chip${r.has(e)?` on`:``}"><input type="checkbox" class="multi-option" data-record-id="${t.id}" data-field-id="${n}" data-multi-option="${U(e)}" ${r.has(e)?`checked`:``} ${i.readonly?`disabled`:``}>${U(e)}</label>`).join(``)}</div>`}if(i?.type===`time`)return`<input class="${c}" type="time" ${o}${u} value="${U(a)}">`;if(i?.type===`dateTime`)return`<input class="${c}" type="datetime-local" ${o}${u} value="${U(a)}">`;if(i?.type===`email`){let e=String(a??``);return`<div class="link-cell"><input class="${c}" type="email" ${o}${u} value="${U(e)}" placeholder="name@example.com">${e&&!s?`<a class="link-open" href="mailto:${U(e)}" title="Send email" aria-label="Send email">✉</a>`:``}</div>`}if(i?.type===`phone`)return`<input class="${c}" type="tel" ${o}${u} value="${U(a)}" placeholder="(555) 555-5555">`;if(i?.type===`link`){let e=String(a??``),t=/^https?:\/\//i.test(e)?e:e?`https://${e}`:``;return`<div class="link-cell"><input class="${c}" type="url" ${o}${u} value="${U(e)}" placeholder="https://…">${t?`<a class="link-open" href="${U(t)}" target="_blank" rel="noopener" title="Open link" aria-label="Open link">↗</a>`:``}</div>`}if(i?.type===`image`){let e=String(a??``),r=/^(data:|https?:|blob:)/i.test(e)?e:``;return`
      <div class="image-cell" tabindex="0" role="button" title="Click here and paste an image, or use Upload image." ${o}>
        ${r?`<img src="${U(r)}" alt="${U(i.description||i.name)}">`:`<span>${U(W(`No image yet`))}</span>`}
        <small>Paste, upload, or take a photo.</small>
        <div class="image-actions">
          <label class="image-upload-label">
            ${U(W(`Upload image`))}
            <input class="image-input" type="file" accept="image/*" ${o}>
          </label>
          <button type="button" class="button ghost" data-action="camera-capture" data-record-id="${t.id}" data-field-id="${n}">Take photo</button>
        </div>
      </div>
    `}if(i?.type===`file`){let e=vi(String(a??``));return`
      <div class="file-cell" ${o}>
        ${e?`<a class="file-link" href="${U(e.url)}" download="${U(e.name)}">📎 ${U(e.name)}</a>`:`<span>No file yet</span>`}
        <label class="image-upload-label">${e?`Replace`:`Add file`}<input class="file-input" type="file" data-record-id="${t.id}" data-field-id="${n}"></label>
      </div>
    `}if(i?.type===`audio`){let e=String(a??``),r=/^(data:|https?:|blob:)/i.test(e)?e:``;return`
      <div class="audio-cell" data-record-id="${t.id}" data-field-id="${n}">
        ${r?`<audio class="no-advance" src="${U(r)}" controls preload="metadata"></audio>`:`<span>No recording</span>`}
        <button type="button" class="button ghost" data-action="record-audio" data-record-id="${t.id}" data-field-id="${n}">${r?`Re-record`:`● Record`}</button>
      </div>
    `}if(i?.type===`rating`)return`<input class="${c}" type="number" min="0" max="5" step="1" ${o}${u} value="${U(a)}">`;if(i?.type===`choice`){let e=i.options?.length?i.options:[`Yes`,`No`];return`<select class="${c}" ${o}${l}${i.readonly?` disabled`:``}><option value=""${a===``?` selected`:``}>—</option>${e.map(e=>`<option value="${U(e)}" ${String(a)===e?`selected`:``}>${U(e)}</option>`).join(``)}</select>`}if(i?.type===`autoNumber`||i?.type===`createdAt`||i?.type===`updatedAt`)return`<output class="calc-output">${U(a)}</output>`;if(i?.type===`longText`)return`<textarea class="${c}" ${o}${u}>${U(a)}</textarea>`;if(i?.type===`date`)return`<input class="${c}" type="date" ${o}${u} value="${U(a)}">`;if(i?.type===`number`||i?.type===`currency`||i?.type===`percent`){let e=i.type===`currency`?`<span class="cell-affix">$</span>`:``,t=i.type===`percent`?`<span class="cell-affix">%</span>`:``;return`<span class="num-cell">${e}<input class="${c}" type="number" step="any" ${o}${u} value="${U(a)}">${t}</span>`}return i?.type===`calculation`?`<output class="calc-output">${U(a)}</output>`:`<input class="${c}" ${o}${u} value="${U(a)}">`}function Or(e){Jt.delete(e.id);let t=E.schema.tables.filter(e=>!Jt.has(e.id)),n=E.schema.tables.filter(e=>Jt.has(e.id));return`<div class="table-tabs" aria-label="Open tables">
    ${t.map(n=>`<div class="table-tab-item ${n.id===e.id?`active`:``}"><button type="button" class="table-tab ${n.id===e.id?`active`:``}" data-table-id="${n.id}">${U(n.name)}</button><button type="button" class="table-tab-close" data-close-table-id="${n.id}" aria-label="Close ${U(n.name)} tab" title="${t.length===1?`Keep at least one table open`:`Close tab; keep its data`}" ${t.length===1?`disabled`:``}>×</button></div>`).join(``)}
    ${n.length?`<select class="reopen-table" data-reopen-table aria-label="Reopen table"><option value="">Reopen table (${n.length})</option>${n.map(e=>`<option value="${e.id}">${U(e.name)}</option>`).join(``)}</select>`:``}
  </div>`}function kr(e,t){if(t.length===0){let e=In();return`
      <div class="data-grid-wrap">
        <div class="empty-state">
          <h3>${U(W(e?`No records match your find`:`No records yet`))}</h3>
          <p>${U(W(e?`Try a different search, or show all records.`:`Add your first record to start building this database.`))}</p>
          <button type="button" class="button primary" data-action="${e?`clear-find`:`add-record`}">${e?U(W(`Show all records`)):`+ ${U(W(`Add first record`))}`}</button>
        </div>
      </div>
    `}let n=Q(e),r=t.length>0&&t.every(e=>P.has(e.id)),i=e=>{let t=M.find(t=>t.fieldId===e);return t?t.direction===`asc`?`▲`:`▼`:`⇅`},a=Rr(e,t),o=n.length+3,s=(t,r)=>`
                <tr class="${t.id===O?`active-row`:``}${P.has(t.id)?` selected-row`:``}" data-record-row="${t.id}">
                  <td class="select-col"><input type="checkbox" data-select-row="${t.id}" aria-label="Select record ${r+1}" ${P.has(t.id)?`checked`:``}></td>
                  <td class="row-num-col"><button type="button" class="row-button" data-select-record="${t.id}">${r+1}</button></td>
                  ${n.map(n=>`<td style="${Ar(n.id)}">${Dr(e,t,n.id,r)}</td>`).join(``)}
                  <td class="record-actions">
                    <button type="button" title="Open record" data-action="expand-record" data-record-action-id="${t.id}">Open</button>
                    <button type="button" data-action="duplicate-record" data-record-action-id="${t.id}">Copy</button>
                    <button type="button" data-action="delete-record" data-record-action-id="${t.id}">Delete</button>
                  </td>
                </tr>
              `,c=0,l=a.map(t=>(nn?`<tr class="group-row"><td colspan="${o}"><strong>${U(t.label)}</strong> <span>${t.records.length}${zr(e,t.records)?` · `+zr(e,t.records):``}</span></td></tr>`:``)+t.records.map(e=>s(e,c++)).join(``)).join(``);return`
    <div class="data-grid-wrap${sn?` wrap-cells`:``}">
      <table class="data-grid">
        <thead>
          <tr>
            <th class="select-col"><input type="checkbox" data-select-all aria-label="Select all records" ${r?`checked`:``}></th>
            <th class="row-num-col">#</th>
            ${n.map(t=>`
                  <th class="col-head" data-col-field="${t.id}" draggable="true" style="${Ar(t.id)}">
                    <button type="button" class="field-button" data-field-settings="${t.id}">
                      ${Tr(e,t)} ${U(t.name)}${t.required?`<span class="req" title="Required field" aria-label="required">*</span>`:``}<br><small>${U(t.type)}</small>
                    </button>
                    <button type="button" class="col-sort" data-action="sort-toggle" data-sort-toggle="${t.id}" title="Sort by ${U(t.name)}">${i(t.id)}</button>
                    <span class="col-resize" data-col-resize="${t.id}" title="Drag to resize" aria-hidden="true"></span>
                  </th>
                `).join(``)}
            <th>Record</th>
          </tr>
        </thead>
        <tbody>
          ${l}
        </tbody>
      </table>
    </div>
  `}function Ar(e){let t=mr()?.columnWidths?.[e];return t?`width:${t}px;min-width:${t}px;`:``}function jr(){return E.metadata.author.trim()||`You`}function Mr(e){let t=E.teacher.studentView,n=(e.comments??[]).filter(e=>!e.teacherOnly||!t),r=E.rubricCriteria??[],i=e.rubricScores??{},a=r.reduce((e,t)=>e+(Number(i[t.id])||0),0),o=r.reduce((e,t)=>e+t.max,0),s=e.history??[];return`
    <section class="record-extras">
      ${r.length?`<div class="record-block">
              <h3>Rubric ${t?``:`<button type="button" class="button ghost" data-action="edit-rubric">Edit</button>`}</h3>
              <div class="rubric-grid">
                ${r.map(e=>`<label class="rubric-row"><span>${U(e.label)}</span><input type="number" min="0" max="${e.max}" data-rubric-criterion="${e.id}" value="${i[e.id]==null?``:U(String(i[e.id]))}"> / ${e.max}</label>`).join(``)}
              </div>
              <p class="rubric-total"><strong>Total: ${a} / ${o}</strong></p>
            </div>`:t?``:`<div class="record-block"><h3>Rubric</h3><button type="button" class="button" data-action="edit-rubric">Set up a rubric</button></div>`}
      <div class="record-block">
        <h3>Comments</h3>
        <div class="comment-list">
          ${n.length?n.map(e=>`
                      <div class="comment${e.teacherOnly?` teacher`:``}">
                        <div class="comment-head"><strong>${U(e.author)}</strong>${e.teacherOnly?`<span class="badge">teacher only</span>`:``}<time>${U(new Date(e.at).toLocaleString())}</time></div>
                        <p>${U(e.text)}</p>
                        ${t&&e.author!==jr()?``:`<button type="button" class="link-btn" data-action="delete-comment" data-comment-id="${e.id}">Delete</button>`}
                      </div>
                    `).join(``):`<p class="muted">No comments yet.</p>`}
        </div>
        <div class="comment-add">
          <textarea data-comment-text rows="2" placeholder="Add a comment or feedback…"></textarea>
          <div class="comment-add-row">
            ${t?``:`<label class="inline-check"><input type="checkbox" data-comment-teacher> Teacher only</label>`}
            <button type="button" class="button" data-action="add-comment">Add comment</button>
          </div>
        </div>
      </div>
      ${t?``:`<div class="record-block">
              <h3>Version history <button type="button" class="button ghost" data-action="save-version">Save version</button></h3>
              ${s.length?`<ul class="version-list">${s.slice().reverse().map((e,t)=>`<li><time>${U(new Date(e.at).toLocaleString())}</time> <button type="button" class="link-btn" data-action="restore-version" data-version-index="${s.length-1-t}">Restore</button></li>`).join(``)}</ul>`:`<p class="muted">Save a version to keep a snapshot you can restore.</p>`}
            </div>`}
    </section>
  `}function Nr(e){let t=e.records.find(e=>e.id===O)??e.records[0];if(!t)return`<div class="empty-panel">Add a record to use form view.</div>`;let n=E.schema.relationships.filter(t=>t.fromTableId===e.id).map(n=>{let r=E.schema.tables.find(e=>e.id===n.toTableId),i=r?lt(n,e,t,r):[];return`
        <section class="related-records">
          <h3>${U(n.name)}</h3>
          <p>${i.length} related record${i.length===1?``:`s`} from ${U(r?.name??`another table`)}</p>
          ${i.length?`<div class="related-grid">${i.slice(0,8).map(e=>`
                      <article class="related-card" data-action="open-related" data-rel-record="${e.id}" data-rel-table="${r.id}">
                        <strong>${U(wr(r,e))}</strong>
                        ${r.fields.filter(e=>!e.hidden).slice(0,3).map(t=>`<span>${U(t.name)}: ${U(Z(r,e,t.id))}</span>`).join(``)}
                      </article>
                    `).join(``)}</div>`:`<p>No matches yet. Make sure the match fields use the same value.</p>`}
          <button type="button" class="button" data-action="add-related" data-rel-id="${n.id}">+ Add ${U(r?.name??`related`)} record</button>
        </section>
      `}).join(``);return`
    <div class="form-view">
      <div class="form-nav">
        ${e.records.map((e,n)=>`<button type="button" class="${e.id===t.id?`active`:``}" data-select-record="${e.id}">Record ${n+1}</button>`).join(``)}
      </div>
      <div class="record-form">
        ${Q(e).map((n,r)=>`
              <label>
                <span>${Tr(e,n)} ${U(n.name)}</span>
                ${Dr(e,t,n.id,r)}
                ${n.description?`<small>${U(n.description)}</small>`:``}
              </label>
            `).join(``)}
        ${n}
        ${Mr(t)}
      </div>
    </div>
  `}function Pr(e,t){let n=(t,n)=>{let r=Z(e,n,t.id);if(t.type===`image`){let e=xr(r);return`
        <figure class="card-image-field">
          ${e?`<img src="${U(e)}" alt="">`:`<span>No image yet</span>`}
          <figcaption>${U(t.name)}</figcaption>
        </figure>
      `}if(t.type===`link`&&String(r??``)){let e=String(r),n=/^https?:\/\//i.test(e)?e:`https://${e}`;return`<p><strong>${U(t.name)}</strong><a href="${U(n)}" target="_blank" rel="noopener">${U(e)}</a></p>`}return`<p><strong>${U(t.name)}</strong><span>${U(pr(t,r))}</span></p>`};return`
    <div class="cards-view ${k===`gallery`?`gallery-view`:``}">
      ${t.map(t=>{let r=Sr(e,t);return`
            <article class="record-card" data-select-record="${t.id}">
              ${k===`gallery`?`<div class="gallery-image">${r?`<img src="${U(r)}" alt="">`:`<span>Add an image field, then upload a picture.</span>`}</div>`:``}
              ${Q(e).filter(e=>k!==`gallery`||e.type!==`image`).slice(0,k===`gallery`?4:8).map(e=>n(e,t)).join(``)}
            </article>
          `}).join(``)}
    </div>
  `}function Fr(e,t){return`
    <div class="labels-view">
      ${t.map(t=>`
            <article class="print-label">
              ${Q(e).slice(0,4).map(n=>`<p><strong>${U(n.name)}:</strong> ${U(pr(n,Z(e,t,n.id)))}</p>`).join(``)}
            </article>
          `).join(``)}
    </div>
  `}function Ir(e,t){let n=gt(e);return`
    <div class="report-view">
      <header>
        <h2>${U(E.metadata.title)}</h2>
        <p>${U(e.name)} report. ${t.length} record${t.length===1?``:`s`} shown.</p>
      </header>
      ${kr(e,t)}
      ${n.length?`<section class="summary-strip">${n.map(e=>`<div><strong>${U(e.fieldName)}</strong><span>Sum ${e.sum.toLocaleString()} | Avg ${e.average.toFixed(2)}</span></div>`).join(``)}</section>`:`<p class="empty-panel">Add a number, currency, or percent field to see summaries.</p>`}
    </div>
  `}function Lr(e,t,n){let r=new Set;return t.forEach(t=>{let i=String(Z(e,t,n)??``).trim();i&&r.add(i)}),[...r]}function Rr(e,t){if(!nn||!e.fields.some(e=>e.id===nn))return[{key:``,label:``,records:t}];let n=new Map;return t.forEach(t=>{let r=String(Z(e,t,nn)??``).trim();n.has(r)||n.set(r,[]),n.get(r).push(t)}),[...n.entries()].sort((e,t)=>e[0].localeCompare(t[0],void 0,{numeric:!0})).map(([e,t])=>({key:e,label:e||`(empty)`,records:t}))}function zr(e,t){return e.fields.filter(e=>[`number`,`currency`,`percent`].includes(e.type)&&!e.hidden).slice(0,3).map(n=>{let r=t.map(t=>Number(Z(e,t,n.id))).filter(e=>Number.isFinite(e));if(!r.length)return``;let i=r.reduce((e,t)=>e+t,0);return`${U(n.name)}: sum ${i.toLocaleString()}, avg ${(i/r.length).toFixed(1)}`}).filter(Boolean).join(` · `)}function Br(e,t){return e.map(e=>`<option value="${e.id}" ${t===e.id?`selected`:``}>${U(e.name)}${e.primaryKey?` (PK)`:``}</option>`).join(``)}function Vr(e){let t=[];if(k===`list`||k===`table`){let n=e.fields.filter(e=>!e.hidden&&![`image`,`longText`].includes(e.type));t.push(`<label>Group by <select data-group-field><option value="">No grouping</option>${Br(n,nn)}</select></label>`),t.push(`<label class="inline-check"><input type="checkbox" data-wrap-toggle ${sn?`checked`:``}> Wrap long text</label>`)}if(k===`kanban`){let n=e.fields.filter(e=>[`choice`,`text`].includes(e.type)&&!e.hidden);t.push(`<label>Columns by <select data-board-field><option value="">Choose a status or choice field</option>${Br(n,rn)}</select></label>`)}if(k===`calendar`){let n=e.fields.filter(e=>[`date`,`dateTime`,`createdAt`,`updatedAt`].includes(e.type)&&!e.hidden);t.push(`<label>Dates from <select data-calendar-field><option value="">Choose a date field</option>${Br(n,an)}</select></label>`)}return t.length?`<div class="view-controls">${t.join(``)}</div>`:``}function Hr(e,t){let n=Q(e),r=n[0],i=n.find(e=>e.id!==r?.id&&![`image`].includes(e.type)),a=Rr(e,t).map(t=>`
        ${nn?`<div class="group-head"><strong>${U(t.label)}</strong><span>${t.records.length}${zr(e,t.records)?` · `+zr(e,t.records):``}</span></div>`:``}
        ${t.records.map(t=>{let n=Sr(e,t);return`
              <div class="list-row${t.id===O?` active`:``}">
                ${n?`<img class="list-thumb" src="${U(n)}" alt="">`:``}
                <div class="list-main">
                  <strong>${U(Z(e,t,r?.id??``)||`Untitled`)}</strong>
                  ${i?`<span>${U(pr(i,Z(e,t,i.id)))}</span>`:``}
                </div>
                <button type="button" class="button ghost" data-action="expand-record" data-record-action-id="${t.id}">Open</button>
              </div>
            `}).join(``)}
      `).join(``);return`<div class="list-view${sn?` wrap-cells`:``}">${a||`<p class="empty-panel">No records to list.</p>`}</div>`}function Ur(e,t){let n=e.fields.find(e=>e.id===rn);return n?`<div class="kanban">${[``,...(n.options&&n.options.length?n.options:Lr(e,t,n.id)).filter(Boolean)].map(r=>{let i=t.filter(t=>String(Z(e,t,n.id)??``).trim()===r);return`
        <div class="kanban-col" data-kanban-col="${U(r)}">
          <div class="kanban-col-head"><strong>${U(r||`Unassigned`)}</strong><span>${i.length}</span></div>
          <div class="kanban-cards">
            ${i.map(t=>`
                  <div class="kanban-card" draggable="true" data-kanban-card="${t.id}" data-action="expand-record" data-record-action-id="${t.id}">
                    <strong>${U(wr(e,t))}</strong>
                  </div>
                `).join(``)}
          </div>
        </div>
      `}).join(``)}</div>`:`<p class="empty-panel">Choose a status or choice field above to build a board with draggable cards.</p>`}function Wr(e,t){let n=e.fields.find(e=>e.id===an)??e.fields.find(e=>[`date`,`dateTime`,`createdAt`,`updatedAt`].includes(e.type)&&!e.hidden);if(!n)return`<p class="empty-panel">Add a date field, then choose it above to see records on a calendar.</p>`;let r=on?new Date(`${on}-01T00:00:00`):new Date,i=r.getFullYear(),a=r.getMonth(),o=`${i}-${String(a+1).padStart(2,`0`)}`,s=new Date(i,a,1),c=s.getDay(),l=new Date(i,a+1,0).getDate(),u=new Map;t.forEach(t=>{let r=String(Z(e,t,n.id)??``).slice(0,10);/^\d{4}-\d{2}-\d{2}$/.test(r)&&r.startsWith(o)&&(u.has(r)||u.set(r,[]),u.get(r).push(t))});let d=[];for(let e=0;e<c;e+=1)d.push(`<div class="cal-cell empty"></div>`);for(let t=1;t<=l;t+=1){let n=`${o}-${String(t).padStart(2,`0`)}`,r=u.get(n)??[];d.push(`
      <div class="cal-cell">
        <div class="cal-day">${t}</div>
        ${r.slice(0,4).map(t=>`<button type="button" class="cal-event" data-action="expand-record" data-record-action-id="${t.id}">${U(wr(e,t))}</button>`).join(``)}
        ${r.length>4?`<span class="cal-more">+${r.length-4} more</span>`:``}
      </div>
    `)}return`
    <div class="calendar-view">
      <div class="cal-nav">
        <button type="button" class="button" data-action="cal-prev">‹</button>
        <strong>${U(s.toLocaleDateString(void 0,{month:`long`,year:`numeric`}))}</strong>
        <button type="button" class="button" data-action="cal-next">›</button>
        <button type="button" class="button ghost" data-action="cal-today">Today</button>
      </div>
      <div class="cal-grid">
        ${[`Sun`,`Mon`,`Tue`,`Wed`,`Thu`,`Fri`,`Sat`].map(e=>`<div class="cal-weekday">${e}</div>`).join(``)}
        ${d.join(``)}
      </div>
    </div>
  `}function Gr(e){let t=on?new Date(`${on}-01T00:00:00`):new Date;t.setMonth(t.getMonth()+e),on=`${t.getFullYear()}-${String(t.getMonth()+1).padStart(2,`0`)}`}function Kr(e){let t=K(e),n={table:`Table: spreadsheet-like rows and columns for fast data entry.`,form:`Form: focus on one record at a time.`,cards:`Cards: compact text-first record cards for browsing.`,gallery:`Gallery: image-first cards for collections and exhibits.`,list:`List: compact rows grouped by a field.`,kanban:`Board: columns by status or category, drag cards to change them.`,calendar:`Calendar: records placed on a month grid by a date field.`,labels:`Labels: printable small cards or shelf labels.`,report:`Report: printable table with title and summaries.`},r=k===`form`?Nr(e):k===`cards`||k===`gallery`?Pr(e,t):k===`list`?Hr(e,t):k===`kanban`?Ur(e,t):k===`calendar`?Wr(e,t):k===`labels`?Fr(e,t):k===`report`?Ir(e,t):kr(e,t);return`
    <section class="database-panel" aria-label="Database table">
      ${Or(e)}
      <div class="view-tabs" role="group" aria-label="Layout modes">
        ${[`table`,`form`,`cards`,`gallery`,`list`,`kanban`,`calendar`,`labels`,`report`].map(e=>`<button type="button" class="${k===e?`active`:``}" data-view-mode="${e}" title="${U(n[e])}" aria-label="${U(n[e])}">${U(W(e===`kanban`?`Board`:e[0].toUpperCase()+e.slice(1)))}</button>`).join(``)}
      </div>
      ${Vr(e)}
      ${qr()}
      ${Jr(e)}
      ${r}
    </section>
  `}function qr(){let e=[];if(tn&&e.push(`<button type="button" class="chip chip-button" data-action="toggle-archived" title="Back to active records">Archived view — click to exit</button>`),A&&e.push(`<span class="chip">Search: “${U(A)}”</span>`),N&&N.rules.length){let t=N.match===`all`?` AND `:` OR `,n=N.rules.map(e=>`${Hi(e.fieldId)} ${Ui(e.operator)}${e.operator===`isEmpty`||e.operator===`isNotEmpty`?``:` `+e.value}${e.operator===`between`?`–`+(e.value2??``):``}`).join(t);e.push(`<button type="button" class="chip chip-button" data-action="find" title="Edit find">Find: ${U(n)}</button>`)}return L.size&&e.push(`<span class="chip">${L.size} highlighted</span>`),M.filter(e=>G().fields.some(t=>t.id===e.fieldId)).forEach(t=>{e.push(`<button type="button" class="chip chip-button" data-action="sort-dialog" title="Edit sort">Sort: ${U(Hi(t.fieldId))} ${t.direction===`asc`?`↑`:`↓`}</button>`)}),e.length?`<div class="filter-chips">${e.join(``)}${In()?`<button type="button" class="chip chip-clear" data-action="clear-find">Clear find</button>`:``}${M.length?`<button type="button" class="chip chip-clear" data-action="sort-dialog">Edit sort</button>`:``}</div>`:``}function Jr(e){let t=Qi(e).length;return t===0||k===`form`?``:`
    <div class="bulk-bar" role="group" aria-label="Bulk actions">
      <strong>${t} selected</strong>
      <button type="button" class="button" data-action="bulk-fill">Fill a field…</button>
      <button type="button" class="button" data-action="bulk-duplicate">Duplicate</button>
      ${tn?`<button type="button" class="button" data-action="bulk-restore">Restore</button>`:`<button type="button" class="button" data-action="bulk-archive">Archive</button>`}
      <button type="button" class="button danger" data-action="bulk-delete">Delete</button>
      <button type="button" class="button ghost" data-action="bulk-clear">Clear selection</button>
    </div>
  `}function Yr(e){let t=gt(e),n=e.records.find(e=>e.id===O)??e.records[0],r=n?E.schema.relationships.filter(t=>t.fromTableId===e.id).map(t=>{let r=E.schema.tables.find(e=>e.id===t.toTableId),i=r?lt(t,e,n,r).length:0;return`
            <div class="template-card">
              <strong>${U(t.name)}</strong>
              <span>${i} related record${i===1?``:`s`}</span>
              <p>${U(ut(E,t))}</p>
            </div>
          `}).join(``):``;return`
    <aside class="teacher-panel" aria-label="Teacher tools and database stats">
      <h2>${lr(`check`)} Database Check</h2>
      <div class="stat-grid">
        <div class="stat-card"><strong>${K(e).length}</strong> shown</div>
        <div class="stat-card"><strong>${e.records.length}</strong> records</div>
        <div class="stat-card"><strong>${e.fields.length}</strong> fields</div>
        <div class="stat-card"><strong>${E.schema.tables.length}</strong> tables</div>
      </div>
      ${t.map(e=>`
            <div class="template-card">
              <strong>${U(e.fieldName)} summary</strong>
              <span>Sum: ${e.sum.toLocaleString()}</span>
              <span>Average: ${e.average.toFixed(2)}</span>
            </div>
          `).join(``)}
      ${r?`<h3>Related Records</h3>${r}`:``}
      <button type="button" class="button relationship-launch" data-action="relationships">${lr(`key`)} Keys &amp; Relationships</button>
      ${pt(E).length?`<p class="relationship-error" role="status">${U(pt(E)[0])}</p>`:``}
      <details class="template-starters"><summary>Classroom Templates <span>${Bt.length} starters</span></summary><p class="template-note">12 records in every table. People, books, observations, and measurements are fictional practice data; verify facts before a research report.</p><div class="template-list">
      ${Bt.map(e=>`
            <div class="template-card">
              <strong>${U(e.title)}</strong>
              <span>${U(e.gradeBand)} · ${e.table.records.length} records${e.relatedTables?.length?` per table · ${1+e.relatedTables.length} linked tables`:``}</span>
              <p>${U(e.goal)}</p>
              <button type="button" data-template-id="${e.id}">Use template</button>
            </div>
          `).join(``)}
      </div></details>
    </aside>
  `}function Xr(e,t){if(e.id===t.id)return`<aside class="relationship-example"><h3>Example for ${U(e.name)}</h3><p>Add a second table, then choose it as the related table to see an example using your records.</p></aside>`;let n=E.schema.relationships.find(n=>n.fromTableId===e.id&&n.toTableId===t.id&&n.enforceKeys),r=e.fields.find(e=>e.id===n?.fromFieldId)??e.fields.find(e=>e.primaryKey),i=t.fields.find(e=>e.id===n?.toFieldId),a=r?.name??`ID`,o=i?.name??`${e.name} ID`,s=e.records.find(e=>r&&dt(e.values[r.id]))??e.records[0],c=r&&s?s.values[r.id]:1,l=n&&s?lt(n,e,s,t)[0]:t.records[0],u=(e,t,n)=>{let r=e.fields.find(e=>e.id!==n&&e.type===`text`);return t&&r?`${r.name}: ${String(t.values[r.id]??``)}`:`Example record`};return`<aside class="relationship-example" aria-label="Example using loaded tables">
    <h3>${n?`Your connection`:`Example using your tables`}</h3>
    <p>${n?`These fields already connect your records.`:`Use this structure if records in the related table belong to records in the parent table. The sample link below is an illustration, not a change to your data.`}</p>
    <div class="relationship-example-tables">
      <section><h4>${U(e.name)}</h4><p>${U(u(e,s,r?.id))}</p><div><span class="key-badge primary-key">${lr(`key`)} PK</span> ${U(a)} <strong>${U(c)}</strong></div></section>
      <span class="example-connector" aria-label="connects to">1 → ${n?.cardinality===`one-to-one`?`1`:`many`}</span>
      <section><h4>${U(t.name)}</h4><p>${U(u(t,l,i?.id))}${n&&!l?` — no linked records yet`:``}</p><div><span class="key-badge foreign-key">↗ FK</span> ${U(o)} <strong>${U(c)}</strong></div></section>
    </div>
    ${n?`<p>The same ID appears in both fields. Choose a parent in the ${U(t.name)} picker to store its ${U(a)}.</p>`:`<ol><li>${r?`Use <strong>${U(e.name)}.${U(a)}</strong> as the parent primary key.`:`Click <strong>Add an ID primary key to ${U(e.name)}</strong> below to give each record its own ID.`}</li><li>Add a <strong>${U(o)}</strong> ${r?.type===`text`?`text`:`number`} field in <strong>${U(t.name)}</strong>. Use an existing field only if it stores these parent IDs.</li><li>Choose those two fields below and create the relationship. In ${U(t.name)}, select the parent record by name; ListSplat stores its ID.</li></ol>`}
  </aside>`}function Zr(){let e=E.schema.tables,t=E.schema.relationships,n=t=>e.find(e=>e.id===t)?.name??`table`,r=(t,n)=>e.find(e=>e.id===t)?.fields.find(e=>e.id===n)?.name??`field`,i=new Set(t.flatMap(e=>[e.fromTableId,e.toTableId]));return`<div class="rel-diagram"><div class="rel-boxes">${e.map(e=>`
        <div class="rel-box${e.id===D?` active`:``}${i.has(e.id)?` linked`:``}">
          <strong>${U(e.name)}</strong>
          <div class="rel-fields">${e.fields.map(t=>`<div>${Tr(e,t)} ${U(t.name)} <small>${U(t.type)}</small></div>`).join(``)}</div>
          <span>${e.records.length} record${e.records.length===1?``:`s`} · ${e.fields.length} field${e.fields.length===1?``:`s`}</span>
        </div>
      `).join(``)}</div><div class="rel-links">${t.length?t.map(e=>`
            <div class="rel-link">
              <span class="rel-badge">${U(n(e.fromTableId))}</span>
              <span class="rel-arrow">${e.enforceKeys?`${lr(`key`)} PK `:``}${U(r(e.fromTableId,e.fromFieldId))} <b>${e.cardinality===`one-to-one`?`1 ─── 1`:`1 ─── ∞`}</b> ${e.enforceKeys?`↗ FK `:``}${U(r(e.toTableId,e.toFieldId))}</span>
              <span class="rel-badge">${U(n(e.toTableId))}</span>
            </div>
          `).join(``):`<p class="rel-empty">No links yet. Create one below to connect two tables.</p>`}</div></div>`}function Qr(e){let t=[[`Combine text`,`JOIN(A, " ", B)`],[`Add`,`ADD(A, B)`],[`Multiply`,`MULTIPLY(A, B)`],[`Percent`,`PERCENT(A, B)`],[`If / then`,`IF(CONTAINS(A, "x"), "yes", "no")`],[`Sum column`,`SUM(A)`],[`Average`,`AVERAGE(A)`],[`Count`,`COUNT(A)`],[`Years since`,`YEARS_BETWEEN(A)`],[`Uppercase`,`UPPER(A)`]],n=e.fields.filter(e=>![`calculation`].includes(e.type)).slice(0,12);return`
    <div class="formula-builder">
      <div class="fb-row"><span>Functions</span>${t.map(([e,t])=>`<button type="button" class="fb-chip" data-formula-insert="${U(t)}">${U(e)}</button>`).join(``)}</div>
      <div class="fb-row"><span>Insert field</span>${n.map(e=>`<button type="button" class="fb-chip field" data-formula-insert="${U(e.name)}">${U(e.name)}</button>`).join(``)}</div>
    </div>
  `}function $r(e,t){let n=[`number`,`currency`,`percent`,`rating`].includes(t),r=[`text`,`longText`,`link`].includes(t),i=[`text`,`longText`,`email`,`phone`,`link`].includes(t);return[`calculation`,`autoNumber`,`createdAt`,`updatedAt`,`image`].includes(t)?``:`
    <fieldset class="constraints">
      <legend>Rules and default</legend>
      <label class="check-row"><input type="checkbox" data-field-unique ${e.unique?`checked`:``}> No duplicate values (unique)</label>
      <label class="check-row"><input type="checkbox" data-field-readonly ${e.readonly?`checked`:``}> Read-only (students cannot change it)</label>
      ${n?`<div class="grid-two">
              <label>Minimum <input data-field-min type="number" step="any" value="${e.min==null?``:U(String(e.min))}"></label>
              <label>Maximum <input data-field-max type="number" step="any" value="${e.max==null?``:U(String(e.max))}"></label>
            </div>`:``}
      ${i?`<label>Character limit <input data-field-maxlength type="number" min="1" value="${e.maxLength==null?``:U(String(e.maxLength))}" placeholder="no limit"></label>`:``}
      ${r?`<label>Format <select data-field-pattern>${[`none`,`email`,`url`,`phone`,`custom`].map(t=>`<option value="${t}" ${(e.pattern??`none`)===t?`selected`:``}>${t}</option>`).join(``)}</select></label>
            <label>Custom pattern (advanced) <input data-field-custom-pattern value="${U(e.customPattern??``)}" placeholder="regular expression"></label>`:``}
      <label>Default value for new records <input data-field-default value="${U(e.defaultValue??``)}" placeholder="optional"></label>
      <label>Custom message when a value breaks a rule <input data-field-message value="${U(e.customMessage??``)}" placeholder="optional friendly message"></label>
    </fieldset>
  `}function ei(e,t,n){if(n===t.type||[`calculation`,`autoNumber`,`createdAt`,`updatedAt`,`image`].includes(n))return``;let r=(w.querySelector(`[data-field-options]`)?.value??t.options?.join(`, `)??``).split(`,`).map(e=>e.trim()).filter(Boolean),i=e.records.filter(e=>String(e.values[t.id]??``).trim()!==``).slice(0,4).map(e=>{let i=String(e.values[t.id]??``),a=ke(e.values[t.id],n,r),o=a.value===!0?`Yes`:a.value===!1?`No`:String(a.value??``);return`<li><span>${U(i)}</span> → <span class="${a.lost?`preview-lost`:``}">${a.lost?`cleared`:U(o||`(empty)`)}</span></li>`}),a=e.records.filter(e=>String(e.values[t.id]??``).trim()!==``&&ke(e.values[t.id],n,r).lost).length;return`
    <div class="type-preview">
      <strong>Change ${U(t.type)} → ${U(n)}</strong>
      ${i.length?`<ul>${i.join(``)}</ul>`:`<p>No values to convert yet.</p>`}
      ${a?`<p class="preview-warn">${a} value${a===1?``:`s`} cannot convert and will be cleared.</p>`:`<p>All values convert cleanly.</p>`}
    </div>
  `}function ti(e){let t=t=>e.fields.map(e=>`<option value="${e.id}" ${e.id===t?`selected`:``}>${U(e.name)}${e.primaryKey?` (PK)`:``}</option>`).join(``),n=Zt.rules.map((e,n)=>{let r=Vi.find(t=>t.value===e.operator)??Vi[0];return`
        <div class="find-rule" data-rule-index="${n}">
          <select data-find-field aria-label="Field">${t(e.fieldId)}</select>
          <select data-find-op aria-label="Condition">${Vi.map(t=>`<option value="${t.value}" ${t.value===e.operator?`selected`:``}>${U(t.label)}</option>`).join(``)}</select>
          <input data-find-value type="text" value="${U(e.value)}" placeholder="value" ${r.needsValue?``:`hidden`}>
          <input data-find-value2 type="text" value="${U(e.value2??``)}" placeholder="and" ${r.needsSecond?``:`hidden`}>
          <button type="button" class="button ghost" data-action="find-remove-rule">Remove</button>
        </div>
      `}).join(``);return`
    <div class="modal-backdrop">
      <section class="modal wide-modal" role="dialog" aria-modal="true" aria-label="Advanced find">
        <h2>Find records</h2>
        <label>Match <select data-find-match>
          <option value="all" ${Zt.match===`all`?`selected`:``}>all conditions (AND)</option>
          <option value="any" ${Zt.match===`any`?`selected`:``}>any condition (OR)</option>
        </select></label>
        <div class="find-rules">${n||`<p>Add a condition to start.</p>`}</div>
        <button type="button" class="button" data-action="find-add-rule">+ Add condition</button>
        <div class="modal-actions">
          <button type="button" class="button primary" data-action="apply-find">Apply find</button>
          <button type="button" data-action="clear-find">Show all</button>
          <button type="button" data-action="close-dialog">Cancel</button>
        </div>
      </section>
    </div>
  `}function ni(e){let t=t=>e.fields.map(e=>`<option value="${e.id}" ${e.id===t?`selected`:``}>${U(e.name)}${e.primaryKey?` (PK)`:``}</option>`).join(``);return`
    <div class="modal-backdrop">
      <section class="modal" role="dialog" aria-modal="true" aria-label="Sort records">
        <h2>Sort records</h2>
        <div class="sort-levels">${Qt.map((e,n)=>`
        <div class="sort-level" data-level-index="${n}">
          <span class="sort-level-num">${n===0?`Sort by`:`then by`}</span>
          <select data-sort-level-field aria-label="Sort field">${t(e.fieldId)}</select>
          <select data-sort-level-dir aria-label="Direction">
            <option value="asc" ${e.direction===`asc`?`selected`:``}>A → Z / low → high</option>
            <option value="desc" ${e.direction===`desc`?`selected`:``}>Z → A / high → low</option>
          </select>
          <button type="button" class="button ghost" data-action="sort-remove-level">Remove</button>
        </div>
      `).join(``)||`<p>Add a sort level to order records.</p>`}</div>
        <button type="button" class="button" data-action="sort-add-level">+ Add sort level</button>
        <div class="modal-actions">
          <button type="button" class="button primary" data-action="apply-sort">Apply sort</button>
          <button type="button" data-action="clear-sort">Clear sort</button>
          <button type="button" data-action="close-dialog">Cancel</button>
        </div>
      </section>
    </div>
  `}function ri(){let e=Ji();return`
    <div class="modal-backdrop">
      <section class="modal" role="dialog" aria-modal="true" aria-label="Saved views">
        <h2>Saved views</h2>
        <p>A view remembers the current table, layout, search, find, and sort. Save it, then reopen it any time.</p>
        <div class="saved-views">
          ${e.length?e.map(e=>`
                      <div class="saved-view" data-view-id="${e.id}">
                        <div><strong>${U(e.name)}</strong><span>${U(e.mode)}${e.sortKeys.length?` · sorted`:``}${e.find&&e.find.rules.length?` · found`:``}</span></div>
                        <button type="button" class="button" data-action="apply-view" data-view-id="${e.id}">Open</button>
                        <button type="button" class="button ghost" data-action="delete-view" data-view-id="${e.id}">Delete</button>
                      </div>
                    `).join(``):`<p>No saved views yet.</p>`}
        </div>
        <label>Name this view <input data-view-name placeholder="e.g. Needs review"></label>
        <div class="modal-actions">
          <button type="button" class="button primary" data-action="save-view">Save current view</button>
          <button type="button" data-action="close-dialog">Close</button>
        </div>
      </section>
    </div>
  `}function ii(e){let t=Qi(e).length;return`
    <div class="modal-backdrop">
      <section class="modal" role="dialog" aria-modal="true" aria-label="Fill a field">
        <h2>Fill a field</h2>
        <p>Set the same value in ${t} selected record${t===1?``:`s`}.</p>
        <label>Field <select data-bulk-field>${e.fields.filter(e=>![`calculation`,`autoNumber`,`createdAt`,`updatedAt`].includes(e.type)).map(e=>`<option value="${e.id}">${U(e.name)}${e.primaryKey?` (PK)`:``}</option>`).join(``)}</select></label>
        <label>Value <input data-bulk-value type="text" placeholder="value to fill in"></label>
        <div class="modal-actions">
          <button type="button" class="button primary" data-action="apply-bulk-fill">Fill selected</button>
          <button type="button" data-action="close-dialog">Cancel</button>
        </div>
      </section>
    </div>
  `}function ai(e){let t=e.fields.find(e=>e.id===un);if(!t)return[];let n=K(e),r=new Map;return n.forEach(n=>{let i=String(Z(e,n,t.id)??``).trim()||`(empty)`,a=1;if(dn===`sum`&&fn){let t=Number(Z(e,n,fn));a=Number.isFinite(t)?t:0}r.set(i,(r.get(i)??0)+a)}),[...r.entries()].map(([e,t])=>({label:e,value:t})).slice(0,24)}var oi=[`#7c3aed`,`#0ea5e9`,`#16a34a`,`#f59e0b`,`#dc2626`,`#9333ea`,`#0891b2`,`#65a30d`,`#ea580c`,`#db2777`];function si(e){if(!e.length)return`<p class="empty-panel">Choose a category field to build a chart.</p>`;let t=Math.max(...e.map(e=>e.value),1),n=e.reduce((e,t)=>e+t.value,0)||1;if(ln===`pie`){let t=-Math.PI/2;return`<svg viewBox="0 0 300 260" class="chart-svg" role="img" aria-label="Pie chart">${e.map((e,r)=>{let i=e.value/n*Math.PI*2,a=150+110*Math.cos(t),o=130+110*Math.sin(t);t+=i;let s=150+110*Math.cos(t),c=130+110*Math.sin(t),l=+(i>Math.PI);return`<path d="M150 130 L${a.toFixed(1)} ${o.toFixed(1)} A110 110 0 ${l} 1 ${s.toFixed(1)} ${c.toFixed(1)} Z" fill="${oi[r%oi.length]}"></path>`}).join(``)}</svg>`}let r=460/e.length;return ln===`line`?`<svg viewBox="0 0 520 260" class="chart-svg" role="img" aria-label="Line chart">
      <polyline fill="none" stroke="#7c3aed" stroke-width="3" points="${e.map((e,n)=>{let i=30+r*n+r/2,a=230-e.value/t*200;return`${i.toFixed(1)},${a.toFixed(1)}`}).join(` `)}"></polyline>
      ${e.map((e,n)=>{let i=30+r*n+r/2,a=230-e.value/t*200;return`<circle cx="${i.toFixed(1)}" cy="${a.toFixed(1)}" r="4" fill="#5b21b6"></circle>`}).join(``)}
    </svg>`:`<svg viewBox="0 0 520 260" class="chart-svg" role="img" aria-label="Bar chart">${e.map((e,n)=>{let i=30+r*n+4,a=e.value/t*200,o=230-a;return`<rect x="${i.toFixed(1)}" y="${o.toFixed(1)}" width="${(r-8).toFixed(1)}" height="${a.toFixed(1)}" rx="4" fill="${oi[n%oi.length]}"></rect>`}).join(``)}<line x1="30" y1="230" x2="490" y2="230" stroke="#d8d2ff"></line></svg>`}function ci(e){let t=e.fields.filter(e=>!e.hidden&&![`image`,`longText`,`calculation`].includes(e.type)),n=e.fields.filter(e=>[`number`,`currency`,`percent`,`rating`].includes(e.type)),r=ai(e);return`
    <div class="modal-backdrop">
      <section class="modal wide-modal" role="dialog" aria-modal="true" aria-label="Charts">
        <h2>Charts</h2>
        <p>Charts use the records currently shown (${K(e).length}). Change filters to focus a chart.</p>
        <div class="chart-controls">
          <label>Type <select data-chart-type>${[`bar`,`pie`,`line`].map(e=>`<option value="${e}" ${ln===e?`selected`:``}>${e}</option>`).join(``)}</select></label>
          <label>Category <select data-chart-category><option value="">Choose a field</option>${t.map(e=>`<option value="${e.id}" ${un===e.id?`selected`:``}>${U(e.name)}${e.primaryKey?` (PK)`:``}</option>`).join(``)}</select></label>
          <label>Measure <select data-chart-value-mode><option value="count" ${dn===`count`?`selected`:``}>count records</option><option value="sum" ${dn===`sum`?`selected`:``}>sum a number</option></select></label>
          ${dn===`sum`?`<label>Number field <select data-chart-value-field><option value="">Choose</option>${n.map(e=>`<option value="${e.id}" ${fn===e.id?`selected`:``}>${U(e.name)}${e.primaryKey?` (PK)`:``}</option>`).join(``)}</select></label>`:``}
        </div>
        <div class="chart-area">${si(r)}</div>
        ${r.length?`<table class="chart-table"><caption class="sr-only">Chart data</caption><thead><tr><th>Category</th><th>Value</th></tr></thead><tbody>${r.map(e=>`<tr><td>${U(e.label)}</td><td>${e.value.toLocaleString()}</td></tr>`).join(``)}</tbody></table>`:``}
        <div class="modal-actions"><button type="button" data-action="close-dialog">Close</button></div>
      </section>
    </div>
  `}function li(e){let t=He(e),n=We(e),r=Ge(E),i=Math.round(JSON.stringify(E).length/1024);return`
    <div class="modal-backdrop">
      <section class="modal" role="dialog" aria-modal="true" aria-label="Database maintenance">
        <h2>Database maintenance</h2>
        <div class="maint-row">
          <div><strong>${t.length}</strong> duplicate record${t.length===1?``:`s`}</div>
          <button type="button" class="button" data-action="remove-duplicates" ${t.length?``:`disabled`}>Remove duplicates</button>
        </div>
        <div class="maint-row">
          <div><strong>${n.length}</strong> always-empty field${n.length===1?``:`s`}${n.length?`: `+U(n.map(e=>e.name).join(`, `)):``}</div>
          <span class="muted">${n.length?`Hide or delete them in field settings.`:``}</span>
        </div>
        <div class="maint-row">
          <div><strong>${r.length}</strong> broken relationship${r.length===1?``:`s`}</div>
          <button type="button" class="button" data-action="remove-broken" ${r.length?``:`disabled`}>Remove broken</button>
        </div>
        <div class="maint-row"><div>Project size in this browser: <strong>${i} KB</strong></div></div>
        <div class="maint-row">
          <button type="button" class="button" data-action="duplicate-project">Save a copy (.json)</button>
          <button type="button" class="button" data-action="structure-copy">Save structure-only copy</button>
        </div>
        <div class="modal-actions"><button type="button" data-action="close-dialog">Close</button></div>
      </section>
    </div>
  `}function ui(e){let t=[];e.fields.filter(e=>e.type===`image`).forEach(e=>{e.description.trim()||t.push(`Image field "${e.name}" has no description to use as alt text.`)});let n=e.fields.filter(e=>!e.hidden&&!e.description.trim()&&![`autoNumber`,`createdAt`,`updatedAt`].includes(e.type));n.length&&t.push(`${n.length} field${n.length===1?``:`s`} have no student-friendly description.`),E.metadata.title.trim()||t.push(`The database has no title.`);let r=zt(e).filter(e=>/required/i.test(e.message)).length;return r&&t.push(`${r} required value${r===1?` is`:`s are`} still empty.`),t}function di(e){let t=ui(e);return`
    <div class="modal-backdrop">
      <section class="modal" role="dialog" aria-modal="true" aria-label="Accessibility check">
        <h2>Accessibility check</h2>
        <p>Quick checks a database creator can act on. ListSplat itself supports keyboard use, visible focus, and screen readers.</p>
        ${t.length?`<ul class="a11y-list">${t.map(e=>`<li>⚠️ ${U(e)}</li>`).join(``)}</ul>`:`<p class="a11y-ok">✅ No issues found. Nice work.</p>`}
        <div class="modal-actions"><button type="button" data-action="close-dialog">Close</button></div>
      </section>
    </div>
  `}var fi=[{id:`collection`,label:`A collection (books, rocks, artifacts)`,fields:[[`Name`,`text`],[`Category`,`choice`],[`Notes`,`longText`],[`Picture`,`image`]]},{id:`log`,label:`A log or journal (observations, reading)`,fields:[[`Date`,`date`],[`Entry`,`longText`],[`Rating`,`rating`]]},{id:`people`,label:`A directory of people`,fields:[[`Name`,`text`],[`Email`,`email`],[`Phone`,`phone`],[`Notes`,`longText`]]},{id:`inventory`,label:`An inventory or checkout list`,fields:[[`Item`,`text`],[`Quantity`,`number`],[`Location`,`text`],[`Status`,`choice`]]},{id:`tracker`,label:`A tracker with status columns`,fields:[[`Title`,`text`],[`Status`,`choice`],[`Owner`,`text`],[`Due date`,`date`],[`Notes`,`longText`]]}];function pi(){return`
    <div class="modal-backdrop">
      <section class="modal" role="dialog" aria-modal="true" aria-label="Guided database builder">
        <h2>Build a database</h2>
        <p>Tell me what you want to track and I'll set up a table with useful fields. You can change anything afterward.</p>
        <label>Name it <input data-guided-name placeholder="e.g. Rock collection"></label>
        <div class="guided-kinds">
          ${fi.map(e=>`<button type="button" class="guided-kind" data-action="guided-create" data-guided-kind="${e.id}"><strong>${U(e.label)}</strong><span>${e.fields.map(([e])=>U(e)).join(` · `)}</span></button>`).join(``)}
        </div>
        <div class="modal-actions"><button type="button" data-action="close-dialog">Cancel</button></div>
      </section>
    </div>
  `}function mi(e){if(R===`none`)return``;if(R===`find`)return ti(e);if(R===`sort`)return ni(e);if(R===`views`)return ri();if(R===`bulkFill`)return ii(e);if(R===`charts`)return ci(e);if(R===`maintenance`)return li(e);if(R===`accessibility`)return di(e);if(R===`guided`)return pi();if(R===`rubric`)return`
      <div class="modal-backdrop">
        <section class="modal" role="dialog" aria-modal="true" aria-label="Rubric">
          <h2>Rubric criteria</h2>
          <p>Score each criterion on every record's form. The total adds up automatically.</p>
          <div class="rubric-def">
            ${en.map((e,t)=>`
                  <div class="rubric-def-row" data-crit-id="${e.id}" data-crit-index="${t}">
                    <input data-crit-label value="${U(e.label)}" placeholder="Criterion">
                    <label>out of <input data-crit-max type="number" min="1" value="${e.max}"></label>
                    <button type="button" class="button ghost" data-action="rubric-remove">Remove</button>
                  </div>
                `).join(``)}
          </div>
          <button type="button" class="button" data-action="rubric-add">+ Add criterion</button>
          <div class="modal-actions">
            <button type="button" class="button primary" data-action="save-rubric">Save rubric</button>
            <button type="button" data-action="close-dialog">Cancel</button>
          </div>
        </section>
      </div>
    `;if(R===`camera`)return`
      <div class="modal-backdrop">
        <section class="modal" role="dialog" aria-modal="true" aria-label="Take a photo">
          <h2>Take a photo</h2>
          <video id="cameraVideo" class="camera-video" autoplay playsinline muted></video>
          <div class="modal-actions">
            <button type="button" class="button primary" data-action="camera-shoot">Capture</button>
            <button type="button" data-action="close-dialog">Cancel</button>
          </div>
        </section>
      </div>
    `;if(R===`replace`){let t=B.slice(0,8);return`
      <div class="modal-backdrop">
        <section class="modal" role="dialog" aria-modal="true" aria-label="Replace values">
          <h2>Replace values</h2>
          <label>Find <input data-replace-find placeholder="Text to find"></label>
          <label>Replace with <input data-replace-with placeholder="New text"></label>
          <label>Field <select data-replace-field>${e.fields.map(e=>`<option value="${e.id}">${U(e.name)}${e.primaryKey?` (PK)`:``}</option>`).join(``)}</select></label>
          <label class="check-row"><input type="checkbox" data-replace-case-sensitive> Case-sensitive</label>
          <label class="check-row"><input type="checkbox" data-replace-whole-word> Whole word only</label>
          <p>Replacement applies to the current found set when search is active. Preview first, then apply. The last replace can be undone from Edit.</p>
          ${B.length?`<div class="replace-preview"><strong>${B.length} change${B.length===1?``:`s`} ready</strong>${t.map(t=>{let n=e.records.find(e=>e.id===t.recordId),r=e.fields.find(e=>e.id===t.fieldId);return`<p><span>${U(n?wr(e,n):`Record`)} / ${U(r?.name??`Field`)}</span><del>${U(t.before)}</del><ins>${U(t.after)}</ins></p>`}).join(``)}</div>`:``}
          <div class="modal-actions">
            <button type="button" data-action="preview-replace">Preview</button>
            <button type="button" data-action="run-replace" ${B.length?``:`disabled`}>Apply Replace</button>
            <button type="button" data-action="close-dialog">Cancel</button>
          </div>
        </section>
      </div>
    `}if(R===`field`){let t=e.fields.find(e=>e.id===vn)??e.fields[0],n=$t||t.type;return`
      <div class="modal-backdrop">
        <section class="modal" role="dialog" aria-modal="true" aria-label="Field settings">
          <h2>Field settings</h2>
          <label>Name <input data-field-name value="${U(t.name)}"></label>
          <label>Type <select data-field-type>${fr(n)}</select></label>
          ${ei(e,t,n)}
          <label>Description <textarea data-field-description>${U(t.description)}</textarea></label>
          <label>Choice options <input data-field-options value="${U(t.options?.join(`, `)??``)}" placeholder="Yes, No, Maybe"></label>
          <label class="check-row"><input type="checkbox" data-field-primary-key ${t.primaryKey?`checked`:``}> Primary key (one per table; unique and required)</label>
          <label class="check-row"><input type="checkbox" data-field-required ${t.required?`checked`:``}> Required field</label>
          <label class="check-row"><input type="checkbox" data-field-hidden ${t.hidden?`checked`:``}> Hide field</label>
          ${$r(t,n)}
          <label>Calculation formula <input data-field-formula value="${U(t.formula??``)}" placeholder='JOIN(First Name, " ", Last Name)'></label>
          ${n===`calculation`?Qr(e):``}
          <p>Try <code>FIELD(Animal)</code>, <code>JOIN(Animal, " lives in ", Habitat)</code>, <code>UPPER(Animal)</code>, <code>ADD(Score, Bonus)</code>, <code>AVERAGE(Score)</code>, or <code>LOOKUP("Book reviews", Rating)</code>.</p>
          <div class="modal-actions">
            <p class="relationship-error" role="alert">${U(V)}</p><button type="button" data-action="save-field-settings">Save field</button>
            <button type="button" data-action="close-dialog">Cancel</button>
          </div>
        </section>
      </div>
    `}if(R===`layout`){let t=mr(),n=gr(e),r=new Set(t?.hiddenFieldIds??[]);return`
      <div class="modal-backdrop">
        <section class="modal" role="dialog" aria-modal="true" aria-label="Layout designer">
          <h2>Layout designer</h2>
          <p>Arrange and choose fields for the current ${U(k)} view. Locked layouts can still be viewed, but students should not change them.</p>
          <label class="check-row"><input type="checkbox" data-layout-locked ${t?.locked?`checked`:``}> Lock this layout</label>
          <div class="layout-field-list">
            ${n.map((e,t)=>`
                  <div class="layout-field-row">
                    <label class="check-row"><input type="checkbox" data-layout-field-visible="${e.id}" ${r.has(e.id)?``:`checked`}> <strong>${U(e.name)}</strong></label>
                    <span>${U(e.type)}</span>
                    <button type="button" data-action="layout-field-up" data-layout-field-id="${e.id}" ${t===0?`disabled`:``}>Up</button>
                    <button type="button" data-action="layout-field-down" data-layout-field-id="${e.id}" ${t===n.length-1?`disabled`:``}>Down</button>
                  </div>
                `).join(``)}
          </div>
          <div class="modal-actions">
            <button type="button" data-action="save-layout-settings">Save layout</button>
            <button type="button" data-action="close-dialog">Close</button>
          </div>
        </section>
      </div>
    `}if(R===`markdownImport`)return`<div class="modal-backdrop"><section class="modal wide-modal" role="dialog" aria-modal="true" aria-label="Import Markdown table">
      <h2>Import Markdown table</h2>
      <p>Paste a Markdown table or load a .md file. If the document has several tables, choose which one to import. Preview columns before creating a new table or adding records to the current table.</p>
      <label>Markdown file <input type="file" data-markdown-file accept=".md,.markdown,text/markdown,text/plain"></label>
      <label>Markdown text <textarea data-markdown-text rows="8" placeholder="| Name | Age |&#10;| --- | --- |&#10;| Alex | 12 |">${U(Dn)}</textarea></label>
      <label>Table to import <select data-markdown-table>${ar()}</select></label>
      <label>Table name <input data-markdown-name value="${U(On)}"></label>
      <p class="relationship-error" role="alert">${U(kn)}</p>
      <div class="modal-actions"><button type="button" class="button" data-action="preview-markdown" ${Ye(Dn).length?``:`disabled`}>Preview columns</button><button type="button" data-action="close-dialog">Cancel</button></div>
    </section></div>`;if(R===`csvImport`&&H){let t=H.records.slice(0,4),n=t=>e.fields.map(e=>`<option value="${e.id}" ${e.id===t?`selected`:``}>${U(e.name)}${e.primaryKey?` (PK)`:``}</option>`).join(``),r=I.map((e,t)=>`
          <div class="csv-map-row" data-map-index="${t}">
            <span class="csv-map-header">${U(e.header||`Column ${t+1}`)}</span>
            <select data-map-action aria-label="What to do with ${U(e.header)}">
              <option value="new" ${e.action===`new`?`selected`:``}>New field</option>
              <option value="existing" ${e.action===`existing`?`selected`:``}>Existing field</option>
              <option value="skip" ${e.action===`skip`?`selected`:``}>Skip</option>
            </select>
            <select data-map-type aria-label="Type for ${U(e.header)}" ${e.action===`new`?``:`hidden`}>${fr(e.type)}</select>
            <select data-map-existing aria-label="Existing field for ${U(e.header)}" ${e.action===`existing`?``:`hidden`}>${n(e.fieldId)}</select>
          </div>
        `).join(``);return`
      <div class="modal-backdrop">
        <section class="modal wide-modal" role="dialog" aria-modal="true" aria-label="${U(En)} import">
          <h2>Import ${U(En)}</h2>
          <p>${U(Tn)} has ${H.fields.length} column${H.fields.length===1?``:`s`} and ${H.records.length} row${H.records.length===1?``:`s`}. Choose how each column maps.</p>
          <div class="csv-map">${r}</div>
          <div class="preview-table-wrap">
            <table class="preview-table">
              <thead>
                <tr>${H.fields.map(e=>`<th>${U(e.name)}</th>`).join(``)}</tr>
              </thead>
              <tbody>
                ${t.map(e=>`<tr>${H.fields.map(t=>`<td>${U(e.values[t.id])}</td>`).join(``)}</tr>`).join(``)}
              </tbody>
            </table>
          </div>
          <p><strong>Create new table</strong> builds a fresh table from the columns you keep. <strong>Append</strong> adds the rows to ${U(e.name)} using your field mapping.</p>
          <div class="csv-dup">
            <label>When appending, match on <select data-csv-key><option value="">nothing (always add)</option>${e.fields.filter(e=>![`image`,`calculation`,`autoNumber`,`createdAt`,`updatedAt`].includes(e.type)).map(e=>`<option value="${e.id}" ${gn===e.id?`selected`:``}>${U(e.name)}${e.primaryKey?` (PK)`:``}</option>`).join(``)}</select></label>
            <label>Duplicates <select data-csv-dup ${gn?``:`disabled`}>
              <option value="add" ${_n===`add`?`selected`:``}>always add</option>
              <option value="skip" ${_n===`skip`?`selected`:``}>skip matches</option>
              <option value="update" ${_n===`update`?`selected`:``}>update matches</option>
            </select></label>
          </div>
          <div class="modal-actions">
            <button type="button" class="button primary" data-action="apply-csv-new">Create new table</button>
            <button type="button" class="button" data-action="apply-csv-append">Append to ${U(e.name)}</button>
            <button type="button" data-action="close-dialog">Cancel</button>
          </div>
        </section>
      </div>
    `}if(R===`projectIdeas`)return`
      <div class="modal-backdrop">
        <section class="modal" role="dialog" aria-modal="true" aria-label="Project ideas">
          <h2>Project ideas</h2>
          <ul>
            <li>Build a classroom library and find books by genre, author, or recommendation.</li>
            <li>Track science observations, then sort by date or measurement.</li>
            <li>Create animal trading cards with a label layout.</li>
            <li>Survey classmates and make a report showing the most common answers.</li>
            <li>Connect a Books table to a Reviews table after relationships are added.</li>
          </ul>
          <div class="modal-actions"><button type="button" data-action="close-dialog">Close</button></div>
        </section>
      </div>
    `;if(R===`relationship`){let t=E.schema.tables.find(e=>e.id===Cn)??e,n=E.schema.tables.find(e=>e.id===wn&&e.id!==t.id)??E.schema.tables.find(e=>e.id!==t.id)??e,r=t.fields.filter(e=>e.primaryKey).map(e=>`<option value="${t.id}:${e.id}">${U(e.name)}${e.primaryKey?` (PK)`:``}</option>`).join(``),i=n.fields.map(e=>`<option value="${n.id}:${e.id}">${U(e.name)}${e.primaryKey?` (PK)`:``}</option>`).join(``);return`
      <div class="modal-backdrop">
        <section class="modal wide-modal" role="dialog" aria-modal="true" aria-label="Relationships">
          <h2>Keys &amp; Relationships</h2>
          <p>Connect a parent primary key (PK) to a child foreign key (FK). IDs stay stored in the child table; the picker shows names.</p>
          <p>Set a primary key by clicking a column heading and choosing Primary key. New relationships enforce unique, nonempty parent keys and valid references. Existing value-match links remain available.</p>
          <p class="relationship-error" role="alert">${U(V)}</p>
          ${Zr()}
          ${Xr(t,n)}
          <label>Relationship type <select data-relationship-cardinality><option value="one-to-many">One parent → many children</option><option value="one-to-one">One parent → one child (unique foreign key)</option></select></label>
          <label>Name <input data-relationship-name placeholder="${U(`${t.name} to ${n.name}`)}"></label>
          <label>Parent table <select data-relationship-from-table>${E.schema.tables.map(e=>`<option value="${e.id}" ${e.id===t.id?`selected`:``}>${U(e.name)}</option>`).join(``)}</select></label>
          ${t.fields.some(e=>e.primaryKey)?``:`<button type="button" class="button" data-action="generate-primary-key">${lr(`key`)} Add an ID primary key to ${U(t.name)}</button>`}
          <label>Parent primary key <select data-relationship-from-field>${r||`<option value="">Add or choose a primary key first</option>`}</select></label>
          <label>Related table <select data-relationship-to-table>${E.schema.tables.map(e=>`<option value="${e.id}" ${e.id===n.id?`selected`:``}>${U(e.name)}</option>`).join(``)}</select></label>
          <label>Child foreign key <select data-relationship-to-field>${i}</select></label>
          ${E.schema.relationships.length?`<div class="relationship-list">${E.schema.relationships.map(e=>`<p><strong>${U(e.name)}</strong><br>${U(ut(E,e))}<br><button type="button" class="button" data-action="remove-relationship" data-relationship-id="${e.id}">Remove link</button></p>`).join(``)}</div>`:`<p>No relationships yet. Add a second table first for the most useful results.</p>`}
          <div class="modal-actions">
            <button type="button" data-action="create-relationship">Create relationship</button>
            <button type="button" data-action="close-dialog">Close</button>
          </div>
        </section>
      </div>
    `}if(R===`functions`){let t=e.fields.filter(e=>![`image`,`createdAt`,`updatedAt`].includes(e.type)),n=t.find(e=>[`text`,`longText`,`choice`].includes(e.type))??t[0],r=t.find(e=>[`number`,`currency`,`percent`,`rating`].includes(e.type))??n,i=n?.name??`Field`,a=r?.name??`Score`;return`
      <div class="modal-backdrop">
        <section class="modal wide-modal" role="dialog" aria-modal="true" aria-label="Functions">
          <h2>Calculation functions</h2>
          <p>Use a calculation field when students need a result made from other fields. Formulas are simple, offline, and do not run custom code.</p>
          <div class="formula-grid">
            <div>
              <strong>Text</strong>
              <code>FIELD(${U(i)})</code>
              <code>JOIN(${U(i)}, " report")</code>
              <code>UPPER(${U(i)})</code>
              <code>TITLECASE(${U(i)})</code>
              <code>CONTAINS(${U(i)}, "a")</code>
            </div>
            <div>
              <strong>Numbers</strong>
              <code>ADD(${U(a)}, "5")</code>
              <code>SUBTRACT(${U(a)}, "1")</code>
              <code>MULTIPLY(${U(a)}, "2")</code>
              <code>DIVIDE(${U(a)}, "2")</code>
              <code>ROUND(${U(a)}, "1")</code>
            </div>
            <div>
              <strong>Whole table</strong>
              <code>SUM(${U(a)})</code>
              <code>AVERAGE(${U(a)})</code>
              <code>MIN(${U(a)})</code>
              <code>MAX(${U(a)})</code>
              <code>COUNT(${U(a)})</code>
            </div>
            <div>
              <strong>Relationships</strong>
              <code>COUNT_RELATED("Relationship name")</code>
              <code>LOOKUP("Relationship name", Field)</code>
              <span>Use these after creating a relationship from Tools.</span>
            </div>
          </div>
          <p>To use one, add a new field, choose <strong>Calculation</strong>, then paste a formula into Field settings.</p>
          <div class="modal-actions"><button type="button" data-action="close-dialog">Close</button></div>
        </section>
      </div>
    `}if(R===`quality`){let t=yr(e),n=vr(e),r=t.reduce((e,t)=>e+t.missing,0),i=t.reduce((e,t)=>e+t.duplicates,0),a=zt(e).length;return`
      <div class="modal-backdrop">
        <section class="modal wide-modal" role="dialog" aria-modal="true" aria-label="Data quality check">
          <h2>Data quality check</h2>
          <p>Use this before printing a report or exporting CSV. Click a count to highlight the records that need attention.</p>
          <div class="quality-summary">
            <div><strong>${r}</strong><span>missing values</span></div>
            <div><strong>${i}</strong><span>duplicate values</span></div>
            <div><strong>${n}</strong><span>formula errors</span></div>
            <div><button type="button" data-action="highlight-invalid" ${a?``:`disabled`}><strong>${a}</strong><span>rule problems</span></button></div>
          </div>
          <div class="quality-table" role="table" aria-label="Field quality">
            <div class="quality-row quality-head" role="row">
              <span>Field</span><span>Missing</span><span>Duplicates</span>
            </div>
            ${t.length?t.map(({field:e,missing:t,duplicates:n})=>`
                        <div class="quality-row" role="row">
                          <span><strong>${U(e.name)}</strong><small>${U(e.type)}</small></span>
                          <button type="button" data-quality-kind="missing" data-quality-field-id="${e.id}" ${t?``:`disabled`}>${t}</button>
                          <button type="button" data-quality-kind="duplicates" data-quality-field-id="${e.id}" ${n?``:`disabled`}>${n}</button>
                        </div>
                      `).join(``):`<p class="empty-panel">No editable data fields are available yet.</p>`}
          </div>
          <div class="modal-actions"><button type="button" data-action="close-dialog">Close</button></div>
        </section>
      </div>
    `}return R===`teacherNotes`?`
      <div class="modal-backdrop">
        <section class="modal" role="dialog" aria-modal="true" aria-label="Teacher notes">
          <h2>Teacher notes</h2>
          <p>Add one note per line. These notes are saved in the .listsplat.json file and included in the project packet.</p>
          <label>Notes <textarea data-teacher-notes rows="8" placeholder="Add setup directions, reflection questions, or grading reminders.">${U(E.teacher.notes.join(`
`))}</textarea></label>
          <div class="modal-actions">
            <button type="button" data-action="save-teacher-notes">Save notes</button>
            <button type="button" data-action="close-dialog">Cancel</button>
          </div>
        </section>
      </div>
    `:`
    <div class="modal-backdrop">
      <section class="modal" role="dialog" aria-modal="true" aria-label="ListSplat help">
        <h2>ListSplatTM Help</h2>
        <p>Create fields to describe the information you want to collect. Add one record for each item, person, place, observation, or source.</p>
        <ul>
          <li>Use Table view for fast entry.</li>
          <li>Use Form view to focus on one record.</li>
          <li>Use Cards, Labels, and Report view to share or print.</li>
          <li>Save a .listsplat.json file when you need a reliable backup.</li>
          <li>CSV import/export lets you trade data with spreadsheets.</li>
        </ul>
        <div class="modal-actions"><button type="button" data-action="close-dialog">Close</button></div>
      </section>
    </div>
  `}function $(){let e=G();Ln(e),Pn();let t=E.teacher.studentView;if(w.innerHTML=`
    <header class="app-header">
      <a class="brand" href="../../pages/splatworks.html" aria-label="SplatWorks home">
        <img class="brand-icon" src="listsplat_icon.png" alt="">
        <span>
          <strong>ListSplat<sup>TM</sup></strong>
          <small>SplatWorks<sup>TM</sup> Database Studio</small>
        </span>
      </a>
      <div class="quick-actions">
        <select id="languageSwitcher" class="lang-switcher" aria-label="Language">${Nn(An)}</select>
      </div>
    </header>
    <main class="listsplat-app">
      <nav class="menu-bar" aria-label="Application menu">
        ${dr(`File`,[[`new`,`New database`],[`save-json`,`Save .listsplat.json`],[`save-drive`,`Save to Google Drive`],[`open-json`,`Open .listsplat.json`],{label:`Import`,items:[[`import-csv`,`CSV or TSV`],[`import-markdown`,`Markdown table`]]},{label:`Export`,items:[[`export-csv`,`Table CSV`],[`export-found-csv`,`Shown records CSV`],[`export-markdown`,`Markdown table`],[`export-report`,`Report HTML`]]},[`print`,`Print`]])}
        ${dr(`Edit`,[[`undo-change`,`Undo last change`],[`redo-change`,`Redo last change`],[`add-record`,`Add record`],[`add-field`,`Add field`],[`find`,`Find records`],[`replace`,`Replace values`]])}
        ${dr(`Data`,[[`add-table`,`New table`],[`rename-table`,`Rename this table`],[`duplicate-table`,`Duplicate this table`],[`move-table-left`,`Move table left`],[`move-table-right`,`Move table right`],[`delete-table`,`Delete this table`],[`sort`,`Sort records`],[`missing`,`Find missing values`],[`duplicates`,`Find duplicates`],[`toggle-archived`,tn?`Show active records`:`Show archived records (${Fn(e)})`],[`structure-copy`,`Save structure-only copy`],[`clear-find`,`Show all records`]])}
        ${dr(`Layout`,[[`layout-designer`,`Design current layout`],[`table-view`,`Table view`],[`form-view`,`Form view`],[`cards-view`,`Card view`],[`gallery-view`,`Gallery view`],[`labels-view`,`Label view`],[`report-view`,`Report view`]])}
        ${dr(`Tools`,[[`functions`,`Functions`],[`relationships`,`Relationships`],[`charts`,`Charts`],[`quality`,`Data quality check`],[`maintenance`,`Database maintenance`],[`accessibility`,`Accessibility check`]])}
        ${dr(`View`,[[`student-view`,t?`Exit student view`:`Student view`],[`teacher-notes`,`Teacher notes`]])}
        <span class="menu-spacer"></span>
        ${t?``:dr(`Teacher`,[[`guided`,`Guided database builder`],[`templates`,`Template Library`],[`project-ideas`,`Project Ideas`],[`share-html`,`Publish read-only page`],[`lock-layout`,`Lock Layout`],[`project-packet`,`Print Project Packet`]])}
        ${dr(`Help`,[[`help-start`,`Start a database`],[`help-csv`,`Import and export CSV`],[`help-layouts`,`Forms and reports`],[`help-privacy`,`Privacy and saving`]])}
      </nav>
      <section class="toolbar" aria-label="Database toolbar">
        <label>${U(W(`Title`))} <input data-project-title value="${U(E.metadata.title)}"></label>
        <label>${U(W(`Search`))} <input data-search value="${U(A)}" placeholder="${U(W(`Find records`))}"></label>
        <label>${U(W(`In`))} <select data-search-field><option value="all">${U(W(`All fields`))}</option>${e.fields.map(e=>`<option value="${e.id}" ${j===e.id?`selected`:``}>${U(e.name)}${e.primaryKey?` (PK)`:``}</option>`).join(``)}</select></label>
        <label>${U(W(`Sort`))} <select data-sort-field><option value="">${U(W(`Choose field`))}</option>${e.fields.map(e=>`<option value="${e.id}" ${M[0]?.fieldId===e.id?`selected`:``}>${U(e.name)}${e.primaryKey?` (PK)`:``}</option>`).join(``)}</select></label>
        <button type="button" data-action="toggle-sort" title="${U(W(`Sort direction`))}">${M[0]?.direction===`desc`?`Z-A`:`A-Z`}</button>
        <button type="button" data-action="sort-dialog" title="${U(W(`Sort by more than one field`))}">${U(W(`Sort…`))}</button>
        <button type="button" data-action="find" title="${U(W(`Advanced find with conditions`))}">${U(W(`Find…`))}</button>
        <button type="button" data-action="views" title="${U(W(`Save and reuse this view`))}">${U(W(`Views`))}</button>
        <label>${U(W(`New field`))} <input data-new-field placeholder="${U(W(`Field name`))}"></label>
        <label>${U(W(`Type`))} <select data-new-field-type>${fr()}</select></label>
        <button type="button" data-action="add-field">${U(W(`Add field`))}</button>
        <button type="button" data-action="add-record">${U(W(`Add record`))}</button>
      </section>
      <div class="workspace${t?` student-workspace`:``}">
        ${Kr(e)}
        ${t?``:Yr(e)}
      </div>
      <footer class="status-bar">
        <span>${U(e.name)}: ${K(e).length} shown of ${e.records.length} records, ${e.fields.length} fields</span>
        ${t?`<span>Student view hides teacher notes and teacher tools.</span>`:``}
        <span role="status" aria-live="polite">${U(z)}</span>
        <span data-save-status aria-live="polite">${Yt}</span>
      </footer>
    </main>
    <input class="hidden-file" type="file" accept=".listsplat.json,application/json" data-open-json>
    <input class="hidden-file" type="file" accept=".csv,text/csv" data-import-csv>
    ${mi(e)}
  `,ur(),xn=``,Sn){let e=Sn;Sn=null,Ni(e.recordId,e.fieldId)}Li()}function hi(e){return e instanceof HTMLInputElement&&e.type===`checkbox`?e.checked:e instanceof HTMLInputElement&&e.type===`number`?e.value===``?``:Number(e.value):e.value}function gi(e){let t=e.dataset.recordId,n=e.dataset.fieldId;if(!t||!n)return;let r=G().fields.find(e=>e.id===n),i=hi(e),a=Er(D,n),o=a&&r?.type===`number`&&i!==``?Number(i):i,s=y(E,Pe(G(),t,n,o)),c=mt(E,s);c?(z=`Change blocked: ${c}`,$()):(E=s,Xt(E),(r?.primaryKey||a)&&$())}function _i(e){return new Promise((t,n)=>{let r=new FileReader;r.onerror=()=>n(r.error),r.onload=()=>{let n=String(r.result??``);if(e.size<=35e4){t(n);return}let i=new Image;i.onerror=()=>t(n),i.onload=()=>{let e=1280,r=Math.max(i.width,i.height),a=r>e?e/r:1,o=Math.max(1,Math.round(i.width*a)),s=Math.max(1,Math.round(i.height*a)),c=document.createElement(`canvas`);c.width=o,c.height=s;let l=c.getContext(`2d`);if(!l){t(n);return}l.drawImage(i,0,0,o,s);let u=c.toDataURL(`image/jpeg`,.82);t(u.length<n.length?u:n)},i.src=n},r.readAsDataURL(e)})}function vi(e){if(!e)return null;try{let t=JSON.parse(e);if(t&&t.url)return{name:t.name||`file`,url:t.url}}catch{}return e.startsWith(`data:`)?{name:`file`,url:e}:null}function yi(e,t,n){let r=new FileReader;r.onload=()=>{Y(`add file`);let i=JSON.stringify({name:n.name,url:String(r.result??``)});E=y(E,Pe(G(),e,t,i)),Xt(E);let a=Math.round(i.length/1024);z=a>900?`File attached (about ${a} KB). Large files can slow autosave.`:`File attached.`,$()},r.onerror=()=>{z=`Could not read that file.`,$()},r.readAsDataURL(n)}async function bi(e,t){if(pn&&pn.state===`recording`)pn.stop();else if(!navigator.mediaDevices?.getUserMedia||window.MediaRecorder===void 0)z=`Audio recording is not available in this browser.`,$();else try{let n=await navigator.mediaDevices.getUserMedia({audio:!0}),r=[],i=new MediaRecorder(n);pn=i,i.ondataavailable=e=>{e.data.size&&r.push(e.data)},i.onstop=()=>{n.getTracks().forEach(e=>e.stop()),pn=null;let i=new FileReader;i.onload=()=>{Y(`record audio`),E=y(E,Pe(G(),e,t,String(i.result??``))),Xt(E),z=`Recording saved.`,$()},i.readAsDataURL(new Blob(r,{type:`audio/webm`}))},i.start(),z=`Recording… press the button again to stop (auto-stops at 60s).`,$(),window.setTimeout(()=>{pn&&pn.state===`recording`&&pn.stop()},6e4)}catch{z=`Microphone permission was blocked.`,$()}}async function xi(){if(!navigator.mediaDevices?.getUserMedia)z=`Camera is not available in this browser.`,R=`none`,$();else try{hn=await navigator.mediaDevices.getUserMedia({video:{facingMode:`environment`}});let e=w.querySelector(`#cameraVideo`);e&&(e.srcObject=hn,await e.play().catch(()=>void 0))}catch{Si(),z=`Camera permission was blocked.`,R=`none`,$()}}function Si(){hn?.getTracks().forEach(e=>e.stop()),hn=null}function Ci(){let e=w.querySelector(`#cameraVideo`);if(!e||!mn||!e.videoWidth)return;let t=document.createElement(`canvas`),n=Math.min(1,1280/Math.max(e.videoWidth,e.videoHeight));t.width=Math.round(e.videoWidth*n),t.height=Math.round(e.videoHeight*n);let r=t.getContext(`2d`);if(!r)return;r.drawImage(e,0,0,t.width,t.height);let i=t.toDataURL(`image/jpeg`,.85),{recordId:a,fieldId:o}=mn;Y(`camera photo`),E=y(E,Pe(G(),a,o,i)),Xt(E),Si(),mn=null,R=`none`,z=`Photo captured.`,$()}function wi(e,t,n,r){n.type.startsWith(`image/`)?_i(n).then(n=>{Y(r),E=y(E,Pe(G(),e,t,n)),Xt(E);let i=Math.round(n.length/1024);z=i>900?`Image saved (about ${i} KB). Very large pictures can slow autosave — a smaller image is fine for most projects.`:`Image saved in this field.`,$()}).catch(()=>{z=`Could not read that image.`,$()}):(z=`That clipboard item is not an image.`,$())}function Ti(){let e=G(),t=e.fields.find(e=>e.id===vn);if(!t)return;let n=w.querySelector(`[data-field-name]`)?.value??t.name,r=w.querySelector(`[data-field-type]`)?.value??t.type,i=w.querySelector(`[data-field-description]`)?.value??``,a=w.querySelector(`[data-field-primary-key]`)?.checked??!1,o=w.querySelector(`[data-field-required]`)?.checked??!1,s=w.querySelector(`[data-field-hidden]`)?.checked??!1,c=w.querySelector(`[data-field-formula]`)?.value??``,l=(w.querySelector(`[data-field-options]`)?.value??``).split(`,`).map(e=>e.trim()).filter(Boolean),u=w.querySelector(`[data-field-unique]`)?.checked??!1,d=w.querySelector(`[data-field-min]`)?.value??``,f=w.querySelector(`[data-field-max]`)?.value??``,ee=d.trim()===``?void 0:Number(d),te=f.trim()===``?void 0:Number(f),ne=w.querySelector(`[data-field-pattern]`)?.value??`none`,re=w.querySelector(`[data-field-custom-pattern]`)?.value??``,ie=w.querySelector(`[data-field-default]`)?.value??``,p=w.querySelector(`[data-field-readonly]`)?.checked??!1,ae=w.querySelector(`[data-field-maxlength]`)?.value??``,oe=ae.trim()===``?void 0:Number(ae),m=w.querySelector(`[data-field-message]`)?.value??``,h=r!==t.type,g=je(e,t.id,{name:n,type:r,description:i,required:o||a,primaryKey:a,hidden:s,formula:c,options:l,unique:u||a,min:ee,max:te,pattern:ne,customPattern:re,defaultValue:ie,readonly:p,maxLength:oe,customMessage:m});h&&![`calculation`,`autoNumber`,`createdAt`,`updatedAt`,`image`].includes(r)&&(g=Ae(g,t.id,r,l));let se=mt(E,y(E,g));se?(V=se,z=se,$()):(V=``,X(g),R=`none`,z=h?`Updated ${n} and converted values to ${r}.`:`Updated ${n}.`,$())}function Ei(){let e=w.querySelector(`[data-replace-find]`)?.value??``,t=w.querySelector(`[data-replace-with]`)?.value??``,n=w.querySelector(`[data-replace-field]`)?.value??G().fields[0]?.id,r=w.querySelector(`[data-replace-case-sensitive]`)?.checked??!1,i=w.querySelector(`[data-replace-whole-word]`)?.checked??!1,a=A?K(G()).map(e=>e.id):void 0;Y(`replace`);let o=Pt(G(),{fieldIds:[n],find:e,replacement:t,recordIds:a,caseSensitive:r,wholeWord:i});R=`none`,B=[],z=`Replaced ${o.count} value${o.count===1?``:`s`}.`,X(o.table)}function Di(){let e=w.querySelector(`[data-replace-find]`)?.value??``,t=w.querySelector(`[data-replace-with]`)?.value??``,n=w.querySelector(`[data-replace-field]`)?.value??G().fields[0]?.id,r=w.querySelector(`[data-replace-case-sensitive]`)?.checked??!1,i=w.querySelector(`[data-replace-whole-word]`)?.checked??!1,a=A?K(G()).map(e=>e.id):void 0;B=Nt(G(),{fieldIds:[n],find:e,replacement:t,recordIds:a,caseSensitive:r,wholeWord:i}),z=`Preview found ${B.length} change${B.length===1?``:`s`}.`,$()}function Oi(){let e=(w.querySelector(`[data-teacher-notes]`)?.value??``).split(`
`).map(e=>e.trim()).filter(Boolean);Y(`teacher notes`),R=`none`,z=`Saved ${e.length} teacher note${e.length===1?``:`s`}.`,J({...E,updatedAt:new Date().toISOString(),teacher:{...E.teacher,notes:e}})}function ki(e){let t=w.querySelector(e)?.value;if(!t)return null;let[n,r]=t.split(`:`);return n&&r?{tableId:n,fieldId:r}:null}function Ai(){let e=w.querySelector(`[data-relationship-from-table]`)?.value??``,t=w.querySelector(`[data-relationship-to-table]`)?.value??``,n=ki(`[data-relationship-from-field]`),r=ki(`[data-relationship-to-field]`),i=w.querySelector(`[data-relationship-name]`)?.value??``;if(!e||!t||!n||!r){z=`Choose both tables and both match fields.`,$();return}if(n.tableId!==e||r.tableId!==t){z=`Match fields must belong to the tables you chose.`,$();return}let a=st(i,e,n.fieldId,t,r.fieldId);a.enforceKeys=!0,a.cardinality=w.querySelector(`[data-relationship-cardinality]`)?.value===`one-to-one`?`one-to-one`:`one-to-many`,E.schema.tables.find(e=>e.id===t)?.fields.find(e=>e.id===r.fieldId)?.primaryKey&&(a.cardinality=`one-to-one`);let o=pt(ct(E,a))[0];o?(V=o,z=o,$()):(V=``,Y(`relationship create`),z=`Created relationship: ${a.name}.`,J(ct(E,a)))}function ji(){Cn=w.querySelector(`[data-relationship-from-table]`)?.value??Cn,wn=w.querySelector(`[data-relationship-to-table]`)?.value??wn,$()}function Mi(e){return window.CSS&&typeof CSS.escape==`function`?CSS.escape(e):e.replace(/["\\]/g,`\\$&`)}function Ni(e,t){let n=w.querySelector(`.data-grid`);if(!n)return!1;let r=n.querySelector(`tr[data-record-row="${Mi(e)}"]`);if(!r)return!1;let i=r.querySelector(`.cell-input[data-field-id="${Mi(t)}"], .cell-checkbox[data-field-id="${Mi(t)}"]`);return i||=r.querySelector(`.cell-input, .cell-checkbox`),i?(i.focus(),i instanceof HTMLInputElement&&i.type!==`checkbox`&&i.select(),!0):!1}function Pi(e){Y(`add record`);let t=Oe(G()),n=t.records.at(-1);n&&(O=n.id,Sn={recordId:n.id,fieldId:e}),X(t)}function Fi(e,t,n,r){let i=Array.from(w.querySelectorAll(`.data-grid tbody tr[data-record-row]`)),a=i.findIndex(t=>t.dataset.recordRow===e),o=Q(G()).map(e=>e.id),s=o.indexOf(t);if(a<0||s<0)return;let c=a+n,l=s+r;r>0&&l>=o.length?(l=0,c=a+1):r<0&&l<0&&(l=o.length-1,c=a-1),c>=i.length?Pi(o[l]??o[0]):c<0||Ni(i[c].dataset.recordRow??e,o[l]??t)}function Ii(){if(!F)return null;let e=K(G()).map(e=>e.id),t=Q(G()).map(e=>e.id),n=e.indexOf(F.anchor.r),r=e.indexOf(F.focus.r),i=t.indexOf(F.anchor.f),a=t.indexOf(F.focus.f);return n<0||r<0||i<0||a<0?null:{rows:e,cols:t,r1:Math.min(n,r),r2:Math.max(n,r),c1:Math.min(i,a),c2:Math.max(i,a)}}function Li(){w.querySelectorAll(`.data-grid td.cell-range`).forEach(e=>e.classList.remove(`cell-range`));let e=Ii();if(e&&!((e.r2-e.r1+1)*(e.c2-e.c1+1)<=1))for(let t=e.r1;t<=e.r2;t+=1)for(let n=e.c1;n<=e.c2;n+=1)w.querySelector(`.data-grid [data-record-id="${Mi(e.rows[t])}"][data-field-id="${Mi(e.cols[n])}"]`)?.closest(`td`)?.classList.add(`cell-range`)}function Ri(e){if(!F)return;let t=K(G()).map(e=>e.id),n=Q(G()).map(e=>e.id),r=t.indexOf(F.focus.r),i=n.indexOf(F.focus.f);r<0||i<0||(e===`ArrowUp`?r=Math.max(0,r-1):e===`ArrowDown`?r=Math.min(t.length-1,r+1):e===`ArrowLeft`?i=Math.max(0,i-1):e===`ArrowRight`&&(i=Math.min(n.length-1,i+1)),F={anchor:F.anchor,focus:{r:t[r],f:n[i]}},Li())}function zi(){let e=Ii();if(!e||e.r2-e.r1===0&&e.c2-e.c1===0)return!1;let t=G(),n=new Map(t.records.map(e=>[e.id,e])),r=[];for(let i=e.r1;i<=e.r2;i+=1){let a=n.get(e.rows[i]);if(!a)continue;let o=[];for(let n=e.c1;n<=e.c2;n+=1)o.push(String(Z(t,a,e.cols[n])??``).replace(/\t/g,` `).replace(/\n/g,` `));r.push(o.join(`	`))}let i=r.join(`
`);navigator.clipboard?.writeText(i).catch(()=>void 0);let a=(e.r2-e.r1+1)*(e.c2-e.c1+1),o=w.querySelector(`.status-bar span:nth-last-child(2)`);return o&&(o.textContent=`Copied ${a} cells.`),!0}function Bi(e,t,n){let r=G(),i=K(r),a=Q(r).map(e=>e.id),o=i.findIndex(e=>e.id===t),s=a.indexOf(n);if(o<0||s<0)return;let c=e.replace(/\r/g,``).replace(/\n$/,``).split(`
`).map(e=>e.split(`	`));Y(`paste`);let l=new Map(r.records.map(e=>[e.id,e])),u=r.records.map(e=>e.id),d=0;c.forEach((e,t)=>{let n;if(o+t<i.length)n=i[o+t].id;else{let e=v(r.fields);l.set(e.id,e),u.push(e.id),n=e.id,d+=1}let c=l.get(n);if(!c)return;let f={...c.values};e.forEach((e,t)=>{let n=a[s+t],i=n?r.fields.find(e=>e.id===n):void 0;i&&![`calculation`,`autoNumber`,`createdAt`,`updatedAt`].includes(i.type)&&(f[i.id]=ke(e,i.type,i.options).value)}),l.set(n,{...c,updatedAt:new Date().toISOString(),values:f})}),F=null,z=`Pasted ${c.length} row${c.length===1?``:`s`}${d?` (${d} new)`:``}.`,X({...r,records:u.map(e=>l.get(e)).filter(Boolean)})}var Vi=[{value:`contains`,label:`contains`,needsValue:!0,needsSecond:!1},{value:`equals`,label:`is exactly`,needsValue:!0,needsSecond:!1},{value:`startsWith`,label:`starts with`,needsValue:!0,needsSecond:!1},{value:`endsWith`,label:`ends with`,needsValue:!0,needsSecond:!1},{value:`greaterThan`,label:`greater than`,needsValue:!0,needsSecond:!1},{value:`lessThan`,label:`less than`,needsValue:!0,needsSecond:!1},{value:`between`,label:`between`,needsValue:!0,needsSecond:!0},{value:`isEmpty`,label:`is empty`,needsValue:!1,needsSecond:!1},{value:`isNotEmpty`,label:`is not empty`,needsValue:!1,needsSecond:!1}];function Hi(e){return G().fields.find(t=>t.id===e)?.name??`field`}function Ui(e){return Vi.find(t=>t.value===e)?.label??e}function Wi(){let e=w.querySelector(`[data-find-match]`)?.value??`all`,t=[];w.querySelectorAll(`.find-rule`).forEach(e=>{let n=e.querySelector(`[data-find-field]`)?.value??``,r=e.querySelector(`[data-find-op]`)?.value??`contains`,i=e.querySelector(`[data-find-value]`)?.value??``,a=e.querySelector(`[data-find-value2]`)?.value??``;n&&t.push({fieldId:n,operator:r,value:i,value2:a})}),Zt={match:e,rules:t}}function Gi(){Wi(),N=Zt.rules.length?Zt:null,L=new Set,R=`none`;let e=K(G()).length;z=N?`Find is on: ${e} record${e===1?``:`s`} match.`:`Find cleared.`,$()}function Ki(){let e=[];w.querySelectorAll(`.sort-level`).forEach(t=>{let n=t.querySelector(`[data-sort-level-field]`)?.value??``,r=t.querySelector(`[data-sort-level-dir]`)?.value??`asc`;n&&e.push({fieldId:n,direction:r})}),Qt=e}function qi(){Ki(),M=Qt,R=`none`,z=M.length?`Sorting by ${M.map(e=>Hi(e.fieldId)).join(`, `)}.`:`Sort cleared.`,$()}function Ji(){return E.views??[]}function Yi(){let e=w.querySelector(`[data-view-name]`)?.value.trim()||`View ${Ji().length+1}`,t={id:_(`view`),name:e,tableId:D,mode:k,search:A,searchFieldId:j,find:N,sortKeys:M};Y(`save view`),z=`Saved view: ${e}.`,J({...E,updatedAt:new Date().toISOString(),views:[...Ji(),t]})}function Xi(e){let t=Ji().find(t=>t.id===e);t&&(E.schema.tables.some(e=>e.id===t.tableId)&&(D=t.tableId,Ln(G())),k=t.mode,A=t.search,j=t.searchFieldId,N=t.find,M=t.sortKeys,L=new Set,R=`none`,z=`Opened view: ${t.name}.`,$())}function Zi(e){Y(`delete view`),z=`Deleted a saved view.`,J({...E,updatedAt:new Date().toISOString(),views:Ji().filter(t=>t.id!==e)})}function Qi(e){let t=new Set(e.records.map(e=>e.id));return[...P].filter(e=>t.has(e))}function $i(){let e=G(),t=new Set(Qi(e));if(t.size===0)return;let n=e.records.filter(e=>!t.has(e.id));n.length===0?(z=`Keep at least one record. Some rows were not deleted.`,$()):window.confirm(`Delete ${t.size} selected record${t.size===1?``:`s`}? You can undo right after.`)&&(Y(`bulk delete`),P=new Set,z=`Deleted ${e.records.length-n.length} records.`,X({...e,records:n}))}function ea(){let e=G(),t=Qi(e);if(t.length===0)return;Y(`bulk duplicate`);let n=t.reduce((e,t)=>Me(e,t),e);P=new Set,z=`Duplicated ${t.length} record${t.length===1?``:`s`}.`,X(n)}function ta(){let e=G(),t=new Set(Qi(e)),n=w.querySelector(`[data-bulk-field]`)?.value??``,r=w.querySelector(`[data-bulk-value]`)?.value??``,i=e.fields.find(e=>e.id===n);if(!i||t.size===0){R=`none`,$();return}let a=ke(r,i.type,i.options).value;Y(`bulk fill`);let o=e.records.map(e=>t.has(e.id)?{...e,updatedAt:new Date().toISOString(),values:{...e.values,[n]:a}}:e);R=`none`,z=`Filled ${i.name} for ${t.size} record${t.size===1?``:`s`}.`,X({...e,records:o})}function na(e){let t=e.filter(e=>e.trim()!==``);return t.length===0?`text`:t.every(e=>!Number.isNaN(Number(e.replace(/[$,%\s]/g,``))))?`number`:t.every(e=>!Number.isNaN(new Date(e).getTime())&&/\d/.test(e))?`date`:t.every(e=>/^(yes|no|true|false)$/i.test(e.trim()))?`checkbox`:`text`}function ra(){w.querySelectorAll(`.csv-map-row`).forEach((e,t)=>{I[t]&&(I[t].action=e.querySelector(`[data-map-action]`)?.value??`new`,I[t].type=e.querySelector(`[data-map-type]`)?.value??`text`,I[t].fieldId=e.querySelector(`[data-map-existing]`)?.value??``)})}w.addEventListener(`click`,async e=>{let t=e.target,n=t.closest(`[data-action]`)?.dataset.action,r=t.closest(`[data-table-id]`)?.dataset.tableId,i=t.closest(`[data-template-id]`)?.dataset.templateId,a=t.closest(`[data-view-mode]`)?.dataset.viewMode,o=t.closest(`[data-select-record]`)?.dataset.selectRecord,s=t.closest(`[data-field-settings]`)?.dataset.fieldSettings,c=t.closest(`[data-record-action-id]`)?.dataset.recordActionId,l=t.closest(`[data-quality-field-id]`),u=t.closest(`[data-close-table-id]`)?.dataset.closeTableId;if(u){let e=E.schema.tables.filter(e=>e.id!==u&&!Jt.has(e.id));if(!e.length)return;Jt.add(u),D===u&&(D=e[0].id,q(),M=[],P=new Set,F=null,Ln(G())),$(),w.querySelector(`.table-tab.active`)?.focus();return}if(r){D=r,q(),M=[],P=new Set,F=null,Ln(G()),$();return}if(i){cr(i);return}if(a){k=a,$();return}if(o){O=o,k===`table`&&$();return}if(s){vn=s,$t=``,V=``,R=`field`,$();return}let d=t.closest(`[data-formula-insert]`)?.dataset.formulaInsert;if(d){let e=w.querySelector(`[data-field-formula]`);if(e){let t=e.selectionStart??e.value.length;e.value=e.value.slice(0,t)+d+e.value.slice(e.selectionEnd??t),e.focus()}}else{if(l){let e=l.dataset.qualityFieldId,t=l.dataset.qualityKind;if(e&&t){let n=t===`duplicates`?jt(G(),e):Mt(G(),e);L=new Set(n.map(e=>e.id));let r=G().fields.find(t=>t.id===e);z=`Highlighted ${n.length} ${t===`duplicates`?`duplicate`:`missing`} record${n.length===1?``:`s`} in ${r?.name??`this field`}.`,R=`none`,$();return}}if(n){if(Gn(),n===`new`){if(T&&!await T.beginReplace().then(e=>(e?.finish(),!!e))||!T&&!window.confirm(`Start a new database? Your current one is replaced here — export it first if you want to keep a copy. You can also undo right after.`))return;Y(`new database`);let e=we(`Untitled Database`);D=e.schema.tables[0].id,O=e.schema.tables[0].records[0]?.id??``,L=new Set,J(e)}else if(n===`save-json`)qn();else if(n===`save-drive`){let e=JSON.stringify(E,null,2);ae({appName:`ListSplat`,fileName:`${E.metadata.title||`listsplat-project`}.listsplat.json`,buildFile:()=>new Blob([e],{type:`application/json`})}).catch(e=>{z=e.message,$()})}else if(n===`open-json`)w.querySelector(`[data-open-json]`)?.click();else if(n===`import-markdown`)Dn=``,On=`Imported Markdown`,kn=``,R=`markdownImport`,$();else if(n===`preview-markdown`){let e=Number(w.querySelector(`[data-markdown-table]`)?.value??`0`),t=Ye(Dn)[e];if(!t){kn=`Include a Markdown table with a header and separator row.`,$();return}On=w.querySelector(`[data-markdown-name]`)?.value||`Imported Markdown`,rr(Xe(On,t),On,`Markdown`)}else if(n===`import-csv`)w.querySelector(`[data-import-csv]`)?.click();else if(n===`export-csv`)Jn();else if(n===`export-found-csv`)Yn();else if(n===`export-markdown`)Qn();else if(n===`export-report`)$n();else if(n===`project-packet`)er();else if(n===`print`)window.print();else if(n===`add-record`){Y(`add record`);let e=G(),t=Oe(e),n=t.records[t.records.length-1];for(let t of e.fields)!t.primaryKey&&Er(e.id,t.id)&&(n.values[t.id]=``);X(t)}else if(n===`add-field`){let e=w.querySelector(`[data-new-field]`),t=w.querySelector(`[data-new-field-type]`)?.value;Y(`add field`),X(Te(G(),e?.value||`New Field`,t??`text`))}else if(n===`add-table`){let e=window.prompt(`New table name?`,`New Table`)??``;Y(`add table`);let t=Fe(E,e);D=t.schema.tables.at(-1)?.id??D,O=G().records[0]?.id??``,J(t)}else if(n===`duplicate-record`&&c)Y(`duplicate record`),X(Me(G(),c));else if(n===`delete-record`&&c){if(G().records.length<=1){z=`Keep at least one record. Add another before deleting this one.`,$();return}if(!window.confirm(`Delete this record? You can undo right after with Ctrl+Z.`))return;Y(`delete record`),X(Ne(G(),c))}else if(n===`toggle-sort`){if(M.length)M=[{...M[0],direction:M[0].direction===`asc`?`desc`:`asc`},...M.slice(1)];else{let e=G().fields[0];e&&(M=[{fieldId:e.id,direction:`asc`}])}$()}else if(n===`sort`||n===`sort-dialog`)Qt=M.length?M.map(e=>({...e})):[{fieldId:G().fields[0]?.id??``,direction:`asc`}],R=`sort`,$();else if(n===`find`)Zt=N?{match:N.match,rules:N.rules.map(e=>({...e}))}:{match:`all`,rules:[{fieldId:G().fields[0]?.id??``,operator:`contains`,value:``}]},R=`find`,$();else if(n===`views`)R=`views`,$();else if(n===`sort-add-level`)Ki(),Qt.push({fieldId:G().fields[0]?.id??``,direction:`asc`}),$();else if(n===`sort-remove-level`){Ki();let e=Number(t.closest(`[data-level-index]`)?.dataset.levelIndex??`-1`);e>=0&&Qt.splice(e,1),$()}else if(n===`sort-toggle`){let e=t.closest(`[data-sort-toggle]`)?.dataset.sortToggle;if(e){let t=M.find(t=>t.fieldId===e);M=[{fieldId:e,direction:t&&t.direction===`asc`?`desc`:`asc`}],$()}}else if(n===`apply-sort`)qi();else if(n===`clear-sort`)Ki(),Qt=[],$();else if(n===`find-add-rule`)Wi(),Zt.rules.push({fieldId:G().fields[0]?.id??``,operator:`contains`,value:``}),$();else if(n===`find-remove-rule`){Wi();let e=Number(t.closest(`[data-rule-index]`)?.dataset.ruleIndex??`-1`);e>=0&&Zt.rules.splice(e,1),$()}else if(n===`apply-find`)Gi();else if(n===`save-view`)Yi();else if(n===`apply-view`){let e=t.closest(`[data-view-id]`)?.dataset.viewId;e&&Xi(e)}else if(n===`delete-view`){let e=t.closest(`[data-view-id]`)?.dataset.viewId;e&&Zi(e)}else if(n===`bulk-delete`)$i();else if(n===`bulk-duplicate`)ea();else if(n===`bulk-fill`)Qi(G()).length&&(R=`bulkFill`,$());else if(n===`apply-bulk-fill`)ta();else if(n===`bulk-clear`)P=new Set,$();else if(n===`expand-record`&&c)O=c,k=`form`,$();else if(n===`camera-capture`){let e=t.closest(`[data-record-id]`)?.dataset.recordId,n=t.closest(`[data-field-id]`)?.dataset.fieldId;e&&n&&(mn={recordId:e,fieldId:n},R=`camera`,$(),xi())}else if(n===`camera-shoot`)Ci();else if(n===`record-audio`){let e=t.closest(`[data-record-id]`)?.dataset.recordId,n=t.closest(`[data-field-id]`)?.dataset.fieldId;e&&n&&bi(e,n)}else if(n===`add-comment`){let e=w.querySelector(`[data-comment-text]`)?.value.trim()??``,t=w.querySelector(`[data-comment-teacher]`)?.checked??!1;e&&Un(n=>({...n,comments:[...n.comments??[],{id:_(`comment`),author:jr(),text:e,at:new Date().toISOString(),teacherOnly:t}]}),`add comment`)}else if(n===`delete-comment`){let e=t.closest(`[data-comment-id]`)?.dataset.commentId;e&&Un(t=>({...t,comments:(t.comments??[]).filter(t=>t.id!==e)}),`delete comment`)}else if(n===`save-version`)Un(e=>({...e,history:[...e.history??[],{at:new Date().toISOString(),values:{...e.values}}].slice(-20)}),`save version`),z=`Saved a version snapshot.`;else if(n===`restore-version`){let e=Number(t.closest(`[data-version-index]`)?.dataset.versionIndex??`-1`);Un(t=>{let n=(t.history??[])[e];return n?{...t,updatedAt:new Date().toISOString(),values:{...t.values,...n.values}}:t},`restore version`),z=`Restored an earlier version.`}else if(n===`edit-rubric`)en=(E.rubricCriteria??[]).map(e=>({...e})),en.length||(en=[{id:_(`crit`),label:`Ideas`,max:4}]),R=`rubric`,$();else if(n===`rubric-add`)Wn(),en.push({id:_(`crit`),label:`New criterion`,max:4}),$();else if(n===`rubric-remove`){Wn();let e=Number(t.closest(`[data-crit-index]`)?.dataset.critIndex??`-1`);e>=0&&en.splice(e,1),$()}else if(n===`save-rubric`)Wn(),Y(`rubric`),R=`none`,z=`Saved the rubric.`,J({...E,updatedAt:new Date().toISOString(),rubricCriteria:en});else if(n===`open-related`){let e=t.closest(`[data-rel-table]`)?.dataset.relTable,n=t.closest(`[data-rel-record]`)?.dataset.relRecord;e&&n&&(D=e,O=n,q(),M=[],k=`form`,$())}else if(n===`add-related`){let e=t.closest(`[data-rel-id]`)?.dataset.relId,n=E.schema.relationships.find(t=>t.id===e),r=G().records.find(e=>e.id===O),i=n?E.schema.tables.find(e=>e.id===n.toTableId):void 0;if(n&&r&&i){Y(`add related record`);let e=r.values[n.fromFieldId]??``,t=Oe(i).records.at(-1),a={...t,values:{...t.values,[n.toFieldId]:e}},o=y(E,{...i,records:[...i.records,a]});D=i.id,O=a.id,q(),M=[],k=`form`,z=`Added a ${i.name} record linked to ${wr(G(),r)}.`,J(o)}}else if(n===`cal-prev`)Gr(-1),$();else if(n===`cal-next`)Gr(1),$();else if(n===`cal-today`)on=``,$();else if(n===`bulk-archive`||n===`bulk-restore`){let e=n===`bulk-archive`,t=new Set(Qi(G()));if(t.size){Y(e?`archive records`:`restore records`);let n=G();P=new Set,z=`${e?`Archived`:`Restored`} ${t.size} record${t.size===1?``:`s`}.`,X({...n,records:n.records.map(n=>t.has(n.id)?{...n,archived:e}:n)})}}else if(n===`toggle-archived`)tn=!tn,P=new Set,z=tn?`Showing archived records.`:`Showing active records.`,$();else if(n===`rename-table`){let e=G(),t=window.prompt(`Rename table`,e.name);t&&t.trim()&&(Y(`rename table`),J(Ie(E,e.id,t)))}else if(n===`duplicate-table`){Y(`duplicate table`);let e=Le(E,D);D=e.newTableId,q(),M=[],P=new Set,z=`Duplicated the table.`,J(e.project)}else if(n===`move-table-left`||n===`move-table-right`)Y(`move table`),J(Re(E,D,n===`move-table-left`?-1:1));else if(n===`delete-table`){if(E.schema.tables.length<=1){z=`A database needs at least one table.`,$();return}if(window.confirm(`Delete the table "${G().name}" and all its records? You can undo right after.`)){Y(`delete table`);let e=ze(E,D);D=e.schema.tables[0].id,q(),M=[],P=new Set,z=`Deleted the table.`,J(e)}}else if(n===`structure-copy`)qn(Be(E)),z=`Saved a structure-only copy (no records).`,$();else if(n===`highlight-invalid`){let e=zt(G());L=new Set(e.map(e=>e.record.id)),R=`none`,z=`Highlighted ${L.size} record${L.size===1?``:`s`} with rule problems.`,$()}else if(n===`duplicates`){let e=j===`all`?G().fields[0]?.id:j;L=new Set(jt(G(),e).map(e=>e.id)),z=`Found ${L.size} duplicate record${L.size===1?``:`s`}.`,$()}else if(n===`missing`){let e=j===`all`?G().fields[0]?.id:j;L=new Set(Mt(G(),e).map(e=>e.id)),z=`Found ${L.size} record${L.size===1?``:`s`} with missing values.`,$()}else if(n===`clear-find`)q(),z=`Showing all records.`,$();else if(n===`replace`)B=[],R=`replace`,$();else if(n===`preview-replace`)Di();else if(n===`run-replace`)Ei();else if(n===`save-teacher-notes`)Oi();else if(n===`apply-csv-new`)sr(`new`);else if(n===`apply-csv-append`)sr(`append`);else if(n===`save-field-settings`)Y(`field settings`),Ti();else if(n===`layout-designer`||n===`lock-layout`)R=`layout`,$();else if(n===`layout-field-up`||n===`layout-field-down`){let e=t.closest(`[data-layout-field-id]`)?.dataset.layoutFieldId,r=mr();if(e&&r){let t=gr(G()).map(e=>e.id),r=t.indexOf(e),i=n===`layout-field-up`?r-1:r+1;r>=0&&i>=0&&i<t.length&&([t[r],t[i]]=[t[i],t[r]],Y(`layout order`),R=`layout`,Cr({fieldOrder:t}))}}else if(n===`save-layout-settings`){let e=w.querySelector(`[data-layout-locked]`)?.checked??!1,t=new Set([...w.querySelectorAll(`[data-layout-field-visible]:checked`)].map(e=>e.dataset.layoutFieldVisible??``)),n=gr(G()).map(e=>e.id),r=n.filter(e=>!t.has(e));Y(`layout settings`),R=`none`,Cr({locked:e,fieldOrder:n,hiddenFieldIds:r})}else if(n===`generate-primary-key`){let e=E.schema.tables.find(e=>e.id===Cn)??G();if(e.fields.some(e=>e.primaryKey)){V=`This table already has a primary key. Edit its column heading to change it.`,$();return}let t={...Se(`ID`,`number`),primaryKey:!0,required:!0,unique:!0},n={...e,fields:[...e.fields,t],records:e.records.map((e,n)=>({...e,values:{...e.values,[t.id]:n+1}}))};Y(`add primary key`),V=``,J(y(E,n))}else if(n===`remove-relationship`){let e=t.closest(`[data-relationship-id]`)?.dataset.relationshipId;Y(`remove relationship`),V=``,J({...E,schema:{...E.schema,relationships:E.schema.relationships.filter(t=>t.id!==e)}})}else if(n===`create-relationship`)Ai();else if(n===`undo-change`)Vn();else if(n===`redo-change`)Hn();else if(n===`close-dialog`)R===`camera`&&(Si(),mn=null),R=`none`,B=[],H=null,$();else if(n.endsWith(`-view`))k=n.replace(`-view`,``),$();else if(n===`templates`)z=`Template starters are in the Teacher panel.`,$();else if(n===`student-view`)Y(`student view toggle`),z=E.teacher.studentView?`Teacher tools are visible again.`:`Student view is on.`,J({...E,updatedAt:new Date().toISOString(),teacher:{...E.teacher,studentView:!E.teacher.studentView}});else if(n===`project-ideas`)R=`projectIdeas`,$();else if(n===`relationships`)V=``,R=`relationship`,$();else if(n===`charts`)un||=G().fields.find(e=>!e.hidden&&![`image`,`longText`,`calculation`].includes(e.type))?.id??``,R=`charts`,$();else if(n===`maintenance`)R=`maintenance`,$();else if(n===`accessibility`)R=`accessibility`,$();else if(n===`guided`)R=`guided`,$();else if(n===`share-html`)Zn();else if(n===`remove-duplicates`){Y(`remove duplicates`);let e=G().records.length,t=Ue(G());R=`none`,z=`Removed ${e-t.records.length} duplicate record${e-t.records.length===1?``:`s`}.`,X(t)}else if(n===`remove-broken`)Y(`remove broken relationships`),R=`none`,z=`Removed broken relationships.`,J(Ke(E));else if(n===`duplicate-project`)qn({...E,metadata:{...E.metadata,title:`${E.metadata.title} copy`}}),z=`Saved a copy of the whole project.`,$();else if(n===`guided-create`){let e=t.closest(`[data-guided-kind]`)?.dataset.guidedKind,n=fi.find(t=>t.id===e);if(n){let e=w.querySelector(`[data-guided-name]`)?.value.trim()||n.label;Y(`guided build`);let t=Fe(E,e),r=t.schema.tables.at(-1).id,i=t.schema.tables.find(e=>e.id===r);i={...i,fields:[],records:[]},n.fields.forEach(([e,t])=>{i=Te(i,e,t)}),i={...i,records:[v(i.fields)]},t=y(t,i),D=r,O=i.records[0].id,q(),M=[],R=`none`,k=`table`,z=`Built the "${e}" table. Add records and adjust fields any time.`,J(t)}}else n===`functions`?(R=`functions`,$()):n===`quality`?(R=`quality`,$()):n===`teacher-notes`?(R=`teacherNotes`,$()):n.startsWith(`help-`)?(R=`help`,$()):(z=`That ListSplatTM control is not available in this workspace.`,$())}}}),w.addEventListener(`change`,e=>{let t=e.target;if(t.matches(`[data-markdown-file]`)&&t instanceof HTMLInputElement&&t.files?.[0]){let e=t.files[0];e.text().then(t=>{Dn=t,On=e.name.replace(/\.(md|markdown)$/i,``),kn=``,$()}).catch(e=>{kn=String(e.message||e),$()})}else if(t.matches(`[data-reopen-table]`)){if(!E.schema.tables.some(e=>e.id===t.value))return;D=t.value,Jt.delete(D),q(),M=[],P=new Set,F=null,Ln(G()),$(),w.querySelector(`.table-tab.active`)?.focus()}else if(t.matches(`#languageSwitcher`)&&t instanceof HTMLSelectElement){An=jn(t.value);try{localStorage.setItem(Wt,An)}catch{}$()}else if(t.matches(`[data-open-json]`)&&t instanceof HTMLInputElement&&t.files?.[0])tr(t.files[0]),t.value=``;else if(t.matches(`[data-import-csv]`)&&t instanceof HTMLInputElement&&t.files?.[0])tr(t.files[0]),t.value=``;else if(t.matches(`[data-search-field]`))j=t.value,L=new Set,$();else if(t.matches(`[data-sort-field]`)){let e=M[0]?.direction??`asc`;M=t.value?[{fieldId:t.value,direction:e}]:[],$()}else if(t.matches(`[data-group-field]`))nn=t.value,$();else if(t.matches(`[data-board-field]`))rn=t.value,$();else if(t.matches(`[data-calendar-field]`))an=t.value,$();else if(t.matches(`[data-wrap-toggle]`)&&t instanceof HTMLInputElement)sn=t.checked,$();else if(t.matches(`[data-chart-type]`))ln=t.value,$();else if(t.matches(`[data-chart-category]`))un=t.value,$();else if(t.matches(`[data-chart-value-mode]`))dn=t.value,$();else if(t.matches(`[data-chart-value-field]`))fn=t.value,$();else if(t.matches(`[data-rubric-criterion]`)&&t instanceof HTMLInputElement){let e=t.dataset.rubricCriterion??``,n=t.value===``?void 0:Number(t.value);Un(t=>{let r={...t.rubricScores??{}};return n==null||Number.isNaN(n)?delete r[e]:r[e]=n,{...t,rubricScores:r}},`rubric score`)}else if(t.matches(`[data-select-all]`)&&t instanceof HTMLInputElement){let e=K(G()).map(e=>e.id);P=t.checked?new Set(e):new Set,$()}else if(t.matches(`[data-select-row]`)&&t instanceof HTMLInputElement){let e=t.dataset.selectRow??``;t.checked?P.add(e):P.delete(e),$()}else if(t.matches(`[data-field-type]`))$t=t.value,$();else if(t.matches(`[data-find-op]`))Wi(),$();else if(t.matches(`[data-map-action]`))ra(),$();else if(t.matches(`[data-csv-key]`))ra(),gn=t.value,$();else if(t.matches(`[data-csv-dup]`))ra(),_n=t.value,$();else if(t.matches(`[data-relationship-from-table], [data-relationship-to-table]`))ji();else if(t.matches(`.file-input`)&&t instanceof HTMLInputElement&&t.files?.[0]){let e=t.dataset.recordId,n=t.dataset.fieldId;e&&n&&yi(e,n,t.files[0])}else if(t.matches(`.multi-option`)&&t instanceof HTMLInputElement){let e=t.closest(`.multi-cell`),n=t.dataset.recordId,r=t.dataset.fieldId;if(e&&n&&r){let t=Array.from(e.querySelectorAll(`.multi-option:checked`)).map(e=>e.dataset.multiOption??``);Rn(n,r),E=y(E,Pe(G(),n,r,t.join(`, `))),Xt(E),$()}}else if(t.matches(`.cell-input, .cell-checkbox, .image-input`)&&(t instanceof HTMLInputElement||t instanceof HTMLTextAreaElement||t instanceof HTMLSelectElement)){if(t instanceof HTMLInputElement&&t.type===`file`&&t.files?.[0]){let e=t.dataset.recordId,n=t.dataset.fieldId,r=t.files[0];e&&n&&wi(e,n,r,`image upload`)}else t.dataset.recordId&&t.dataset.fieldId&&Rn(t.dataset.recordId,t.dataset.fieldId),gi(t)}}),w.addEventListener(`paste`,e=>{let t=e.target,n=t.closest(`.image-cell`);if(n){let t=n.dataset.recordId,r=n.dataset.fieldId,i=Array.from(e.clipboardData?.items??[]).find(e=>e.type.startsWith(`image/`))?.getAsFile();t&&r&&i&&(e.preventDefault(),wi(t,r,i,`image paste`));return}let r=t.closest(`.cell-input`);if(!r||!r.closest(`.data-grid`)||!r.dataset.recordId||!r.dataset.fieldId)return;let i=e.clipboardData?.getData(`text/plain`)??``;/[\t\n]/.test(i.replace(/\n$/,``))&&(e.preventDefault(),Bi(i,r.dataset.recordId,r.dataset.fieldId))}),w.addEventListener(`input`,e=>{let t=e.target;if(t.matches(`[data-markdown-text]`))Dn=t.value,or();else if(t.matches(`[data-markdown-name]`))On=t.value;else if(t.matches(`[data-project-title]`))Kn(t.value);else if(t.matches(`[data-search]`))A=t.value,L=new Set,$();else if(t.matches(`.cell-input`)&&(t instanceof HTMLInputElement||t instanceof HTMLTextAreaElement||t instanceof HTMLSelectElement)){if(t.dataset.recordId&&t.dataset.fieldId&&Rn(t.dataset.recordId,t.dataset.fieldId),G().fields.find(e=>e.id===t.dataset.fieldId)?.primaryKey||Er(D,t.dataset.fieldId??``))return;gi(t)}}),w.addEventListener(`focusout`,e=>{e.target.matches?.(`.cell-input, .cell-checkbox`)&&(xn=``)}),w.addEventListener(`mousedown`,e=>{let t=e.target.closest(`[data-record-id][data-field-id]`);if(!t||!t.closest(`.data-grid`)||!t.dataset.recordId||!t.dataset.fieldId)return;let n={r:t.dataset.recordId,f:t.dataset.fieldId};e.shiftKey&&F?(e.preventDefault(),F={anchor:F.anchor,focus:n}):F={anchor:n,focus:n},Li()}),w.addEventListener(`pointerdown`,e=>{let t=e.target.closest(`[data-col-resize]`);if(!t)return;e.preventDefault(),e.stopPropagation();let n=t.dataset.colResize??``,r=t.closest(`th`);if(!r)return;r.setAttribute(`draggable`,`false`);let i=e.clientX,a=r.getBoundingClientRect().width,o=Math.round(a),s=e=>{o=Math.max(80,Math.round(a+(e.clientX-i))),r.style.width=`${o}px`,r.style.minWidth=`${o}px`},c=()=>{document.removeEventListener(`pointermove`,s),document.removeEventListener(`pointerup`,c),r.setAttribute(`draggable`,`true`);let e=mr();e&&(Y(`resize column`),Cr({columnWidths:{...e.columnWidths??{},[n]:o}}))};document.addEventListener(`pointermove`,s),document.addEventListener(`pointerup`,c)});var ia=null;w.addEventListener(`dragstart`,e=>{let t=e.target,n=t.closest(`.kanban-card[data-kanban-card]`);if(n){cn=n.dataset.kanbanCard??null,e.dataTransfer?.setData(`text/plain`,cn??``);return}if(t.closest(`[data-col-resize]`))return;let r=t.closest(`.col-head[data-col-field]`);r&&(ia=r.dataset.colField??null,e.dataTransfer?.setData(`text/plain`,ia??``))}),w.addEventListener(`dragover`,e=>{let t=e.target;(ia&&t.closest(`.col-head[data-col-field]`)||cn&&t.closest(`.kanban-col`))&&e.preventDefault()}),w.addEventListener(`drop`,e=>{let t=e.target.closest(`.kanban-col`);if(t&&cn&&rn){e.preventDefault();let n=cn;cn=null;let r=t.dataset.kanbanCol??``;Y(`move card`);let i=y(E,Pe(G(),n,rn,r)),a=mt(E,i);if(a){z=`Change blocked: ${a}`,$();return}E=i,Xt(E),z=`Moved card to ${r||`Unassigned`}.`,$();return}let n=e.target.closest(`.col-head[data-col-field]`);if(!n||!ia)return;e.preventDefault();let r=n.dataset.colField??``,i=ia;if(ia=null,!r||r===i)return;let a=gr(G()).map(e=>e.id),o=a.indexOf(i),s=a.indexOf(r);o<0||s<0||(a.splice(s,0,a.splice(o,1)[0]),Y(`reorder columns`),Cr({fieldOrder:a}))}),w.addEventListener(`keydown`,e=>{let t=e.target;if(!t.matches?.(`.cell-input, .cell-checkbox`))return;let n=t.dataset.recordId,r=t.dataset.fieldId;if(!n||!r)return;let i=t instanceof HTMLTextAreaElement,a=t instanceof HTMLSelectElement;if(e.shiftKey&&[`ArrowUp`,`ArrowDown`,`ArrowLeft`,`ArrowRight`].includes(e.key)&&!i&&!a)F||={anchor:{r:n,f:r},focus:{r:n,f:r}},e.preventDefault(),Ri(e.key);else if(e.key===`Escape`&&F)F=null,Li();else switch(e.key){case`Enter`:i||(e.preventDefault(),Fi(n,r,e.shiftKey?-1:1,0));break;case`ArrowDown`:!i&&!a&&(e.preventDefault(),Fi(n,r,1,0));break;case`ArrowUp`:!i&&!a&&(e.preventDefault(),Fi(n,r,-1,0));break;case`Tab`:e.preventDefault(),Fi(n,r,0,e.shiftKey?-1:1)}}),document.addEventListener(`keydown`,e=>{let t=e.target,n=t.closest(`.menu`);if(n&&e.key===`Escape`){e.preventDefault();let r=t.closest(`.file-submenu`);r?.open?(r.open=!1,r.querySelector(`summary`)?.focus()):(Gn(),n.querySelector(`summary`)?.focus());return}let r=t.closest(`.file-submenu`);if(r&&e.key===`ArrowRight`&&t.matches(`summary`)){e.preventDefault(),r.open=!0,r.querySelector(`button`)?.focus();return}if(r&&e.key===`ArrowLeft`){e.preventDefault(),r.open=!1,r.querySelector(`summary`)?.focus();return}if(!(e.ctrlKey||e.metaKey))return;let i=e.key.toLowerCase();i===`c`?zi()&&e.preventDefault():i===`z`&&!e.shiftKey?(e.preventDefault(),Vn()):i===`y`||i===`z`&&e.shiftKey?(e.preventDefault(),Hn()):i===`s`&&(e.preventDefault(),qn(),z=`Saved a .listsplat.json file to your downloads.`,$())}),document.addEventListener(`click`,e=>{e.target.closest(`.menu`)||Gn()}),document.addEventListener(`toggle`,e=>{let t=e.target;t instanceof HTMLDetailsElement&&t.matches(`.file-submenu`)&&t.open?t.parentElement?.querySelectorAll(`.file-submenu[open]`).forEach(e=>{e!==t&&(e.open=!1)}):t instanceof HTMLDetailsElement&&t.matches(`.menu`)&&t.open&&document.querySelectorAll(`.menu[open]`).forEach(e=>{e!==t&&(e.open=!1)})},!0),$(),T=i(`listsplat`,{snapshot:()=>E,file:e=>({name:(e.metadata.title||`database`)+`.listsplat.json`,blob:new Blob([JSON.stringify(e,null,2)],{type:`application/json`})}),status:e=>{z=e,$()},open:()=>w.querySelector(`[data-open-json]`)?.click(),openFile:tr,help:()=>{R=`help`,$()}}),ye(`listsplat`).then(e=>{e&&tr(e)}).catch(e=>window.alert(e.message||String(e)));