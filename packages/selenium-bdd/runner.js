import { spawn } from 'child_process';
import { readdirSync, existsSync, statSync } from 'fs';
import { join, resolve } from 'path';

export async function run(path = process.cwd(), options = {}) {
  const targetPath = resolve(path), features = findFeatureFiles(targetPath);
  if (features.length === 0) return { exitCode: 2, results: [] };

  const result = await runCucumber(features, findSupportDir(targetPath));
  return { exitCode: result.passed ? 0 : 1, results: [result] };
}

function findFeatureFiles(targetPath) {
  if (!existsSync(targetPath)) return [];

  const stats = statSync(targetPath);
  if (stats.isFile()) return targetPath.endsWith('.feature') ? [targetPath] : [];

  const files = [], scan = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.name === 'node_modules' || entry.name === 'support') continue;
      const fullPath = join(dir, entry.name);
      entry.isDirectory() ? scan(fullPath) : entry.name.endsWith('.feature') && files.push(fullPath);
    }
  };

  return scan(targetPath), files;
}

function findSupportDir(startPath) {
  let currentPath = resolve(startPath);
  while (currentPath !== '/') {
    const supportPath = join(currentPath, 'support');
    if (existsSync(supportPath)) return supportPath;
    const parentPath = join(currentPath, '..');
    if (parentPath === currentPath) break;
    currentPath = parentPath;
  }
  return null;
}

function runCucumber(features, supportDir) {
  return new Promise((resolve) => {
    const startTime = Date.now(), args = features.slice();
    supportDir && args.unshift('--require', supportDir);

    const child = spawn('npx', ['@cucumber/cucumber', ...args], { stdio: 'inherit' });

    child.on('close', (code) => {
      const duration = Date.now() - startTime, passed = code === 0;
      const result = { file: `${features.length} feature(s)`, passed, duration };
      !passed && (result.error = `Cucumber exited with code ${code}`);
      resolve(result);
    });

    child.on('error', (error) => resolve({
      file: `${features.length} feature(s)`, passed: false, duration: Date.now() - startTime, error: error.message
    }));
  });
}
