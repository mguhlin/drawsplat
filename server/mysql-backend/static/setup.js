const form=document.getElementById('setup-form'),status=document.getElementById('setup-status');
async function submit(action){
 const body=Object.fromEntries(new FormData(form));body.ssl=form.elements.ssl.checked;body.action=action;
 form.querySelectorAll('button').forEach(b=>b.disabled=true);status.textContent=action==='test'?'Testing database connection…':'Applying schema and creating your administrator…';
 try{const response=await fetch('/setup',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});const out=await response.json();if(!response.ok)throw new Error(out.error);status.textContent=action==='test'?`${out.database} connection works.`:out.message;if(action==='finish'){form.hidden=true;form.reset();}}
 catch(error){status.textContent=error.message;}finally{form.querySelectorAll('button').forEach(b=>b.disabled=false);}
}
document.getElementById('test-db').onclick=()=>submit('test');form.onsubmit=event=>{event.preventDefault();submit('finish');};
