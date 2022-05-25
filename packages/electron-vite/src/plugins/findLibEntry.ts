import * as path from 'path';
import * as fs from 'fs';

export function findLibEntry(root: string, scope: string): string {
  for (const name of ['index', scope]) {
    for (const ext of ['js', 'ts', 'mjs', 'cjs']) {
      const entryFile = path.resolve(root, 'electron', scope, `${name}.${ext}`);
      if (fs.existsSync(entryFile)) {
        return entryFile;
      }
    }
  }
  return '';
}
