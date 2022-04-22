import type { Configuration } from 'webpack';
import type { IAppContext } from '@modern-js/core';
import { BUILD_MODE, ENV_NAME } from './constant';

const getDevOptions = (isDev: boolean, port: number) => {
  // solve the problem of sources loading when using file protocal in dev.
  const devOptions = isDev
    ? {
        dev: {
          assetPrefix: `http://localhost:${port}/`,
        },
      }
    : {};
  return devOptions;
};

// this is a hack way
export const getBuildMode = () => {
  if (process.argv.includes(BUILD_MODE.ELECTRON_WEB)) {
    return BUILD_MODE.ELECTRON_WEB;
  }
  if (process.argv.includes(BUILD_MODE.ELECTRON_MAIN)) {
    return BUILD_MODE.ELECTRON_MAIN;
  }
  return process.env.BUILD_MODE || BUILD_MODE.WEB;
};

// only support fileProtocol in dev with all entries. can't define it by entry.
export const getConfigByBuildMode = (appContext: IAppContext) => {
  const isDev = process.env.NODE_ENV === ENV_NAME.DEV;
  const port = appContext?.port || 8080;
  const baseElectronConfig = {
    ...getDevOptions(isDev, port),
  };

  switch (getBuildMode()) {
    // in this case, window should open nodeIntegration = true
    case BUILD_MODE.ELECTRON_WEB:
      return {
        ...baseElectronConfig,
        output: {
          // disableNodePolyfill for get process.platform
          disableNodePolyfill: true,
        },
        tools: {
          webpack: (_config: Configuration, { chain }: any) => {
            chain.target('electron-renderer');
            chain.node.set('__dirname', false);
            chain.node.set('__filename', false);
          },
        },
      };
    default:
      return {
        ...baseElectronConfig,
      };
  }
};
