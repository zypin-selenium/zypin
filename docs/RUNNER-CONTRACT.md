# Runner Contract Specification

This document defines the standard interface that all `@zypin-selenium` runners must implement.

## Purpose

The runner contract ensures:
- Consistent behavior across all test runners (selenium, bdd, visual, etc.)
- Future extensibility without breaking changes
- Easy integration with the CLI test command
- Predictable output format for aggregation

## Interface

All runners must export a `run` function with this signature:

```javascript
export async function run(path, options) {
  // Implementation here
  return {
    exitCode: 0 | 1 | 2,
    results: [
      {
        file: string,
        passed: boolean,
        duration: number,
        error?: string
      }
    ]
  };
}
```

## Parameters

### `path` (string | undefined)
- Test file or folder path to execute
- Default: `process.cwd()` (run all tests in current directory)
- Can be:
  - Single file: `"test.js"` or `"tests/login.feature"`
  - Folder: `"tests/"` or `"tests/integration"`
  - Glob pattern: `"**/*.test.js"` (if runner supports)
  - `undefined`: Run all tests in current working directory

### `options` (object | undefined)
- Reserved for future functionality
- Potential future options:
  - `parallel`: Run tests in parallel
  - `timeout`: Test timeout in milliseconds
  - `reporter`: Output format (tap, json, pretty)
  - `verbose`: Enable verbose logging
- Current implementation: Can be ignored or validated as empty object

## Return Value

### `exitCode` (number)
- **0**: All tests passed successfully
- **1**: One or more tests failed
- **2**: Runtime error (no tests found, crash, invalid configuration, etc.)

### `results` (array)
Array of test result objects, one per test file executed.

Each result object contains:
- `file` (string): Relative path to test file
- `passed` (boolean): Whether the test passed
- `duration` (number): Execution time in milliseconds
- `error` (string, optional): Error message if test failed

## Examples

### Valid Returns

**All tests passed**:
```javascript
{
  exitCode: 0,
  results: [
    { file: 'test1.js', passed: true, duration: 120 },
    { file: 'test2.js', passed: true, duration: 95 }
  ]
}
```

**Some tests failed**:
```javascript
{
  exitCode: 1,
  results: [
    { file: 'test1.js', passed: true, duration: 120 },
    { file: 'test2.js', passed: false, duration: 85, error: 'Expected true but got false' }
  ]
}
```

**Runtime error**:
```javascript
{
  exitCode: 2,
  results: []
}
```

**No tests found**:
```javascript
{
  exitCode: 2,
  results: []
}
```

### Invalid Returns

❌ Missing exitCode:
```javascript
{ results: [...] }  // Error: Must include exitCode
```

❌ Wrong exitCode type:
```javascript
{ exitCode: true, results: [...] }  // Error: Must be 0, 1, or 2
```

❌ Missing results:
```javascript
{ exitCode: 0 }  // Error: Must include results array
```

❌ Invalid result object:
```javascript
{
  exitCode: 0,
  results: [
    { file: 'test.js' }  // Error: Missing passed and duration
  ]
}
```

## Implementation Guidelines

### Error Handling

Runners should:
- Return exitCode 2 for runtime errors (don't throw exceptions)
- Catch test execution errors and include in results array
- Validate path parameter and return exitCode 2 if invalid
- Return empty results array on runtime error

### Test Discovery

When `path` is undefined or a directory:
- Search for test files matching runner's pattern
- Selenium: `**/*.test.js`
- BDD: `**/*.feature`
- Visual: `**/*.visual.js` (future)

When `path` is a file:
- Execute that single file
- Return exitCode 2 if file doesn't exist

### Output to Console

Runners are free to output progress to console during execution:
- Use `console.log()` for progress/success messages
- Use `console.error()` for error messages
- Follow format: `✓ Passed: test.js` / `✗ Failed: test.js`
- CLI will aggregate and format final output

### Performance

- Sequential execution is acceptable for MVP
- Parallel execution can be added later via `options.parallel`
- Duration tracking is required (use `Date.now()` or `performance.now()`)

## Validation

The CLI will validate runner return values:
- Check exitCode is 0, 1, or 2
- Check results is an array
- Check each result has required fields: file, passed, duration
- Warn if validation fails but still aggregate results

## Future Extensions

Potential additions (not required now):
- `skipped`: Number of skipped tests
- `warnings`: Array of warning messages
- `coverage`: Code coverage data
- `artifacts`: Screenshots, videos, logs paths

When adding new fields, ensure backwards compatibility by making them optional.

## Reference Implementations

See:
- `packages/selenium/runner.js` - Selenium test runner
- `packages/selenium-bdd/runner.js` - BDD/Cucumber test runner
- `packages/visual/runner.js` - Visual regression runner (future)
