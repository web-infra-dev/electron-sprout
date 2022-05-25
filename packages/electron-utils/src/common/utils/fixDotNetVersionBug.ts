import * as path from 'path';
import { app } from 'electron';
import * as regedit from '../libs/regedit';

const IS_DEV = process.env.NODE_ENV === 'development';
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
      console.info('regedit path', p);
      const res = regedit.setExternalVBSLocation(p);
      console.info('regedit.setExternalVBSLocation', res);
    }
    const key = 'HKLM\\SOFTWARE\\Microsoft\\NET Framework Setup\\NDP\\v4\\Full';
    try {
      const data = regedit.listSync([key]);
      if (data && data[key]) {
        const version = data[key].values.Version.value;
        if (version >= '4.7.1') {
          console.info('regedit version success:', version);
          return;
        }
        console.info('regedit version failed:', version);
      }
      app.disableHardwareAcceleration();
    } catch (e) {
      console.info('regedit failed:', e);
      app.disableHardwareAcceleration();
    }
  }
};
