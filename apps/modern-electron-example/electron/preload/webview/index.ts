import bridge, {
  webviewPreloadApis,
  exposeInMainWorld,
} from '@modern-js/runtime/electron-webview';
import { testServices } from '@modern-js/electron-test/webview';

console.log('bridge::', bridge);

const { ...rest } = webviewPreloadApis;
export const apis = testServices({
  ...webviewPreloadApis,

  getAppVersion: () => '13.5.1',
  registerServicesTwice: (msg: string, msg2: string) => {
    console.log('msg:', msg, msg2);
    rest.registerServices({
      func1: () => msg,
    });
    return rest.registerServices({
      func2: () => msg2,
    });
  },
  listenMessage: (channel: string) =>
    new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('listen message timeout'));
      }, 5000);
      const onMessage = rest.onMessage(channel);
      const listener = onMessage((data: any) => {
        listener.dispose();
        clearTimeout(timeout);
        resolve(data);
      });
    }),
});

exposeInMainWorld(apis);
