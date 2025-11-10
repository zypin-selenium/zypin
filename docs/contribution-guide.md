# Contribution Guide

Architecture overview and contribution workflow for Zypin Selenium framework.

## Architecture Overview

Zypin is a monorepo framework for Selenium-based test automation with AI assistance and zero configuration.

### Monorepo Structure

**templates/zypin/** - User project template, source of truth for package versions

**packages/** - Framework packages (cli, selenium)

### Why Monorepo

**Single source of truth** - All packages share the same workspace, unified versioning via npm workspaces

**Dependency hoisting** - npm workspaces hoist shared dependencies to root node_modules, ensuring consistency

**Consistent development** - Changes across packages tested together before publishing

### Why Instance-Based Browser

**No global state** - Each test gets its own browser instance, enabling parallel execution

**Multiple browsers** - Run Chrome and Firefox simultaneously in same test suite

**Testability** - Pure function pattern makes testing easier without global mocks

### Why Magic Detection

**Convention over configuration** - No config files needed, framework detects test type from dependencies

**Zero setup** - User installs test framework (mocha/cucumber/jest), Zypin auto-detects and runs correctly

**Easy maintenance** - Add new framework support without user configuration changes

### Package Roles

**packages/cli** - Main CLI commands and orchestration

**packages/selenium** - Browser management and driver abstraction

**templates/** - Project and test templates for users

## Why Templates/Zypin is Source of Truth

**Single version management** - When upgrading internal packages, update only templates/zypin/package.json. All new projects inherit these exact versions.

**Template inheritance** - Users don't manually configure dependencies. They run init command, which copies the entire template including package.json with pre-defined versions.

**Version strategy** - All framework packages set to specific versions in templates/zypin package.json.

**Upgrade workflow:**
1. Developer updates dependency in templates/zypin/package.json
2. Test in templates/zypin
3. Publish all packages
4. All future init commands get updated version automatically

**Not in package dependencies** - Framework packages define their own dependencies for internal use. Only templates/zypin defines what users receive.

**Monorepo benefit** - In development, all packages use same versions. In production, users get tested, compatible versions.

## File Organization Principles

Read [coding-standards.md](coding-standards.md) for detailed patterns.

**Key principles:**
- Export at top, implementation below with `_` prefix
- Simple descriptive filenames without prefixes
- Flat structure for easy finding
- Main entry point handles validation, utilities stay pure

## Init Command Flow

When user runs init command:

### Package Resolution

CLI downloads and resolves framework packages via npm

**Why bin points to CLI** - Template package delegates execution to CLI package directly without wrapper

### Init Command Execution

Implementation in main CLI entry point

**High-level flow:**
1. **Scaffold** - Copy template files to current directory
2. **Dependencies** - Install packages from template
3. **Finalize** - Clean template-specific config (bin field, move CLI to devDependencies)

### Key Architecture Decisions

**Async File Operations**

Uses async fs operations instead of sync versions

**Why** - Non-blocking operations prevent freezing UI during copy. Parallel task execution shows visual progress

**Template Exclusions**

Excludes node_modules when copying template files

**Why** - User will install fresh dependencies. Copying wastes time and may cause platform-specific binary incompatibilities

**Bin Field Cleanup**

Removes bin field from user's package.json after init completes

**Why** - Bin field only needed to execute init. User's project doesn't need it - they'll use npx or npm scripts instead

**Workspace Configuration**

Templates include workspaces field for test folder hoisting

**Why** - All test templates share dependencies efficiently. Single node_modules at root reduces disk space and ensures version consistency

## Test Command Flow

Implementation in main CLI entry point

### Magic Detection

Framework scans package.json dependencies to detect test framework

**Detection logic:**
- Find nearest package.json from target path
- Check dependencies for mocha/cucumber/jest
- Return runner type automatically

**Why no config file** - Dependencies already declare what framework user chose. No duplication needed.

### Runner Selection

Based on detected framework, spawn appropriate test runner

**Supported runners:**
- mocha - For basic tests
- cucumber - For BDD tests
- jest - For Jest tests

**Why switch pattern** - Simple, explicit, easy to add new runners

### Server Management

**Local mode (default):**
1. Check Java installed
2. Download Selenium Server JAR (cache to ~/.zypin/)
3. Start server on port 8444
4. Run tests
5. Auto-cleanup when done

**Remote mode (--remote flag):**
- Skip server management
- Connect to provided URL
- Useful for CI/CD or shared test infrastructure

**Why automatic cleanup** - Framework uses Listr2 which handles process lifecycle. Server stops automatically when CLI exits.

## Server Management

### Java Requirement

Framework checks Java installed before starting server

**Why required** - Selenium Server is Java application, cannot run without JVM

**Error message** - Clear instructions to install Java 11+ if missing

### JAR Download & Caching

Downloads Selenium Server JAR on first run, caches in ~/.zypin/

**Why caching** - 8MB file takes time to download. Cache ensures fast subsequent runs.

**Version pinned** - Uses specific Selenium version for stability

### Server Startup

Spawns Java process with server JAR, waits for "ready" message

**Why wait** - Tests fail if server not ready. Framework waits for log message before continuing.

**Port selection** - Uses port 8444 by default

**Why 8444** - Avoids conflict with common ports (8080, 4444). Specific port makes configuration easier.

### Cloudflared Tunnel (Remote Mode)

For remote testing, framework starts tunnel via npx cloudflared

**Why Cloudflared** - Zero configuration, no account required, auto-generated HTTPS URL

**Why npx** - No need to download/cache binary. npm handles it automatically.

## Template System

### Dynamic Template Scanning

Framework scans templates folder at runtime to discover available templates

**Why dynamic** - Add new template by dropping folder in templates/. No code changes needed.

**Detection logic:**
- Scan templates/ directory
- Exclude base template (zypin folder)
- Read package.json to detect test framework
- Generate label automatically from dependencies

### Template Structure Requirements

Each template must have:
- package.json with test framework dependency
- At least one example test file

**Why minimal** - Templates show usage pattern. User customizes after generation.

### Adding New Templates

To add new template:
1. Create folder in templates/
2. Add package.json with framework dependency
3. Add example test files
4. Framework auto-detects on next run

**No registration needed** - Dynamic scanning handles discovery automatically

## Key Architecture Decisions

### Why Selenium WebDriver

**Browser compatibility** - Works with Chrome, Firefox, Edge, Safari

**Mature ecosystem** - Industry standard with extensive documentation and community support

**Flexibility** - Can connect to Selenium Grid, cloud services, or local server

### Why Zero Config

**Lower barrier to entry** - Manual testers can start without learning configuration

**Convention over configuration** - Framework makes smart defaults based on project structure

**Less maintenance** - No config files to keep in sync with code changes

### Why Workspaces

**Dependency hoisting** - Test templates share dependencies efficiently

**Single install** - npm install once at root installs all test dependencies

**Version consistency** - All tests use same dependency versions

## Contributing New Features

### Before Starting

1. Read coding-standards.md for code patterns and conventions
2. Understand the same pattern rule - similar files follow identical structure
3. Ask for clarification if architecture decisions are unclear

### Testing Checklist

Before submitting changes:

- Test init command in empty directory
- Test generate command with each template
- Test test command (local mode)
- Test test command (remote mode)
- Test chat command
- Verify dependencies install correctly
- Check for console errors or warnings

### Package Dependencies

**Rule** - Each package defines its own dependencies based on responsibility

**Templates package** - Lists all framework packages that users will receive

**Why strict separation** - Keep package sizes small, clear responsibilities, avoid bloat

**Where to add** - Add dependency to the package that uses it, not to parent or siblings

### Adding New Commands

To add new CLI command, follow existing command patterns in main CLI entry point

**Structure** - Use Commander.js command() API with action() handler

**Task UI** - Use TaskContext for consistent visual output and progress tracking

**Reference** - Study existing commands for structure and patterns

### Adding New Templates

To add new test template:

**Create template directory:**
```bash
mkdir templates/your-template
cd templates/your-template
```

**Add package.json:**
```json
{
  "name": "@zypin-selenium/your-template",
  "version": "0.1.0",
  "type": "module",
  "dependencies": {
    "@zypin-selenium/selenium": "^0.1.0",
    "your-test-framework": "^1.0.0"
  }
}
```

**Add example tests** - Include at least one working test file showing framework usage

**No registration needed** - Dynamic scanning will detect new template automatically

### Adding New Packages

To add new package to monorepo:

**Create package directory:**
```bash
mkdir packages/your-package
cd packages/your-package
npm init -y
```

**Configure package.json:**
```json
{
  "name": "@zypin-selenium/your-package",
  "version": "0.1.0",
  "license": "MIT",
  "type": "module"
}
```

**Add to template (optional):**

If users need this package, add to templates/zypin/package.json

## Key Files Reference

**CLI commands** - Main CLI entry point in packages/cli/

**Test detection** - Search for detection logic by function names

**Server management** - Search for Java check and download functions

**Browser abstraction** - packages/selenium/ main export

**CLI framework** - Framework classes (CLI, CommandBuilder, TaskContext)

**Template config** - templates/zypin/package.json

Search these files for function names to locate specific implementations instead of relying on line numbers.
