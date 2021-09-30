import '@modern-js/electron-runtime';

declare module '@modern-js/electron-runtime' {
  export type BrowserWindowApis = typeof import('../electron/preload/browserWindow').apis;
  export type WebviewApis = typeof import('../electron/preload/webview').apis;
}

