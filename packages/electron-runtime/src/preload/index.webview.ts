import { webviewBridge } from './webviewBridge';
import { exposeInMainWorld as doExposeInMainWorld } from './utils';

export type WebviewBridge = typeof webviewBridge;

// api in preload of webview
export const webviewPreloadApis = {
  ...webviewBridge,
};

const exposeInMainWorld = (apis: Record<string, unknown>) =>
  doExposeInMainWorld('webviewBridge', apis);

export { exposeInMainWorld };
