/**
 * read user config
 */

import { cosmiconfigSync } from 'cosmiconfig';
import { UserConfig } from './interface';

export const DEFAULT_CONFIG_NAME = 'electron';
export const MODERN_CONFIG_NAME = 'modern';

export const readConfig = (projectPath: string) => {
  const defaultElectronConfig = doReadConfig(projectPath, DEFAULT_CONFIG_NAME);
  if (defaultElectronConfig) {
    return defaultElectronConfig as UserConfig;
  }
  const jupiterElectronConfig = doReadConfig(projectPath, MODERN_CONFIG_NAME);
  return (jupiterElectronConfig?.electron || {}) as UserConfig;
};

const doReadConfig = (projectPath: string, moduleName: string) => {
  const explorer = (_moduleName: string, _projectPath: string) =>
    cosmiconfigSync(moduleName, {
      stopDir: projectPath,
      searchPlaces: [
        `.${moduleName}rc`,
        `.${moduleName}rc.json`,
        `.${moduleName}rc.yaml`,
        `.${moduleName}rc.yml`,
        `.${moduleName}rc.js`,
        `${moduleName}.config.js`,
      ],
    });
  const searched = explorer(moduleName, projectPath).search(projectPath);
  return searched?.config || null;
};
