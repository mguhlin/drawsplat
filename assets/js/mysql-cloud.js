/* Host-independent private cloud boards. Database credentials never enter this client. */
(function () {
  'use strict';
  const SESSION_KEY = 'drawsplat.mysqlSession';
  const REVISION_KEY = 'drawsplat.mysqlRevisions';
  let busy = false;
  function endpoint(value) {
    const raw = value === undefined ? localStorage.getItem('drawsplat.folderEndpoint') : value;
    if (!raw) throw new Error('Connect an online saving service in Teacher Admin first.');
    const url = new URL(raw, location.origin);
    if (url.username || url.password || url.search || url.hash || (url.protocol !== 'https:' && !(url.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)))) {
      throw new Error('Use an HTTPS API address, or localhost for testing. Do not include passwords in the address.');
    }
    return url.href.replace(/\/+$/, '');
  }
  function session() {
    try { const s = JSON.parse(sessionStorage.getItem(SESSION_KEY)); return s?.endpoint === endpoint() && Date.parse(s.expiresAt) > Date.now() ? s : null; } catch (_) { return null; }
  }
  async function request(path, options = {}, base = endpoint()) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);
    try {
      const s = session();
      const response = await fetch(base + path, { ...options, cache: 'no-store', signal: controller.signal, headers: { 'Content-Type': 'application/json', ...(s && s.endpoint === base ? { Authorization: 'Bearer ' + s.token } : {}), ...options.headers } });
      const data = await response.json();
      if (!response.ok || !data.ok) {
        if (response.status === 401) sessionStorage.removeItem(SESSION_KEY);
        throw new Error(data.error === 'auth_required' ? 'Sign in again to save online.' : data.error || 'Online saving did not confirm the request.');
      }
      return data;
    } catch (err) { if (err.name === 'AbortError') throw new Error('Online saving timed out. Your device copy is still available.'); throw err; }
    finally { clearTimeout(timeout); }
  }
  function modal(title, help) {
    const dialog = document.createElement('dialog');dialog.className = 'mysql-cloud-dialog';
    const heading = document.createElement('h2');heading.textContent = title;
    const intro = document.createElement('p');intro.className = 'whiteboard-dialog-intro';intro.textContent = help;
    const close = document.createElement('button');close.type = 'button';close.textContent = 'Close';close.className = 'mysql-cloud-close';close.onclick = () => dialog.close();
    dialog.append(heading, intro, close);document.body.append(dialog);return dialog;
  }
  function field(form, labelText, type, autocomplete) {
    const label = document.createElement('label');label.textContent = labelText;
    const input = document.createElement('input');input.type = type;input.required = true;input.autocomplete = autocomplete;label.append(input);form.append(label);return input;
  }
  let googleScript;
  async function googleButton(parent,onSignIn,onError,base=endpoint()) {
    const config=await request('/auth/config',{},base);if(!config.googleClientId)return;
    const holder=document.createElement('div');holder.className='google-signin';parent.append(holder);
    if(!googleScript)googleScript=new Promise((resolve,reject)=>{if(window.google?.accounts?.id)return resolve();const script=document.createElement('script');script.src='https://accounts.google.com/gsi/client';script.onload=resolve;script.onerror=()=>{googleScript=null;reject(new Error('Google sign-in could not load. Check your district OAuth settings.'));};document.head.append(script);});
    await googleScript;
    window.google.accounts.id.initialize({client_id:config.googleClientId,callback:async result=>{try{const out=await request('/auth/google',{method:'POST',body:JSON.stringify({idToken:result.credential})},base);sessionStorage.setItem(SESSION_KEY,JSON.stringify({...out,endpoint:base}));onSignIn(out);}catch(err){onError(err);}}});
    window.google.accounts.id.renderButton(holder,{type:'standard',theme:'outline',size:'large',text:'signin_with'});
  }
  async function account() {
    const current = session();
    if (current) {
      const dialog = modal('Online account', 'Signed in as ' + current.user.email + '. Sign out when you finish on a shared device. Signing out closes online access; device copies remain.');
      const button = document.createElement('button');button.textContent = 'Sign out';
      button.onclick = async () => { button.disabled = true; try { await request('/auth/logout', { method: 'POST' }); } catch (_) {} sessionStorage.removeItem(SESSION_KEY);sessionStorage.removeItem(REVISION_KEY);dialog.close(); };
      dialog.append(button);dialog.addEventListener('close', () => dialog.remove(), { once: true });dialog.showModal();return null;
    }
    const requestedEndpoint=endpoint();
    return new Promise(resolve => {
      const dialog = modal('Sign in to save online', 'Use your DrawSplat saving account. This is separate from the Teacher Admin password. Your sign-in stays in this browser tab. Saving service: ' + new URL(endpoint()).host);
      const form = document.createElement('form');
      const email = field(form, 'Email', 'email', 'username');
      const password = field(form, 'Password', 'password', 'current-password');
      const status = document.createElement('p');status.setAttribute('role', 'status');
      const login = document.createElement('button');login.type = 'submit';login.textContent = 'Sign in';login.className = 'primary';
      form.append(login, status);dialog.append(form);
      let signedIn = null;
      googleButton(dialog,out=>{if(endpoint()!==requestedEndpoint||!dialog.isConnected||!dialog.open){sessionStorage.removeItem(SESSION_KEY);return;}signedIn={...out,endpoint:requestedEndpoint};dialog.close();},err=>status.textContent=err.message,requestedEndpoint).catch(err=>status.textContent=err.message);

      form.onsubmit = async event => {
        event.preventDefault();if (login.disabled) return;login.disabled = true;status.textContent = 'Signing in…';
        try { const out = await request('/auth/login', { method: 'POST', body: JSON.stringify({ email: email.value.trim(), password: password.value }) },requestedEndpoint);if(endpoint()!==requestedEndpoint)throw new Error('The saving service changed. Close this window and sign in again.');if (!dialog.isConnected || !dialog.open) return;signedIn = { ...out, endpoint: requestedEndpoint };sessionStorage.setItem(SESSION_KEY, JSON.stringify(signedIn));dialog.close(); }
        catch (err) { status.textContent = err.message; }
        finally { login.disabled = false;password.value = ''; }
      };
      dialog.addEventListener('close', () => { dialog.remove();resolve(signedIn); }, { once: true });dialog.showModal();email.focus();
    });
  }
  async function authenticated() { return session() || await account(); }
  function revisionKey(key) { const s = session();return JSON.stringify([s.endpoint, s.user.id, key]); }
  function revisions() { try { return JSON.parse(sessionStorage.getItem(REVISION_KEY)) || {}; } catch (_) { return {}; } }
  function remember(key, revision) { const map = revisions();map[revisionKey(key)] = revision;sessionStorage.setItem(REVISION_KEY, JSON.stringify(map)); }
  async function save(board) {
    if (busy) throw new Error('An online save is already in progress.');
    busy = true;
    try {
      if (!await authenticated()) return null;
      const key = board.recordingBoardId;
      if (!/^[A-Za-z0-9_-]{1,80}$/.test(key || '')) throw new Error('This board needs a valid online identifier.');
      const out = await request('/boards/' + encodeURIComponent(key), { method: 'PUT', body: JSON.stringify({ board, revision: revisions()[revisionKey(key)] || 0 }) });
      remember(key, out.revision);return out;
    } finally { busy = false; }
  }
  async function load() {
    if (!await authenticated()) return null;
    const out = await request('/boards');
    if (!out.boards.length) throw new Error('No boards saved in this account yet. Choose Save online first.');
    const chosen = await new Promise(resolve => {
      const dialog = modal('Open your saved board', 'Choose a board from your account. Download a board file first if you want to keep your current work.');
      const list = document.createElement('div');list.className = 'mysql-board-list';
      let result = null;
      for (const board of out.boards) { const button = document.createElement('button');button.type = 'button';button.className = 'mysql-board-card';
        const name = document.createElement('strong');name.textContent = board.title || 'Untitled board';
        const date = document.createElement('span');date.textContent = 'Saved ' + new Date(board.updatedAt).toLocaleString();button.append(name, date);
        button.onclick = () => { result = board.boardKey;dialog.close(); };list.append(button);
      }
      dialog.append(list);dialog.addEventListener('close', () => { dialog.remove();resolve(result); }, { once: true });dialog.showModal();
    });
    if (!chosen) return null;
    const loaded = await request('/boards/' + encodeURIComponent(chosen));
    if (!loaded.board || !Array.isArray(loaded.board.panels) || !loaded.board.panels.length) throw new Error('The online copy is not a valid whiteboard.');
    loaded.board.recordingBoardId = chosen;remember(chosen, loaded.revision);return loaded.board;
  }
  async function test(value) {
    const out = await request('/health', {}, endpoint(value));
    if (out.provider !== 'mysql' || !out.capabilities?.includes('private-boards-v1')) throw new Error('Update the backend: it must support account-owned whiteboard saving.');
    return out;
  }
  async function classrooms(getBoard,openBoard) {
    const requested=endpoint();
    // Student onboarding is scoped to a teacher invitation, never a public role selector.
    const authConfig=await request('/auth/config');
    if(!session()) {
      if(authConfig.rosterOnly){if(await authenticated())return classrooms(getBoard,openBoard);return;}
      const d=modal('Classroom sign-in','Sign in with your school account, or create a student account using a teacher invitation.');
      const signin=document.createElement('button');signin.textContent='Sign in';signin.onclick=async()=>{d.close();if(await authenticated())classrooms(getBoard,openBoard).catch(err=>alert(err.message));};d.append(signin);
      const f=document.createElement('form');const params=new URL(location.href).searchParams;
      const classId=field(f,'Classroom number','text','off');classId.value=params.get('classroom')||'';
      const code=field(f,'Invitation code','text','off');code.value=params.get('invite')||'';
      const name=field(f,'Your name','text','name'),email=field(f,'School email','email','username'),password=field(f,'New password (at least 12 characters)','password','new-password');password.minLength=12;
      const create=document.createElement('button');create.type='submit';create.textContent='Create student account';const message=document.createElement('p');message.setAttribute('role','status');f.append(create,message);d.append(f);
      f.onsubmit=async e=>{e.preventDefault();create.disabled=true;try{await request('/classrooms/enroll',{method:'POST',body:JSON.stringify({classroomId:classId.value,code:code.value,displayName:name.value,email:email.value,password:password.value})},requested);message.textContent='Account created. Choose Sign in with your new account.';f.reset();}catch(err){message.textContent=err.message;}finally{create.disabled=false;password.value='';}};
      d.addEventListener('close',()=>d.remove(),{once:true});d.showModal();return;
    }
    const health=await test();if(!health.capabilities.includes('classrooms-v1'))throw new Error('Update your saving service to enable classrooms.');
    const current=session(),isStudent=current.user.role==='student';
    const dialog=modal('Online classrooms',isStudent?'Open your teacher’s shared assignments and turn in your own work.':'Create classes, invite students, share a copy of your board, and review submissions. Sharing creates a snapshot; your private board stays separate.');
    const status=document.createElement('p');status.setAttribute('role','status');dialog.append(status);
    const content=document.createElement('div');dialog.append(content);
    const action=(label,fn,parent=content)=>{const b=document.createElement('button');b.type='button';b.textContent=label;b.onclick=async()=>{b.disabled=true;try{await fn();}catch(err){status.textContent=err.message;}finally{b.disabled=false;}};parent.append(b);return b;};
    async function invite(cls) {const out=await request('/classrooms/'+cls.id+'/invitation',{method:'POST',body:'{}'});const url=new URL(location.href);url.search='';for(const [key,value] of Object.entries({storage:'mysql',api:endpoint(),role:'student',classroom:cls.id,invite:out.code}))url.searchParams.set(key,value);const area=document.createElement('textarea');area.readOnly=true;area.value=url.href;const label=document.createElement('label');label.textContent='Student enrollment link (previous invitations are replaced)';label.append(area);content.append(label);area.focus();area.select();status.textContent='Copy this link for your students. It grants class enrollment, not access to other students’ work.';}
    async function list(){content.replaceChildren();const out=await request('/classrooms');
      if(!isStudent){const f=document.createElement('form');const title=field(f,'New class name','text','off');const create=document.createElement('button');create.textContent='Create class';create.type='submit';f.append(create);content.append(f);f.onsubmit=async e=>{e.preventDefault();create.disabled=true;try{const result=await request('/classrooms',{method:'POST',body:JSON.stringify({title:title.value})});await list();if(!authConfig.rosterOnly)await invite({id:result.classroomId});}catch(err){status.textContent=err.message;}finally{create.disabled=false;}};}
      else if(!authConfig.rosterOnly) {action('Join another class',async()=>{const classroomId=prompt('Classroom number:');if(!classroomId)return;const code=prompt('Invitation code:');if(!code)return;await request('/classrooms/join',{method:'POST',body:JSON.stringify({classroomId,code})});await list();});}
      if(!out.classes.length){const p=document.createElement('p');p.textContent='No classes yet.';content.append(p);}
      for(const cls of out.classes)action(cls.title,()=>view(cls));
    }
    async function loadCopy(board){if(!confirm('Open this board? Download your current board first if you need to keep it.'))return;board.recordingBoardId=crypto.randomUUID();await openBoard(board);dialog.close();}
    async function view(cls){content.replaceChildren();const heading=document.createElement('h3');heading.textContent=cls.title;content.append(heading);action('All classes',list);
      const owner=String(cls.teacherUserId)===String(current.user.id);
      if(owner){if(!authConfig.rosterOnly)action('Copy student invitation',()=>invite(cls));action('Share current board as assignment',async()=>{const board=getBoard();const title=prompt('Assignment title:',board.title||'Class assignment');if(!title)return;await request('/classrooms/'+cls.id+'/assignments',{method:'POST',body:JSON.stringify({title,board})});await view(cls);status.textContent='Assignment shared with this class.';});action('View class roster',async()=>{const roster=await request('/classrooms/'+cls.id+'/members');for(const student of roster.members){const p=document.createElement('p');p.textContent=student.displayName+' ('+student.email+')';content.append(p);action('Remove '+(student.displayName||student.email),async()=>{if(!confirm('Remove this student’s classroom access? Their submitted work remains available to you.'))return;await request('/classrooms/'+cls.id+'/members/'+student.id,{method:'DELETE'});await view(cls);},p);}if(!roster.members.length)status.textContent='No enrolled students yet.';});}
      const assignments=await request('/classrooms/'+cls.id+'/assignments'),submitted=await request('/classrooms/'+cls.id+'/submissions');
      const h=document.createElement('h3');h.textContent='Shared assignments';content.append(h);
      for(const assignment of assignments.assignments){const section=document.createElement('section');const title=document.createElement('h4');title.textContent=assignment.title;section.append(title);content.append(section);action('Open assignment',async()=>{const out=await request('/classrooms/'+cls.id+'/assignments/'+assignment.id);await loadCopy(out.board);},section);if(isStudent)action('Turn in current board',async()=>{if(!confirm('Submit your current board for '+assignment.title+'?'))return;const prior=submitted.submissions.find(s=>String(s.assignmentId)===String(assignment.id));await request('/classrooms/'+cls.id+'/assignments/'+assignment.id+'/submission',{method:'PUT',body:JSON.stringify({board:getBoard(),revision:prior?.revision||0})});await view(cls);status.textContent='Your work was turned in.';},section);}
      const h2=document.createElement('h3');h2.textContent=owner?'Student submissions':'Your submissions and feedback';content.append(h2);
      for(const submission of submitted.submissions){const section=document.createElement('section');const p=document.createElement('p');p.textContent=submission.title+' — '+(submission.displayName||'Student')+(submission.feedback?' / Feedback: '+submission.feedback:'');section.append(p);content.append(section);action('Open submitted work',async()=>{const out=await request('/classrooms/'+cls.id+'/submissions/'+submission.assignmentId+'/'+submission.studentUserId);await loadCopy(out.board);},section);if(owner)action('Give feedback',async()=>{const feedback=prompt('Feedback:',submission.feedback||'');if(feedback===null)return;await request('/classrooms/'+cls.id+'/submissions/'+submission.assignmentId+'/'+submission.studentUserId+'/feedback',{method:'PUT',body:JSON.stringify({feedback})});await view(cls);status.textContent='Feedback saved.';},section);}
    }
    dialog.addEventListener('close',()=>dialog.remove(),{once:true});dialog.showModal();await list();
  }
  async function logout() { try { await request('/auth/logout', {method:'POST'}); } finally { sessionStorage.removeItem(SESSION_KEY); sessionStorage.removeItem(REVISION_KEY); } }
  window.DrawSplatMySQL = { logout, endpoint, test, account, save, load, classrooms, session, request, googleButton, register: (value, base) => request('/auth/register', {method:'POST',body:JSON.stringify({...value,role:'teacher'})}, endpoint(base)) };
  if (document.getElementById('boardSvg')) {
    const button = document.createElement('button');button.id = 'onlineAccountBtn';button.hidden = true;button.textContent = 'Online account';button.onclick = () => account().catch(err => alert(err.message));document.body.append(button);
  }
})();
