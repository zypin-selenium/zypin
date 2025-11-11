/**
 * Rule: export-pattern
 * Enforces export pattern:
 * - export const name = _name;
 * - function _name() {}
 *
 * Exceptions:
 * - export default
 * - export { ... } from '...' (re-exports)
 * - export const CONSTANT = 'value' (string/number constants)
 * - export { Class } (class exports)
 */

export default {
  meta: {
    type: 'problem',
    docs: {
      description: 'Enforce export const name = _name pattern',
      category: 'Best Practices',
    },
    messages: {
      invalidExportPattern:
        'Export must follow pattern: export const {{name}} = _{{name}};',
      missingImplementation:
        'Implementation function _{{name}} not found for export {{name}}',
      implementationNotFunction:
        '_{{name}} must be a function declaration, not {{type}}',
    },
    schema: [],
  },

  create(context) {
    const _sourceCode = context.sourceCode || context.getSourceCode();
    const exports = new Map(); // name -> node
    const implementations = new Map(); // _name -> node

    return {
      ExportNamedDeclaration(node) {
        // Skip re-exports: export { ... } from '...'
        if (node.source) return;

        // Handle: export const name = _name;
        if (node.declaration?.type === 'VariableDeclaration') {
          node.declaration.declarations.forEach(declarator => {
            const name = declarator.id?.name;
            const init = declarator.init;

            // Skip constants (UPPER_CASE)
            if (name && /^[A-Z_]+$/.test(name)) return;

            // Check pattern: export const name = _name;
            if (init?.type === 'Identifier') {
              const expectedImpl = `_${name}`;
              if (init.name !== expectedImpl) {
                context.report({
                  node: declarator,
                  messageId: 'invalidExportPattern',
                  data: { name },
                });
              } else {
                exports.set(name, declarator);
              }
            } else if (init?.type !== 'Literal') {
              // Allow: export const CONSTANT = 'value'
              context.report({
                node: declarator,
                messageId: 'invalidExportPattern',
                data: { name },
              });
            }
          });
        }

        // Catch: export function name() {} - NOT ALLOWED!
        if (node.declaration?.type === 'FunctionDeclaration') {
          const funcName = node.declaration.id?.name;
          if (funcName) {
            context.report({
              node: node.declaration,
              messageId: 'invalidExportPattern',
              data: { name: funcName },
            });
          }
        }

        // Allow: export { Class }
        if (node.specifiers?.length > 0 && !node.declaration) {
          // This is okay - class or re-export
          return;
        }
      },

      FunctionDeclaration(node) {
        const name = node.id?.name;
        if (name?.startsWith('_')) {
          implementations.set(name, node);
        }
      },

      'Program:exit'() {
        // Check all exports have corresponding implementations
        exports.forEach((exportNode, name) => {
          const implName = `_${name}`;
          const impl = implementations.get(implName);

          if (!impl) {
            context.report({
              node: exportNode,
              messageId: 'missingImplementation',
              data: { name },
            });
          }
        });
      },
    };
  },
};
