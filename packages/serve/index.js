#!/usr/bin/env node

import { test } from '@zypin-selenium/test';
import { existsSync, mkdirSync, createWriteStream } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { homedir } from 'os';
import { spawn, execSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const JAR_PATH = join(__dirname, 'lib', 'selenium-server-4.38.0.jar');
const LOG_DIR = join(homedir(), '.zypin', 'logs');
const PORT = 19539;

await test('Selenium Grid should start', async ({ ok, doesNotThrow, doesNotReject }) => {
  ok((!existsSync(LOG_DIR) && mkdirSync(LOG_DIR, { recursive: true }), existsSync(LOG_DIR)), 'Log directory should exist');
  doesNotThrow(() => execSync('java -version', { stdio: 'ignore' }), 'Java should exist');

  let gridLog, gridChild;
  ok(gridChild = spawn('java', ['-jar', JAR_PATH, 'standalone', '--port', String(PORT), '--selenium-manager', 'true'], { stdio: ['inherit', 'pipe', 'pipe'] }), 'Grid process should spawn');
  ok((gridLog = createWriteStream(join(LOG_DIR, 'selenium-grid.log'), { flags: 'a' }), gridChild.stdout.pipe(gridLog), gridChild.stderr.pipe(gridLog), process.on('exit', () => (gridChild && gridChild.kill('SIGTERM'), gridLog.end()))), 'Grid should create log file');
  await doesNotReject(() => new Promise((resolve, reject) => (
    gridChild.on('exit', (code) => code !== 0 && code !== null && reject(new Error(`Grid startup failed (code ${code})\nLogs: ${join(LOG_DIR, 'selenium-grid.log')}`))),
    gridChild.stdout.on('data', (data) => data.toString().includes('Started Selenium') && resolve())
  )), 'Grid should start');
});

await test('Tunnel should start', async ({ ok, doesNotReject }) => {
  let tunnelLog, tunnelChild;
  ok(tunnelChild = spawn('npx', ['-y', 'cloudflared', 'tunnel', '--url', `http://localhost:${PORT}`], { stdio: ['ignore', 'pipe', 'pipe'] }), 'Tunnel process should spawn');
  ok((tunnelLog = createWriteStream(join(LOG_DIR, 'tunnel.log'), { flags: 'a' }), tunnelChild.stdout.pipe(tunnelLog), tunnelChild.stderr.pipe(tunnelLog), process.on('exit', () => (tunnelChild && tunnelChild.kill('SIGTERM'), tunnelLog.end()))), 'Tunnel should create log file');
  await doesNotReject(() => new Promise((resolve, reject) => (
    tunnelChild.on('exit', (code) => code !== 0 && code !== null && reject(new Error(`Tunnel startup failed (code ${code})\nLogs: ${join(LOG_DIR, 'tunnel.log')}`))),
    tunnelChild.stderr.on('data', (data) => ((match) => match && resolve(`tunnel at ${match[1]}`))(data.toString().match(/(https:\/\/[^\s]+\.trycloudflare\.com)/)))
  )), 'Tunnel should start');
}, { skip: process.argv.includes('--no-tunnel') });
