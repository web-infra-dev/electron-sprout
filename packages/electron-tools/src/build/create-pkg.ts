import { dirname, join } from 'path';
import { existsSync } from 'fs';
import { mkdirpSync, readJsonSync, writeJsonSync } from 'fs-extra';
import { cliLog } from '@modern-js/electron-log';
import { createStore } from '../utils/store';
import { APP_PACKAGE_JSON_FILE_PATH } from '../utils/paths';
import { readConfig } from '@/config';

const IGNORE_DEPENDENCIES: string[] = ['electron', 'electron-builder'];

// framework default version of @electron/remote
const DEFAULT_DEPENDENCES = {
  '@electron/remote': '^1.2.1',
};
// const DEV_DEPENDENCIES: string[] = ['electron', 'electron-builder'];

const filterPkgInfo = (pkg: any) => {
  const { scripts, jupiterSettings, dependencies, devDependencies, ...rest } =
    pkg;
  return rest;
};

const getDistPackageJsonPath = (userProjectPath: string) => {
  const config = readConfig(userProjectPath);
  const appPath = config?.builder?.baseConfig?.directories?.app || '';

  return appPath
    ? join(userProjectPath, appPath, 'package.json')
    : join(userProjectPath, APP_PACKAGE_JSON_FILE_PATH);
};

/**
 * create pkg with dependencies which found by babel in main process code
 */
export const createNodeModulesPkg = (options: {
  userProjectPath: string;
  externalDependencies?: Record<string, string>; // this used in framework
  ignoreDependencies?: string[];
}) => {
  const {
    userProjectPath,
    externalDependencies: _externalDependencies,
    ignoreDependencies = [],
  } = options;
  const searchedDependencies = Array.from(createStore());
  const pkg = readJsonSync(join(userProjectPath, 'package.json'));
  const userDependencies = Object.keys(pkg.dependencies || {});
  const userDevDependencies = Object.keys(pkg.devDependencies || {});

  // user defined dependencies
  const externalDependencies = pkg.externalDependencies || {};

  // depeences need to install and copy to electron app.
  const neededDependencies = {
    ...externalDependencies,
    ...DEFAULT_DEPENDENCES,
    ..._externalDependencies,
  };

  // dev dependencies define for pack, such as electron and electron-builder
  const devDependencies = {
    electron: pkg.devDependencies.electron,
    'electron-builder': pkg.devDependencies['electron-builder'],
  };

  // whether need to be installed.
  // @modernjs/electron-bridge/prelod -> @modernjs/electron-bridge, so we use x.includes(dep)
  const shouldInstall = (dep: string) => {
    const _dep = searchedDependencies.filter(x => x.includes(dep));
    return _dep.length > 0;
  };

  [userDevDependencies, userDependencies].forEach(dependencies => {
    dependencies.forEach(each => {
      const depVersion = pkg.dependencies[each] || pkg.devDependencies[each];
      if (
        shouldInstall(each) &&
        ![...IGNORE_DEPENDENCIES, ...ignoreDependencies].includes(each)
      ) {
        neededDependencies[each] = depVersion;
      }
    });
  });

  // create package.json for main process.
  const pkgFolder = dirname(APP_PACKAGE_JSON_FILE_PATH);
  if (!existsSync(pkgFolder)) {
    mkdirpSync(pkgFolder);
  }

  const distPackagejson = getDistPackageJsonPath(userProjectPath);
  cliLog.info('distPackagejson:', distPackagejson);
  writeJsonSync(
    distPackagejson,
    {
      ...filterPkgInfo(pkg),
      dependencies: neededDependencies,
      devDependencies,
    },
    {
      encoding: 'utf8',
      spaces: 2,
    },
  );
  console.log('created main process node_modules package.json file!');
};
