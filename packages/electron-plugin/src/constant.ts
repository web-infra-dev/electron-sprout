import { ENVS as _ENVS, ENV_NAME } from '@modern-js/electron-tools';

export const BUILD_MODE = {
  ELECTRON_MAIN: 'electron-main',
  ELECTRON_WEB: 'electron-web',
  WEB: 'web',
};

export enum PROCESS_TYPE {
  MAIN = 'main',
  RENDERER = 'renderer',
}

export const USER_CLI_COMMAND = {
  STOP_RENDERER_PROCESS: 'swp',
  STOP_MAIN_PROCESS: 'smp',
  RESTART_ELECTRON_MAIN_PROCESS: 'rsmp',
  RESTART_RENDERER_PROCESS: 'rswp',
};

export const ENVS = {
  IS_ELECTRON_COMMAND: 'IS_ELECTRON_COMMAND', // is start main process command
  MAIN_PROCESS_ENTRY_FILE: 'MAIN_PROCESS_ENTRY_FILE',
  BUILD_MODE: 'BUILD_MODE',
  ..._ENVS,
};

export { ENV_NAME };
