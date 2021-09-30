import type { IAppContext } from '@modern-js/core';
import { createRuntimeExportsUtils } from '@modern-js/utils';

export type ExportsUtil = {
  addExport: (statement: string) => void;
  getPath: () => any;
};

export type ExportsUtils = {
  renderExportsUtils: ExportsUtil;
  webviewExportsUtils: ExportsUtil;
  mainExportsUtils: ExportsUtil;
  bridgeExportsUtils: ExportsUtil;
  toolsExportsUtils: ExportsUtil;
  testExportsUtils: ExportsUtil;
  testMainExportsUtils: ExportsUtil;
  testRenderExportsUtils: ExportsUtil;
  testWebviewExportsUtils: ExportsUtil;
};

export const getImportAlias = (appContext: IAppContext) => {
  const renderExportsUtils = createRuntimeExportsUtils(
    appContext.internalDirectory,
    'render',
  );
  const webviewExportsUtils = createRuntimeExportsUtils(
    appContext.internalDirectory,
    'webview',
  );
  const mainExportsUtils = createRuntimeExportsUtils(
    appContext.internalDirectory,
    'main',
  );

  const bridgeExportsUtils = createRuntimeExportsUtils(
    appContext.internalDirectory,
    'bridge',
  );
  const toolsExportsUtils = createRuntimeExportsUtils(
    appContext.internalDirectory,
    'tools',
  );

  const testExportsUtils = createRuntimeExportsUtils(
    appContext.internalDirectory,
    'test',
  );
  const testMainExportsUtils = createRuntimeExportsUtils(
    appContext.internalDirectory,
    'test.main',
  );
  const testRenderExportsUtils = createRuntimeExportsUtils(
    appContext.internalDirectory,
    'test.render',
  );
  const testWebviewExportsUtils = createRuntimeExportsUtils(
    appContext.internalDirectory,
    'test.webview',
  );
  return {
    utils: {
      renderExportsUtils,
      mainExportsUtils,
      webviewExportsUtils,
      bridgeExportsUtils,
      testWebviewExportsUtils,
      testExportsUtils,
      testMainExportsUtils,
      testRenderExportsUtils,
      toolsExportsUtils,
    },
    config: {
      source: {
        alias: {
          '@modern-js/runtime/electron-render': renderExportsUtils.getPath(),
          '@modern-js/runtime/electron-main': mainExportsUtils.getPath(),
          '@modern-js/runtime/electron-bridge': bridgeExportsUtils.getPath(),
          '@modern-js/runtime/electron-webview': webviewExportsUtils.getPath(),
          '@modern-js/runtime/electron-tools': toolsExportsUtils.getPath(),
          '@modern-js/runtime/electron-test': testExportsUtils.getPath(),
          '@modern-js/runtime/electron-test/render':
            testRenderExportsUtils.getPath(),
          '@modern-js/runtime/electron-test/main':
            testMainExportsUtils.getPath(),
          '@modern-js/runtime/electron-test/webview':
            testWebviewExportsUtils.getPath(),
        },
      },
    },
  };
};
