import { existsSync, readJSONSync } from 'fs-extra';
import {join} from 'path';

export const isModernJsMWA = (cwd: string) => {
  const pkgPath = join(cwd, 'package.json');
  if (!existsSync(pkgPath)) {
    return false;
  }
  const pkg = readJSONSync(pkgPath, { encoding: 'utf8' })
  return Boolean(pkg.devDependencies['@modern-js/app-tools']);
}
