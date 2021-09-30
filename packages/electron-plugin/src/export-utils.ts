import { ExportsUtils } from './get-import-alias';

export const handleExportUtils = (exportsUtils: ExportsUtils | null) => {
  exportsUtils?.bridgeExportsUtils.addExport(`
          export { webviewBridge } from '@modern-js/plugin-electron/bridge';
          export { default } from '@modern-js/plugin-electron/bridge';
        `);
  exportsUtils?.mainExportsUtils.addExport(`
          export * from '@modern-js/plugin-electron/main';
          export { default } from '@modern-js/plugin-electron/main';
        `);
  exportsUtils?.renderExportsUtils.addExport(`
          export * from '@modern-js/plugin-electron/render';
        `);
  exportsUtils?.webviewExportsUtils.addExport(`
          export * from '@modern-js/plugin-electron/webview';
          export { default } from '@modern-js/plugin-electron/webview';
        `);
  exportsUtils?.toolsExportsUtils.addExport(`
          export * from '@modern-js/plugin-electron/tools';
        `);
  exportsUtils?.testExportsUtils.addExport(`
          module.exports = {
            default: require('@modern-js/plugin-electron/test').default,
            ...require('@modern-js/plugin-electron/test')
          }
        `);
  exportsUtils?.testMainExportsUtils.addExport(`
          module.exports = require('@modern-js/plugin-electron/test.main');
        `);
  exportsUtils?.testRenderExportsUtils.addExport(`
          module.exports = require('@modern-js/plugin-electron/test.render');
        `);
  exportsUtils?.testWebviewExportsUtils.addExport(`
          module.exports = require('@modern-js/plugin-electron/test.webview');
          module.exports = {
            default: require('@modern-js/plugin-electron/test.webview').default,
            ...require('@modern-js/plugin-electron/test.webview')
          }
        `);
};
