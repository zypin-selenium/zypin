import { exec } from 'child_process';
import { existsSync, mkdirSync, createWriteStream } from 'fs';
import { homedir } from 'os';
import { join } from 'path';
import { pipeline } from 'stream/promises';
import { promisify } from 'util';

const execPromise = promisify(exec);

export const checkJava = _checkJava;
export const downloadSeleniumServer = _downloadSeleniumServer;
export const getSeleniumServerPath = _getSeleniumServerPath;
export const getCacheDir = _getCacheDir;

// Implementation

function _getCacheDir() {
  const cacheDir = join(homedir(), '.zypin');
  if (!existsSync(cacheDir)) {
    mkdirSync(cacheDir, { recursive: true });
  }
  return cacheDir;
}

async function _checkJava() {
  try {
    await execPromise('java -version');
    return true;
  } catch (_error) {
    throw new Error('Java is required. Please install Java 11+ from https://adoptium.net/');
  }
}

function _getSeleniumServerPath() {
  const cacheDir = _getCacheDir();
  return join(cacheDir, 'selenium-server-4.38.0.jar');
}

async function _downloadSeleniumServer() {
  const jarPath = _getSeleniumServerPath();

  if (existsSync(jarPath)) {
    return jarPath; // Already cached
  }

  const url = 'https://github.com/SeleniumHQ/selenium/releases/download/selenium-4.38.0/selenium-server-4.38.0.jar';

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Download failed: ${response.statusText}`);
  }

  const fileStream = createWriteStream(jarPath);
  await pipeline(response.body, fileStream);

  return jarPath;
}
