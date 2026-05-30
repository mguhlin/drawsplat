(function(){
  const ACCESS_KEY='drawsplat.adminAccess';
  // Public builds do not include a working admin password. Set these to the
  // SHA-256 hashes of your deployment passwords, or use server-side auth/SSO.
  // ADMIN: full read/write access.
  const PASSWORD_HASH='042f36d69b1b5ffec86e7edbf04d8fda1ffda2a54e5a8d383f951939c34198fd';
  // VIEWER: read-only access — panel is visible but inputs and buttons are
  // disabled. Leave empty to disable viewer access. Generate with, e.g.,
  //   echo -n 'your-viewer-password' | sha256sum
  const VIEWER_HASH='';
  const $=id=>document.getElementById(id);

  function toHex(buffer){
    return Array.from(new Uint8Array(buffer)).map(b=>b.toString(16).padStart(2,'0')).join('');
  }

  async function sha256(text){
    const data=new TextEncoder().encode(text);
    return toHex(await crypto.subtle.digest('SHA-256',data));
  }

  function applyRole(role){
    const body=document.body;
    body.classList.remove('admin-locked','admin-unlocked','admin-full','admin-viewer');
    if(role==='admin'){
      body.classList.add('admin-unlocked','admin-full');
    }else if(role==='viewer'){
      body.classList.add('admin-unlocked','admin-viewer');
    }else{
      body.classList.add('admin-locked');
    }
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
    if(!PASSWORD_HASH && !VIEWER_HASH){
      return setMessage('Admin access is not configured in this public build. Request access from the developer or configure your own deployment hash.','danger');
    }
    if(!password) return setMessage('Enter the admin password.','danger');
    try{
      const hash=await sha256(password);
      if(PASSWORD_HASH && hash===PASSWORD_HASH){
        sessionStorage.setItem(ACCESS_KEY,'admin');
        if(input) input.value='';
        applyRole('admin');
      }else if(VIEWER_HASH && hash===VIEWER_HASH){
        sessionStorage.setItem(ACCESS_KEY,'viewer');
        if(input) input.value='';
        applyRole('viewer');
      }else{
        setMessage('Password not accepted. Request admin access if you need it.','danger');
      }
    }catch(err){
      setMessage('Could not verify password: '+err.message,'danger');
    }
  }

  function signOut(){
    sessionStorage.removeItem(ACCESS_KEY);
    applyRole(null);
    setMessage('Admin access locked for this tab.','success');
  }

  // Defense-in-depth: even if CSS is bypassed in DevTools, swallow clicks and
  // submits on mutating controls while in viewer mode. Whitelist elements that
  // opt in with [data-viewer-ok].
  function blockMutation(event){
    if(!document.body.classList.contains('admin-viewer')) return;
    const target=event.target.closest('button, input, select, textarea, a, form');
    if(!target) return;
    if(target.closest('[data-viewer-ok]')) return;
    if(target.closest('.admin-gate, header')) return;
    // Allow plain text-readonly interactions: clicks on links inside hero copy,
    // toggling <details>, etc. Block form submissions and writeable inputs.
    if(event.type==='submit'){ event.preventDefault(); event.stopImmediatePropagation(); return; }
    if(target.tagName==='BUTTON' || (target.tagName==='INPUT' && target.type!=='hidden' && target.type!=='text' && target.type!=='url' && target.type!=='number' && target.type!=='email' && target.type!=='password') || target.tagName==='SELECT'){
      event.preventDefault(); event.stopImmediatePropagation();
    }
  }

  function init(){
    const stored=sessionStorage.getItem(ACCESS_KEY);
    if(stored==='admin' || stored==='1') applyRole('admin');
    else if(stored==='viewer') applyRole('viewer');
    else applyRole(null);
    $('adminGateSubmit')?.addEventListener('click',submitPassword);
    $('adminGatePassword')?.addEventListener('keydown',event=>{if(event.key==='Enter')submitPassword()});
    $('adminSignOutBtn')?.addEventListener('click',signOut);
    document.addEventListener('click',blockMutation,true);
    document.addEventListener('submit',blockMutation,true);
    document.addEventListener('change',blockMutation,true);
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init);
  else init();
})();
