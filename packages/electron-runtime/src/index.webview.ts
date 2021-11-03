import { getGlobal } from '@electron/remote';

export * from './preload/index.webview';
export * from './services/index.webview';
export * from './common';

export { default } from './services/index.webview';

const APP_ROOT = getGlobal('electronCoreObj').appRoot;

export { APP_ROOT };
