/**
 * Rule: file-structure-order
 * Enforces coding standards file structure:
 * 1. Imports
 * 2. Constants (UPPER_CASE)
 * 3. Exports (no implementation)
 * 4. // Implementation comment
 * 5. Implementation functions (with _ prefix)
 */

export default {
  meta: {
    type: 'layout',
    docs: {
      description: 'Enforce file structure order per coding standards',
      category: 'Stylistic Issues',
    },
    messages: {
      importsFirst: 'Imports must come before all other statements',
      constantsAfterImports: 'Constants (UPPER_CASE) must come after imports, before exports',
      exportsBeforeImplementation: 'Exports must come before implementation functions',
      implementationCommentRequired: '"// Implementation" comment is required before implementation functions',
      implementationLast: 'Implementation functions must come after exports',
    },
    schema: [],
  },

  create(context) {
    const sourceCode = context.sourceCode || context.getSourceCode();
    const tokens = sourceCode.ast.body;

    let lastImportIndex = -1;
    let firstConstantIndex = -1;
    let firstExportIndex = -1;
    let implementationCommentIndex = -1;
    let firstImplementationIndex = -1;

    // Find sections
    tokens.forEach((node, index) => {
      if (node.type === 'ImportDeclaration') {
        lastImportIndex = index;
      } else if (
        node.type === 'VariableDeclaration' &&
        node.declarations[0]?.id?.name &&
        /^[A-Z_]+$/.test(node.declarations[0].id.name)
      ) {
        if (firstConstantIndex === -1) firstConstantIndex = index;
      } else if (node.type === 'ExportNamedDeclaration' && !node.declaration) {
        if (firstExportIndex === -1) firstExportIndex = index;
      } else if (
        node.type === 'FunctionDeclaration' &&
        node.id?.name?.startsWith('_')
      ) {
        if (firstImplementationIndex === -1) firstImplementationIndex = index;
      } else if (node.type === 'ExportDefaultDeclaration') {
        if (firstExportIndex === -1) firstExportIndex = index;
      } else if (node.type === 'ExportAllDeclaration') {
        if (firstExportIndex === -1) firstExportIndex = index;
      }
    });

    // Check for // Implementation comment
    const comments = sourceCode.getAllComments();
    comments.forEach((comment, index) => {
      if (
        comment.type === 'Line' &&
        comment.value.trim() === 'Implementation'
      ) {
        implementationCommentIndex = index;
      }
    });

    // Validate order
    return {
      Program(_node) {
        // Check imports are first
        if (lastImportIndex > -1) {
          tokens.forEach((token, index) => {
            if (
              index < lastImportIndex &&
              token.type !== 'ImportDeclaration'
            ) {
              context.report({
                node: token,
                messageId: 'importsFirst',
              });
            }
          });
        }

        // Check constants after imports
        if (firstConstantIndex > -1 && lastImportIndex > -1) {
          if (firstConstantIndex < lastImportIndex) {
            context.report({
              node: tokens[firstConstantIndex],
              messageId: 'constantsAfterImports',
            });
          }
        }

        // Check exports before implementation
        if (firstExportIndex > -1 && firstImplementationIndex > -1) {
          if (firstExportIndex > firstImplementationIndex) {
            context.report({
              node: tokens[firstExportIndex],
              messageId: 'exportsBeforeImplementation',
            });
          }
        }

        // Check implementation comment exists if there are implementation functions
        if (firstImplementationIndex > -1 && implementationCommentIndex === -1) {
          context.report({
            node: tokens[firstImplementationIndex],
            messageId: 'implementationCommentRequired',
          });
        }
      },
    };
  },
};
