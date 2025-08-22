#!/usr/bin/env node
// Orchestrated dev runner: ensures analyzer setup, starts it, waits for health, then starts API + Web
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import http from 'node:http';

const ROOT = process.cwd();
const ANALYZER_DIR = path.join(ROOT, 'apps', 'github-analyzer-service');
const VENV_DIR = path.join(ANALYZER_DIR, 'venv');
const HEALTH_URL = 'http://localhost:8080/health';

function log(section, msg) {
  console.log(`[dev] ${section}: ${msg}`);
}

function run(cmd, args, opts = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: 'inherit', shell: false, ...opts });
    child.on('exit', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${cmd} ${args.join(' ')} exited with code ${code}`));
    });
  });
}

async function waitForHealth(url, timeoutMs = 60000, intervalMs = 1500) {
  const start = Date.now();
  return await new Promise((resolve, reject) => {
    const tick = () => {
      const req = http.get(url, (res) => {
        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
          res.resume();
          return resolve(true);
        }
        res.resume();
        if (Date.now() - start > timeoutMs) return reject(new Error('timeout'));
        setTimeout(tick, intervalMs);
      });
      req.on('error', () => {
        if (Date.now() - start > timeoutMs) return reject(new Error('timeout'));
        setTimeout(tick, intervalMs);
      });
      req.setTimeout(5000, () => {
        req.destroy();
        if (Date.now() - start > timeoutMs) return reject(new Error('timeout'));
        setTimeout(tick, intervalMs);
      });
    };
    tick();
  });
}

async function main() {
  // 1) Ensure analyzer setup (venv and deps)
  if (!existsSync(VENV_DIR)) {
    log('setup', 'Analyzer venv not found; running setup...');
    await run('bun', ['run', 'setup:analyzer']);
  } else {
    log('setup', 'Analyzer venv present');
  }

  // 2) Start analyzer service first to avoid port races
  log('analyzer', 'starting analyzer dev server...');
  const analyzerProc = spawn('bun', ['run', 'dev:analyzer'], {
    cwd: ROOT,
    stdio: 'inherit',
    shell: false,
  });

  // If analyzer process dies early, bail out
  analyzerProc.on('exit', (code) => {
    if (code !== 0) {
      console.error(`Analyzer process exited with code ${code}`);
      process.exit(code || 1);
    }
  });

  // 3) Wait for analyzer health
  log('analyzer', `waiting for health at ${HEALTH_URL} ...`);
  try {
    await waitForHealth(HEALTH_URL, 90000, 2000);
    log('analyzer', 'healthy');
  } catch (e) {
    console.error('[dev] analyzer: failed to become healthy in time. You can check logs above.');
    process.exit(1);
  }

  // 4) Start API and Web in parallel (keep this process alive to show combined logs)
  log('backend', 'starting API and Web...');
  const backend = spawn('bun', ['run', 'dev:api'], { stdio: 'inherit', shell: false });
  const frontend = spawn('bun', ['run', 'dev:frontend'], { stdio: 'inherit', shell: false });

  const exitHandler = (code) => {
    try { analyzerProc.kill(); } catch {}
    try { backend.kill(); } catch {}
    try { frontend.kill(); } catch {}
    process.exit(code ?? 0);
  };
  process.on('SIGINT', () => exitHandler(0));
  process.on('SIGTERM', () => exitHandler(0));

  // keep process alive
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
