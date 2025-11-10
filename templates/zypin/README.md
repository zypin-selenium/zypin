# Zypin Selenium

Selenium-based test automation with AI assistance and zero configuration.

## Quick Start

```bash
npx zypin generate     # Generate test from template
npx zypin test         # Run tests (auto-detects type)
npx zypin chat         # AI assistant
```

## Test Templates

Choose a template when generating:

- **selenium-basic** - Simple Mocha tests
- **selenium-bdd** - Cucumber BDD with predefine steps

Framework auto-detects test type from dependencies and runs the correct runner.

## Zero Configuration

No config files needed:

- Test type detected from package.json dependencies
- Selenium Server managed automatically
- Browser selection per test file
- Parallel-ready design

## Project Structure

```
tests/                   Generated test folders
  selenium-basic/       Basic test template
  selenium-bdd/         BDD test template
```

## Features

- **Magic detection** - Auto-detect test framework (Mocha/Cucumber/Jest)
- **Auto server** - Selenium Server downloads and starts automatically
- **Multi-browser** - Chrome, Firefox, Edge, Safari with headless
- **Remote mode** - Run tests on remote server with tunnel
- **AI assistant** - Chat with Gemini for help
- **Zero setup** - Works out of the box

## Commands

**npx zypin generate** - Generate test from template

**npx zypin test** - Run tests (local server auto-managed)

**npx zypin test --remote <url>** - Run on remote server

**npx zypin server** - Start server with tunnel (for remote testing)

**npx zypin chat** - AI assistant

## Writing Tests

Tests use instance-based browser pattern for parallel support:

```js
const browser = await createBrowser({ browser: 'chrome' });
await browser.driver.get('https://example.com');
await browser.close();
```

Each test manages its own browser instance.
