import { readFileSync, existsSync, writeFileSync, readdirSync, mkdirSync, renameSync } from 'fs';
import { copy } from 'fs-extra';
import { dirname, join, basename } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export async function initTemplate(folderName) {
  const templateInfo = detectTemplate();
  const cliVersion = getCliVersion();
  checkVersionCompatibility(cliVersion, templateInfo.version);

  const isZypinTemplate = templateInfo.name === '@zypin-selenium/create-zypin';
  isZypinTemplate ? await initZypinTemplate(templateInfo, folderName) : await initSubTemplate(templateInfo, folderName);
}

export function detectTemplate() {
  try {
    const templatePackageJsonPath = join(__dirname, '../../../package.json');
    const templatePackageJson = JSON.parse(readFileSync(templatePackageJsonPath, 'utf-8'));
    const templateDir = dirname(templatePackageJsonPath);
    return { name: templatePackageJson.name, version: templatePackageJson.version, path: templateDir };
  } catch (error) {
    console.error('Error: Unable to detect template information');
    process.exit(1);
  }
}

export function getCliVersion() {
  try {
    const cliPackageJsonPath = join(__dirname, '../package.json');
    const cliPackageJson = JSON.parse(readFileSync(cliPackageJsonPath, 'utf-8'));
    return cliPackageJson.version;
  } catch (error) {
    console.error('Error: Unable to read CLI version');
    process.exit(1);
  }
}

export function checkVersionCompatibility(cliVersion, templateVersion) {
  const cliMajor = parseInt(cliVersion.split('.')[0]);
  const templateMajor = parseInt(templateVersion.split('.')[0]);
  if (cliMajor < templateMajor) {
    console.error(`CLI version ${cliVersion} is not compatible with template version ${templateVersion}`);
    process.exit(1);
  }
}

async function initZypinTemplate(templateInfo, folderName) {
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
  await copyTemplate(templateInfo, targetDir);
  await cleanupPackageJson(targetDir, folderName);
  console.log('\nTemplate initialized successfully!');
  console.log(`Next: cd ${folderName} && npm install\n`);
}

async function initSubTemplate(templateInfo, folderName) {
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
  await copyTemplate(templateInfo, targetDir);
  await cleanupPackageJson(targetDir, folderName);
  console.log('\nTemplate initialized successfully!');
  console.log('Next: npm install\n');
}

async function copyTemplate(templateInfo, targetDir) {
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
    await copy(sourcePath, targetPath);
    console.log(`✓ Copied: ${file}`);
  }

  const gitignorePath = join(targetDir, 'gitignore'), dotGitignorePath = join(targetDir, '.gitignore');
  existsSync(gitignorePath) && renameSync(gitignorePath, dotGitignorePath);
}

async function cleanupPackageJson(targetDir, folderName) {
  const packageJsonPath = join(targetDir, 'package.json');
  if (!existsSync(packageJsonPath)) return console.warn('Warning: package.json not found in template');

  const pkg = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
  delete pkg.bin;
  pkg.name = folderName;

  if (pkg.dependencies && pkg.dependencies['@zypin-selenium/cli']) {
    pkg.devDependencies = pkg.devDependencies || {};
    pkg.devDependencies['@zypin-selenium/cli'] = pkg.dependencies['@zypin-selenium/cli'];
    delete pkg.dependencies['@zypin-selenium/cli'];
  }

  pkg.scripts = pkg.scripts || {};
  if (!pkg.scripts.test) pkg.scripts.test = 'zypin test';

  writeFileSync(packageJsonPath, JSON.stringify(pkg, null, 2) + '\n');
  console.log('\n✓ Updated package.json');
}
