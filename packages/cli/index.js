#!/usr/bin/env node

import { CLI } from './src/cli.js';
import { copyTemplate } from './src/init.js';
import { getTemplates, copyTestTemplate } from './src/generate.js';
import { detectTest } from './src/test.js';
import { checkJava, downloadSeleniumServer } from './src/server.js';
import { basename } from 'path';

const cli = new CLI('zypin', 'Zypin Testing Framework', '0.1.0');

cli
  .command('init', 'Initialize a new Zypin project')
  .action(async (options, ctx) => {
    ctx.task('Init', async (ctx) => {
      ctx.task('Copy template files', async () => {
        await copyTemplate(process.cwd());
      });

      ctx.task('Configure project', async (ctx) => {
        ctx.spawn('Clean package config', 'npm', ['pkg', 'delete', 'bin']);
        ctx.spawn('Set package name', 'npm', ['pkg', 'set', `name=${basename(process.cwd())}`]);
        ctx.spawn('Move CLI dependency', 'npm', ['pkg', 'set', 'devDependencies.@zypin-selenium/cli=$(npm pkg get dependencies.@zypin-selenium/cli | tr -d \'"\')']);
        ctx.spawn('Delete CLI from dependencies', 'npm', ['pkg', 'delete', 'dependencies.@zypin-selenium/cli']);
      });

      ctx.spawn('Install dependencies', 'npm', ['install']);

      ctx.task('Done', () => {
        ctx.title = 'Init completed';
        ctx.output = [
          'Next steps:',
          '- npm run generate  # Generate test template',
          '- npm run chat      # AI assistant'
        ].join('\n');
      });
    });
  });

cli
  .command('generate', 'Generate test template')
  .action(async (options, ctx) => {
    let selectedTemplate = '';

    ctx.task('Generate', async (ctx) => {
      ctx.task('Select template', async (ctx) => {
        const templates = getTemplates();

        if (templates.length === 0) {
          throw new Error('No templates found');
        }

        selectedTemplate = await ctx.select({
          message: 'Select test template',
          choices: templates.map(t => ({
            name: t.label,
            value: t.value
          }))
        });
      });

      ctx.task('Copy template', async (ctx) => {
        const destDir = await copyTestTemplate(selectedTemplate, process.cwd());
        ctx.output = destDir;
      });

      ctx.spawn('Install dependencies', 'npm', ['install']);

      ctx.task('Done', () => {
        ctx.title = 'Generate completed';
        const templateName = selectedTemplate.split('/').pop();
        ctx.output = `Next: zypin test tests/${templateName}`;
      });
    });
  });

cli
  .command('test', 'Run tests')
  .option('--remote <url>', 'Connect to remote Selenium server')
  .action(async (options, ctx) => {
    const targetPath = options.args[0] || 'tests';
    let testInfo;
    let jarPath;

    ctx.task('Run Tests', async (ctx) => {
      if (!options.remote) {
        // Local mode - manage server
        ctx.task('Setup Selenium Server', async (ctx) => {
          ctx.task('Check Java', async () => {
            await checkJava();
          });

          ctx.task('Download Selenium Server', async (ctx) => {
            jarPath = await downloadSeleniumServer();
            ctx.output = jarPath;
          });

          ctx.spawn('Start Server', 'java', [
            '-jar', jarPath,
            'standalone',
            '--port', '8444',
            '--selenium-manager', 'true'
          ], {
            onLine(line, { resolve }) {
              if (line.includes('Selenium Server is up and running')) {
                resolve();
              }
            }
          });
        });
      } else {
        // Set remote URL
        process.env.SELENIUM_SERVER_URL = options.remote;
      }

      ctx.task('Detect test type', async (ctx) => {
        testInfo = detectTest(targetPath);
        ctx.output = `Found: ${testInfo.runner}`;
      });

      ctx.task('Run tests', async (ctx) => {
        const files = options.args.slice(1);

        switch (testInfo.runner) {
          case 'mocha':
            const mochaArgs = files.length > 0 ? files : ['*.test.js'];
            ctx.spawn('Execute Mocha', 'mocha', [...mochaArgs, '--timeout', '30000'], {
              cwd: testInfo.testDir
            });
            break;

          case 'cucumber':
            ctx.spawn('Execute Cucumber', 'cucumber-js', files, {
              cwd: testInfo.testDir
            });
            break;

          case 'jest':
            ctx.spawn('Execute Jest', 'jest', files, {
              cwd: testInfo.testDir
            });
            break;

          default:
            throw new Error(`Runner not implemented: ${testInfo.runner}`);
        }
      });
    });
  });

cli
  .command('server', 'Start Selenium server with tunnel')
  .action(async (options, ctx) => {
    let jarPath;
    let tunnelUrl = '';

    ctx.task('Server', async (ctx) => {
      ctx.task('Check Java', async () => {
        await checkJava();
      });

      ctx.task('Download Selenium Server', async (ctx) => {
        jarPath = await downloadSeleniumServer();
        ctx.output = jarPath;
      });

      ctx.parallel('Start Services', async (ctx) => {
        ctx.spawn('Start Selenium Server', 'java', [
          '-jar', jarPath,
          'standalone',
          '--port', '8444',
          '--selenium-manager', 'true'
        ], {
          onLine(line, { resolve }) {
            if (line.includes('Selenium Server is up and running')) {
              resolve();
            }
          }
        });

        ctx.spawn('Create Tunnel', 'npx', [
          '--yes',
          'cloudflared',
          'tunnel',
          '--url',
          'http://localhost:8444'
        ], {
          onLine(line, { resolve }) {
            const match = line.match(/(https:\/\/[^\s]+\.trycloudflare\.com)/);
            if (match) {
              tunnelUrl = match[1];
              resolve();
            }
            if (line.includes('ERR') && line.includes('429')) {
              throw new Error('Cloudflare rate limit. Try again later.');
            }
          }
        });
      });

      ctx.task('Done', () => {
        ctx.title = 'Server running';
        ctx.output = `Remote URL: ${tunnelUrl}\n\nRun on another machine:\nzypin test --remote ${tunnelUrl}`;
      });
    });

    // Keep running (spawn keeps processes alive)
    await new Promise(() => {});
  });

cli
  .command('chat', 'Chat with AI assistant')
  .action(async (options, ctx) => {
    ctx.spawn('Gemini AI', 'npx', [
      'https://github.com/google-gemini/gemini-cli'
    ], {
      stdio: 'inherit'
    });
  });

cli.run();
