#!/usr/bin/env node

import { test } from '@zypin-selenium/test';
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url)), rootDir = join(__dirname, '..');

test('Versions should bump', ({ ok }) => {
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
