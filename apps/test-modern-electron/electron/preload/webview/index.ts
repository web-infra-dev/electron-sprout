import {
  webviewPreloadApis,
  exposeInMainWorld,

} from '@modern-js/runtime/electron-webview';
import { remote } from 'electron';
import { testServices } from '@modern-js/electron-test/webview';

const { ...rest } = webviewPreloadApis;
export const apis = testServices({
  ...rest,

  getAppVersion: () => {
    return remote.app.getVersion();
  },
  registerServicesTwice: (msg: string, msg2: string) => {
    rest.registerServices({
      func1: () => {
        return msg;
      }
    })
    return rest.registerServices({
      func2: () => {
        return msg2;
      }
    })
  },
  listenMessage: (channel: string) => {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('listen message timeout'));
      }, 5000)
      const onMessage = rest.onMessage(channel);
      const listener = onMessage((data: any) => {
        listener.dispose();
        clearTimeout(timeout);
        resolve(data);
      })
    })
  },
});

exposeInMainWorld(apis);
