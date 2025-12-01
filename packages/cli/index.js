#!/usr/bin/env node

import { Command } from 'commander';
import { initTemplate, detectTemplate } from './src/init.js';
import { runTests } from './src/test.js';
import { existsSync, readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const program = new Command();

if (isCalledFromTemplate()) {
  const templateInfo = detectTemplate();
  program.name(templateInfo.name).description(`Initialize ${templateInfo.name} template`).argument('[folder]', 'Folder name').action((folder) => initTemplate(folder));
} else {
  program.name('zypin').description('Zypin Selenium CLI');
  program.command('test [path]').description('Run tests').action(runTests);
}

program.parse();

// Functions

function isCalledFromTemplate() {
  try {
    const parentPkgPath = join(__dirname, '../../package.json');
    if (!existsSync(parentPkgPath)) return false;
    const parentPkg = JSON.parse(readFileSync(parentPkgPath, 'utf-8'));
    return parentPkg.bin === 'node_modules/@zypin-selenium/cli/index.js';
  } catch {
    return false;
  }
}
