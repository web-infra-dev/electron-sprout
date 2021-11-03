import { createStore } from '../utils/store';

export default function () {
  const store = createStore();
  return {
    visitor: {
      ImportDeclaration(path: any) {
        if (path.get('source').isStringLiteral()) {
          const libName = path.get('source').node.value;
          store.add(libName);
        }
      },
    },
  };
}
