/**
 * it seems that this shouldn't appeare here. because it only for modernjs mwa.
 * need to improve
 * TODO: @pikun
 */

import { types, NodePath } from '@babel/core';
import { ENVS } from '../utils/constant';

export type ImportStyleType = 'source-code' | 'compiled-code';
export interface IImportPathOpts {
  appDirectory: string;
  importStyle?: ImportStyleType;
}

// Allow to modify package names via env variables
const MODERN_JS_NAME =
  process.env[ENVS.ELECTRON_RUNTIME_PKG_NAME] || '@modern-js/runtime';
const ELECTRON_PLUGIN_NAME =
  process.env[ENVS.ELECTRON_PLUGIN_PKG_NAME] || '@modern-js/plugin-electron';

// preload may have bridge or webview or render
const INNER_PKGS_MAP = {
  ELECTRON_TEST: `${MODERN_JS_NAME}/electron-test`,
  ELECTRON_TEST_MAIN: `${MODERN_JS_NAME}/electron-test/main`,
  ELECTRON_TEST_RENDER: `${MODERN_JS_NAME}/electron-test/render`,
  ELECTRON_TEST_WEBVIEW: `${MODERN_JS_NAME}/electron-test/webivew`,
  ELECTRON_MAIN: `${MODERN_JS_NAME}/electron-main`,
  ELECTRON_BRIDGE: `${MODERN_JS_NAME}/electron-bridge`,
  ELECTRON_WEBVIEW: `${MODERN_JS_NAME}/electron-webview`,
  ELECTRON_RENDER: `${MODERN_JS_NAME}/electron-render`,
};

const INNER_PKGS = [
  INNER_PKGS_MAP.ELECTRON_RENDER,
  INNER_PKGS_MAP.ELECTRON_MAIN,
  INNER_PKGS_MAP.ELECTRON_TEST,
  INNER_PKGS_MAP.ELECTRON_BRIDGE,
  INNER_PKGS_MAP.ELECTRON_WEBVIEW,
  INNER_PKGS_MAP.ELECTRON_TEST_MAIN,
  INNER_PKGS_MAP.ELECTRON_TEST_RENDER,
  INNER_PKGS_MAP.ELECTRON_TEST_WEBVIEW,
];

const getReplaceImportName = (importName: string) => {
  switch (importName) {
    case INNER_PKGS_MAP.ELECTRON_BRIDGE:
      return `${ELECTRON_PLUGIN_NAME}/bridge`;
    case INNER_PKGS_MAP.ELECTRON_MAIN:
      return `${ELECTRON_PLUGIN_NAME}/main`;
    case INNER_PKGS_MAP.ELECTRON_RENDER:
      return `${ELECTRON_PLUGIN_NAME}/render`;
    case INNER_PKGS_MAP.ELECTRON_WEBVIEW:
      return `${ELECTRON_PLUGIN_NAME}/webview`;
    case INNER_PKGS_MAP.ELECTRON_TEST:
      return `${ELECTRON_PLUGIN_NAME}/test`;
    case INNER_PKGS_MAP.ELECTRON_TEST_MAIN:
      return `${ELECTRON_PLUGIN_NAME}/test.main`;
    case INNER_PKGS_MAP.ELECTRON_TEST_RENDER:
      return `${ELECTRON_PLUGIN_NAME}/test.render`;
    case INNER_PKGS_MAP.ELECTRON_TEST_WEBVIEW:
      return `${ELECTRON_PLUGIN_NAME}/test.webview`;
    default:
      return importName;
  }
};

export default function () {
  return {
    visitor: {
      ImportDeclaration({ node }: NodePath<types.ImportDeclaration>) {
        const { source } = node;
        const importName = source?.value ? source.value : undefined;
        const isCorePkgs = (pkgName: string) => {
          const result = INNER_PKGS.find(x => pkgName === x);
          return Boolean(result);
        };
        if (importName && isCorePkgs(importName)) {
          node.source.value = getReplaceImportName(importName);
        }
      },
    },
  };
}
