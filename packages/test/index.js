import assert from 'node:assert';
import { performance } from 'node:perf_hooks';

const runner = new TAPRunner();
let globalCount = 0, allPassed = true;

global.test = test;

process.on('beforeExit', () => (console.log(`1..${globalCount}`), process.exitCode = allPassed ? 0 : 1));

// Implement

/**
 * @typedef {(name: string, fn: TestFunction, options?: {skip?: boolean, timeout?: number}) => void | Promise<void>} TestMethod
 * @typedef {(ctx: {test: TestMethod} & import('assert')) => void | Promise<void>} TestFunction
 * @param {string} n
 * @param {TestFunction} f
 * @param {{skip?: boolean, timeout?: number}} [o]
 * @returns {void | Promise<void>}
 */
export function test(n, f, o) {
  if (o?.skip) return console.log(`ok ${++globalCount} - ${n} # SKIP`);

  const result = runner.test(n, f, o);
  const handleResult = ({ passed, time }) => (
    console.log(`${passed ? 'ok' : 'not ok'} ${++globalCount} - ${n} # time=${time}ms`),
    allPassed &&= passed
  );

  return result instanceof Promise ? result.then(handleResult) : handleResult(result);
}

function BailError() { Error.call(this, 'BailError'); }
BailError.prototype = Object.create(Error.prototype);
BailError.prototype.constructor = BailError;

function TAPRunner(indent = '') { this.indent = indent; }

TAPRunner.prototype.test = function (name, fn, options = {}) {
  if (options.skip) return { passed: true, time: '0.00' };

  const start = performance.now(), nextIndent = this.indent + '    ', timeout = options.timeout || 1800000;
  let count = 0, passed = true, done = false, lastAssertEnd = start;

  console.log(`${this.indent}# Subtest: ${name}`);

  const ctx = {
    test: (n, f, o) => {
      if (done) return;
      const r = new TAPRunner(nextIndent), result = r.test(n, f, o);

      const handleResult = ({ passed: ok, time }) => (
        console.log(`${nextIndent}${ok ? 'ok' : 'not ok'} ${++count} - ${n} # time=${time}ms`),
        passed &&= ok
      );

      return result instanceof Promise ? result.then(handleResult) : handleResult(result);
    }
  };

  Object.getOwnPropertyNames(assert).filter(m => typeof assert[m] === 'function' && m !== 'AssertionError').forEach(m =>
    ctx[m] = (...a) => {
      if (done) return;
      const msg = (m === 'ok' || m === 'fail') ? (a[1] || m) : (a[2] || a[1] || m);

      const onPass = () => {
        const now = performance.now(), time = Math.max(0.01, now - lastAssertEnd).toFixed(2);
        console.log(`${nextIndent}ok ${++count} - ${typeof msg === 'string' ? msg : m} # time=${time}ms`);
        lastAssertEnd = now;
      };

      const onFail = (e) => {
        const now = performance.now(), time = Math.max(0.01, now - lastAssertEnd).toFixed(2);
        console.log(`${nextIndent}not ok ${++count} - ${typeof msg === 'string' ? msg : m} # time=${time}ms`);
        this.yaml(e, nextIndent + '  ');
        passed = false, lastAssertEnd = now;
        throw new BailError();
      };

      if (m === 'rejects' || m === 'doesNotReject') return assert[m](...a).then(onPass, onFail);

      try { assert[m](...a), onPass(); } catch (e) { onFail(e); }
    }
  );

  let executionResult;
  try { executionResult = fn(ctx); }
  catch (e) {
    if (e instanceof BailError) return { passed, time: (performance.now() - start).toFixed(2) };
    return done = true, passed = false,
      console.log(`${nextIndent}not ok ${++count} - ${e.message || 'Test threw exception'} # time=${(performance.now() - start).toFixed(2)}ms`),
      this.yaml(e, nextIndent + '  '),
      { passed, time: (performance.now() - start).toFixed(2) };
  }

  if (executionResult instanceof Promise) {
    const timer = setTimeout(() => !done && (done = true, passed = false,
      console.log(`${nextIndent}not ok ${++count} - Test timeout after ${timeout}ms # time=${timeout}.00ms`),
      this.yaml(new Error(`Test timeout after ${timeout}ms`), nextIndent + '  '),
      console.log(`${nextIndent}1..${count}`)), timeout);

    return executionResult.then(() => (
      done = true, clearTimeout(timer), console.log(`${nextIndent}1..${count}`),
      { passed, time: (performance.now() - start).toFixed(2) }
    )).catch(e => {
      done = true, clearTimeout(timer);
      if (e instanceof BailError) return { passed, time: (performance.now() - start).toFixed(2) };
      return passed = false,
        console.log(`${nextIndent}not ok ${++count} - ${e.message || 'Test threw exception'} # time=${(performance.now() - start).toFixed(2)}ms`),
        this.yaml(e, nextIndent + '  '),
        { passed, time: (performance.now() - start).toFixed(2) };
    });
  }

  console.log(`${nextIndent}1..${count}`);
  return { passed, time: (performance.now() - start).toFixed(2) };
};

TAPRunner.prototype.yaml = function (e, sp) {
  const msg = e.message || '';
  console.log(`${sp}---`),
    msg.includes('\n')
      ? (console.log(`${sp}message: |`), msg.split('\n').forEach(l => console.log(`${sp}  ${l}`)))
      : console.log(`${sp}message: '${msg.replace(/'/g, '"')}'`),
    e.operator && console.log(`${sp}operator: ${e.operator}`),
    e.expected !== undefined && console.log(`${sp}expected: ${JSON.stringify(e.expected)}`),
    e.actual !== undefined && console.log(`${sp}actual: ${JSON.stringify(e.actual)}`);
  if (e.stack) {
    const st = e.stack.split('\n').slice(1).filter(l => l.includes(' at ') && !l.includes('node_modules/') && !l.includes('node:internal') && !l.includes('node:assert')).slice(0, 5);
    st.length && (console.log(`${sp}stack: |`), st.forEach(l => console.log(`${sp}  ${l}`)));
  }
  console.log(`${sp}...`);
};