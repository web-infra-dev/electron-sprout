// replace electron-bridge npm package.json
// should include type defination and api

export type {
  IUpdateProgressInfo,
  Event,
  CloseReason,
} from '@modern-js/electron-runtime';
declare global {
  interface Window {
    bridge: import('@modern-js/electron-runtime').BrowserWindowApis;
    webviewBridge: import('@modern-js/electron-runtime').WebviewApis;
  }
}

const { bridge, webviewBridge } = window;
export { webviewBridge };
export default bridge;
