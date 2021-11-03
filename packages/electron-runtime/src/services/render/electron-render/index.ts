import { getGlobal, getCurrentWindow } from '@electron/remote';

import { Bridge } from './bridge';
import ServiceManager from './serviceManager';
import { Client } from '@/core/base/parts/ipc/electron-browser/ipc.electron-browser';
import { getConnectionId, CONNECTION_TARGET } from '@/common/utils/ipc';

const CURRENT_WIN_ID = getCurrentWindow().id;

const mainProcessConnection: Client = new Client(
  getConnectionId(CONNECTION_TARGET.BROWSER_WINDOW, `${CURRENT_WIN_ID}`),
);

const APP_ROOT = getGlobal('electronCoreObj').appRoot;

const bridge = new Bridge(mainProcessConnection);

const serviceManager = new ServiceManager(
  mainProcessConnection,
  CURRENT_WIN_ID,
);

export const winService = serviceManager.getWindowsService();
export const webviewService = serviceManager.getWebviewService();
export const updateService = serviceManager.getUpdateService();
export const lifecycleService = serviceManager.getLifecycleService();

// webviewbridge can't be export from here, because if we use webviewBridge in webview, it will instance winService
// and it will connect to main process

const callMain = (funcName: string, ...args: any[]) =>
  bridge.callMain(funcName, ...args);

export { APP_ROOT, bridge, callMain, serviceManager };
