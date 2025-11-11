# @zypin-selenium/linter

Shared ESLint configuration with custom rules for enforcing coding standards.

## Features

- **Custom Rules** (3 rules):
  - `standards/export-pattern`: Enforce `export const name = _name` pattern
  - `standards/function-naming`: Enforce verb-first naming with max 3 parts
  - `standards/file-structure-order`: Enforce file structure (Imports → Constants → Exports → Implementation)

- **ESLint Built-in Rules**: Configured for code quality and consistency

## Installation

```bash
npm install @zypin-selenium/linter --save-dev
```

## Usage

### Basic Usage

Create `eslint.config.js`:

```javascript
import { createConfig } from '@zypin-selenium/linter';

export default createConfig();
```

### Custom Ignores

```javascript
import { createConfig } from '@zypin-selenium/linter';

export default createConfig({
  ignores: ['node_modules/**', 'dist/**', 'custom-ignore/**']
});
```

## Rules

### `standards/export-pattern`

Enforces the export pattern:
```javascript
// ✅ Correct
export const functionName = _functionName;

function _functionName() {
  // implementation
}

// ❌ Wrong
export function functionName() {}
export const functionName = () => {};
```

### `standards/function-naming`

Enforces verb-first naming with max 3 parts:
```javascript
// ✅ Correct
function _getUser() {}
function _processData() {}
function _buildConfig() {}

// ❌ Wrong
function _userData() {}  // No verb
function _getUserProfileDataFromServer() {}  // Too many parts (>3)
```

### `standards/file-structure-order`

Enforces file structure:
```javascript
// 1. Imports
import { join } from 'path';

// 2. Constants
const API_URL = 'https://api.example.com';

// 3. Exports
export const fetchData = _fetchData;

// Implementation
function _fetchData() {
  return fetch(API_URL);
}
```

## License

MIT
