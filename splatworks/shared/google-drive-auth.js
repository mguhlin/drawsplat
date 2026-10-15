// Optional, user-triggered Google authorization. MIT; see LICENSE.txt.
const SCOPE = 'https://www.googleapis.com/auth/drive.file';
let identityLoading = null;

export function connectionsAllowed() {
  if (window.SplatPrivacy?.getState().optionalConnections === false) throw new Error('External connections are off. Enable them in Privacy before using Google Drive.');
  if (navigator.onLine === false) throw new Error('Google Drive needs an internet connection. You can still save to your device.');
}

export function loadIdentity() {
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
export function requestToken(id, signal) {
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

// Isolated editors keep their COOP/COEP policies. A same-origin authorization
// page uses its own popup policy and an unguessable, memory-only channel.
export function requestTokenInWindow(id, signal) {
  connectionsAllowed();
  if (typeof BroadcastChannel !== 'function') return Promise.reject(new Error('This browser cannot open the authorization window. Save to your device instead.'));
  return new Promise((resolve, reject) => {
    const key = crypto.randomUUID(), channel = new BroadcastChannel('splat-drive-' + key);
    let settled = false;
    const finish = (error, token) => {
      if (settled) return; settled = true;
      channel.postMessage({ type: 'close' }); channel.close();
      clearTimeout(timer); signal.removeEventListener('abort', aborted);
      if (error) reject(error); else resolve(token);
    };
    const aborted = () => finish(new DOMException('Cancelled', 'AbortError'));
    const timer = setTimeout(() => finish(new Error('Google authorization timed out. Close the authorization window and try again.')), 120000);
    signal.addEventListener('abort', aborted, { once: true });
    if (signal.aborted) { aborted(); return; }
    channel.onmessage = ({ data }) => {
      if (!data || settled) return;
      if (data.type === 'ready') channel.postMessage({ type: 'configure', clientId: id });
      if (data.type === 'cancel') aborted();
      if (data.type === 'error') finish(new Error('Google authorization was not completed. Your local work is preserved.'));
      if (data.type === 'token' && typeof data.accessToken === 'string' && data.accessToken && data.scope === SCOPE) {
        try { connectionsAllowed(); finish(null, data.accessToken); } catch (error) { finish(error); }
      }
    };
    try {
      const url = new URL('../../splatworks/shared/google-drive-auth.html', location.href); url.hash = key;
      const popup = window.open(url.href, '_blank', 'popup,width=540,height=620');
      // COOP can deliberately sever the WindowProxy. Channel messages, not
      // popup.closed, determine completion across browsing context groups.
      if (!popup) finish(new Error('The authorization window was blocked. Allow popups and try again.'));
    } catch (error) { finish(error); }
  });
}

export function initializeAuthorizationPage() {
  const key = location.hash.slice(1), status = document.querySelector('[role=status]'), button = document.querySelector('#authorize');
  history.replaceState(null, '', location.pathname + location.search);
  if (!/^[a-f0-9-]{36}$/.test(key) || typeof BroadcastChannel !== 'function') { status.textContent = 'Start Google Drive saving from your SplatWorks app.'; return; }
  const channel = new BroadcastChannel('splat-drive-' + key), controller = new AbortController();
  let configured = false, complete = false, id;
  const notify = type => { if (!complete) channel.postMessage({ type }); };
  const ready = setInterval(() => notify('ready'), 500);
  const timeout = setTimeout(() => { notify('cancel'); complete = true; clearInterval(ready); controller.abort(); channel.close(); status.textContent = 'Authorization expired. Return to your app and try again.'; button.disabled = true; }, 120000);
  channel.onmessage = async ({ data }) => {
    if (data?.type === 'close') { complete = true; clearTimeout(timeout); clearInterval(ready); controller.abort(); channel.close(); window.close(); return; }
    if (data?.type !== 'configure' || configured || typeof data.clientId !== 'string') return;
    configured = true; id = data.clientId; clearInterval(ready);
    try { await loadIdentity(); status.textContent = 'Continue to choose your Google account and authorize this file transfer.'; button.disabled = false; }
    catch (error) { status.textContent = error.message; notify('error'); }
  };
  button.onclick = async () => {
    button.disabled = true;
    try {
      const token = await requestToken(id, controller.signal); connectionsAllowed();
      if (complete) return;
      channel.postMessage({ type: 'token', accessToken: token, scope: SCOPE });
      status.textContent = 'Authorized. Return to your app to see the transfer result.';
    } catch (error) { if (!complete) { status.textContent = error.message; button.disabled = false; } }
  };
  document.querySelector('#cancel').onclick = () => { notify('cancel'); window.close(); };
  window.addEventListener('pagehide', () => { notify('cancel'); clearTimeout(timeout); clearInterval(ready); controller.abort(); channel.close(); }, { once: true });
  notify('ready');
}
