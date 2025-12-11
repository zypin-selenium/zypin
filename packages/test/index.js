import { ok as assertOk, strictEqual, deepStrictEqual, throws as assertThrows } from 'node:assert';
import { performance } from 'node:perf_hooks';
import { writeTest, resetIndex, writePlan } from './src/reporter.js';

const testQueue = [];
let scheduled = false;

/**
 * @typedef {Object} TestOptions
 * @property {boolean} [skip] - Skip this test
 * @property {number} [timeout=30000] - Timeout in milliseconds
 */

/**
 * @typedef {Object} TestContext
 * @property {(value: any, msg?: string) => void} ok - Assert that value is truthy
 * @property {(actual: any, expected: any, msg?: string) => void} equal - Assert strict equality
 * @property {(actual: any, expected: any, msg?: string) => void} deepEqual - Assert deep equality
 * @property {(fn: Function, error?: any, msg?: string) => void} throws - Assert function throws
 * @property {(name: string, options?: TestOptions, fn?: (t: TestContext) => Promise<void>) => Promise<void>} test - Run nested test
 */

/**
 * Register a test to run later
 * @param {string} name - Test name
 * @param {TestOptions | ((t: TestContext) => Promise<void>)} [options] - Test options or test function
 * @param {(t: TestContext) => Promise<void>} [fn] - Test function
 */
export function test(name, options, fn) {
  if (typeof options === 'function') fn = options, options = {};

  // Capture stack trace at test definition for timeout errors
  const stack = {};
  Error.captureStackTrace(stack, test);

  testQueue.push({ name, options: options || {}, fn, stack: stack.stack });

  !scheduled && (scheduled = true, queueMicrotask(() => runTests()));
}

async function runTests() {
  writePlan(testQueue.length, 0);
  for (const { name, options, fn, stack } of testQueue) {
    const result = await runTest(name, options, fn, 0, false, stack);
    writeTest(result);
  }
  resetIndex();
}

async function runTest(name, options, fn, level, isTopLevel = false, testStack) {
  const opts = options || {}, timeout = opts.timeout || 30000;

  if (opts.skip) return { name, passed: true, skipped: true, children: [], level };

  const ctx = new TestContext(level), start = performance.now();
  let timeoutId;

  // Create timeout error with captured stack from test definition
  const timeoutError = new Error(`Timeout after ${timeout}ms`);
  testStack && (timeoutError.stack = `Error: ${timeoutError.message}\n${testStack}`);

  try {
    await Promise.race([
      fn(ctx),
      new Promise((_, reject) => { timeoutId = setTimeout(() => reject(timeoutError), timeout); })
    ]);
    const hasFailedChildren = ctx.children.some(c => !c.passed);
    return { name, passed: !hasFailedChildren, duration: performance.now() - start, children: ctx.children, level };
  } catch (error) {
    return { name, passed: false, duration: performance.now() - start, error: parseError(error), children: ctx.children, level };
  } finally {
    clearTimeout(timeoutId);
  }
}

function parseError(error) {
  const parsed = { message: error.message };
  error.expected !== undefined && (parsed.expected = error.expected);
  error.actual !== undefined && (parsed.actual = error.actual);

  // Determine severity based on error type
  parsed.severity = (error.code === 'ERR_ASSERTION' || error.message.includes('Timeout after')) ? 'fail' : 'error';

  // Extract stack trace
  if (error.stack) {
    const relevantLine = error.stack.split('\n').find(line =>
      line.includes('    at ') && !line.includes('node_modules') && !line.includes('node:internal') && !line.includes('/index.js:')
    );
    const match = relevantLine?.match(/\((.+):(\d+):(\d+)\)/) || relevantLine?.match(/at (.+):(\d+):(\d+)/);
    match && (parsed.location = `${match[1]}:${match[2]}:${match[3]}`);
  }

  return parsed;
}

class TestContext {
  constructor(level) { this.level = level, this.children = []; }
  ok(value, msg) { assertOk(value, msg); }
  equal(actual, expected, msg) { strictEqual(actual, expected, msg); }
  deepEqual(actual, expected, msg) { deepStrictEqual(actual, expected, msg); }
  throws(fn, error, msg) { assertThrows(fn, error, msg); }
  async test(name, options, fn) {
    typeof options === 'function' && (fn = options, options = {});
    const result = await runTest(name, options || {}, fn, this.level + 1);
    this.children.push(result);
  }
}
