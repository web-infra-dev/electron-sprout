import * as path from 'path';
import { mainLog } from '@modern-js/electron-log';
import { app } from 'electron';
import * as regedit from '../libs/regedit';
import { IS_DEV } from '../constants/constants';

export const fixDotNetVersionBug = () => {
  if (process.platform === 'win32') {
    if (!IS_DEV) {
      const p = path.join(
        path.dirname(app.getAppPath()),
        'node_modules',
        '@modern-js',
        'electron-runtime',
        'dist',
        'js',
        'node',
        'common',
        'libs',
        'regedit',
        'vbs',
      );
      mainLog.info('regedit path', p);
      const res = regedit.setExternalVBSLocation(p);
      mainLog.info('regedit.setExternalVBSLocation', res);
    }
    const key = 'HKLM\\SOFTWARE\\Microsoft\\NET Framework Setup\\NDP\\v4\\Full';
    try {
      const data = regedit.listSync([key]);
      if (data && data[key]) {
        const version = data[key].values.Version.value;
        if (version >= '4.7.1') {
          mainLog.info('regedit version success:', version);
          return;
        }
        mainLog.info('regedit version failed:', version);
      }
      app.disableHardwareAcceleration();
    } catch (e) {
      mainLog.info('regedit failed:', e);
      app.disableHardwareAcceleration();
    }
  }
};
