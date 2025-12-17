#!/usr/bin/env node

import { test } from '@zypin-selenium/test';
import { Command } from 'commander';
import { readFileSync, existsSync, writeFileSync, readdirSync, mkdirSync, renameSync, cpSync, rmSync } from 'fs';
import { execSync } from 'child_process';
import { dirname, join, basename } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const scriptName = basename(process.argv[1]);
const templatePath = join(__dirname, `../${scriptName}/package.json`);
const templatePkg = JSON.parse(readFileSync(templatePath, 'utf-8'));
const templateInfo = { name: templatePkg.name, version: templatePkg.version, path: dirname(templatePath) };

new Command().name(templateInfo.name).argument('<folder>').action(f => {
  const isZypin = templateInfo.name === '@zypin-selenium/create-zypin';
  test(isZypin ? 'Zypin project should create' : 'Template should create', ({ test, ok, doesNotThrow }) => {
    let testsDir;
    const targetDir = isZypin ? join(process.cwd(), f) : (ok(existsSync(testsDir = join(process.cwd(), 'tests')), 'Zypin project should exist'), join(testsDir, f));
    ok(!existsSync(targetDir), 'Folder should not exist');
    doesNotThrow(() => copyTemplateFiles(templateInfo.path, targetDir), 'Project files should copy');
    doesNotThrow(() => updatePackageJson(targetDir, f, isZypin), 'Package.json should update');
    test('Dependencies should install', ({ doesNotThrow }) =>
      doesNotThrow(() => { try { execSync('npm install', { cwd: targetDir, stdio: 'ignore' }); } catch (e) { throw (rmSync(targetDir, { recursive: true, force: true }), e); } }, 'Dependencies should install'));
  });
}).parse();

// Implement

function copyTemplateFiles(src, dest) {
  mkdirSync(dest, { recursive: true });
  readdirSync(src).forEach(file =>
    !['node_modules', 'package-lock.json'].includes(file) && !existsSync(join(dest, file)) &&
    cpSync(join(src, file), join(dest, file), { recursive: true })
  );
  existsSync(join(dest, 'gitignore')) && renameSync(join(dest, 'gitignore'), join(dest, '.gitignore'));
}

function updatePackageJson(dir, name, isZypin) {
  const p = join(dir, 'package.json');
  if (!existsSync(p)) return;
  const pkg = JSON.parse(readFileSync(p, 'utf-8'));
  delete pkg.bin, pkg.name = name;
  pkg.dependencies?.['@zypin-selenium/cli'] && (
    isZypin && ((pkg.devDependencies ??= {})['@zypin-selenium/cli'] = pkg.dependencies['@zypin-selenium/cli']),
    delete pkg.dependencies['@zypin-selenium/cli'],
    Object.keys(pkg.dependencies).length === 0 && delete pkg.dependencies
  );
  writeFileSync(p, JSON.stringify(pkg, null, 2) + '\n');
}
