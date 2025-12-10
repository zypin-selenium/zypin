#!/usr/bin/env node

import { Command } from 'commander';
import { runTests } from './src/test.js';

const program = new Command();
program.name('zypin').description('Zypin Selenium CLI');
program.command('test [path]').description('Run tests').action(runTests);
program.parse();
