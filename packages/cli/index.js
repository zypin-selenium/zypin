#!/usr/bin/env node

import { Command } from 'commander';
import { initTemplate, detectTemplate } from './src/init.js';
import { runTests } from './src/test.js';

const program = new Command();
const templateInfo = detectTemplate();

if (templateInfo) {
  program.name(templateInfo.name).description(`Initialize ${templateInfo.name} template`).argument('[folder]', 'Folder name').action((folder) => initTemplate(folder, templateInfo));
} else {
  program.name('zypin').description('Zypin Selenium CLI');
  program.command('test [path]').description('Run tests').action(runTests);
}

program.parse();
