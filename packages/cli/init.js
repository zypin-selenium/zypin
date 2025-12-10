#!/usr/bin/env node

import { Command } from 'commander';
import { readFileSync, existsSync, writeFileSync, readdirSync, mkdirSync, renameSync, cpSync, rmSync } from 'fs';
import { execSync } from 'child_process';
import { dirname, join, basename } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const scriptName = basename(process.argv[1]);

if (scriptName.startsWith('create-')) {
  const templatePath = join(__dirname, `../${scriptName}/package.json`);
  const templatePkg = JSON.parse(readFileSync(templatePath, 'utf-8'));
  const templateInfo = { name: templatePkg.name, version: templatePkg.version, path: dirname(templatePath) };

  new Command().name(templateInfo.name).argument('<folder>').action(f => {
    const isZypin = templateInfo.name === '@zypin-selenium/create-zypin';
    const targetDir = isZypin ? join(process.cwd(), f) : (() => {
      const testsDir = join(process.cwd(), 'tests');
      if (!existsSync(testsDir)) throw Error('Not a zypin project');
      return join(testsDir, f);
    })();

    if (existsSync(targetDir)) throw Error('Folder already exists');

    mkdirSync(targetDir, { recursive: true });
    readdirSync(templateInfo.path).forEach(file =>
      !['node_modules', 'package-lock.json'].includes(file) && !existsSync(join(targetDir, file)) &&
      cpSync(join(templateInfo.path, file), join(targetDir, file), { recursive: true })
    );

    existsSync(join(targetDir, 'gitignore')) && renameSync(join(targetDir, 'gitignore'), join(targetDir, '.gitignore'));

    const pkgPath = join(targetDir, 'package.json');
    if (existsSync(pkgPath)) {
      const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
      delete pkg.bin;
      pkg.name = f;
      pkg.dependencies?.['@zypin-selenium/cli'] && (
        isZypin && ((pkg.devDependencies ??= {})['@zypin-selenium/cli'] = pkg.dependencies['@zypin-selenium/cli']),
        delete pkg.dependencies['@zypin-selenium/cli'],
        Object.keys(pkg.dependencies).length === 0 && delete pkg.dependencies
      );
      writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
    }

    try {
      execSync('npm install', { cwd: targetDir, stdio: 'inherit' });
      console.log(`Created at ${targetDir}`);
    } catch {
      rmSync(targetDir, { recursive: true, force: true });
    }
  }).parse();

  process.exit();
}
