import { ipcRenderer } from 'electron';
import { IPC_EVENTS } from './common/constants/events';

export * from './preload/index.webview';
export * from './services/index.webview';
export * from './common';

const APP_ROOT = ipcRenderer.sendSync(IPC_EVENTS.GET_APP_ROOT);

export { default } from './services/index.webview';

export { APP_ROOT };
