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
  window.DrawSplatMySQL = { endpoint, test, account, save, load, register: (value, base) => request('/auth/register', {method:'POST',body:JSON.stringify({...value,role:'teacher'})}, endpoint(base)) };
  if (document.getElementById('boardSvg')) {
    const button = document.createElement('button');button.id = 'onlineAccountBtn';button.hidden = true;button.textContent = 'Online account';button.onclick = () => account().catch(err => alert(err.message));document.body.append(button);
  }
})();
