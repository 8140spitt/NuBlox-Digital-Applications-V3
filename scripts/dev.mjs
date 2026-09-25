import { spawn, spawnSync } from 'node:child_process';

const pnpm = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';
const children = new Set();

function runRequired(args, label) {
  const result = spawnSync(pnpm, args, {
    stdio: 'inherit',
    env: {
      ...process.env,
      NODE_ENV: process.env.NODE_ENV || 'development'
    }
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    console.error(
      `NuBlox startup stopped because ${label} failed (exit code=${result.status ?? 'null'}).`
    );
    process.exit(result.status ?? 1);
  }
}

function start(args, label) {
  const child = spawn(pnpm, args, {
    stdio: 'inherit',
    env: {
      ...process.env,
      NODE_ENV: process.env.NODE_ENV || 'development'
    }
  });

  children.add(child);
  child.once('exit', (code, signal) => {
    children.delete(child);

    if (!stopping && label === 'web') {
      console.error(
        `NuBlox web process exited unexpectedly (code=${code ?? 'null'}, signal=${signal ?? 'null'}).`
      );
      stop(code ?? 1);
    }
  });

  return child;
}

let stopping = false;

function stop(exitCode = 0) {
  if (stopping) return;
  stopping = true;

  for (const child of children) {
    if (!child.killed) child.kill('SIGTERM');
  }

  const timer = setTimeout(() => {
    for (const child of children) {
      if (!child.killed) child.kill('SIGKILL');
    }
    process.exit(exitCode);
  }, 3000);
  timer.unref();

  if (children.size === 0) process.exit(exitCode);
  Promise.all(
    [...children].map(
      (child) =>
        new Promise((resolve) => {
          child.once('exit', resolve);
        })
    )
  ).then(() => process.exit(exitCode));
}

process.once('SIGINT', () => stop(0));
process.once('SIGTERM', () => stop(0));

runRequired(['db:migrate'], 'database migration');
start(['--dir', 'packages/persistence', 'auth:dispatch-loop'], 'identity-worker');
start(['--dir', 'apps/web', 'dev'], 'web');
