import { readdirSync, readFileSync } from 'fs';
import { stat, cp, copyFile } from 'fs/promises';
import { join, basename } from 'path';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

const TEMPLATE_PACKAGES = [
  '@zypin-selenium/selenium-basic',
  '@zypin-selenium/selenium-bdd'
];

export const getTemplates = _getTemplates;
export const copyTestTemplate = _copyTestTemplate;

// Implementation

function _getTemplates() {
  const templates = [];

  for (const packageName of TEMPLATE_PACKAGES) {
    try {
      const pkgPath = require.resolve(`${packageName}/package.json`);
      const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));

      // Extract template name from package name
      const name = packageName.split('/').pop();

      // Create label from dependencies
      let label = name;
      if (pkg.dependencies?.['mocha']) {
        label = `${name} (Mocha)`;
      } else if (pkg.dependencies?.['@cucumber/cucumber']) {
        label = `${name} (Cucumber/BDD)`;
      } else if (pkg.dependencies?.['jest']) {
        label = `${name} (Jest)`;
      }

      templates.push({
        name: packageName,
        label,
        value: packageName
      });
    } catch (err) {
      // Package not installed, skip
    }
  }

  return templates;
}

async function _copyTestTemplate(templatePackage, targetDir) {
  const files = await _scanTemplate(templatePackage);
  const templateName = templatePackage.split('/').pop();
  const destDir = join(targetDir, 'tests', templateName);

  for (const file of files) {
    await _copy(file, destDir);
  }

  return destDir;
}

async function _scanTemplate(packageName) {
  const packageJsonPath = require.resolve(`${packageName}/package.json`);
  const templatePath = join(packageJsonPath, '..');

  return readdirSync(templatePath)
    .filter(file => file !== 'node_modules')
    .map(file => join(templatePath, file));
}

async function _copy(sourcePath, targetDir) {
  const targetPath = join(targetDir, basename(sourcePath));

  if ((await stat(sourcePath)).isDirectory()) {
    await cp(sourcePath, targetPath, { recursive: true });
  } else {
    await copyFile(sourcePath, targetPath);
  }
}
