#!/usr/bin/env python3
"""Rebuild the pinned, local-only Go/pdfcpu WebAssembly security worker."""
import base64,json,subprocess,tempfile,hashlib,gzip
from pathlib import Path
root=Path(__file__).resolve().parent
with tempfile.TemporaryDirectory() as temporary:
 wasm=Path(temporary)/'security.wasm'
 subprocess.run(['go','build','-buildvcs=false','-trimpath','-ldflags=-s -w','-o',str(wasm),'.'],cwd=root,env={**__import__('os').environ,'GOOS':'js','GOARCH':'wasm'},check=True)
 goroot=Path(subprocess.check_output(['go','env','GOROOT'],text=True).strip())
 runtime=(goroot/'lib/wasm/wasm_exec.js').read_text()
 worker='''function pdfSecurityWorkerMain(encoded){
'''+runtime+'''
let busy=false;
self.onmessage=async({data})=>{
 if(busy)return;busy=true;
 try{
  const binary=atob(encoded),bytes=new Uint8Array(binary.length);for(let i=0;i<bytes.length;i++)bytes[i]=binary.charCodeAt(i);
  if(typeof DecompressionStream==='undefined')throw Error('Update your system WebView or browser to load the local PDF security engine.');
  const wasm=await new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer();
  const go=new Go(),module=await WebAssembly.instantiate(wasm,go.importObject);void go.run(module.instance);
  const result=globalThis.pdfSplatCrypt(data.operation,new Uint8Array(data.bytes),data.password);
  data.password='';
  if(result.error)self.postMessage({error:result.error});else self.postMessage({bytes:result.bytes.buffer},[result.bytes.buffer]);
 }catch(error){self.postMessage({error:error.message||'PDF security engine failed'});}
};
}
'''
 output=worker+'\nconst pdfSecurityWasm='+json.dumps(base64.b64encode(gzip.compress(wasm.read_bytes(),mtime=0)).decode())+';\nif(typeof document!=="undefined"){globalThis.PDFSplatSecurityWorkerCode="("+pdfSecurityWorkerMain.toString()+")("+JSON.stringify(pdfSecurityWasm)+");";}else pdfSecurityWorkerMain(pdfSecurityWasm);\n'
 (root.parent/'pdf-security-worker.js').write_text(output)
 (root/'engine-manifest.json').write_text(json.dumps({'go':subprocess.check_output(['go','version'],text=True).strip(),'pdfcpu':'v0.16.3','wasm_sha256':hashlib.sha256(wasm.read_bytes()).hexdigest(),'worker_sha256':hashlib.sha256(output.encode()).hexdigest(),'input_limit_bytes':16<<20,'output_limit_bytes':32<<20,'runtime':'isolated one-operation worker; in-memory stateless configuration'},indent=2)+'\n')
# Preserve all runtime dependency licenses alongside the engine.
raw=subprocess.check_output(['go','list','-m','-json','all'],cwd=root,text=True);decoder=json.JSONDecoder();modules=[]
while raw.strip():
 value,end=decoder.raw_decode(raw.lstrip());raw=raw.lstrip()[end:];modules.append(value)
used=set(subprocess.check_output(['go','list','-deps','-f','{{if .Module}}{{.Module.Path}}{{end}}','.'],cwd=root,text=True).split())
notices=['PDFSplat password PDF engine. Go and pdfcpu dependencies retain their respective licenses.\n']
for module in modules:
 if module.get('Main') or module['Path'] not in used:continue
 folder=Path(module['Dir']);licenses=[p for p in folder.iterdir() if p.is_file() and p.name.lower().startswith(('license','copying','notice'))]
 if not licenses:raise SystemExit('Missing license: '+module['Path'])
 notices.append('\n=== '+module['Path']+' '+module['Version']+' ===\n')
 for p in licenses:notices.append(p.read_text(errors='replace'))
notices.append('\n=== Go runtime ===\n'+(goroot/'LICENSE').read_text())
(root/'THIRD-PARTY-NOTICES.txt').write_text('\n'.join(notices))
print('Built local PDF security worker')
