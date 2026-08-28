'use strict';

importScripts('./vendor/hash-wasm/argon2.umd.min.js');

self.onmessage = async event => {
  const { password, salt, memorySize, iterations, parallelism, hashLength } = event.data;
  try {
    const key = await hashwasm.argon2id({
      password: new Uint8Array(password),
      salt: new Uint8Array(salt),
      memorySize,
      iterations,
      parallelism,
      hashLength,
      outputType: 'binary',
    });
    self.postMessage({ key: key.buffer }, [key.buffer]);
  } catch (error) {
    self.postMessage({ error: error?.message || String(error) });
  }
};
