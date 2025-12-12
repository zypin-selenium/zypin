import assert from 'node:assert';
import { performance } from 'node:perf_hooks';

const tests = [];
/**
 * @typedef {(name: string, fn: TestFunction, options?: {skip?: boolean, timeout?: number}) => void} TestMethod
 * @typedef {(ctx: {test: TestMethod} & import('assert')) => void | Promise<void>} TestFunction
 * @param {string} n
 * @param {TestFunction} f
 * @param {{skip?: boolean, timeout?: number}} [o]
 */
export const test = (n, f, o) => tests.push({ n, f, o });
global.test = test;

let globalCount = 0, allPassed = true;

process.nextTick(async () => {
  if (!tests.length) return;
  for (const { n, f, o } of tests) {
    o?.skip ? console.log(`ok ${++globalCount} - ${n} # SKIP`) : (
      await (async () => {
        const r = new TAPRunner(), {passed, time} = await r.test(n, f, o);
        console.log(`${passed ? 'ok' : 'not ok'} ${++globalCount} - ${n} # time=${time}ms`),
        allPassed &&= passed;
      })()
    );
  }
  console.log(`1..${globalCount}`), process.exitCode = allPassed ? 0 : 1;
});

class TAPRunner {
  constructor(indent = '') { this.indent = indent; }

  async test(name, fn, options = {}) {
    if (options.skip) return {passed: true, time: '0.00'};

    const start = performance.now(), nextIndent = this.indent + '    ',
          timeout = options.timeout || 1800000, childQueue = [];
    let count = 0, passed = true, done = false, lastAssertEnd = start;

    console.log(`${this.indent}# Subtest: ${name}`);

    const ctx = { test: (n, f, o) => childQueue.push({n, f, o}) };

    Object.getOwnPropertyNames(assert).filter(m => typeof assert[m] === 'function' && m !== 'AssertionError').forEach(m =>
      ctx[m] = async (...a) => {
        if (done) return;
        const msg = (m === 'ok' || m === 'fail') ? (a[1] || m) : (a[2] || a[1] || m);
        try {
          await assert[m](...a);
          const now = performance.now(), time = Math.max(0.01, now - lastAssertEnd).toFixed(2);
          console.log(`${nextIndent}ok ${++count} - ${typeof msg === 'string' ? msg : m} # time=${time}ms`),
          lastAssertEnd = now;
        } catch (e) {
          const now = performance.now(), time = Math.max(0.01, now - lastAssertEnd).toFixed(2);
          console.log(`${nextIndent}not ok ${++count} - ${typeof msg === 'string' ? msg : m} # time=${time}ms`),
          this.yaml(e, nextIndent + '  '), passed = false, lastAssertEnd = now;
        }
      }
    );

    const timer = setTimeout(() => !done && (done = true, passed = false,
      console.log(`${nextIndent}not ok ${++count} - Test timeout after ${timeout}ms # time=${timeout}.00ms`),
      this.yaml(new Error(`Test timeout after ${timeout}ms`), nextIndent + '  '),
      console.log(`${nextIndent}1..${count}`)), timeout);

    try {
      await Promise.resolve(fn(ctx)), done = true, clearTimeout(timer);
    } catch (e) {
      done = true, clearTimeout(timer), passed = false,
      console.log(`${nextIndent}not ok ${++count} - ${e.message || 'Test threw exception'} # time=${(performance.now() - start).toFixed(2)}ms`),
      this.yaml(e, nextIndent + '  ');
    }
    !done && (done = true, clearTimeout(timer));

    for (const {n, f, o} of childQueue) {
      const r = new TAPRunner(nextIndent), {passed: ok, time} = await r.test(n, f, o);
      console.log(`${nextIndent}${ok ? 'ok' : 'not ok'} ${++count} - ${n} # time=${time}ms`), passed &&= ok;
    }

    return console.log(`${nextIndent}1..${count}`), {passed, time: (performance.now() - start).toFixed(2)};
  }

  yaml(e, sp) {
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
  }
}