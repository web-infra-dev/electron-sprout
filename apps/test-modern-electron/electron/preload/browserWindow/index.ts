import { join } from 'path';
import {
  exposeInMainWorld,
  browserWindowPreloadApis,
} from '@modern-js/runtime/electron-render';
import { getCurrentWindow } from '@electron/remote';
import { testServices } from '@modern-js/electron-test/render';
import { IS_DEV } from '../../common/utils';

const { callMain, ...rest } = browserWindowPreloadApis;
export const apis = testServices({
  ...rest,
  callMain,
  startToUpdate: (url: string) => callMain('startToUpdate', url),
  openWindow: (winName: string) => callMain('openWindow', winName),
  openDevTools: (webviewId: string) => {
    const webview = rest.webviewService.getWebviewById(webviewId);
    webview?.openDevTools();
  },
  registWebviewServices: (msg: string) =>
    rest.webviewService.registerServices({
      func1: () => msg,
    }),
  getAppVersion: () => '13.1.9',
  getPageLocation: () => window.location.href,
  openInBrowser: (url: string) => callMain('openInBrowser', url),
  getWindowCount: () => callMain('getWindowCount'),
  getWebviewPreloadJs: () =>
    join(
      'file://',
      __dirname,
      '..',
      'webview',
      IS_DEV ? 'index.dev.js' : 'index.js',
    ),
  getCurrentWindowId: () => getCurrentWindow().id,
  listenWillClose: (data: string) =>
    new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('listen onClose timeout'));
      }, 5000);
      const listener = rest.winService.registerWillClose(() => {
        clearTimeout(timeout);
        resolve(data);
        listener.dispose();
      });
    }),
  listenBeforeClose: (state = false) =>
    new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('listen onClose timeout'));
      }, 5000);
      rest.winService.registerBeforeClose(() => {
        clearTimeout(timeout);
        resolve(true);
        return state;
      });
    }),
  listenWebviewMsg: (webviewId: string, channel: string) =>
    new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('listen message timeout'));
      }, 5000);
      const onMessage = rest.webviewService.onMessage(webviewId, channel);
      const listener = onMessage((data: any) => {
        listener.dispose();
        clearTimeout(timeout);
        resolve(data);
      });
    }),
  listenMessage: (channel: string) =>
    new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('listen message timeout'));
      }, 5000);
      const onMessage = rest.winService.onMessage(channel);
      const listener = onMessage((data: any) => {
        listener.dispose();
        clearTimeout(timeout);
        resolve(data);
      });
    }),
});

exposeInMainWorld(apis);
