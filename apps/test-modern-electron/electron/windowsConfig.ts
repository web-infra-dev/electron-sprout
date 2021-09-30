import { join } from 'path';
import type { WindowConfig } from '@modern-js/runtime/electron-main';
// preload js for browserwindow to provide native apis for render-process
const PRELOAD_JS = join(
  __dirname,
  'preload',
  'browserWindow',
  process.env.NODE_ENV === 'development' ? 'index.dev.js' : 'index.js',
);

// windows config
export const windowsConfig: WindowConfig[] = [
  {
    name: 'main',
    options: {
      webPreferences: {
        nodeIntegration: true,
        preload: PRELOAD_JS,
        webviewTag: true,
        contextIsolation: false,
        enableRemoteModule: true,
      },
    },
  },
  {
    name: 'demo',
  },
  {
    name: 'test_create_window_with_config',
    options: {
      width: 100,
    },
  },
];
