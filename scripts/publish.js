#!/usr/bin/env node
import { test } from '@zypin-selenium/test';
import { existsSync, renameSync } from 'fs';
import { join, dirname } from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
// Setup
const __dirname = dirname(fileURLToPath(import.meta.url)), rootDir = join(__dirname, '..');
// Test
test('Packages should publish', ({ ok, doesNotThrow, test }) => {
    let toPublish = [];
    // Verify token
    ok(process.env.NPM_TOKEN, 'NPM_TOKEN should exist');
    // Load changes
    doesNotThrow(() => {
        toPublish = execSync('git log -1 --name-only --pretty=format:', { cwd: rootDir, encoding: 'utf-8' }).split('\n')
            .filter(file => file.endsWith('package.json') && ['packages', 'templates'].some(dir => file.startsWith(`${dir}/`)))
            .map(file => {
                const dir = file.replace('/package.json', '');
                return { name: dir, path: join(rootDir, dir), isTemplate: dir.startsWith('templates/') };
            });
    }, 'Git changes should load');
    // Publish
    toPublish.forEach(({ name, path, isTemplate }) => test(`${name} should publish`, ({ doesNotThrow }) => {
        const gitignore = join(path, '.gitignore'), renamed = join(path, 'gitignore');
        doesNotThrow(() => isTemplate && existsSync(gitignore) && renameSync(gitignore, renamed), 'Gitignore should prepare');
        doesNotThrow(() => execSync('npm publish --access public', { cwd: path, stdio: 'inherit', env: { ...process.env, NODE_AUTH_TOKEN: process.env.NPM_TOKEN } }), 'NPM publish should succeed');
        doesNotThrow(() => isTemplate && existsSync(renamed) && renameSync(renamed, gitignore), 'Gitignore should restore');
    }));
});
