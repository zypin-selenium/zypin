#!/usr/bin/env node

import { existsSync, mkdirSync, createWriteStream } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { homedir } from 'os';
import { spawn, execSync } from 'child_process';

process.on('uncaughtException', (err) => (console.error(`✗ failed, ${err.message}`), process.exit(1)));

const __dirname = dirname(fileURLToPath(import.meta.url)), JAR_PATH = join(__dirname, 'lib', 'selenium-server-4.38.0.jar'), LOG_DIR = join(homedir(), '.zypin', 'logs'), PORT = 4444, noTunnel = process.argv.includes('--no-tunnel');

await task('checking requirements...', (resolve, reject) => {
  !existsSync(LOG_DIR) && mkdirSync(LOG_DIR, { recursive: true });
  try { execSync('java -version', { stdio: 'ignore' }), resolve('requirements ready'); } catch { reject(new Error('java is not installed')); }
});

await task('starting grid...', (resolve, reject) => {
  let gridLog = createWriteStream(join(LOG_DIR, 'selenium-grid.log'), { flags: 'a' }), gridChild = spawn('java', ['-jar', JAR_PATH, 'standalone', '--selenium-manager', 'true'], { stdio: ['inherit', 'pipe', 'pipe'] });
  gridChild.stdout.pipe(gridLog), gridChild.stderr.pipe(gridLog), process.on('exit', () => (gridChild && gridChild.kill('SIGTERM'), gridLog.end()));
  gridChild.on('exit', (code) => code !== 0 && code !== null && reject(new Error(`see ${join(LOG_DIR, 'selenium-grid.log')}`)));
  gridChild.stdout.on('data', (data) => data.toString().includes('Started Selenium') && resolve(`grid at http://localhost:${PORT}`));
});

!noTunnel && await task('starting tunnel...', (resolve, reject) => {
  let tunnelLog = createWriteStream(join(LOG_DIR, 'tunnel.log'), { flags: 'a' }), tunnelChild = spawn('npx', ['-y', 'cloudflared', 'tunnel', '--url', `http://localhost:${PORT}`], { stdio: ['ignore', 'pipe', 'pipe'] });
  tunnelChild.stdout.pipe(tunnelLog), tunnelChild.stderr.pipe(tunnelLog), process.on('exit', () => (tunnelChild && tunnelChild.kill('SIGTERM'), tunnelLog.end()));
  tunnelChild.on('exit', (code) => code !== 0 && code !== null && reject(new Error(`see ${join(LOG_DIR, 'tunnel.log')}`)));
  tunnelChild.stderr.on('data', (data) => ((match) => match && resolve(`tunnel at ${match[1]}`))(data.toString().match(/(https:\/\/[^\s]+\.trycloudflare\.com)/)));
});

function task(title, fn) { return (console.log(title), new Promise(fn).then((msg) => console.log(`✓ ${msg}\n`), (err) => { throw err; })); }