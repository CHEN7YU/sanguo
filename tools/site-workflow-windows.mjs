import { spawn } from 'node:child_process';

const workflow = process.argv[2];
const args = process.argv.slice(3);
if (!workflow) {
  console.error('usage: node site-workflow-windows.mjs <site-workflow.mjs> [args...]');
  process.exit(64);
}

const gitBashBins = [String.raw`C:\Program Files\Git\usr\bin`, String.raw`C:\Program Files\Git\bin`];
// GNU tar treats the drive-letter colon in an absolute Windows archive path as
// a remote-host separator unless --force-local is present.
const env = { ...process.env, TAR_OPTIONS: '--force-local', Path: [...gitBashBins, process.env.Path || ''].join(';') };
const child = spawn(process.execPath, [workflow, ...args], { stdio: 'inherit', env });
child.once('error', error => {
  console.error(error.message);
  process.exit(1);
});
child.once('exit', (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  else process.exit(code ?? 1);
});
