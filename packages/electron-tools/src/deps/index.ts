// install dependencies by package.json in node_modules/.electron-main
// mainly for main process to use in packed electron app.

import { join, dirname } from 'path';
import { existsSync } from 'fs-extra';
import { getArchAndPlatform } from '../utils/platform';
import { spawnPromise } from '../utils/spawn';
import { getElectronBuilderBin, YARN_BIN } from '../utils/bins';
import { ENV_NAME } from '@/utils';

export const installDep = (compileFolder: string, installCmd?: string) => {
  const pkgFile = join(compileFolder, 'package.json');
  if (!existsSync(pkgFile)) {
    throw Error(
      `the package.json of main process node_modules isn't exist, please run build to build main process before pack!`,
    );
  }
  return spawnPromise({
    processEnv: {
      ...process.env,
      NODE_ENV: ENV_NAME.PROD,
    },
    cwd: dirname(pkgFile),
    cmd: installCmd || YARN_BIN,
    params: ['install', '--production'],
    stdio: 'inherit',
  });
};

export const compileDep = (compileFolder: string) => {
  const electronBuilderBin = getElectronBuilderBin();
  const pcInfo = getArchAndPlatform();
  return spawnPromise({
    cmd: electronBuilderBin,
    cwd: compileFolder,
    processEnv: {
      ...process.env,
      NODE_ENV: ENV_NAME.PROD,
    },
    params: [
      'install-app-deps',
      '--arch',
      pcInfo.arch,
      '--platform',
      pcInfo.platform,
    ],
  });
};
