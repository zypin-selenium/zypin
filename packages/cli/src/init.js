import { readFileSync, existsSync, writeFileSync, readdirSync, mkdirSync, renameSync, cpSync } from 'fs';
import { dirname, join, basename } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export function detectTemplate() {
  const scriptName = basename(process.argv[1]);
  if (!scriptName.startsWith('create-')) return null;

  try {
    // Templates are sibling packages due to npm hoisting
    // cli/src/init.js -> ../../{template-name}/package.json
    const templatePackageJsonPath = join(__dirname, `../../${scriptName}/package.json`);
    const templatePackageJson = JSON.parse(readFileSync(templatePackageJsonPath, 'utf-8'));
    const templateDir = dirname(templatePackageJsonPath);
    return { name: templatePackageJson.name, version: templatePackageJson.version, path: templateDir };
  } catch (error) {
    console.error('Error: Unable to detect template information');
    process.exit(1);
  }
}

export function initTemplate(folderName, templateInfo) {
  const isZypinTemplate = templateInfo.name === '@zypin-selenium/create-zypin';
  isZypinTemplate ? initZypinTemplate(templateInfo, folderName) : initSubTemplate(templateInfo, folderName);
}


function initZypinTemplate(templateInfo, folderName) {
  if (!folderName) {
    console.error('Error: Folder name is required');
    console.error('Usage: npx @zypin-selenium/create-zypin <folder-name>');
    process.exit(1);
  }

  const targetDir = join(process.cwd(), folderName);
  if (existsSync(targetDir)) {
    console.error(`Error: Folder "${folderName}" already exists`);
    process.exit(1);
  }

  mkdirSync(targetDir, { recursive: true });
  copyTemplate(templateInfo, targetDir);
  cleanupPackageJson(targetDir, folderName, true);
  console.log('\nTemplate initialized successfully!');
  console.log(`Next: cd ${folderName} && npm install\n`);
}

function initSubTemplate(templateInfo, folderName) {
  const testsDir = join(process.cwd(), 'tests');
  if (!existsSync(testsDir)) {
    console.error('Error: Not a zypin project (tests/ folder not found)');
    console.error('Run "npx @zypin-selenium/create-zypin <project-name>" first');
    process.exit(1);
  }

  if (!folderName) {
    console.error('Error: Folder name is required');
    console.error(`Usage: npx ${templateInfo.name} <folder-name>`);
    process.exit(1);
  }

  const targetDir = join(testsDir, folderName);
  if (existsSync(targetDir)) {
    console.error(`Error: Folder "tests/${folderName}" already exists`);
    process.exit(1);
  }

  mkdirSync(targetDir, { recursive: true });
  copyTemplate(templateInfo, targetDir);
  cleanupPackageJson(targetDir, folderName, false);
  console.log('\nTemplate initialized successfully!');
  console.log('Next: npm install\n');
}

function copyTemplate(templateInfo, targetDir) {
  const sourceDir = templateInfo.path;
  console.log(`\nCopying template files from ${templateInfo.name}...\n`);
  const files = readdirSync(sourceDir);

  for (const file of files) {
    if (file === 'node_modules' || file === 'package-lock.json') continue;
    const sourcePath = join(sourceDir, file);
    const targetPath = join(targetDir, file);
    if (existsSync(targetPath)) {
      console.warn(`Warning: ${file} already exists, skipping...`);
      continue;
    }
    cpSync(sourcePath, targetPath, { recursive: true });
    console.log(`✓ Copied: ${file}`);
  }

  const gitignorePath = join(targetDir, 'gitignore'), dotGitignorePath = join(targetDir, '.gitignore');
  existsSync(gitignorePath) && renameSync(gitignorePath, dotGitignorePath);
}

function cleanupPackageJson(targetDir, folderName, isMainTemplate) {
  const packageJsonPath = join(targetDir, 'package.json');
  if (!existsSync(packageJsonPath)) return console.warn('Warning: package.json not found in template');

  const pkg = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
  delete pkg.bin;
  pkg.name = folderName;

  if (pkg.dependencies && pkg.dependencies['@zypin-selenium/cli']) {
    if (isMainTemplate) {
      pkg.devDependencies = pkg.devDependencies || {};
      pkg.devDependencies['@zypin-selenium/cli'] = pkg.dependencies['@zypin-selenium/cli'];
    }
    delete pkg.dependencies['@zypin-selenium/cli'];
    if (Object.keys(pkg.dependencies).length === 0) {
      delete pkg.dependencies;
    }
  }

  writeFileSync(packageJsonPath, JSON.stringify(pkg, null, 2) + '\n');
  console.log('\n✓ Updated package.json');
}
