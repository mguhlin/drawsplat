import { copyFileSync, readFileSync, writeFileSync } from 'node:fs';
import { spawn } from 'node:child_process';

const deployIndexPath = new URL('../index.html', import.meta.url);
const viteIndexPath = new URL('../index.vite.html', import.meta.url);
const [command, ...args] = process.argv.slice(2);
if (!command) {
  console.error('Usage: node scripts/with-vite-index.mjs <command> [...args]');
  process.exit(1);
}

const originalIndex = readFileSync(deployIndexPath);
let restored = false;
let child;
function restoreIndex() {
  if (restored) return;
  writeFileSync(deployIndexPath, originalIndex);
  restored = true;
}
// Install cleanup before changing the entrypoint. Synchronous file operations
// leave no pending write that could overwrite restoration during termination.
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.once(signal, () => {
    restoreIndex();
    child?.kill(signal);
    process.exit(1);
  });
}

let exitCode;
try {
  copyFileSync(viteIndexPath, deployIndexPath);
  child = spawn(command, args, {
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });
  exitCode = await new Promise((resolve, reject) => {
    child.once('error', reject);
    child.once('exit', (code, signal) => resolve(signal ? 1 : code ?? 1));
  });
} finally {
  restoreIndex();
}
process.exit(exitCode);
