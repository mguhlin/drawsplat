(function(){
  const ACCESS_KEY='drawsplat.adminAccess';
  // Public builds do not include a working admin password. Set this to the
  // SHA-256 hash of your deployment password, or use server-side auth/SSO.
  const PASSWORD_HASH='042f36d69b1b5ffec86e7edbf04d8fda1ffda2a54e5a8d383f951939c34198fd';
  const $=id=>document.getElementById(id);

  function toHex(buffer){
    return Array.from(new Uint8Array(buffer)).map(b=>b.toString(16).padStart(2,'0')).join('');
  }

  async function sha256(text){
    const data=new TextEncoder().encode(text);
    return toHex(await crypto.subtle.digest('SHA-256',data));
  }

  function unlock(){
    document.body.classList.remove('admin-locked');
    document.body.classList.add('admin-unlocked');
  }

  function lock(){
    document.body.classList.add('admin-locked');
    document.body.classList.remove('admin-unlocked');
  }

  function setMessage(message,cls=''){
    const el=$('adminGateMessage');
    if(!el) return;
    el.textContent=message;
    el.className='hint '+cls;
  }

  async function submitPassword(){
    const input=$('adminGatePassword');
    const password=input?.value||'';
    if(!PASSWORD_HASH){
      return setMessage('Admin access is not configured in this public build. Request access from the developer or configure your own deployment hash.','danger');
    }
    if(!password) return setMessage('Enter the admin password.','danger');
    try{
      const hash=await sha256(password);
      if(hash===PASSWORD_HASH){
        sessionStorage.setItem(ACCESS_KEY,'1');
        if(input) input.value='';
        unlock();
      }else{
        setMessage('Password not accepted. Request admin access if you need it.','danger');
      }
    }catch(err){
      setMessage('Could not verify password: '+err.message,'danger');
    }
  }

  function signOut(){
    sessionStorage.removeItem(ACCESS_KEY);
    lock();
    setMessage('Admin access locked for this tab.','success');
  }

  function init(){
    if(sessionStorage.getItem(ACCESS_KEY)==='1') unlock();
    else lock();
    $('adminGateSubmit')?.addEventListener('click',submitPassword);
    $('adminGatePassword')?.addEventListener('keydown',event=>{if(event.key==='Enter')submitPassword()});
    $('adminSignOutBtn')?.addEventListener('click',signOut);
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init);
  else init();
})();
