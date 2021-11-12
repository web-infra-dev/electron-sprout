import { join, relative } from 'path';
import { existsSync, readJSONSync } from 'fs-extra';
import {
  DEFAULT_ELECTRON_MAIN_FOLDER,
  DEFAULT_ELECTRON_MAIN_DIST_FOLDER,
} from '../utils/paths';

/**
 * read user babel config and default config,
 * then write to /node_modules/.electron-main/babel.config.json
 * for babel to compile ts
 */

export const getProjectInfo = (options: {
  userProjectPath: string; // start folder
  mainProcessFolder?: string; // main entrance path relative start folder
}): {
  outDir: string;
  isTsProject: boolean;
} => {
  const { userProjectPath, mainProcessFolder = DEFAULT_ELECTRON_MAIN_FOLDER } =
    options;
  const userTsConfigFile = join(
    userProjectPath,
    mainProcessFolder,
    'tsconfig.json',
  );
  let electronMainDistFolder = DEFAULT_ELECTRON_MAIN_DIST_FOLDER;

  if (!existsSync(userTsConfigFile)) {
    // it means js project, compile folder default is electron
    return {
      outDir: DEFAULT_ELECTRON_MAIN_FOLDER,
      isTsProject: false,
    };
  }
  const config = readJSONSync(userTsConfigFile);
  if (config?.compilerOptions?.outDir) {
    electronMainDistFolder = config?.compilerOptions?.outDir;
  }
  return {
    outDir: relative(
      userProjectPath,
      join(DEFAULT_ELECTRON_MAIN_FOLDER, electronMainDistFolder),
    ),
    isTsProject: true,
  };
};
