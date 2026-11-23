'use strict';
let pgpPreviewEpoch=0,pgpPreviewTimer;
function clearPgpKeyPreview(){
 pgpPreviewEpoch++;clearTimeout(pgpPreviewTimer);if(!$('#pgpKeyDetails'))return;
 $('#pgpKeyDetails').classList.add('hidden');$('#pgpFingerprint').textContent='';$('#pgpLoadedType').textContent='';$('#pgpKeyUse').textContent='';
}
function queuePgpKeyPreview(){clearPgpKeyPreview();pgpPreviewTimer=setTimeout(previewOpenPgpKey,220)}
async function previewOpenPgpKey(){
 const epoch=++pgpPreviewEpoch,text=$('#pgpKeyInput').value.trim(),binary=pgpKeyBinary;
 if(enc.encode(text).length>4*1048576){$('#pgpKeyStatus').textContent='Use one exported key up to 4 MiB.';return}
 if(!text&&!binary){clearPgpKeyPreview();syncCredentialPanel();return}
 if(/^https?:\/\//i.test(text)){$('#pgpKeyStatus').textContent='Import a key file or paste its complete key block, not a web address. CipherSplat does not fetch keys from servers.';return}
 try{
  const engine=await getOpenPgp(),key=binary?await engine.readKey({binaryKey:binary}):await engine.readKey({armoredKey:text});
  if(epoch!==pgpPreviewEpoch||workspaceBusy)return;
  const kind=key.isPrivate()?'private':'public';pgpLoadedKind=kind;
  $('#pgpLoadedType').textContent=kind==='private'?'Private key loaded':'Public key loaded';
  $('#pgpFingerprint').textContent=key.getFingerprint().toUpperCase().match(/.{1,4}/g).join(' ');
  $('#pgpKeyUse').textContent=kind==='private'?'Use this to decrypt a message addressed to its matching public key. '+(!key.isDecrypted()?'Enter its private-key passphrase below.':'This key has no passphrase protection.'):'Use this to encrypt for its owner. Verify this fingerprint with the recipient before encrypting.';
  $('#pgpKeyDetails').classList.remove('hidden');syncCredentialPanel();sync();
 }catch{if(epoch===pgpPreviewEpoch){pgpLoadedKind='';$('#pgpKeyDetails').classList.add('hidden');$('#pgpKeyStatus').textContent='Paste the complete public/private key block or import an exported .asc/.pgp key file.'}}
}
function syncPgpPageHelp(){
 const hint=$('#pgpActionHelp');if(!hint)return;
 hint.textContent=operation==='decrypt'?'Encrypted content detected. Use your matching private key and its passphrase, if protected.':'To encrypt, use the recipient’s public key. Only the matching private key can unlock the result.';
}
if(document.body.dataset.ciphersplatMode==='openpgp'){
 if(location.hash==='#key-help')location.replace('help.html#openpgp-keys');
 setCryptoMethod('openpgp');syncPgpPageHelp();
}
