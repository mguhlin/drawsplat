const form=document.getElementById('setup-form'),status=document.getElementById('setup-status');
// Unique starter password exists only in this installation tab; never in shared source or storage.
const passwordAlphabet='ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#_-';
const starterBytes=crypto.getRandomValues(new Uint8Array(24));
form.elements.adminEmail.value='admin@localhost.test';
form.elements.adminPassword.value=Array.from(starterBytes,b=>passwordAlphabet[b%passwordAlphabet.length]).join('');
document.getElementById('show-admin-password').onchange=event=>{form.elements.adminPassword.type=event.target.checked?'text':'password';};
document.getElementById('copy-admin-login').onclick=async()=>{const copyStatus=document.getElementById('copy-login-status');try{await navigator.clipboard.writeText('DrawSplat district administrator\nEmail: '+document.getElementById('installed-admin-email').value+'\nPassword: '+document.getElementById('installed-admin-password').value);copyStatus.textContent='Login details copied.';}catch{copyStatus.textContent='Select the email and password above and copy them manually.';}};
async function submit(action){
 const body=Object.fromEntries(new FormData(form));body.ssl=form.elements.ssl.checked;body.action=action;
 form.querySelectorAll('button').forEach(b=>b.disabled=true);status.textContent=action==='test'?'Testing database connection…':'Applying schema and creating your administrator…';
 try{const response=await fetch('/setup',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});const out=await response.json();if(!response.ok)throw new Error(out.error);status.textContent=action==='test'?`${out.database} connection works.`:out.message;if(action==='finish'){document.getElementById('installed-admin-email').value=body.adminEmail;document.getElementById('installed-admin-password').value=body.adminPassword;document.getElementById('setup-login-details').hidden=false;form.hidden=true;form.reset();}}
 catch(error){status.textContent=error.message;}finally{form.querySelectorAll('button').forEach(b=>b.disabled=false);}
}
document.getElementById('test-db').onclick=()=>submit('test');form.onsubmit=event=>{event.preventDefault();submit('finish');};
