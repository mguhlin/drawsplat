const {test,expect}=require('@playwright/test');
const password='Synthetic interoperability password';
test.beforeEach(async({page})=>{await page.goto('/solutions/CipherSplat/');});
test('unified workspace preserves exact Unicode text and offers automatic download',async({page})=>{
 const errors=[];page.on('pageerror',error=>errors.push(error.message));
 await page.locator('#password').fill(password);await page.locator('#textInput').fill('Synthetic español 日本語\n\n');
 const download=page.waitForEvent('download');await page.locator('#runButton').click();expect((await download).suggestedFilename()).toBe('encrypted-note.csplat');
 const encrypted=await page.locator('#textResult').inputValue();expect(encrypted).toMatch(/^PRISMVAULT3\./);await expect(page.locator('#password')).toHaveValue('');
 await page.locator('#textInput').fill(encrypted);await page.locator('#password').fill(password);await page.locator('#runButton').click();await expect(page.locator('#textResult')).toHaveValue('Synthetic español 日本語\n\n');expect(errors).toEqual([]);
});
test('file selection automatically compresses, encrypts, verifies and saves; restores original bytes',async({page})=>{
 await page.evaluate(()=>{delete window.showSaveFilePicker});await page.locator('#password').fill(password);const download=page.waitForEvent('download');await page.locator('#fileInput').setInputFiles({name:'sample.txt',mimeType:'text/plain',buffer:Buffer.from('Original español 日本語\n\n')});
 const encrypted=await download;expect(encrypted.suggestedFilename()).toBe('sample.txt.csplat');
 await page.evaluate(()=>{delete window.showDirectoryPicker});await page.locator('#password').fill(password);
 const restored=page.waitForEvent('download');await page.locator('#fileInput').setInputFiles(await encrypted.path());const plain=await restored;
 expect(plain.suggestedFilename()).toBe('sample.txt');expect(await require('fs/promises').readFile(await plain.path(),'utf8')).toBe('Original español 日本語\n\n');
});
test('save cancellation retains originals and does not run encryption',async({page})=>{
 await page.evaluate(()=>{window.showSaveFilePicker=async()=>{throw new DOMException('cancel','AbortError')};});await page.locator('#password').fill(password);await page.locator('#fileInput').setInputFiles({name:'sample.txt',mimeType:'text/plain',buffer:Buffer.from('Still ready')});
 await expect(page.locator('#statusCopy')).toContainText('Save cancelled');expect(await page.evaluate(()=>selectedEntries.length)).toBe(1);await expect(page.locator('#password')).toHaveValue(password);await expect(page.locator('#resultPanel')).toBeHidden();
});
test('invalid encrypted inputs and unsafe archive trees are rejected',async({page})=>{
 await page.locator('#fileInput').setInputFiles({name:'broken.csplat',mimeType:'application/octet-stream',buffer:Buffer.from('not encrypted')});await expect(page.locator('#errorMessage')).toContainText('not a recognized');
 const rejected=await page.evaluate(async()=>{
  const bad=[[{path:'../escape',dir:false,size:1}],[{path:'CON.txt',dir:false,size:1}],[{path:'a',dir:false,size:1},{path:'A',dir:false,size:1}],[{path:'a',dir:false,size:1},{path:'a/b',dir:false,size:1}]];
  const out=bad.map(items=>{try{CipherSplatArchives.validateRestoreTree(items);return false}catch{return true}});
  const zip=new JSZip();zip.file('bad.txt','bad',{unixPermissions:0o120777});try{await CipherSplatArchives.unpack(await zip.generateAsync({type:'blob',platform:'UNIX'}));out.push(false)}catch{out.push(true)}return out;
 });expect(rejected).toEqual([true,true,true,true,true]);
});
test('marked archives restore directories and do not unpack ordinary original ZIP files',async({page})=>{
 const result=await page.evaluate(async()=>{
  const zip=new JSZip();zip.folder('empty');zip.file('nested/note.txt','Exact bytes\n');const blob=await zip.generateAsync({type:'blob'});const unpacked=await CipherSplatArchives.unpack(blob);
  resultBlob=new Blob([blob],{type:'application/zip'});resultName='original.zip';await unpackZipResult();return {dirs:unpacked.directories,files:unpacked.files.map(f=>f.path),ordinary:resultName,markers:[CipherSplatArchives.isArchiveType('application/vnd.cipherenc.zip'),CipherSplatArchives.isArchiveType('application/vnd.ciphersplat.zip')]};
 });expect(result.dirs).toContain('empty');expect(result.files).toEqual(['nested/note.txt']);expect(result.ordinary).toBe('original.zip');expect(result.markers).toEqual([true,true]);
});
test('OpenPGP imports local keys, previews fingerprints and clears key material',async({page})=>{
 await page.goto('/solutions/CipherSplat/openpgp.html');const key=await page.evaluate(async()=>{const keys=await openpgp.generateKey({type:'ecc',curve:'curve25519',userIDs:[{name:'Synthetic test'}],format:'armored'});return keys.publicKey});await page.locator('#pgpKeyFile').setInputFiles({name:'public.asc',mimeType:'application/pgp-keys',buffer:Buffer.from(key)});await expect(page.locator('#pgpLoadedType')).toHaveText('Public key loaded');await expect(page.locator('#pgpFingerprint')).toHaveText(/[A-F0-9 ]{40,}/);
 await page.locator('#textInput').fill('OpenPGP synthetic note');const download=page.waitForEvent('download');await page.locator('#runButton').click();expect((await download).suggestedFilename()).toBe('encrypted-message.asc');await expect(page.locator('#textResult')).toHaveValue(/BEGIN PGP MESSAGE/);await expect(page.locator('#pgpKeyInput')).toHaveValue('');await expect(page.locator('#pgpKeyDetails')).toBeHidden();
});
test('phone layout and help keep controls within the viewport',async({page})=>{
 await page.setViewportSize({width:390,height:844});await page.reload();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await expect(page.locator('#chooseFiles')).toBeVisible();await page.goto('/solutions/CipherSplat/help.html');expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await expect(page.locator('h1')).toBeVisible();
});
test('independent CipherEnc fixtures remain readable including compressed directories',async({page})=>{
 test.setTimeout(90000);const fixtures=require('./fixtures/cipherenc-browser.json'),zip=require('./fixtures/cipherenc-zip.json');
 const result=await page.evaluate(async({fixtures,zip})=>{
  const out=[];for(const fixture of fixtures){els.password.value=fixture.password;const bytes=fromB64(fixture.data);const text=fixture.name.includes('text')?dec.decode((await decryptData(bytes)).data):await (await decryptFilesChunked(new File([bytes],'fixture.csplat'))).files[0].blob.text();out.push(text===fixture.expected)}
  els.password.value=zip.password;const packed=await decryptFilesChunked(new File([fromB64(zip.data)],'fixture.csplat'));const unpacked=await CipherSplatArchives.unpack(packed.files[0].blob);return {out,paths:unpacked.files.map(f=>f.path),dirs:unpacked.directories};
 },{fixtures,zip});expect(result.out.every(Boolean)).toBe(true);expect(result.paths.length).toBeGreaterThan(0);expect(result.dirs).toEqual(['Lessons','Lessons/Nested']);
});
test('PDF integration opens compressed CipherSplat and legacy raw CS4, then verifies its own output',async({page})=>{
 test.setTimeout(90000);const result=await page.evaluate(async()=>{
  const {protectPdf,unlockPdf}=await import('/solutions/pdfsplat/src/ciphersplat-pdf.js');const source=enc.encode('%PDF-1.7\nSynthetic PDF bytes\n');els.password.value='Synthetic PDF password';selectedEntries=[{file:new File([source],'handout.pdf',{type:'application/pdf'}),path:'handout.pdf'}];
  const compressed=await encryptCompressedFiles();const opened=await unlockPdf(new File([compressed.blob],'handout.pdf.csplat'),els.password.value);
  const raw=await protectPdf(source,'handout.pdf',els.password.value);const old=await decryptFilesChunked(new File([raw],'old.csplat'));
  const mutated=new Uint8Array(await compressed.blob.arrayBuffer());mutated[mutated.length-1]^=1;let refused=false;try{await unlockPdf(new File([mutated],'bad.csplat'),els.password.value)}catch{refused=true}
  return {restored:await opened.text(),raw:await old.files[0].blob.text(),refused};
 });expect(result.restored).toBe('%PDF-1.7\nSynthetic PDF bytes\n');expect(result.raw).toBe(result.restored);expect(result.refused).toBe(true);
});
