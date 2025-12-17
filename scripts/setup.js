#!/usr/bin/env node
import { test } from '@zypin-selenium/test';
import { writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
// Setup
const __dirname = dirname(fileURLToPath(import.meta.url)), rootDir = join(__dirname, '..');
// Test
test('Git hook should setup', ({ ok, doesNotThrow }) => {
    const hookPath = join(rootDir, '.git', 'hooks', 'pre-commit');
    doesNotThrow(() => writeFileSync(hookPath, `#!/bin/sh\nnode scripts/bump.js\n`, { mode: 0o755 }), 'Pre-commit hook should write');
    ok(existsSync(hookPath), 'Pre-commit hook should exist');
});
