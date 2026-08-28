const encoder = new TextEncoder();
const decoder = new TextDecoder();
const MAGIC = encoder.encode('CSPCS4!!');
const MEMORY = 65536;
const PASSES = 3;
const PARALLELISM = 1;
const KEY_LENGTH = 32;
const CHUNK_SIZE = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ? 1024 * 1024 : 4 * 1024 * 1024;
const MAX_CHUNK_SIZE = 8 * 1024 * 1024;
const MAX_META_SIZE = 8 * 1024 * 1024;

function concat(...arrays) {
  const output = new Uint8Array(arrays.reduce((size, array) => size + array.length, 0));
  let offset = 0;
  for (const array of arrays) { output.set(array, offset); offset += array.length; }
  return output;
}

function u32(value) {
  const bytes = new Uint8Array(4);
  new DataView(bytes.buffer).setUint32(0, value);
  return bytes;
}

function b64(bytes) {
  let value = '';
  for (let index = 0; index < bytes.length; index += 0x8000) {
    value += String.fromCharCode(...bytes.subarray(index, index + 0x8000));
  }
  return btoa(value);
}

function fromB64(value) {
  const raw = atob(value);
  return Uint8Array.from(raw, character => character.charCodeAt(0));
}

function validateHeader(header) {
  if (header.v !== 4 || header.alg !== 'AES-256-GCM-CHUNKED' || header.kdf !== 'Argon2id-v1.3'
    || header.memory !== MEMORY || header.passes !== PASSES || header.parallelism !== PARALLELISM
    || header.keyLength !== KEY_LENGTH || !Number.isInteger(header.chunkSize)
    || header.chunkSize < 65536 || header.chunkSize > MAX_CHUNK_SIZE) {
    throw Error('Unsupported or unsafe CipherSplat parameters.');
  }
}

async function argon2Bytes(password, salt, header) {
  validateHeader(header);
  const passwordBytes = encoder.encode(password);
  const saltBytes = salt.slice();
  try {
    if (typeof Worker === 'function') {
      return await new Promise((resolve, reject) => {
        const worker = new Worker('./argon2-worker.js');
        const timer = setTimeout(() => { worker.terminate(); reject(Error('Argon2id timed out.')); }, 120000);
        worker.onmessage = event => {
          clearTimeout(timer);
          worker.terminate();
          event.data.error ? reject(Error(event.data.error)) : resolve(new Uint8Array(event.data.key));
        };
        worker.onerror = event => { clearTimeout(timer); worker.terminate(); reject(Error(event.message || 'Argon2id failed.')); };
        worker.postMessage({ password: passwordBytes.buffer, salt: saltBytes.buffer, memorySize:header.memory, iterations:header.passes, parallelism:header.parallelism, hashLength:header.keyLength }, [passwordBytes.buffer, saltBytes.buffer]);
      });
    }
  } catch (error) {
    if (!globalThis.hashwasm?.argon2id) throw error;
  }
  if (!globalThis.hashwasm?.argon2id) throw Error('The local Argon2id engine is unavailable.');
  return globalThis.hashwasm.argon2id({ password:encoder.encode(password), salt:salt.slice(), memorySize:header.memory, iterations:header.passes, parallelism:header.parallelism, hashLength:header.keyLength, outputType:'binary' });
}

async function deriveKey(password, salt, header) {
  const bytes = await argon2Bytes(password, salt, header);
  try { return await crypto.subtle.importKey('raw', bytes, { name:'AES-GCM' }, false, ['encrypt','decrypt']); }
  finally { bytes.fill(0); }
}

function ivFor(prefix, counter) {
  const iv = new Uint8Array(12);
  iv.set(prefix);
  new DataView(iv.buffer).setUint32(8, counter);
  return iv;
}

function aad(header, counter) {
  return concat(MAGIC, u32(header.length), header, u32(counter));
}

async function sealRecord(key, prefix, counter, plain, header) {
  const cipher = new Uint8Array(await crypto.subtle.encrypt({ name:'AES-GCM', iv:ivFor(prefix,counter), additionalData:aad(header,counter), tagLength:128 }, key, plain));
  return new Blob([u32(plain.length), u32(cipher.length), cipher]);
}

