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
    const constantIndices = [];
    const exportIndices = [];
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
        // This is a standalone constant (not part of export)
        constantIndices.push(index);
      } else if (node.type === 'ExportNamedDeclaration') {
        // Track ALL exports (with or without declaration)
        exportIndices.push(index);
      } else if (
        node.type === 'FunctionDeclaration' &&
        node.id?.name?.startsWith('_')
      ) {
        if (firstImplementationIndex === -1) firstImplementationIndex = index;
      } else if (node.type === 'ExportDefaultDeclaration') {
        exportIndices.push(index);
      } else if (node.type === 'ExportAllDeclaration') {
        exportIndices.push(index);
      }
    });

    // Check for // Implementation comment
    const comments = sourceCode.getAllComments();
    comments.forEach((_comment, index) => {
      if (
        _comment.type === 'Line' &&
        _comment.value.trim() === 'Implementation'
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

        // Check ALL constants are after imports and before exports
        if (constantIndices.length > 0) {
          const firstExportIndex = exportIndices.length > 0 ? Math.min(...exportIndices) : Infinity;

          constantIndices.forEach(constIndex => {
            // Constant must be after last import
            if (lastImportIndex > -1 && constIndex < lastImportIndex) {
              context.report({
                node: tokens[constIndex],
                messageId: 'constantsAfterImports',
              });
            }
            // Constant must be before first export
            if (constIndex > firstExportIndex) {
              context.report({
                node: tokens[constIndex],
                messageId: 'constantsAfterImports',
              });
            }
          });
        }

        // Check ALL exports are before implementation
        if (exportIndices.length > 0 && firstImplementationIndex > -1) {
          exportIndices.forEach(exportIndex => {
            if (exportIndex > firstImplementationIndex) {
              context.report({
                node: tokens[exportIndex],
                messageId: 'exportsBeforeImplementation',
              });
            }
          });
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
