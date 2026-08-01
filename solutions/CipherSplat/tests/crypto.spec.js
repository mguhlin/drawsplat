const { test, expect } = require('@playwright/test');

test.beforeEach(async ({ page }) => {
  await page.goto('/solutions/CipherSplat/');
  await page.locator('#password').fill('correct horse battery staple');
});

test('text v3 authenticates the exact header, ciphertext, and tag', async ({ page }) => {
  const result = await page.evaluate(async () => {
    const original = await encryptData(enc.encode('audit plaintext'), 'text', 'audit.txt', []);
    const hlen = new DataView(original.buffer, original.byteOffset + 8, 4).getUint32(0);
    const positions = { header: 12 + 5, ciphertext: 12 + hlen + 1, tag: original.length - 1 };
    const rejected = {};
    for (const [name, position] of Object.entries(positions)) {
      const changed = original.slice();
      changed[position] ^= 1;
      try { await decryptData(changed); rejected[name] = false; }
      catch { rejected[name] = true; }
    }
    const opened = await decryptData(original);
    return { magic: dec.decode(original.slice(0, 8)), text: dec.decode(opened.data), rejected };
  });

  expect(result.magic).toBe('CSPTXT3!');
  expect(result.text).toBe('audit plaintext');
  expect(result.rejected).toEqual({ header: true, ciphertext: true, tag: true });
});

test('text parser rejects a mismatched authenticated format version', async ({ page }) => {
  const rejected = await page.evaluate(async () => {
    const original = await encryptData(enc.encode('version test'), 'text', 'audit.txt', []);
    const hlen = new DataView(original.buffer, original.byteOffset + 8, 4).getUint32(0);
    const header = JSON.parse(dec.decode(original.slice(12, 12 + hlen)));
    header.v = 4;
    const replacement = enc.encode(JSON.stringify(header));
    if (replacement.length !== hlen) throw Error('Test requires an equal-length version mutation.');
    const changed = original.slice();
    changed.set(replacement, 12);
    try { await decryptData(changed); return false; }
    catch { return true; }
  });
  expect(rejected).toBe(true);
});

test('legacy vault metadata rejects unsafe paths and inconsistent sizes', async ({ page }) => {
  const rejected = await page.evaluate(() => {
    const cases = [
      { meta: { kind: 'folder', name: 'vault', entries: [{ path: '../escape.txt', size: 1, type: 'text/plain' }] }, size: 1 },
      { meta: { kind: 'file', name: 'vault', entries: [{ path: 'safe.txt', size: 2, type: 'text/plain' }] }, size: 1 },
      { meta: { kind: 'file', name: 'vault', entries: [{ path: 'safe.txt', size: 1, type: 7 }] }, size: 1 },
    ];
    return cases.every(({ meta, size }) => {
      try { validatePlainMetadata(meta, size); return false; }
      catch { return true; }
    });
  });
  expect(rejected).toBe(true);
});

test('chunked v4 authenticates its header for every record', async ({ page }) => {
  const result = await page.evaluate(async () => {
    selectedEntries = [{ file: new File([enc.encode('chunk data')], 'audit.txt'), path: 'audit.txt' }];
    const encrypted = await encryptFilesChunked();
    const original = new Uint8Array(await encrypted.blob.arrayBuffer());
    const opened = await decryptFilesChunked(new File([original], 'audit.ciphersplat'));
    const changed = original.slice();
    changed[12 + 5] ^= 1;
    let headerRejected = false;
    try { await decryptFilesChunked(new File([changed], 'changed.ciphersplat')); }
    catch { headerRejected = true; }
    return {
      name: encrypted.name,
      magic: dec.decode(original.slice(0, 8)),
      text: await opened.files[0].blob.text(),
      headerRejected,
    };
  });

  expect(result).toEqual({ name: 'audit.txt.csplat', magic: 'CSPCS4!!', text: 'chunk data', headerRejected: true });
});

test('chunked v4 rejects ciphertext mutation, truncation, and appended data', async ({ page }) => {
  const rejected = await page.evaluate(async () => {
    selectedEntries = [{ file: new File([enc.encode('structural test')], 'audit.txt'), path: 'audit.txt' }];
    const encrypted = await encryptFilesChunked();
    const original = new Uint8Array(await encrypted.blob.arrayBuffer());
    const hlen = new DataView(original.buffer, original.byteOffset + 8, 4).getUint32(0);
    const mutation = original.slice();
    mutation[12 + hlen + 8] ^= 1;
    const variants = {
      ciphertext: mutation,
      truncated: original.slice(0, -1),
      appended: concat(original, new Uint8Array([0])),
    };
    const result = {};
    for (const [name, bytes] of Object.entries(variants)) {
      try { await decryptFilesChunked(new File([bytes], `${name}.ciphersplat`)); result[name] = false; }
      catch { result[name] = true; }
    }
    return result;
  });
  expect(rejected).toEqual({ ciphertext: true, truncated: true, appended: true });
});

