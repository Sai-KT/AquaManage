import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const backendDir = path.resolve(rootDir, 'backend');

console.log('─────────────────────────────────────────────────────────────');
console.log('  Starting AquaManage Full-Stack (Frontend + Local Backend)');
console.log('─────────────────────────────────────────────────────────────\n');

// 1. Spawn Backend
const backend = spawn('npm', ['run', 'dev'], {
  cwd: backendDir,
  stdio: 'inherit',
  shell: true,
});

// 2. Spawn Frontend
const frontend = spawn('npx', ['vite'], {
  cwd: rootDir,
  stdio: 'inherit',
  shell: true,
});

function cleanup() {
  console.log('\nStopping full-stack processes...');
  backend.kill();
  frontend.kill();
  process.exit(0);
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
