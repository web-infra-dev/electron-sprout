/**
 * read user config
 */

import { cosmiconfigSync, OptionsSync, defaultLoaders } from 'cosmiconfig';
import { TypeScriptLoader } from "cosmiconfig-typescript-loader";
import { UserConfig } from './interface';

export const DEFAULT_CONFIG_NAME = 'electron';
export const MODERN_CONFIG_NAME = 'modern';

export const readConfig = (projectPath: string) => {
  const defaultElectronConfig = doReadConfig(projectPath, DEFAULT_CONFIG_NAME);
  if (defaultElectronConfig) {
    return defaultElectronConfig as UserConfig;
  }
  const jupiterElectronTsConfig = doReadConfig(projectPath, MODERN_CONFIG_NAME, true);
  if (jupiterElectronTsConfig) {
    return (jupiterElectronTsConfig?.electron || {}) as UserConfig;
  }
  const jupiterElectronConfig = doReadConfig(projectPath, MODERN_CONFIG_NAME);
  return (jupiterElectronConfig?.electron || {}) as UserConfig;
};

const doReadConfig = (projectPath: string, moduleName: string, isTs?: boolean) => {
  let defaultCosmiconfig: OptionsSync = {
    stopDir: projectPath,
    searchPlaces: [
      `.${moduleName}rc`,
      `.${moduleName}rc.json`,
      `.${moduleName}rc.yaml`,
      `.${moduleName}rc.yml`,
      `.${moduleName}rc.js`,
      `${moduleName}.config.js`,
    ]
  }

  if (isTs) {
    defaultCosmiconfig.loaders = {
      ...defaultLoaders,
      ".ts": TypeScriptLoader({
        transpileOnly: true,
        emit: false,
        compilerOptions: {
          sourceMap: false,
        }
      })
    }
  }
  const explorer = cosmiconfigSync(moduleName, defaultCosmiconfig);
  if (isTs) {
    const loaded = explorer.load(`${moduleName}.config.ts`);
    return loaded?.config || null;
  }
  const searched = explorer.search(projectPath);
  return searched?.config || null;
};
