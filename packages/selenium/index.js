import { Builder, By, Key, until } from 'selenium-webdriver';
import { spawn } from 'child_process';
import http from 'http';

const GRID_URL = process.env.ZYPIN_GRID_URL || 'http://localhost:4444';

export { By, Key, until };
export { Options as ChromeOptions } from 'selenium-webdriver/chrome.js';
export { Options as FirefoxOptions } from 'selenium-webdriver/firefox.js';
export { Options as EdgeOptions } from 'selenium-webdriver/edge.js';
export { Options as SafariOptions } from 'selenium-webdriver/safari.js';

/**
 * @typedef {import('selenium-webdriver/chrome.js').Options} ChromeOptions
 * @typedef {import('selenium-webdriver/firefox.js').Options} FirefoxOptions
 * @typedef {import('selenium-webdriver/edge.js').Options} EdgeOptions
 * @typedef {import('selenium-webdriver/safari.js').Options} SafariOptions
 */

/**
 * Creates a WebDriver instance with optional browser-specific options
 * @param {'chrome' | 'firefox' | 'edge' | 'safari'} [browserName='chrome'] - Browser name
 * @param {ChromeOptions | FirefoxOptions | EdgeOptions | SafariOptions | null} [options=null] - Browser-specific options
 * @returns {Promise<import('selenium-webdriver').WebDriver>}
 */
export async function createDriver(browserName = 'chrome', options = null) {
  const gridAvailable = await new Promise(r => {
    const req = http.get(`${GRID_URL}/status`, { timeout: 2000 }, res => r(res.statusCode === 200));
    req.on('error', () => r(false));
    req.on('timeout', () => (req.destroy(), r(false)));
  });

  if (!gridAvailable) {
    await new Promise(r => (
      spawn('npx', ['@zypin-selenium/serve', '--background'], { stdio: 'ignore' }),
      setTimeout(r, 2000)
    ));

    await new Promise((r, j) => {
      const startTime = Date.now(), maxWait = 30000;
      const check = async () => {
        const available = await new Promise(r => {
          const req = http.get(`${GRID_URL}/status`, { timeout: 2000 }, res => r(res.statusCode === 200));
          req.on('error', () => r(false));
          req.on('timeout', () => (req.destroy(), r(false)));
        });
        if (available) return r();
        if (Date.now() - startTime > maxWait) return j(new Error('Grid failed to start'));
        setTimeout(check, 1000);
      };
      check();
    });
  }

  const builder = new Builder().forBrowser(browserName).usingServer(GRID_URL);
  options && builder[{chrome:'setChromeOptions',firefox:'setFirefoxOptions',edge:'setEdgeOptions',safari:'setSafariOptions'}[browserName.toLowerCase()]](options);
  return builder.build();
}
