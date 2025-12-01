# Coding Style Guide

This document outlines the coding conventions and style guidelines for the zypin-selenium project.

## General Principles

### 1. Minimalism
- **Prefer fewer files with more content over many small files**
- Each file can be longer if it keeps related logic together
- Only split files when there's a clear separation of concerns

### 2. Minimal Dependencies
- Prefer native Node.js APIs when possible
- Only add external dependencies when they provide significant value
- Keep package.json minimal with only essential fields

### 3. Zero Configuration
- Default values should work out of the box
- Users shouldn't need config files for basic usage
- Smart defaults over configuration options

## Code Organization

### Hoist Rule
**Functions must be placed at the bottom of the file, execution code at the top.**

✅ Good:
```javascript
#!/usr/bin/env node

import { someFunction } from './module.js';

// Execution code at top
const result = someFunction();
console.log(result);

// Functions at bottom
function someFunction() {
  return 'result';
}
```

❌ Bad:
```javascript
#!/usr/bin/env node

// Functions at top
function someFunction() {
  return 'result';
}

// Execution code at bottom
const result = someFunction();
console.log(result);
```

### File Structure

**Entry files (index.js)** should be minimal:
- Import statements
- Execution/command setup
- Delegate to src/ modules

**Source files (src/\*.js)** contain implementation:
- Export main functions at top of exports
- Internal/helper functions can be non-exported
- Keep related functionality together

Example structure:
```
packages/cli/
├── index.js              (30 lines - commands only)
└── src/
    ├── init.js           (all initialization logic)
    └── test.js           (all test logic)
```

### Exports

Export functions that are needed by other modules:

```javascript
// src/init.js
export async function initTemplate() { /* ... */ }
export function detectTemplate() { /* ... */ }
export function getCliVersion() { /* ... */ }

// Internal functions - not exported
async function copyTemplate() { /* ... */ }
async function cleanupPackageJson() { /* ... */ }
```

Later modules can import from earlier ones if needed:
```javascript
// src/test.js can import from src/init.js if needed
import { someFunction } from './init.js';
```

## Module System

### ES Modules Only
All packages use ES modules (`"type": "module"`):

```javascript
import { readFileSync } from 'fs';
import { join } from 'path';

export function myFunction() {
  // ...
}
```

### __dirname in ES Modules
```javascript
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
```

## Package.json

### Minimal Fields Only
Only include essential information:

```json
{
  "name": "@zypin-selenium/package-name",
  "version": "1.0.0",
  "type": "module",
  "main": "index.js"
}
```

Add optional fields only when needed:
- `bin` - for CLI packages
- `dependencies` - install via npm, don't write directly

### Installing Dependencies
Always install packages via npm commands:
```bash
npm install package-name
```

**Do not** manually write to package.json dependencies.

## Naming Conventions

### Packages
- Core packages: `@zypin-selenium/package-name`
- Templates: `@zypin-selenium/create-name`

Examples:
- `@zypin-selenium/cli`
- `@zypin-selenium/selenium`
- `@zypin-selenium/create-zypin`
- `@zypin-selenium/create-selenium`

### Functions
- Use clear, descriptive names
- Async functions should be obvious from context
- Helper functions can be internal (not exported)

```javascript
// Main exported functions
export async function initTemplate() { /* ... */ }
export function detectTemplate() { /* ... */ }

// Internal helper functions
async function copyTemplate() { /* ... */ }
function validateVersion() { /* ... */ }
```

### Variables
- Use `const` by default
- Use `let` only when reassignment is needed
- Descriptive names over short names

```javascript
const templateInfo = detectTemplate();
const cliVersion = getCliVersion();
```

## Error Handling

### Exit on Fatal Errors
For CLI tools, exit immediately on fatal errors:

```javascript
if (!existsSync(packageJsonPath)) {
  console.error('Error: package.json not found');
  process.exit(1);
}
```

### Warnings for Non-Fatal Issues
Use warnings for issues that don't prevent execution:

```javascript
if (existsSync(targetPath)) {
  console.warn(`Warning: ${file} already exists, skipping...`);
  continue;
}
```

### No Verbose Error Messages
Keep error messages concise and actionable:

✅ Good:
```javascript
console.error(`CLI version ${cliVersion} is not compatible with template version ${templateVersion}`);
```

