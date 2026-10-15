/* Optional Google Drive file transfer. MIT; see LICENSE.txt.
 * No startup Google requests, stored tokens, background uploads or public sharing.
 */
const SCOPE = 'https://www.googleapis.com/auth/drive.file';
const PUBLIC_CLIENT = '31274545407-l338d2doafet21gv8u4qmq2jk3j03jq3.apps.googleusercontent.com';
let identityLoading = null, activeDialog = null;

function connectionsAllowed() {
  if (window.SplatPrivacy?.getState().optionalConnections === false) throw new Error('External connections are off. Enable them in Privacy before using Google Drive.');
  if (navigator.onLine === false) throw new Error('Google Drive needs an internet connection. You can still save to your device.');
}

function clientId(configured) {
  return configured || document.querySelector('meta[name="google-drive-client-id"]')?.content ||
    (/^(splatworks\.org|drawsplat\.org)$/.test(location.hostname) ? PUBLIC_CLIENT : '');
}

function loadIdentity() {
  connectionsAllowed();
  if (window.google?.accounts?.oauth2) return Promise.resolve();
  if (identityLoading) return identityLoading;
  identityLoading = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    const failed = () => { clearTimeout(timer); script.remove(); identityLoading = null; reject(new Error('Google sign-in could not load. Check your connection and try again.')); };
    const timer = setTimeout(failed, 15000);
    script.src = 'https://accounts.google.com/gsi/client'; script.async = true;
    script.onerror = failed;
    script.onload = () => { clearTimeout(timer); if (window.google?.accounts?.oauth2) resolve(); else failed(); };
    document.head.append(script);
  });
  return identityLoading;
}

// Called directly by the dialog's button, before any asynchronous file preparation.
// This preserves the user gesture required for Google's popup.
function requestToken(id, signal) {
  connectionsAllowed();
  return new Promise((resolve, reject) => {
    let settled = false;
    const finish = (error, token) => {
      if (settled) return; settled = true; clearTimeout(timer); signal.removeEventListener('abort', aborted);
      if (error) reject(error); else resolve(token);
    };
    const aborted = () => finish(new DOMException('Cancelled', 'AbortError'));
    const timer = setTimeout(() => finish(new Error('Google sign-in timed out. Try again.')), 120000);
    signal.addEventListener('abort', aborted, { once: true });
    if (signal.aborted) { aborted(); return; }
    try {
      const oauth = window.google.accounts.oauth2;
      const tokenClient = oauth.initTokenClient({
        client_id: id, scope: SCOPE, include_granted_scopes: false,
        callback(response) {
          if (response.error || !response.access_token) { finish(new Error('Google Drive permission was not granted. Your local work is unchanged.')); return; }
          if ((oauth.hasGrantedAllScopes && !oauth.hasGrantedAllScopes(response, SCOPE)) || (response.scope && !response.scope.split(/\s+/).includes(SCOPE))) {
            finish(new Error('Allow access to the files you use with this app to continue.')); return;
          }
          finish(null, response.access_token);
        },
        error_callback() { finish(new Error('Google sign-in was closed or blocked. Allow the popup and try again.')); }
      });
      tokenClient.requestAccessToken({ prompt: 'select_account' });
    } catch (error) { finish(error); }
  });
}

async function checkedFetch(url, options, token, signal) {
  connectionsAllowed();
  const response = await fetch(url, { ...options, signal, redirect: 'error', headers: { ...options.headers, Authorization: 'Bearer ' + token } });
  if (!response.ok && response.status !== 308) {
    if (response.status === 401) throw new Error('Google authorization expired. Choose Save or Open again to sign in.');
    if (response.status === 403) throw new Error('Google Drive denied this action. Check your account permissions and school Workspace policy.');
    throw new Error('Google Drive could not complete this action (' + response.status + '). Your local work is unchanged.');
  }
  return response;
}

function validFileId(id) {
  if (typeof id !== 'string' || !/^[\w-]+$/.test(id)) throw new Error('Google Drive did not return a usable file. Try saving again.');
  return id;
}

