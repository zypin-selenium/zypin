#!/usr/bin/env node

import { Command } from 'commander';
import { initTemplate, detectTemplate } from './src/init.js';
import { runTests } from './src/test.js';

const program = new Command();
const templateInfo = detectTemplate();

// Template initialization mode (low priority - rarely updated)
if (templateInfo) {
  program.name(templateInfo.name).description(`Initialize ${templateInfo.name} template`).argument('[folder]', 'Folder name').action((folder) => initTemplate(folder, templateInfo));
  program.parse();
  process.exit(0);
}

// Main CLI mode (high priority - frequently updated)
program.name('zypin').description('Zypin Selenium CLI');
program.command('test [path]').description('Run tests').action(runTests);

program.parse();