test('legacy NV1 text packages remain decryptable with strict v1 validation', async ({ page }) => {
  const result = await page.evaluate(async () => {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const key = await derive(els.password.value, salt);
    const plain = makePlain('text', 'legacy.txt', enc.encode('legacy plaintext'), []);
    const cipher = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv, tagLength: 128 }, key, plain));
    const header = enc.encode(JSON.stringify({
      v: 1, brand: 'Nivora Vault', alg: 'AES-256-GCM', kdf: 'PBKDF2-SHA-256',
      iter: ITERATIONS, salt: b64(salt), iv: b64(iv),
    }));
    const opened = await decryptData(concat(MAGIC, u32(header.length), header, cipher));
    return dec.decode(opened.data);
  });
  expect(result).toBe('legacy plaintext');
});

test('legacy authenticated PBKDF2 text v2 and chunked v3 remain decryptable', async ({ page }) => {
  const result = await page.evaluate(async () => {
    const password = els.password.value;
    const textSalt = crypto.getRandomValues(new Uint8Array(16));
    const textIv = crypto.getRandomValues(new Uint8Array(12));
    const textHeader = enc.encode(JSON.stringify({
      v: 2, alg: 'AES-256-GCM', kdf: 'PBKDF2-SHA-256', iter: ITERATIONS,
      salt: b64(textSalt), iv: b64(textIv),
    }));
    const textAad = containerAad(MAGIC_TEXT2, textHeader);
    const textKey = await derive(password, textSalt);
    const textCipher = new Uint8Array(await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: textIv, additionalData: textAad, tagLength: 128 },
      textKey, makePlain('text', 'legacy-v2.txt', enc.encode('legacy v2'), []),
    ));
    const textOpened = await decryptData(concat(textAad, textCipher));

    const salt = crypto.getRandomValues(new Uint8Array(16));
    const prefix = crypto.getRandomValues(new Uint8Array(8));
    const header = enc.encode(JSON.stringify({
      v: 3, alg: 'AES-256-GCM-CHUNKED', kdf: 'PBKDF2-SHA-256', iter: ITERATIONS,
      salt: b64(salt), prefix: b64(prefix), chunkSize: CHUNK_SIZE,
    }));
    const key = await derive(password, salt);
    const sealV3 = async (counter, plain) => {
      const cipher = new Uint8Array(await crypto.subtle.encrypt({
        name: 'AES-GCM', iv: ivFor(prefix, counter),
        additionalData: recordAad(3, header, counter), tagLength: 128,
      }, key, plain));
      return concat(u32(plain.length), u32(cipher.length), cipher);
    };
    const data = enc.encode('legacy v3');
    const metadata = enc.encode(JSON.stringify({
      kind: 'file', name: 'legacy-v3.txt',
      files: [{ path: 'legacy-v3.txt', size: data.length, type: 'text/plain', chunks: 1 }],
    }));
    const packageBytes = concat(MAGIC3, u32(header.length), header, await sealV3(0, metadata), await sealV3(1, data));
    const chunkOpened = await decryptFilesChunked(new File([packageBytes], 'legacy-v3.ciphersplat'));
    return { text: dec.decode(textOpened.data), chunk: await chunkOpened.files[0].blob.text() };
  });
  expect(result).toEqual({ text: 'legacy v2', chunk: 'legacy v3' });
});

test('Argon2id implementation matches a fixed independent vector', async ({ page }) => {
  const hex = await page.evaluate(async () => {
    const output = await window.hashwasm.argon2id({
      password: 'password', salt: 'somesalt', iterations: 1, memorySize: 64,
      parallelism: 1, hashLength: 24, outputType: 'hex',
    });
    return output;
  });
  expect(hex).toBe('655ad15eac652dc59f7170a7332bf49b8469be1fdb9c28bb');
});

test('hostile Argon2id parameters are rejected before derivation', async ({ page }) => {
  const rejected = await page.evaluate(() => {
    const base = { kdf: 'Argon2id-v1.3', memory: 65536, passes: 3, parallelism: 1, keyLength: 32 };
    return [
      { ...base, memory: ARGON2_MEMORY + 1 },
      { ...base, passes: ARGON2_ITERATIONS + 1 },
      { ...base, parallelism: ARGON2_PARALLELISM + 1 },
      { ...base, keyLength: 64 },
    ].every(params => { try { validateArgon2(params); return false; } catch { return true; } });
  });
  expect(rejected).toBe(true);
});
