let store: Set<string> | null = null;

export const createStore = (): Set<string> => {
  if (store) {
    return store;
  }

  store = new Set<string>();
  return store;
};
