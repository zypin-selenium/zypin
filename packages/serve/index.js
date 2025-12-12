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

test('Selenium Grid startup', async (t) => {
  t.ok(() => (!existsSync(LOG_DIR) && mkdirSync(LOG_DIR, { recursive: true }), existsSync(LOG_DIR)), 'Log directory should exist');
  t.ok(() => false, 'Java should be installed');  // Force fail to test bailout
  t.ok(() => (console.log('THIS SHOULD NOT PRINT'), true), 'Test should pass');
})

// await test('Requirements should be satisfied', async () => (
//   await test('Log directory should exist', () => !existsSync(LOG_DIR) && mkdirSync(LOG_DIR, { recursive: true })),
//   await test('Java should be installed', () => execSync('java -version', { stdio: 'ignore' }))
// ));

// await test('Grid should start successfully', async () => {
//   let gridLog, gridChild;
//   await test('Grid process should spawn', () => gridChild = spawn('java', ['-jar', JAR_PATH, 'standalone', '--port', String(PORT), '--selenium-manager', 'true'], { stdio: ['inherit', 'pipe', 'pipe'] }));
//   await test('Grid should setup logging and cleanup', () => (
//     gridLog = createWriteStream(join(LOG_DIR, 'selenium-grid.log'), { flags: 'a' }),
//     gridChild.stdout.pipe(gridLog),
//     gridChild.stderr.pipe(gridLog),
//     process.on('exit', () => (gridChild && gridChild.kill('SIGTERM'), gridLog.end()))
//   ));
//   await test('Grid should complete startup', () => new Promise((resolve, reject) => (
//     gridChild.on('exit', (code) => code !== 0 && code !== null && reject(new Error(`Grid startup failed (code ${code})\nLogs: ${join(LOG_DIR, 'selenium-grid.log')}`))),
//     gridChild.stdout.on('data', (data) => data.toString().includes('Started Selenium') && resolve())
//   )));
// });

// await test('Tunnel should start successfully', { skip: process.argv.includes('--no-tunnel') }, async () => {
//   let tunnelLog, tunnelChild;
//   await test('Tunnel process should spawn', () => tunnelChild = spawn('npx', ['-y', 'cloudflared', 'tunnel', '--url', `http://localhost:${PORT}`], { stdio: ['ignore', 'pipe', 'pipe'] }));
//   await test('Tunnel should setup logging and cleanup', () => (
//     tunnelLog = createWriteStream(join(LOG_DIR, 'tunnel.log'), { flags: 'a' }),
//     tunnelChild.stdout.pipe(tunnelLog),
//     tunnelChild.stderr.pipe(tunnelLog),
//     process.on('exit', () => (tunnelChild && tunnelChild.kill('SIGTERM'), tunnelLog.end()))
//   ));
//   await test('Tunnel should complete startup', () => new Promise((resolve, reject) => (
//     tunnelChild.on('exit', (code) => code !== 0 && code !== null && reject(new Error(`Tunnel startup failed (code ${code})\nLogs: ${join(LOG_DIR, 'tunnel.log')}`))),
//     tunnelChild.stderr.on('data', (data) => ((match) => match && resolve(`tunnel at ${match[1]}`))(data.toString().match(/(https:\/\/[^\s]+\.trycloudflare\.com)/)))
//   )));
// });
