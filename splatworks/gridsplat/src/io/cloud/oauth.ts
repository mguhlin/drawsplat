interface OAuthToken {
  accessToken: string;
  expiresAt: number;
}

interface OAuthConfig {
  authorizeUrl: string;
  clientId: string;
  scope: string;
  storageKey: string;
  tokenUrl: string;
}

function base64UrlEncode(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function randomString(byteLength = 32): string {
  const bytes = new Uint8Array(byteLength);

  crypto.getRandomValues(bytes);

  return base64UrlEncode(bytes);
}

async function sha256(text: string): Promise<Uint8Array> {
  const data = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest('SHA-256', data);

  return new Uint8Array(digest);
}

function redirectUri(): string {
  return `${window.location.origin}${window.location.pathname}`;
}

function readStoredToken(storageKey: string): OAuthToken | null {
  try {
    const stored = localStorage.getItem(storageKey);

    if (!stored) {
      return null;
    }

    const token = JSON.parse(stored) as OAuthToken;

    return token.expiresAt > Date.now() + 60_000 ? token : null;
  } catch {
    return null;
  }
}

function storeToken(storageKey: string, token: OAuthToken) {
  localStorage.setItem(storageKey, JSON.stringify(token));
}

async function waitForAuthorizationCode(
  authUrl: string,
): Promise<{ code: string; popup: Window }> {
  const popup = window.open(
    authUrl,
    'gridsplat-cloud-auth',
    'popup,width=520,height=680',
  );

  if (!popup) {
    throw new Error('The sign-in window was blocked by the browser.');
  }

  return new Promise((resolve, reject) => {
    const timeoutId = window.setTimeout(() => {
      window.clearInterval(intervalId);
      popup.close();
      reject(new Error('Cloud sign-in timed out. Try connecting again.'));
    }, 120_000);

    const intervalId = window.setInterval(() => {
      if (popup.closed) {
        window.clearTimeout(timeoutId);
        window.clearInterval(intervalId);
        reject(new Error('Cloud sign-in was closed before it finished.'));
        return;
      }

      try {
        const url = new URL(popup.location.href);

        if (url.origin !== window.location.origin) {
          return;
        }

        const error = url.searchParams.get('error');

        if (error) {
          throw new Error(`Cloud sign-in failed: ${error}`);
        }

        const code = url.searchParams.get('code');

        if (!code) {
          return;
        }

        window.clearTimeout(timeoutId);
        window.clearInterval(intervalId);
        resolve({ code, popup });
      } catch (error) {
        if (error instanceof DOMException) {
          return;
        }

        window.clearTimeout(timeoutId);
        window.clearInterval(intervalId);
        reject(error);
      }
    }, 400);
  });
}

export async function getAccessToken(config: OAuthConfig): Promise<string> {
  const stored = readStoredToken(config.storageKey);

  if (stored) {
    return stored.accessToken;
  }

  const verifier = randomString(48);
  const challenge = base64UrlEncode(await sha256(verifier));
  const authUrl = new URL(config.authorizeUrl);

  authUrl.searchParams.set('client_id', config.clientId);
  authUrl.searchParams.set('code_challenge', challenge);
  authUrl.searchParams.set('code_challenge_method', 'S256');
  authUrl.searchParams.set('redirect_uri', redirectUri());
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('scope', config.scope);
  authUrl.searchParams.set('state', randomString(24));

  const { code, popup } = await waitForAuthorizationCode(authUrl.toString());
  const response = await fetch(config.tokenUrl, {
    body: new URLSearchParams({
      client_id: config.clientId,
      code,
      code_verifier: verifier,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri(),
    }),
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    method: 'POST',
  });

  popup.close();

  if (!response.ok) {
    throw new Error('Cloud sign-in could not get an access token.');
  }

  const payload = (await response.json()) as {
    access_token?: string;
    expires_in?: number;
  };

  if (!payload.access_token) {
    throw new Error('Cloud sign-in did not return an access token.');
  }

  const token = {
    accessToken: payload.access_token,
    expiresAt: Date.now() + (payload.expires_in ?? 3600) * 1000,
  };

  storeToken(config.storageKey, token);

  return token.accessToken;
}

export function lastFileStorageKey(providerId: string): string {
  return `gridsplat:${providerId}:last-file`;
}