async function upload(blob, name, token, signal) {
  if (!(blob instanceof Blob)) throw new Error('The project file could not be prepared. Save a local copy and try again.');
  const type = blob.type || 'application/octet-stream';
  const metadata = JSON.stringify({ name, mimeType: type });
  let response;
  const endpoint = 'https://www.googleapis.com/upload/drive/v3/files?fields=id&uploadType=';
  if (blob.size <= 5 * 1024 * 1024) {
    const boundary = 'splatworks-' + crypto.randomUUID();
    const body = new Blob(['--' + boundary + '\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n', metadata,
      '\r\n--' + boundary + '\r\nContent-Type: ' + type + '\r\n\r\n', blob, '\r\n--' + boundary + '--\r\n']);
    response = await checkedFetch(endpoint + 'multipart', { method: 'POST', body, headers: { 'Content-Type': 'multipart/related; boundary=' + boundary } }, token, signal);
  } else {
    const session = await checkedFetch(endpoint + 'resumable', { method: 'POST', body: metadata, headers: { 'Content-Type': 'application/json; charset=UTF-8', 'X-Upload-Content-Type': type, 'X-Upload-Content-Length': String(blob.size) } }, token, signal);
    const location = session.headers.get('Location');
    if (!location) throw new Error('Google Drive did not start the upload. Try again.');
    const target = new URL(location);
    // Never forward the bearer token to an arbitrary server from a response header.
    if (target.origin !== 'https://www.googleapis.com' || target.pathname !== '/upload/drive/v3/files') throw new Error('Google Drive returned an unexpected upload address.');
    response = await checkedFetch(target.href, { method: 'PUT', body: blob, headers: { 'Content-Type': type } }, token, signal);
  }
  const id = validFileId((await response.json()).id);
  return { id, name, webViewLink: 'https://drive.google.com/file/d/' + id + '/view' };
}

function installStyles() {
  if (document.getElementById('splat-drive-styles')) return;
  const style = document.createElement('style'); style.id = 'splat-drive-styles';
  style.textContent = `.splat-drive-dialog{box-sizing:border-box;width:min(32rem,calc(100vw - 2rem));max-height:calc(100dvh - 2rem);overflow:auto;margin:auto;padding:1.5rem;border:1px solid #cbd5e1;border-radius:1rem;background:#fff;color:#172036;font:16px/1.5 system-ui,sans-serif;box-shadow:0 24px 80px #0004;z-index:2147483647}.splat-drive-dialog::backdrop{background:#10172a99}.splat-drive-dialog h2{margin:0 0 .8rem;font-size:1.4rem;color:#172036}.splat-drive-dialog p{margin:.7rem 0}.splat-drive-dialog label{display:block;font-weight:650}.splat-drive-dialog input{box-sizing:border-box;display:block;width:100%;margin:.4rem 0;padding:.65rem;border:1px solid #94a3b8;border-radius:.5rem;background:#fff;color:#172036;font:inherit}.splat-drive-dialog button,.splat-drive-dialog a{font:inherit}.splat-drive-dialog button{padding:.65rem 1rem;border:1px solid #aab4c5;border-radius:.5rem;background:#f3f5fa;color:#172036;cursor:pointer}.splat-drive-dialog button[type=submit]{background:#5b21b6;border-color:#5b21b6;color:#fff}.splat-drive-dialog button:disabled{opacity:.55;cursor:wait}.splat-drive-dialog :focus-visible{outline:3px solid #d97706;outline-offset:3px}.splat-drive-dialog a{color:#5b21b6;text-decoration:underline}.splat-drive-actions{display:flex;flex-wrap:wrap;justify-content:flex-end;gap:.6rem;margin-top:1rem}.splat-drive-status{min-height:1.5em;overflow-wrap:anywhere}.splat-drive-dialog [hidden]{display:none!important}`;
  document.head.append(style);
}

