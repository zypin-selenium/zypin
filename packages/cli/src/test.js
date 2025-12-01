import { readFileSync, existsSync, readdirSync } from 'fs';
import { join } from 'path';

export async function runTests(path, options = {}) {
  const packages = detectTemplateTypes();
  if (packages.length === 0) console.error('Error: No test runners detected'), process.exit(1);

  const aggregated = {};
  for (const pkg of packages) {
    try {
      const { run } = await import(`${pkg}/runner.js`);
      aggregated[pkg] = await run(path, options);
    } catch (error) {
      console.error(`Error: Failed to run ${pkg}: ${error.message}`), aggregated[pkg] = { exitCode: 2, results: [] };
    }
  }

  outputTAP(aggregated);
  process.exit(Object.values(aggregated).some(r => r.exitCode !== 0) ? 1 : 0);
}

function detectTemplateTypes() {
  const cwdType = detectTypeInPackageJson(join(process.cwd(), 'package.json'));
  if (cwdType) return [cwdType];

  const packages = [], testsDir = join(process.cwd(), 'tests');
  if (!existsSync(testsDir)) return packages;

  for (const entry of readdirSync(testsDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const type = detectTypeInPackageJson(join(testsDir, entry.name, 'package.json'));
    type && packages.push(type);
  }

  return packages;
}

function detectTypeInPackageJson(packageJsonPath) {
  if (!existsSync(packageJsonPath)) return null;

  const pkg = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
  const deps = { ...pkg.dependencies, ...pkg.devDependencies };

  if (deps['@zypin-selenium/selenium-bdd']) return '@zypin-selenium/selenium-bdd';
  if (deps['@zypin-selenium/selenium']) return '@zypin-selenium/selenium';
  return null;
}

function outputTAP(aggregated) {
  const allResults = [];
  for (const [pkg, data] of Object.entries(aggregated)) {
    const pkgName = pkg.split('/').pop();
    for (const result of data.results) allResults.push({ pkg: pkgName, ...result });
  }

  console.log(`1..${allResults.length}`);

  let index = 1;
  for (const result of allResults) {
    const status = result.passed ? 'ok' : 'not ok', duration = result.duration ? `(${result.duration}ms)` : '';
    console.log(`${status} ${index} - ${result.pkg}: ${result.file} ${duration}`);
    result.error && console.log(`  # ${result.error}`);
    index++;
  }
}
