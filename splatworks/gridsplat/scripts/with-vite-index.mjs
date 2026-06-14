import { copyFile, readFile, writeFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';

const deployIndexPath = new URL('../index.html', import.meta.url);
const viteIndexPath = new URL('../index.vite.html', import.meta.url);

const [command, ...args] = process.argv.slice(2);

if (!command) {
  console.error('Usage: node scripts/with-vite-index.mjs <command> [...args]');
  process.exit(1);
}

const originalIndex = await readFile(deployIndexPath);
let restored = false;

async function restoreIndex() {
  if (restored) {
    return;
  }

  restored = true;
  await writeFile(deployIndexPath, originalIndex);
}

function forwardSignal(child, signal) {
  process.once(signal, () => {
    child.kill(signal);
  });
}

await copyFile(viteIndexPath, deployIndexPath);

const child = spawn(command, args, {
  stdio: 'inherit',
  shell: process.platform === 'win32',
});

forwardSignal(child, 'SIGINT');
forwardSignal(child, 'SIGTERM');

const exitCode = await new Promise((resolve) => {
  child.once('exit', (code, signal) => {
    resolve(signal ? 1 : code ?? 1);
  });
});

await restoreIndex();
process.exit(exitCode);
