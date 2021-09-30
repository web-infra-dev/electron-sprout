import { join } from 'path';
import {
  exposeInMainWorld,
  browserWindowPreloadApis,
} from '@modern-js/runtime/electron-render';
import { app, getCurrentWindow } from '@electron/remote';
import { testServices } from '@modern-js/electron-test/render';
import { IS_DEV } from '../../common/utils';

const { callMain, ...rest } = browserWindowPreloadApis;
export const apis = testServices({
  ...rest,
  callMain,

  startToUpdate: (url: string) => {
    return callMain('startToUpdate', url);
  },

  openWindow: (winName: string) => {
    return callMain('openWindow', winName);
  },
  openDevTools: (webviewId: string) => {
    const webview = rest.webviewService.getWebviewById(webviewId);
    webview?.openDevTools();
  },
  registWebviewServices: (msg: string) => {
    return rest.webviewService.registerServices({
      func1: () => {
        return msg;
      },
    });
  },
  getAppVersion: () => {
    return app.getVersion();
  },
  getPageLocation: () => {
    console.log('getPageLocation');
    return window.location.href;
  },
  openInBrowser: (url: string) => {
    return callMain('openInBrowser', url);
  },
  getWindowCount: () => {
    return callMain('getWindowCount');
  },
  getWebviewPreloadJs: () => {
    return join(
      'file://',
      __dirname,
      '..',
      'webview',
      IS_DEV ? 'index.dev.js' : 'index.js',
    );
  },
  getCurrentWindowId: () => {
    return getCurrentWindow().id;
  },
  listenWillClose: (data: string) => {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('listen onClose timeout'));
      }, 5000);
      const listener = rest.winService.registerWillClose(() => {
        clearTimeout(timeout);
        console.log('data:', data);
        resolve(data);
        listener.dispose();
      });
    });
  },
  listenBeforeClose: (state = false) => {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('listen onClose timeout'));
      }, 5000);
      rest.winService.registerBeforeClose(() => {
        clearTimeout(timeout);
        resolve(true);
        return state;
      });
    });
  },
  listenWebviewMsg: (webviewId: string, channel: string) => {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('listen message timeout'));
      }, 5000);
      const onMessage = rest.webviewService.onMessage(webviewId, channel);
      const listener = onMessage((data: any) => {
        listener.dispose();
        clearTimeout(timeout);
        resolve(data);
      });
    });
  },
  listenMessage: (channel: string) => {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('listen message timeout'));
      }, 5000);
      const onMessage = rest.winService.onMessage(channel);
      const listener = onMessage((data: any) => {
        listener.dispose();
        clearTimeout(timeout);
        resolve(data);
      });
    });
  },
});

exposeInMainWorld(apis);
