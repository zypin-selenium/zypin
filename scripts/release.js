#!/usr/bin/env node
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');
const mode = process.argv[2];

if (mode === 'setup') setupGitHook();
else if (mode === 'bump') detectAndBump();
else if (mode === 'publish') publishToNpm();
else console.error('Usage: release.js [setup|bump|publish]'), process.exit(1);

function setupGitHook() {
  const hookPath = join(rootDir, '.git', 'hooks', 'pre-commit');
  const hookContent = `#!/bin/sh\nnode scripts/release.js bump\n`;
  writeFileSync(hookPath, hookContent, { mode: 0o755 });
  console.log('✓ Pre-commit hook installed');
}

function detectAndBump() {
  const changed = execSync('git diff --cached --name-only', { cwd: rootDir, encoding: 'utf-8' })
    .trim().split('\n').filter(Boolean);

  const changedPackages = new Set(), changedTemplates = new Set();

  for (const file of changed) {
    if (file.startsWith('packages/') && !file.includes('node_modules')) {
      const pkg = file.split('/')[1];
      changedPackages.add(`packages/${pkg}`);
    }
    if (file.startsWith('templates/') && !file.includes('node_modules')) {
      const tpl = file.split('/')[1];
      changedTemplates.add(`templates/${tpl}`);
    }
  }

  const bumped = [];

  for (const pkg of changedPackages) {
    bumpVersion(pkg);
    bumped.push(pkg);

    const dependentTemplates = findDependentTemplates(pkg);
    for (const tpl of dependentTemplates) {
      changedTemplates.add(tpl);
      updateDependency(tpl, pkg);
    }
  }

  for (const tpl of changedTemplates) {
    bumpVersion(tpl);
    bumped.push(tpl);
  }

  if (bumped.length > 0) {
    for (const path of bumped) execSync(`git add ${path}/package.json`, { cwd: rootDir });
    console.log(`✓ Bumped versions: ${bumped.join(', ')}`);
  }
}

function publishToNpm() {
  if (!process.env.NPM_TOKEN) console.error('Error: NPM_TOKEN not set'), process.exit(1);

  const lastCommit = execSync('git log -1 --name-only --pretty=format:', { cwd: rootDir, encoding: 'utf-8' })
    .trim().split('\n').filter(Boolean);

  const toPublish = [];

  for (const file of lastCommit) {
    if (file.endsWith('package.json') && (file.startsWith('packages/') || file.startsWith('templates/'))) {
      const dir = join(rootDir, file.replace('/package.json', ''));
      toPublish.push(dir);
    }
  }

  if (toPublish.length === 0) {
    console.log('No package.json changes detected in last commit. Nothing to publish.');
    return;
  }

  console.log(`Found ${toPublish.length} package(s) to publish`);

  const packages = toPublish.filter(p => p.includes('packages/')).sort();
  const templates = toPublish.filter(p => p.includes('templates/')).sort();

  for (const pkg of [...packages, ...templates]) {
    try {
      console.log(`Publishing: ${pkg}`);
      execSync('npm publish --access public', { cwd: pkg, stdio: 'inherit', env: { ...process.env, NODE_AUTH_TOKEN: process.env.NPM_TOKEN } });
      console.log(`✓ Published: ${pkg}`);
    } catch (error) {
      console.error(`✗ Failed to publish ${pkg}: ${error.message}`);
    }
  }
}

function bumpVersion(pkgPath) {
  const pkgJsonPath = join(rootDir, pkgPath, 'package.json');
  if (!existsSync(pkgJsonPath)) return;

  const pkg = JSON.parse(readFileSync(pkgJsonPath, 'utf-8'));
  const [major, minor, patch] = pkg.version.split('.').map(Number);
  pkg.version = `${major}.${minor}.${patch + 1}`;
  writeFileSync(pkgJsonPath, JSON.stringify(pkg, null, 2) + '\n');
}

function findDependentTemplates(pkgPath) {
  const pkgJson = JSON.parse(readFileSync(join(rootDir, pkgPath, 'package.json'), 'utf-8'));
  const pkgName = pkgJson.name;
  const templates = [];

  const templatesDir = join(rootDir, 'templates');
  if (!existsSync(templatesDir)) return templates;

  for (const entry of readdirSync(templatesDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const tplPkgPath = join(templatesDir, entry.name, 'package.json');
    if (!existsSync(tplPkgPath)) continue;

    const tplPkg = JSON.parse(readFileSync(tplPkgPath, 'utf-8'));
    const deps = { ...tplPkg.dependencies, ...tplPkg.devDependencies };
    deps[pkgName] && templates.push(`templates/${entry.name}`);
  }

  return templates;
}

function updateDependency(tplPath, pkgPath) {
  const pkgJson = JSON.parse(readFileSync(join(rootDir, pkgPath, 'package.json'), 'utf-8'));
  const tplPkgPath = join(rootDir, tplPath, 'package.json');
  const tplPkg = JSON.parse(readFileSync(tplPkgPath, 'utf-8'));

  if (tplPkg.dependencies?.[pkgJson.name]) tplPkg.dependencies[pkgJson.name] = `^${pkgJson.version}`;
  if (tplPkg.devDependencies?.[pkgJson.name]) tplPkg.devDependencies[pkgJson.name] = `^${pkgJson.version}`;

  writeFileSync(tplPkgPath, JSON.stringify(tplPkg, null, 2) + '\n');
}
