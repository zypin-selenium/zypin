import { copyFileSync, readdirSync, mkdirSync, existsSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export const getTemplates = _getTemplates;
export const copyTestTemplate = _copyTestTemplate;

// Implementation

function _getTemplates() {
  const templatesDir = join(__dirname, '../../templates');
  const entries = readdirSync(templatesDir, { withFileTypes: true });

  const templates = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;

    // Skip base template
    if (entry.name === 'zypin') continue;

    const templatePath = join(templatesDir, entry.name);
    const pkgPath = join(templatePath, 'package.json');

    // Read package.json for better label
    let label = entry.name;
    if (existsSync(pkgPath)) {
      try {
        const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
        // Create label from dependencies
        if (pkg.dependencies?.['mocha']) {
          label = `${entry.name} (Mocha)`;
        } else if (pkg.dependencies?.['@cucumber/cucumber']) {
          label = `${entry.name} (Cucumber/BDD)`;
        } else if (pkg.dependencies?.['jest']) {
          label = `${entry.name} (Jest)`;
        }
      } catch (err) {
        // Ignore, use default label
      }
    }

    templates.push({
      name: entry.name,
      label,
      value: entry.name
    });
  }

  return templates;
}

function _copyTestTemplate(templateName, targetDir) {
  const templateDir = join(__dirname, '../../templates', templateName);
  const destDir = join(targetDir, 'tests', templateName);

  if (!existsSync(templateDir)) {
    throw new Error(`Template not found: ${templateName}`);
  }

  _copyRecursive(templateDir, destDir);

  return destDir;
}

function _copyRecursive(src, dest) {
  if (!existsSync(dest)) {
    mkdirSync(dest, { recursive: true });
  }

  const entries = readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = join(src, entry.name);
    const destPath = join(dest, entry.name);

    if (entry.isDirectory()) {
      _copyRecursive(srcPath, destPath);
    } else {
      copyFileSync(srcPath, destPath);
    }
  }
}
