import * as path from 'path';
import * as fs from 'fs';

export function findInput(root: string, scope = 'src'): string {
  const rendererDir = path.resolve(root, scope, 'index.html');
  if (fs.existsSync(rendererDir)) {
    return rendererDir;
  }
  return '';
}
