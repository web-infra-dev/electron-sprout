/* eslint-disable react-hooks/rules-of-hooks */
import { createPlugin, useAppContext } from '@modern-js/core';
import {
  registerBuildAppCmd,
  registerBuildRendererCmd,
  registerBuildMainCmd,
  registerPackCmd,
} from './build-or-pack';
import { ENVS } from './constant';
import {
  execDevMain,
  registerDevMainCmd,
  registerDevRenderCmd,
  registerDevElectronCmd,
} from './dev';
import { handleExportUtils } from './export-utils';
import { getBuildMode, getConfigByBuildMode } from './get-config-by-build-mode';
import { ExportsUtils, getImportAlias } from './get-import-alias';
import { pluginConfig } from './plugin-config';

export default createPlugin(
  () => {
    let exportsUtils: ExportsUtils | null = null;
    return {
      commands({ program }) {
        [
          registerDevRenderCmd,
          registerDevMainCmd,
          registerBuildRendererCmd,
          registerDevElectronCmd,
          registerBuildMainCmd,
          registerBuildAppCmd,
          registerPackCmd,
        ].forEach(registerCmd => registerCmd(program));
      },
      afterDev() {
        if (process.env[ENVS.IS_ELECTRON_COMMAND]) {
          execDevMain(process.env[ENVS.MAIN_PROCESS_ENTRY_FILE]);
          delete process.env[ENVS.IS_ELECTRON_COMMAND];
        }
      },
      validateSchema() {
        return [
          {
            target: 'electron',
            schema: pluginConfig,
          },
        ];
      },
      config() {
        // config is running before command, so need to set BUILD_MODE here
        process.env.BUILD_MODE = getBuildMode();
        const { value: appContext } = useAppContext();
        const buildConfig = getConfigByBuildMode(appContext) || {};
        const aliasConfig = getImportAlias(appContext);
        exportsUtils = aliasConfig.utils;
        return {
          ...buildConfig,
          ...aliasConfig.config,
        };
      },
      modifyEntryImports() {
        handleExportUtils(exportsUtils);
      },
    };
  },
  {
    name: '@modern-js/plugin-electron',
  },
);
