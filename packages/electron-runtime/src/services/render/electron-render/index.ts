import { ipcRenderer } from 'electron';
import { Bridge } from './bridge';
import ServiceManager from './serviceManager';
import { Client } from '@/core/base/parts/ipc/electron-browser/ipc.electron-browser';
import { IPC_EVENTS } from '@/common/constants/events';

const mainProcessConnection: Client = new Client();

const bridge = new Bridge(mainProcessConnection);

const serviceManager = new ServiceManager(mainProcessConnection);

export const winService = serviceManager.getWindowsService();
export const webviewService = serviceManager.getWebviewService();
export const updateService = serviceManager.getUpdateService();
export const lifecycleService = serviceManager.getLifecycleService();

// webviewbridge can't be export from here, because if we use webviewBridge in webview, it will instance winService
// and it will connect to main process

const callMain = (funcName: string, ...args: any[]) =>
  bridge.callMain(funcName, ...args);

const APP_ROOT = ipcRenderer.sendSync(IPC_EVENTS.GET_APP_ROOT);

export { APP_ROOT, bridge, callMain, serviceManager };