function transfer(options, mode) {
  if (activeDialog) return Promise.reject(new Error('A Google Drive window is already open.'));
  installStyles();
  const previousFocus = document.activeElement;
  const dialog = document.createElement('dialog'); dialog.className = 'splat-drive-dialog';
  dialog.setAttribute('aria-label', mode === 'save' ? 'Save to Google Drive' : mode === 'open' ? 'Open from Google Drive' : 'Connect Google Drive');
  dialog.innerHTML = '<h2></h2><p class="splat-drive-note"></p><form><label>File name<input name="filename" maxlength="180" required></label><p class="splat-drive-status" role="status" aria-live="polite"></p><p class="splat-drive-result" hidden><a target="_blank" rel="noopener noreferrer">Open in Google Drive</a></p><div class="splat-drive-actions"><button type="button" data-close>Cancel</button><button type="submit" disabled></button></div></form>';
  const form = dialog.querySelector('form'), field = form.elements.filename, submit = form.querySelector('[type=submit]'), close = form.querySelector('[data-close]'), status = dialog.querySelector('[role=status]');
  const resultLink = dialog.querySelector('.splat-drive-result');
  const action = mode === 'save' ? 'Save to Google Drive' : mode === 'open' ? 'Open from Google Drive' : 'Connect Google Drive';
  dialog.querySelector('h2').textContent = action;
  dialog.querySelector('.splat-drive-note').textContent = mode === 'save'
    ? options.appName + ' saves a new native project file to the Google account you choose. Local work stays here. Sharing is not enabled; manage access in Drive. Download the file from Drive and open it in ' + options.appName + ' to edit.'
    : 'Choose your Google account to ' + (mode === 'open' ? 'reopen the last ' + options.appName + ' file saved from this browser.' : 'connect ' + options.appName + '.') + ' Access is limited to files you use with this app.';
  field.value = options.fileName || 'project.json'; field.parentElement.hidden = mode !== 'save';
  submit.textContent = action;
  document.body.append(dialog); activeDialog = dialog; dialog.showModal();
  let controller, finished = false, outcome = null;
  const completion = new Promise(resolve => {
    dialog.addEventListener('close', () => {
      finished = true; controller?.abort(); activeDialog = null; dialog.remove();
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus();
      resolve(outcome);
    }, { once: true });
  });
  close.onclick = () => dialog.close();
  const id = clientId(options.clientId);
  try {
    connectionsAllowed();
    if (location.protocol !== 'https:' && !/^(localhost|127\.0\.0\.1)$/.test(location.hostname)) throw new Error('Google Drive needs a hosted HTTPS site. Save to your device here.');
    if (!id) throw new Error('This site needs Google Drive setup. Ask your administrator to configure a Google OAuth client. Local saving is available.');
    status.textContent = 'Loading Google sign-in…';
    loadIdentity().then(() => { if (!finished) { connectionsAllowed(); status.textContent = 'Choose ' + action + ' to sign in and authorize this file transfer.'; submit.disabled = false; } }).catch(error => { if (!finished) status.textContent = error.message; });
  } catch (error) { status.textContent = error.message; }
  form.onsubmit = async event => {
    event.preventDefault(); if (submit.disabled || finished) return;
    let name = field.value.replace(/[\x00-\x1f/\\]/g, '-').trim();
    const suffix = options.fileName?.match(/\.(?:(?:grid|show|write|list)splat\.json|layoutsplat)$/i)?.[0];
    if (name && suffix && !name.toLowerCase().endsWith(suffix.toLowerCase())) name += suffix;
    if (mode === 'save' && !name) { field.focus(); return; }
    submit.disabled = true; field.disabled = true; controller = new AbortController();
    let timeout;
    try {
      status.textContent = 'Choose your Google account and allow file access…';
      const token = await requestToken(id, controller.signal);
      if (finished) return;
      connectionsAllowed();
      timeout = setTimeout(() => controller.abort(), 180000);
      if (mode === 'save') {
        status.textContent = 'Preparing and uploading your project…';
        const blob = await options.buildFile();
        outcome = await upload(blob, name, token, controller.signal);
        if (finished) return;
        resultLink.querySelector('a').href = outcome.webViewLink; resultLink.hidden = false;
        status.textContent = 'Saved ' + name + ' to Google Drive. Local work is preserved.';
        close.textContent = 'Done'; submit.hidden = true;
      } else if (mode === 'open') {
        status.textContent = 'Opening your project…';
        const response = await checkedFetch('https://www.googleapis.com/drive/v3/files/' + validFileId(options.fileId) + '?alt=media', { method: 'GET' }, token, controller.signal);
        outcome = await response.blob(); dialog.close();
      } else { outcome = true; dialog.close(); }
    } catch (error) {
      if (!finished) { outcome = null; status.textContent = error.name === 'AbortError' ? 'The transfer stopped. Check Drive before retrying. Your local work is preserved.' : error.message; submit.disabled = false; field.disabled = false; }
    } finally { clearTimeout(timeout); }
  };
  return completion;
}

export function saveToGoogleDrive(options) { return transfer(options, 'save'); }
export function openFromGoogleDrive(options) { return transfer(options, 'open'); }
export function connectGoogleDrive(options) { return transfer(options, 'connect'); }
