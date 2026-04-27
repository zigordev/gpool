#!/usr/bin/env node

import { existsSync, readFileSync, watch } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

function die(message) {
  console.error(message);
  process.exit(1);
}

function parseArgs(argv) {
  const args = {
    watch: false,
    workspace: null,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const value = argv[i];
    if (value === '--watch') {
      args.watch = true;
      continue;
    }
    if (value === '--once') {
      args.watch = false;
      continue;
    }
    if (value === '--workspace') {
      args.workspace = argv[i + 1] ?? null;
      i += 1;
    }
  }

  if (!args.workspace) {
    die('Missing required --workspace value');
  }

  return args;
}

function parseEnvFile(filePath) {
  const content = readFileSync(filePath, 'utf8');
  const env = {};
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const separatorIndex = trimmed.indexOf('=');
    if (separatorIndex <= 0) continue;
    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim();
    env[key] = value;
  }
  return env;
}

function runPush(repoRoot, workspace, env) {
  return new Promise((resolve) => {
    const child = spawn(
      'node',
      ['scripts/openbao-run.mjs', '--', 'npm', 'run', 'i18n:push', '-w', workspace],
      {
        cwd: repoRoot,
        stdio: 'inherit',
        env,
      },
    );

    child.on('exit', (code, signal) => {
      if (signal) {
        console.error(`Tolgee push interrupted by signal ${signal}`);
        resolve(1);
        return;
      }
      resolve(code ?? 1);
    });
  });
}

async function main() {
  const { watch: watchMode, workspace } = parseArgs(process.argv.slice(2));
  const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const envFile = path.join(repoRoot, 'docker/.env.app.local');
  const messagesDir = path.join(repoRoot, 'apps/ui/messages');

  if (!existsSync(envFile)) {
    die(`Missing ${path.relative(repoRoot, envFile)}. Create it before running Tolgee sync.`);
  }
  if (!existsSync(messagesDir)) {
    die(`Missing ${path.relative(repoRoot, messagesDir)} directory.`);
  }

  const envFromFile = parseEnvFile(envFile);
  const openbaoToken = envFromFile.OPENBAO_TOKEN?.trim();
  if (!openbaoToken || openbaoToken === 'CHANGE_ME_LOCAL_OPENBAO_TOKEN') {
    die('docker/.env.app.local must contain a real OPENBAO_TOKEN before Tolgee sync can run.');
  }

  const childEnv = {
    ...process.env,
    ...envFromFile,
    OPENBAO_ADDR: process.env.OPENBAO_ADDR ?? 'http://localhost:8200',
    OPENBAO_KV_MOUNT: process.env.OPENBAO_KV_MOUNT ?? 'kv',
    OPENBAO_SECRET_PATH: process.env.OPENBAO_SECRET_PATH ?? 'gpool',
    OPENBAO_REQUIRED_KEYS: 'TOLGEE_API_KEY',
    TOLGEE_API_URL: process.env.TOLGEE_API_URL ?? 'http://localhost:8090',
  };

  if (!childEnv.TOLGEE_PROJECT_ID?.trim()) {
    die('docker/.env.app.local must define TOLGEE_PROJECT_ID.');
  }

  const pushOnce = async () => {
    const exitCode = await runPush(repoRoot, workspace, childEnv);
    if (exitCode !== 0 && !watchMode) {
      process.exit(exitCode);
    }
  };

  await pushOnce();

  if (!watchMode) {
    return;
  }

  console.log(`Watching ${path.relative(repoRoot, messagesDir)} for Tolgee sync...`);

  let timer = null;
  let inFlight = false;
  let queued = false;

  const schedulePush = () => {
    if (timer) {
      clearTimeout(timer);
    }
    timer = setTimeout(async () => {
      if (inFlight) {
        queued = true;
        return;
      }
      inFlight = true;
      await pushOnce();
      inFlight = false;
      if (queued) {
        queued = false;
        schedulePush();
      }
    }, 400);
  };

  watch(messagesDir, (eventType, filename) => {
    if (!filename || !filename.endsWith('.json')) {
      return;
    }
    console.log(`Detected ${eventType} in ${filename}, syncing to Tolgee...`);
    schedulePush();
  });
}

main().catch((error) => {
  die(error instanceof Error ? error.message : String(error));
});
