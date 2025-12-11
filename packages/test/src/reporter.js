let globalIndex = 0;

export function writeTest(result, level = 0) {
  writeResult(result, level, level === 0 ? ++globalIndex : null);
  if (result.children.length > 0) {
    writePlan(result.children.length, level + 1);
    let localIndex = 0;
    for (const child of result.children) writeTestWithIndex(child, level + 1, ++localIndex);
  }
}

export function resetIndex() { globalIndex = 0; }
export function writePlan(total, level) { console.log(`${indent(level)}1..${total}`); }

function writeTestWithIndex(result, level, localIndex) {
  writeResult(result, level, localIndex);
  if (result.children.length > 0) {
    writePlan(result.children.length, level + 1);
    let childLocalIndex = 0;
    for (const child of result.children) writeTestWithIndex(child, level + 1, ++childLocalIndex);
  }
}

function writeResult(result, level, index) {
  const status = result.skipped ? 'ok' : (result.passed ? 'ok' : 'not ok');
  const skip = result.skipped ? ' # SKIP' : '', duration = result.duration !== undefined ? ` (${parseFloat(result.duration.toFixed(2))}ms)` : '';

  console.log(`${indent(level)}${status} ${index} - ${result.name}${duration}${skip}`);

  !result.passed && !result.skipped && result.error && writeYAML(result.error, level);
}

function writeYAML(error, level) {
  const ind = indent(level);
  console.log(`${ind}  ---`);
  console.log(`${ind}  message: "${error.message}"`);
  console.log(`${ind}  severity: ${error.severity || 'fail'}`);
  error.expected !== undefined && console.log(`${ind}  expected: ${formatValue(error.expected)}`);
  error.actual !== undefined && console.log(`${ind}  actual: ${formatValue(error.actual)}`);
  error.location && console.log(`${ind}  location: ${error.location}`);
  console.log(`${ind}  ...`);
}

function indent(level) { return '    '.repeat(level); }
function formatValue(value) { return typeof value === 'string' ? `"${value}"` : JSON.stringify(value); }
