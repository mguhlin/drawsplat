import createPublisher from './publisher-decoder.mjs';
self.onmessage = async ({ data }) => {
  try {
    const bytes = data instanceof ArrayBuffer ? data : data?.bytes, encoding = data?.encoding || 'auto';
    if (!(bytes instanceof ArrayBuffer) || bytes.byteLength > 32000000) throw Error('Choose a Publisher file smaller than 32 MB.');
    const response = await fetch(new URL('./unicode-data.dat', import.meta.url)); if (!response.ok) throw Error('The local Publisher language data could not load.');
    const unicode = new Uint8Array(await response.arrayBuffer()), module = await createPublisher({ print: () => {}, printErr: () => {} });
    module.FS.writeFile('/unicode-data.dat', unicode);
    if (module.ccall('load_unicode_data', 'number', ['string'], ['/unicode-data.dat']) > 0) throw Error('Publisher language data is invalid.');
    if (!['auto', 'UTF-16LE', 'windows-1250', 'windows-1251', 'windows-1252', 'windows-1256', 'windows-1258', 'Shift_JIS', 'GB18030', 'Big5'].includes(encoding)) throw Error('Unsupported Publisher text encoding.');
    if (encoding !== 'auto') module.ccall('set_pub_encoding', null, ['string'], [encoding]);
    module.FS.writeFile('/input.pub', new Uint8Array(bytes));
    const result = module.ccall('parse_pub', 'string', ['string'], ['/input.pub']);
    if (result.length > 64000000) throw Error('The decoded Publisher document is too large.');
    self.postMessage(JSON.parse(result));
  } catch (error) { self.postMessage({ error: error?.message || String(error) }); }
};
