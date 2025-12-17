#!/usr/bin/env node

import { test } from '@zypin-selenium/test';
import { existsSync, renameSync } from 'fs';
import { join, dirname } from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url)), rootDir = join(__dirname, '..');

test('Packages should publish', ({ ok, doesNotThrow }) => {
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
