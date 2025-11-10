import { readFileSync, existsSync, statSync } from 'fs';
import { dirname, resolve, join } from 'path';

export const detectTest = _detectTest;

// Implementation

function _detectTest(targetPath) {
  const absPath = resolve(targetPath);
  const pkgPath = _findPackageJson(absPath);

  if (!pkgPath) {
    throw new Error(`No package.json found for: ${targetPath}`);
  }

  const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
  const runner = _detectRunner(pkg);

  return {
    runner,
    testDir: dirname(pkgPath),
    pkg
  };
}

function _findPackageJson(startPath) {
  let currentDir = existsSync(startPath) && statSync(startPath).isDirectory()
    ? startPath
    : dirname(startPath);

  while (currentDir !== dirname(currentDir)) {
    const pkgPath = join(currentDir, 'package.json');
    if (existsSync(pkgPath)) {
      const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
      // Check if it's a test package (has test framework)
      if (pkg.dependencies && (
        pkg.dependencies['mocha'] ||
        pkg.dependencies['@cucumber/cucumber'] ||
        pkg.dependencies['jest']
      )) {
        return pkgPath;
      }
    }
    currentDir = dirname(currentDir);
  }
  return null;
}

function _detectRunner(pkg) {
  if (pkg.dependencies?.['@cucumber/cucumber']) return 'cucumber';
  if (pkg.dependencies?.['mocha']) return 'mocha';
  if (pkg.dependencies?.['jest']) return 'jest';

  throw new Error('Unknown test framework. Please install mocha, @cucumber/cucumber, or jest.');
}