async function openRecord(file, offset, key, prefix, counter, maximum, header) {
  if (offset + 8 > file.size) throw Error('The encrypted package ended unexpectedly.');
  const lengths = new Uint8Array(await file.slice(offset, offset + 8).arrayBuffer());
  const view = new DataView(lengths.buffer);
  const plainLength = view.getUint32(0);
  const cipherLength = view.getUint32(4);
  if (cipherLength !== plainLength + 16 || plainLength > maximum || offset + 8 + cipherLength > file.size) throw Error('Invalid encrypted chunk length.');
  try {
    const plain = await crypto.subtle.decrypt({ name:'AES-GCM', iv:ivFor(prefix,counter), additionalData:aad(header,counter), tagLength:128 }, key, await file.slice(offset + 8, offset + 8 + cipherLength).arrayBuffer());
    return { bytes:new Uint8Array(plain), next:offset + 8 + cipherLength };
  } catch { throw Error('Unlock failed. The password is wrong or the package was altered.'); }
}

export async function protectPdf(bytes, filename, password, onProgress = () => {}) {
  if (!crypto.subtle) throw Error('Web Crypto requires HTTPS or localhost.');
  if (password.length < 12) throw Error('Use a password of at least 12 characters.');
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const prefix = crypto.getRandomValues(new Uint8Array(8));
  const headerObject = { v:4, alg:'AES-256-GCM-CHUNKED', kdf:'Argon2id-v1.3', memory:MEMORY, passes:PASSES, parallelism:PARALLELISM, keyLength:KEY_LENGTH, salt:b64(salt), prefix:b64(prefix), chunkSize:CHUNK_SIZE };
  const header = encoder.encode(JSON.stringify(headerObject));
  onProgress('Hardening password with Argon2id…');
  const key = await deriveKey(password, salt, headerObject);
  const file = new Blob([bytes], { type:'application/pdf' });
  const metadata = { kind:'file', name:filename, files:[{ path:filename, size:file.size, type:'application/pdf', chunks:Math.ceil(file.size / CHUNK_SIZE) }] };
  let counter = 0;
  const parts = [MAGIC, u32(header.length), header, await sealRecord(key, prefix, counter++, encoder.encode(JSON.stringify(metadata)), header)];
  for (let offset = 0; offset < file.size; offset += CHUNK_SIZE) {
    onProgress(`Encrypting ${Math.min(100, Math.round(100 * offset / Math.max(file.size, 1)))}%…`);
    parts.push(await sealRecord(key, prefix, counter++, new Uint8Array(await file.slice(offset, offset + CHUNK_SIZE).arrayBuffer()), header));
  }
  return new Blob(parts, { type:'application/octet-stream' });
}

export async function unlockPdf(file, password, onProgress = () => {}) {
  if (file.size < 29) throw Error('This package is too short to be valid.');
  const prefixBytes = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  if (!MAGIC.every((byte, index) => prefixBytes[index] === byte)) throw Error('This is not a current CipherSplat CS4 package.');
  const headerLength = new DataView(prefixBytes.buffer).getUint32(8);
  if (headerLength < 2 || headerLength > 4096 || 12 + headerLength + 24 > file.size) throw Error('Invalid package header.');
  const header = new Uint8Array(await file.slice(12, 12 + headerLength).arrayBuffer());
  let headerObject;
  try { headerObject = JSON.parse(decoder.decode(header)); } catch { throw Error('Invalid package header encoding.'); }
  validateHeader(headerObject);
  const salt = fromB64(headerObject.salt);
  const prefix = fromB64(headerObject.prefix);
  if (salt.length !== 16 || prefix.length !== 8) throw Error('Invalid package key parameters.');
  onProgress('Hardening password with Argon2id…');
  const key = await deriveKey(password, salt, headerObject);
  let offset = 12 + headerLength;
  let counter = 0;
  const metadataRecord = await openRecord(file, offset, key, prefix, counter++, MAX_META_SIZE, header);
  offset = metadataRecord.next;
  let metadata;
  try { metadata = JSON.parse(decoder.decode(metadataRecord.bytes)); } catch { throw Error('Invalid encrypted metadata.'); }
  const entry = metadata?.kind === 'file' && metadata.files?.length === 1 ? metadata.files[0] : null;
  if (!entry || typeof entry.path !== 'string' || !entry.path.toLowerCase().endsWith('.pdf') || !Number.isSafeInteger(entry.size) || entry.size < 0 || entry.chunks !== Math.ceil(entry.size / headerObject.chunkSize)) throw Error('This CipherSplat package does not contain one valid PDF.');
  const parts = [];
  let restored = 0;
  for (let index = 0; index < entry.chunks; index += 1) {
    onProgress(`Authenticating ${Math.round(100 * offset / file.size)}%…`);
    const record = await openRecord(file, offset, key, prefix, counter++, headerObject.chunkSize, header);
    offset = record.next;
    restored += record.bytes.length;
    parts.push(record.bytes);
  }
  if (offset !== file.size || restored !== entry.size) throw Error('Authenticated PDF size does not match package metadata.');
  return new File(parts, entry.path, { type:'application/pdf' });
}
