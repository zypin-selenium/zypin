import { Builder, By, Key, until } from 'selenium-webdriver';
import { spawn } from 'child_process';
import http from 'http';

const GRID_URL = process.env.ZYPIN_GRID_URL || 'http://localhost:4444';
let spawnedGridProcess = null;

export { By, Key, until };
export { Options as ChromeOptions } from 'selenium-webdriver/chrome.js';
export { Options as FirefoxOptions } from 'selenium-webdriver/firefox.js';
export { Options as EdgeOptions } from 'selenium-webdriver/edge.js';
export { Options as SafariOptions } from 'selenium-webdriver/safari.js';

export async function createDriver(browserName = 'chrome') {
  const gridAvailable = await isGridAvailable();
  if (!gridAvailable) {
    await startGrid();
    await waitForGrid();
  }
  return new Builder().forBrowser(browserName).usingServer(GRID_URL).build();
}

export async function quit(driver) {
  await driver.quit();
  if (spawnedGridProcess) {
    spawnedGridProcess.kill('SIGTERM');
    spawnedGridProcess = null;
  }
}

function isGridAvailable() {
  return new Promise((resolve) => {
    const req = http.get(`${GRID_URL}/status`, { timeout: 2000 }, (res) => resolve(res.statusCode === 200));
    req.on('error', () => resolve(false));
    req.on('timeout', () => (req.destroy(), resolve(false)));
  });
}

function startGrid() {
  return new Promise((resolve) => {
    spawnedGridProcess = spawn('npx', ['@zypin-selenium/serve', '--background'], { stdio: 'ignore', detached: true });
    spawnedGridProcess.unref();
    setTimeout(resolve, 2000);
  });
}

function waitForGrid(maxWait = 30000) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const check = async () => {
      if (await isGridAvailable()) return resolve();
      if (Date.now() - startTime > maxWait) return reject(new Error('Grid failed to start'));
      setTimeout(check, 1000);
    };
    check();
  });
}
