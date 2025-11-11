/**
 * Rule: function-naming
 * Enforces function naming conventions:
 * - Verb-first pattern: verb + [qualifier] + noun
 * - Max 3 parts (words)
 * - camelCase enforced by ESLint core camelcase rule
 *
 * Examples:
 * - scanConfigs ✓
 * - loadEnv ✓
 * - buildWeb ✓
 * - getUserFromDatabase ✗ (4 parts)
 *
 * Exceptions:
 * - Class methods
 * - Callbacks/arrow functions
 * - Test functions (describe, it, test, etc.)
 */

const COMMON_VERBS = [
  'add',
  'build',
  'calculate',
  'check',
  'copy',
  'create',
  'delete',
  'detect',
  'download',
  'execute',
  'fetch',
  'find',
  'format',
  'generate',
  'get',
  'handle',
  'init',
  'is',
  'load',
  'make',
  'parse',
  'process',
  'remove',
  'render',
  'resolve',
  'restore',
  'run',
  'save',
  'scan',
  'set',
  'spawn',
  'start',
  'stop',
  'update',
  'validate',
  'write',
];

function countParts(name) {
  // Remove leading underscore for internal functions
  const cleanName = name.startsWith('_') ? name.slice(1) : name;

  // Split camelCase into parts
  const parts = cleanName.split(/(?=[A-Z])/);
  return parts.length;
}

function startsWithVerb(name) {
  const cleanName = name.startsWith('_') ? name.slice(1) : name;
  const firstWord = cleanName.split(/(?=[A-Z])/)[0].toLowerCase();
  return COMMON_VERBS.includes(firstWord);
}

export default {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Enforce verb-first naming pattern and max 3 parts',
      category: 'Best Practices',
    },
    messages: {
      tooManyParts:
        'Function name "{{name}}" has {{count}} parts, max 3 allowed (verb + qualifier + noun)',
      mustStartWithVerb:
        'Function name "{{name}}" should start with a verb (e.g., get, set, create, build)',
    },
    schema: [],
  },

  create(context) {
    return {
      FunctionDeclaration(node) {
        const name = node.id?.name;
        if (!name) return;

        // Skip if inside class
        const parent = context.getAncestors?.()[context.getAncestors().length - 1];
        if (parent?.type === 'ClassBody') return;

        // Check max 3 parts
        const parts = countParts(name);
        if (parts > 3) {
          context.report({
            node: node.id,
            messageId: 'tooManyParts',
            data: { name, count: parts },
          });
        }

        // Check verb-first (only for exported/internal functions)
        if (name.startsWith('_') || node.parent?.type === 'ExportNamedDeclaration') {
          if (!startsWithVerb(name)) {
            context.report({
              node: node.id,
              messageId: 'mustStartWithVerb',
              data: { name },
            });
          }
        }
      },
    };
  },
};
