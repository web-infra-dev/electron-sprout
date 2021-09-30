import { join } from 'path';

// babel compile default output folder
// relative to userProject folder
const DEFAULT_ELECTRON_MAIN_DIST_FOLDER = join('dist', 'electron');

// default electron main process code folder
// relative to userProject folder
const DEFAULT_ELECTRON_MAIN_FOLDER = 'electron';

// electron main entrance file path
// relative to userProject folder
const getElectronMainEntryPath = (isTsProject: boolean) =>
  process.env.MAIN_ENTRY_FILE ||
  join(DEFAULT_ELECTRON_MAIN_FOLDER, isTsProject ? 'main.ts' : 'main.js');

// package.json needed in app
const APP_PACKAGE_JSON_FILE_PATH = join('dist', 'package.json');

export {
  DEFAULT_ELECTRON_MAIN_FOLDER,
  getElectronMainEntryPath,
  APP_PACKAGE_JSON_FILE_PATH,
  DEFAULT_ELECTRON_MAIN_DIST_FOLDER,
};
