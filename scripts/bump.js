#!/usr/bin/env node
import { test } from '@zypin-selenium/test';
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
// Setup
const __dirname = dirname(fileURLToPath(import.meta.url)), rootDir = join(__dirname, '..');
// Test
test('Versions should bump', ({ ok, test, doesNotThrow }) => {
    let changed = new Set();
    // Calculate changes
    doesNotThrow(() => {
        const workspaces = ['packages', 'templates'].flatMap(dirName => {
            const dir = join(rootDir, dirName);
            return existsSync(dir) ? readdirSync(dir, { withFileTypes: true })
                .filter(entry => entry.isDirectory() && existsSync(join(dir, entry.name, 'package.json')))
                .map(entry => ({ path: `${dirName}/${entry.name}`, pkg: JSON.parse(readFileSync(join(dir, entry.name, 'package.json'), 'utf-8')) }))
                : [];
        });
        // Get diff
        const diff = execSync('git diff --cached --name-only', { cwd: rootDir, encoding: 'utf-8' }).split('\n');
        diff.map(line => workspaces.find(workspace => line.startsWith(workspace.path + '/') && !line.includes('node_modules'))).filter(Boolean)
            .forEach(workspace => changed.add(workspace));
        // Propagate updates
        changed.forEach(workspace => {
            const [major, minor, patch] = (workspace.pkg.version || '0.0.0').split('.');
            workspace.pkg.version = `${major}.${minor}.${+patch + 1}`;
            workspaces.forEach(dep => ['dependencies', 'devDependencies'].forEach(depType => dep.pkg[depType]?.[workspace.pkg.name] && (
                dep.pkg[depType][workspace.pkg.name] = `^${workspace.pkg.version}`, changed.add(dep)
            )));
        });
    }, 'Version calculation should succeed');
    // Save changes
    changed.size === 0 && ok(true, 'No versions should bump');
    changed.forEach(({ path, pkg }) => test(`${path} should bump`, ({ doesNotThrow }) => (
        doesNotThrow(() => writeFileSync(join(rootDir, path, 'package.json'), JSON.stringify(pkg, null, 2) + '\n'), 'File should write'),
        doesNotThrow(() => execSync(`git add ${path}/package.json`, { cwd: rootDir }), 'Git add should succeed')
    )));
});
