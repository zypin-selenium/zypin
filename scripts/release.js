#!/usr/bin/env node

import { test } from '@zypin-selenium/test';
import { readFileSync, writeFileSync, existsSync, readdirSync, renameSync } from 'fs';
import { join, dirname } from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url)), rootDir = join(__dirname, '..'), mode = process.argv[2];

if (mode === 'setup') test('Git hook should setup', ({ ok, doesNotThrow }) => (
  doesNotThrow(() => writeFileSync(join(rootDir, '.git', 'hooks', 'pre-commit'), `#!/bin/sh\nnode scripts/release.js bump\n`, { mode: 0o755 }), 'Pre-commit hook should write'),
  ok(existsSync(join(rootDir, '.git', 'hooks', 'pre-commit')), 'Pre-commit hook should exist')
));
else if (mode === 'bump') test('Versions should bump', ({ ok }) => {
  const changed = execSync('git diff --cached --name-only', { cwd: rootDir, encoding: 'utf-8' }).trim().split('\n').filter(Boolean),
    changedPackages = new Set(), changedTemplates = new Set(), bumped = [];

  changed.forEach(f => (
    f.startsWith('packages/') && !f.includes('node_modules') && changedPackages.add(`packages/${f.split('/')[1]}`),
    f.startsWith('templates/') && !f.includes('node_modules') && changedTemplates.add(`templates/${f.split('/')[1]}`)
  ));

  changedPackages.forEach(pkg => (
    bumpVersion(pkg),
    bumped.push(pkg),
    findDependents(pkg).forEach(dep => (
      dep.startsWith('packages/') ? changedPackages.add(dep) : changedTemplates.add(dep),
      updateDependency(dep, pkg)
    ))
  ));

  changedTemplates.forEach(tpl => (bumpVersion(tpl), bumped.push(tpl)));

  ok(bumped.length === 0 || (bumped.forEach(p => execSync(`git add ${p}/package.json`, { cwd: rootDir })), true), `Versions should bump: ${bumped.join(', ')}`);
});
else if (mode === 'publish') test('Packages should publish', ({ ok, doesNotThrow }) => {
  ok(process.env.NPM_TOKEN, 'NPM_TOKEN should exist');

  const lastCommit = execSync('git log -1 --name-only --pretty=format:', { cwd: rootDir, encoding: 'utf-8' }).trim().split('\n').filter(Boolean),
    toPublish = lastCommit.filter(f => f.endsWith('package.json') && (f.startsWith('packages/') || f.startsWith('templates/'))).map(f => join(rootDir, f.replace('/package.json', ''))),
    packages = toPublish.filter(p => p.includes('packages/')).sort(),
    templates = toPublish.filter(p => p.includes('templates/')).sort();

  ok(toPublish.length > 0, `Packages should publish: ${toPublish.length} found`);

  [...packages, ...templates].forEach(pkg => {
    const isTemplate = pkg.includes('templates/'), gitignorePath = join(pkg, '.gitignore'), renamedPath = join(pkg, 'gitignore');
    doesNotThrow(() => (
      isTemplate && existsSync(gitignorePath) && renameSync(gitignorePath, renamedPath),
      execSync('npm publish --access public', { cwd: pkg, stdio: 'inherit', env: { ...process.env, NODE_AUTH_TOKEN: process.env.NPM_TOKEN } }),
      isTemplate && existsSync(renamedPath) && renameSync(renamedPath, gitignorePath)
    ), `Package should publish: ${pkg}`);
  });
});
else console.error('Usage: release.js [setup|bump|publish]'), process.exit(1);

// Implement

function bumpVersion(pkgPath) {
  const pkgJsonPath = join(rootDir, pkgPath, 'package.json');
  if (!existsSync(pkgJsonPath)) return;
  const pkg = JSON.parse(readFileSync(pkgJsonPath, 'utf-8')), [major, minor, patch] = pkg.version.split('.').map(Number);
  pkg.version = `${major}.${minor}.${patch + 1}`, writeFileSync(pkgJsonPath, JSON.stringify(pkg, null, 2) + '\n');
}

function findDependents(pkgPath) {
  const pkgName = JSON.parse(readFileSync(join(rootDir, pkgPath, 'package.json'), 'utf-8')).name, dependents = [];
  ['packages', 'templates'].forEach(dir => {
    const dirPath = join(rootDir, dir);
    existsSync(dirPath) && readdirSync(dirPath, { withFileTypes: true }).forEach(entry => {
      if (!entry.isDirectory()) return;
      const depPkgPath = join(dirPath, entry.name, 'package.json');
      if (!existsSync(depPkgPath)) return;
      const depPkg = JSON.parse(readFileSync(depPkgPath, 'utf-8')), deps = { ...depPkg.dependencies, ...depPkg.devDependencies }, depPath = `${dir}/${entry.name}`;
      deps[pkgName] && depPath !== pkgPath && dependents.push(depPath);
    });
  });
  return dependents;
}

function updateDependency(tplPath, pkgPath) {
  const pkgJson = JSON.parse(readFileSync(join(rootDir, pkgPath, 'package.json'), 'utf-8')),
    tplPkgPath = join(rootDir, tplPath, 'package.json'),
    tplPkg = JSON.parse(readFileSync(tplPkgPath, 'utf-8'));
  tplPkg.dependencies?.[pkgJson.name] && (tplPkg.dependencies[pkgJson.name] = `^${pkgJson.version}`),
    tplPkg.devDependencies?.[pkgJson.name] && (tplPkg.devDependencies[pkgJson.name] = `^${pkgJson.version}`),
    writeFileSync(tplPkgPath, JSON.stringify(tplPkg, null, 2) + '\n');
}
