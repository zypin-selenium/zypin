#!/usr/bin/env node

import { existsSync, mkdirSync, createWriteStream } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { spawn } from 'child_process';
import https from 'https';

const SELENIUM_VERSION = '4.38.0';
const SELENIUM_JAR = `selenium-server-${SELENIUM_VERSION}.jar`;
const DOWNLOAD_URL = `https://github.com/SeleniumHQ/selenium/releases/download/selenium-${SELENIUM_VERSION}/${SELENIUM_JAR}`;
const ZYPIN_DIR = join(homedir(), '.zypin');
const JAR_PATH = join(ZYPIN_DIR, SELENIUM_JAR);
const LOG_DIR = join(ZYPIN_DIR, 'logs');
const LOG_FILE = join(LOG_DIR, 'selenium-grid.log');
const TUNNEL_LOG_FILE = join(LOG_DIR, 'tunnel.log');
const PORT = 4444;
const isBackground = process.argv.includes('--background');
let tunnelUrl = null;

// Main execution
console.log('Zypin Selenium Grid Server\n');
if (!existsSync(ZYPIN_DIR)) mkdirSync(ZYPIN_DIR, { recursive: true });
if (!existsSync(LOG_DIR)) mkdirSync(LOG_DIR, { recursive: true });

if (!existsSync(JAR_PATH)) {
  console.log(`Downloading Selenium Server ${SELENIUM_VERSION}...`);
  await downloadJar();
  console.log('✓ Download complete\n');
} else console.log(`✓ Selenium Server ${SELENIUM_VERSION} already exists\n`);

await startServices();

// Functions

function downloadJar() {
  return new Promise((resolve, reject) => {
    const handleResponse = (response) => {
      if (response.statusCode === 302 || response.statusCode === 301) return https.get(response.headers.location, handleResponse).on('error', reject);
      if (response.statusCode !== 200) return reject(new Error(`Download failed with status ${response.statusCode}`));

      const fileStream = createWriteStream(JAR_PATH);
      const totalBytes = parseInt(response.headers['content-length'], 10);
      let downloadedBytes = 0, lastProgress = 0;

      response.on('data', (chunk) => {
        downloadedBytes += chunk.length;
        const progress = Math.floor((downloadedBytes / totalBytes) * 100);
        if (progress >= lastProgress + 10) process.stdout.write(`\rProgress: ${progress}%`), lastProgress = progress;
      });

      response.pipe(fileStream);
      fileStream.on('finish', () => (fileStream.close(), process.stdout.write('\rProgress: 100%\n'), resolve()));
      fileStream.on('error', reject);
    };

    https.get(DOWNLOAD_URL, handleResponse).on('error', reject);
  });
}

function startServices() {
  const gridLogStream = createWriteStream(LOG_FILE, { flags: 'a' });
  const tunnelLogStream = createWriteStream(TUNNEL_LOG_FILE, { flags: 'a' });
  const gridArgs = ['-jar', JAR_PATH, 'standalone', '--selenium-manager', 'true'];
  const tunnelArgs = ['-y', 'cloudflared', 'tunnel', '--url', `http://localhost:${PORT}`];

  if (isBackground) {
    console.log('Starting services in background...\n');
    const gridChild = spawn('java', gridArgs, { detached: true, stdio: ['ignore', gridLogStream, gridLogStream] });
    gridChild.unref();
    const tunnelChild = spawn('npx', tunnelArgs, { detached: true, stdio: ['ignore', tunnelLogStream, tunnelLogStream] });
    tunnelChild.unref();
    console.log('✓ Selenium Grid started');
    console.log(`  PID: ${gridChild.pid}`);
    console.log(`  URL: http://localhost:${PORT}`);
    console.log(`  Logs: ${LOG_FILE}\n`);
    console.log('✓ Cloudflared Tunnel started');
    console.log(`  PID: ${tunnelChild.pid}`);
    console.log(`  Logs: ${TUNNEL_LOG_FILE}\n`);
    console.log(`Bạn có thể stop process này qua pid: ${gridChild.pid} (grid), ${tunnelChild.pid} (tunnel)\n`);
    return process.exit(0);
  }

  console.log('Starting Selenium Grid and Cloudflared Tunnel...');
  console.log('Press Ctrl+C to stop\n');

  const gridChild = spawn('java', gridArgs, { stdio: ['inherit', 'pipe', 'pipe'] });
  const tunnelChild = spawn('npx', tunnelArgs, { stdio: ['ignore', 'pipe', 'pipe'] });

  gridChild.stdout.pipe(gridLogStream);
  gridChild.stderr.pipe(gridLogStream);
  tunnelChild.stdout.pipe(tunnelLogStream);
  tunnelChild.stderr.pipe(tunnelLogStream);

  tunnelChild.stderr.on('data', (data) => {
    const match = data.toString().match(/(https:\/\/[^\s]+\.trycloudflare\.com)/);
    if (match && !tunnelUrl) {
      tunnelUrl = match[1];
      console.log('\n✓ Services started successfully:');
      console.log(`  Grid URL: http://localhost:${PORT}`);
      console.log(`  Tunnel URL: ${tunnelUrl}`);
      console.log(`  Grid Logs: ${LOG_FILE}`);
      console.log(`  Tunnel Logs: ${TUNNEL_LOG_FILE}\n`);
    }
  });

  const cleanup = (exitCode = 0) => (gridChild.kill('SIGTERM'), tunnelChild.kill('SIGTERM'), gridLogStream.end(), tunnelLogStream.end(), process.exit(exitCode));

  gridChild.on('error', (err) => (console.error('Error starting Selenium Grid:', err.message), cleanup(1)));
  tunnelChild.on('error', (err) => (console.error('Error starting Cloudflared Tunnel:', err.message), cleanup(1)));
  gridChild.on('exit', (code) => (gridLogStream.end(), code !== 0 && code !== null && (console.error(`\nSelenium Grid exited with code ${code}`), cleanup(code))));
  tunnelChild.on('exit', (code) => (tunnelLogStream.end(), code !== 0 && code !== null && (console.error(`\nCloudflared Tunnel exited with code ${code}`), cleanup(code))));
  process.on('SIGINT', () => (console.log('\n\nStopping services...'), cleanup(0)));
}
