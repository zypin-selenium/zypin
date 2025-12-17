#!/usr/bin/env node

import { test } from '@zypin-selenium/test';
import { writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url)), rootDir = join(__dirname, '..');

test('Git hook should setup', ({ ok, doesNotThrow }) => (
    doesNotThrow(() => writeFileSync(join(rootDir, '.git', 'hooks', 'pre-commit'), `#!/bin/sh\nnode scripts/bump.js\n`, { mode: 0o755 }), 'Pre-commit hook should write'),
    ok(existsSync(join(rootDir, '.git', 'hooks', 'pre-commit')), 'Pre-commit hook should exist')
));
