import { spawn } from 'child_process';
import { readdirSync, statSync, existsSync } from 'fs';
import { join, resolve } from 'path';

export async function run(path = process.cwd(), options = {}) {
  const files = findTestFiles(resolve(path));
  if (files.length === 0) return { exitCode: 2, results: [] };

  const results = [];
  let hasFailure = false;

  for (const file of files) {
    const result = await runTestFile(file);
    results.push(result), !result.passed && (hasFailure = true);
  }

  return { exitCode: hasFailure ? 1 : 0, results };
}

function findTestFiles(targetPath) {
  if (!existsSync(targetPath)) return [];

  const stats = statSync(targetPath);
  if (stats.isFile()) return targetPath.endsWith('.test.js') ? [targetPath] : [];

  const files = [], scan = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.name === 'node_modules') continue;
      const fullPath = join(dir, entry.name);
      entry.isDirectory() ? scan(fullPath) : entry.name.endsWith('.test.js') && files.push(fullPath);
    }
  };

  return scan(targetPath), files;
}

function runTestFile(file) {
  return new Promise((resolve) => {
    const startTime = Date.now(), child = spawn('node', [file], { stdio: 'inherit' });

    child.on('close', (code) => {
      const duration = Date.now() - startTime, passed = code === 0;
      const result = { file, passed, duration };
      !passed && (result.error = `Test exited with code ${code}`);
      resolve(result);
    });

    child.on('error', (error) => resolve({
      file, passed: false, duration: Date.now() - startTime, error: error.message
    }));
  });
}
