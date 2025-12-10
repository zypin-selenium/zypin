#!/usr/bin/env node

import { existsSync, mkdirSync, createWriteStream } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { spawn } from 'child_process';
import https from 'https';

const SELENIUM_VERSION = '4.38.0';
const SELENIUM_JAR = `selenium-server-${SELENIUM_VERSION}.jar`;
const ZYPIN_DIR = join(homedir(), '.zypin');
const JAR_PATH = join(ZYPIN_DIR, SELENIUM_JAR);
const LOG_DIR = join(ZYPIN_DIR, 'logs');
const PORT = 4444;

[ZYPIN_DIR, LOG_DIR].forEach(dir => !existsSync(dir) && mkdirSync(dir, { recursive: true }));

if (!existsSync(JAR_PATH)) {
  console.log(`downloading selenium server ${SELENIUM_VERSION} to ${JAR_PATH}...`);
  await new Promise((resolve, reject) => {
    const handleResponse = (res) => {
      if (res.statusCode === 302 || res.statusCode === 301) return https.get(res.headers.location, handleResponse).on('error', reject);
      if (res.statusCode !== 200) return reject(new Error(`download failed with status ${res.statusCode}`));

      const file = createWriteStream(JAR_PATH), total = parseInt(res.headers['content-length'], 10);
      let downloaded = 0, lastProgress = 0;

      res.on('data', (chunk) => {
        downloaded += chunk.length;
        const progress = Math.floor((downloaded / total) * 100);
        progress >= lastProgress + 10 && (process.stdout.write(`\rprogress: ${progress}%`), lastProgress = progress);
      });

      res.pipe(file);
      file.on('finish', () => (file.close(), process.stdout.write('\r✓ download complete\n\n'), resolve()));
      file.on('error', reject);
    };
    https.get(`https://github.com/SeleniumHQ/selenium/releases/download/selenium-${SELENIUM_VERSION}/${SELENIUM_JAR}`, handleResponse).on('error', reject);
  });
}

console.log('starting services...');

let [gridLog, tunnelLog] = [join(LOG_DIR, 'selenium-grid.log'), join(LOG_DIR, 'tunnel.log')].map(f => createWriteStream(f, { flags: 'a' }));
let gridChild = spawn('java', ['-jar', JAR_PATH, 'standalone', '--selenium-manager', 'true'], { stdio: ['inherit', 'pipe', 'pipe'] });
let tunnelChild = spawn('npx', ['-y', 'cloudflared', 'tunnel', '--url', `http://localhost:${PORT}`], { stdio: ['ignore', 'pipe', 'pipe'] });

gridChild.stdout.pipe(gridLog), gridChild.stderr.pipe(gridLog);
tunnelChild.stdout.pipe(tunnelLog), tunnelChild.stderr.pipe(tunnelLog);

let servicesReady = false;

Promise.all([
  new Promise(resolve => gridChild.stdout.on('data', (data) => {
    data.toString().includes('Started Selenium') && resolve();
    servicesReady && process.stdout.write(data);
  })),
  new Promise(resolve => tunnelChild.stderr.on('data', (data) => {
    const match = data.toString().match(/(https:\/\/[^\s]+\.trycloudflare\.com)/);
    match && resolve(match[1]);
  }))
]).then(([, tunnelUrl]) => (servicesReady = true, console.log(`✓ grid at http://localhost:${PORT}`), console.log(`✓ tunnel at ${tunnelUrl}\n`)));

process.on('exit', () => ([gridChild, tunnelChild].forEach(c => c && c.kill('SIGTERM')), [gridLog, tunnelLog].forEach(s => s.end())));
gridChild.on('exit', (code) => (code !== 0 && code !== null && console.error(`\nsee log: ${join(LOG_DIR, 'selenium-grid.log')}`), process.exit(code || 0)));
tunnelChild.on('exit', (code) => (code !== 0 && code !== null && console.error(`\nsee log: ${join(LOG_DIR, 'tunnel.log')}`), process.exit(code || 0)));
process.on('SIGINT', () => process.exit(0));
