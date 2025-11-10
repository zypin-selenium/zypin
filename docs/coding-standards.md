# Coding Standards

## Principles
- Do exactly what is asked, nothing more
- No assumptions or "best practices"
- Ask when unclear

## Write only what is required
- Minimal code only
- No unnecessary abstractions
- Remove if not essential

## Same Pattern Rule
- When similar files exist, use identical patterns
- Examples: Parallel functions (buildX/buildY, loadX/loadY)
- Ask user before applying pattern to other files
- Maintain consistency: structure, naming, variable placement

## Workflow
1. Plan the task
2. Review standards
3. Check for similar files (same pattern)
4. Ask for confirmation
5. Write code
6. Apply same changes to similar files (ask first)

## Naming

### Files
- Simple descriptive names without prefixes
- Single responsibility per file
- Flat structure for easy finding
- Pattern: Use domain nouns (cli, test, server, etc.)

### Functions & Exports

**Verb-First Pattern:**
- Format: `verb + [qualifier] + noun` (max 2-3 words)
- Examples: `scanConfigs`, `loadEnv`, `buildWeb`, `copy`

**Naming Rules:**
1. Remove redundant context
2. Drop prepositions
3. Simplify qualifiers
4. Max 3 parts rule

**Noun Pattern (Services/API):**
- Use nouns for: classes, instances, services, middleware
- Keep standard conventions: `with*` for middleware

### Variables
- camelCase
- Clear, concise names
- No intermediate variables if used once

## Code Organization

### File Structure Order
1. Imports
2. Constants
3. Exports (no implementation)
4. `// Implementation` comment
5. Implementations with `_` prefix

### Constants Section
- Place all constants after imports, before exports
- Use UPPER_CASE for constants
- Extract hardcoded lists/arrays to named constants
- Makes values easy to find and edit

```js
// Constants
const TEMPLATE_PACKAGES = [
  '@zypin-selenium/selenium-basic',
  '@zypin-selenium/selenium-bdd'
];

// Exports
export const getTemplates = _getTemplates;

// Implementation
function _getTemplates() {
  for (const pkg of TEMPLATE_PACKAGES) {
    // ...
  }
}
```

### Export Pattern
```js
// Exports
export const functionName = _functionName;
export const anotherFn = _anotherFn;

// Implementation

function _functionName() {
  // ...
}

function _anotherFn() {
  // ...
}
```

**Exceptions:**
- `export default` - Components, pages
- `export { ... } from '...'` - Re-exports
- `export const CONSTANT = 'value'` - String constants

## Source of Trust
- Main entry point handles validation/errors
- Utility functions stay pure
- Don't throw in utilities
- Return data only

## .gitignore Rules
- No comments, no blank lines
- Folders first (trailing slash), then files
- Sort alphabetically within groups
