(function(){
  const ACCESS_KEY='drawsplat.adminAccess';
  // Public builds do not include a working admin password. Set this to the
  // SHA-256 hash of your deployment password, or use server-side auth/SSO.
  // Anyone with this password gets FULL read/write access.
  const PASSWORD_HASH='042f36d69b1b5ffec86e7edbf04d8fda1ffda2a54e5a8d383f951939c34198fd';
  // Viewer mode is a zero-config "preview as viewer" — anyone clicking the
  // gate's Preview button enters a read-only UI tour. No password is needed
  // because no real backend data is loaded in viewer mode (every Load /
  // Fetch button is CSS-disabled and a capturing event listener swallows
  // mutations). Schools who don't want this can hide the preview button in
  // their copy of admin.html / mysql-setup.html.
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
    if(!PASSWORD_HASH){
      return setMessage('Admin access is not configured in this public build. Request access from the developer or configure your own deployment hash. (You can still click Preview as Viewer for a read-only tour.)','danger');
    }
    if(!password) return setMessage('Enter the admin password, or click Preview as Viewer for a read-only tour.','danger');
    try{
      const hash=await sha256(password);
      if(hash===PASSWORD_HASH){
        sessionStorage.setItem(ACCESS_KEY,'admin');
        if(input) input.value='';
        applyRole('admin');
      }else{
        setMessage('Password not accepted. Click Preview as Viewer for a read-only tour, or request admin access if you need to make changes.','danger');
      }
    }catch(err){
      setMessage('Could not verify password: '+err.message,'danger');
    }
  }

  function enterViewerPreview(){
    sessionStorage.setItem(ACCESS_KEY,'viewer');
    const input=$('adminGatePassword'); if(input) input.value='';
    applyRole('viewer');
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
    $('adminViewerPreviewBtn')?.addEventListener('click',enterViewerPreview);
    $('adminSignOutBtn')?.addEventListener('click',signOut);
    document.addEventListener('click',blockMutation,true);
    document.addEventListener('submit',blockMutation,true);
    document.addEventListener('change',blockMutation,true);
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init);
  else init();
})();