❌ Bad:
```javascript
console.error(`
ERROR: Version Compatibility Issue
================================
The CLI version (${cliVersion}) you are using is not compatible
with the template version (${templateVersion}).
Please update your CLI by running: npm install -g @zypin-selenium/cli@latest
`);
```

## Comments

### Minimal Comments
Code should be self-documenting. Use comments only when necessary:

✅ Good:
```javascript
// Skip node_modules and package-lock.json
if (file === 'node_modules' || file === 'package-lock.json') {
  continue;
}
```

❌ Bad:
```javascript
// This loop iterates through all files in the source directory
// and copies them to the target directory, but it skips certain
// files that we don't want to copy
for (const file of files) {
  // ...
}
```

### TODO Comments
Use TODO for future implementation:

```javascript
// TODO: Implement test runners after packages are ready
console.log('TODO: Test runner implementation coming soon');
```

## Console Output

### User-Facing Messages
- Clear and concise
- Use checkmarks (✓) for success
- Use "Warning:" prefix for warnings
- Use "Error:" prefix for errors

```javascript
console.log(`✓ Copied: ${file}`);
console.warn(`Warning: ${file} already exists, skipping...`);
console.error('Error: Unable to detect template information');
```

### No Emoji (Unless Requested)
Avoid emojis in output unless user explicitly requests them.

## File Operations

### Use Appropriate APIs
- `fs-extra` for recursive copy operations
- Native `fs` for simple read/write operations

```javascript
import { copy } from 'fs-extra';
import { readFileSync, writeFileSync } from 'fs';

// Recursive copy
await copy(sourcePath, targetPath);

// Simple read/write
const content = readFileSync(filePath, 'utf-8');
writeFileSync(filePath, content);
```

## Version Management

### Major Version Compatibility
Check only major versions for compatibility:

```javascript
const cliMajor = parseInt(cliVersion.split('.')[0]);
const templateMajor = parseInt(templateVersion.split('.')[0]);

if (cliMajor < templateMajor) {
  console.error(`CLI version ${cliVersion} is not compatible with template version ${templateVersion}`);
  process.exit(1);
}
```

### Independent Package Versions
Each package has its own version, managed independently.

## Code Compression

### Compress Code for Brevity
Apply compression techniques to reduce line count while maintaining readability:

**Single-line if statements**:
```javascript
// Compressed
if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

// Not compressed
if (!existsSync(dir)) {
  mkdirSync(dir, { recursive: true });
}
```

**Comma operator for multiple statements**:
```javascript
// Compressed
fileStream.close(), process.stdout.write('Done\n'), resolve();

// Not compressed
fileStream.close();
process.stdout.write('Done\n');
resolve();
```

**Inline variable declarations**:
```javascript
// Compressed
let count = 0, total = 100;

// Not compressed
let count = 0;
let total = 100;
```

**Arrow function single expressions**:
```javascript
// Compressed
const cleanup = () => (child.kill(), logStream.end(), process.exit(0));

// Not compressed
const cleanup = () => {
  child.kill();
  logStream.end();
  process.exit(0);
};
```

**Logical AND short-circuit**:
```javascript
// Compressed
code !== 0 && (console.error('Failed'), process.exit(code));

// Not compressed
if (code !== 0) {
  console.error('Failed');
  process.exit(code);
}
```

**Early returns**:
```javascript
// Compressed
if (status === 301) return https.get(location, handler);

// Not compressed
if (status === 301) {
  return https.get(location, handler);
}
```

### When to Compress
- ✅ Simple one-liners (if/else with single statement)
- ✅ Multiple related statements (comma operator)
- ✅ Arrow functions with single expression
- ✅ Short cleanup/setup code
- ❌ Complex logic that becomes hard to read
- ❌ Error handling with multiple conditions

## Testing

Testing strategy will be defined later. For MVP, focus on:
- Manual testing during development
- Clear, testable function boundaries
- Minimal side effects

---

## Summary Checklist

When writing code, ensure:

- [ ] Execution code at top, functions at bottom (hoist rule)
- [ ] Minimal dependencies (prefer native APIs)
- [ ] ES modules (`type: "module"`)
- [ ] Minimal package.json fields
- [ ] Clear, descriptive function names
- [ ] Exports only what's needed by other modules
- [ ] Concise error messages
- [ ] Self-documenting code with minimal comments
- [ ] Appropriate file organization (don't over-split)
- [ ] User-friendly console output
