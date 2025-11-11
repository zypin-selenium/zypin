import exportPattern from './rules/export-pattern.js';
import fileStructureOrder from './rules/file-structure-order.js';
import functionNaming from './rules/function-naming.js';

export default {
  rules: {
    'file-structure-order': fileStructureOrder,
    'export-pattern': exportPattern,
    'function-naming': functionNaming,
  },
};
