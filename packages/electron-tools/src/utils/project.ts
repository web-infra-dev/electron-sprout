import { join } from 'path';
import { existsSync, readJSONSync } from 'fs-extra';

export const isModernJsMWA = (cwd: string) => {
  const pkgPath = join(cwd, 'package.json');
  if (!existsSync(pkgPath)) {
    return false;
  }
  const pkg = readJSONSync(pkgPath, { encoding: 'utf8' });
  return Boolean(pkg.devDependencies['@modern-js/app-tools']);
};

export const isTsProject = (cwd: string) => {
  const tsconfig = join(cwd, 'tsconfig.json');
  return existsSync(tsconfig);
};
