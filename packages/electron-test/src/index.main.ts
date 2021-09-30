// in main process
import os from 'os';
import { app } from 'electron';
import { winService, serviceManager } from '@modern-js/electron-runtime';

export type IMessage = {
  msgId: number;
  funcName: string;
  args: any[];
  winName?: string;
};

const METHODS: any = {
  isReady: async (options: {
    winName?: string;
    timeout?: number;
    webviewId?: string;
  }) => {
    const { winName, timeout, webviewId } = options;
    if (!winName) {
      await app.whenReady();
      return true;
    }
    return new Promise(resolve => {
      // TODO: pikun
      serviceManager.whenReady().then(() => {
        const timer = setTimeout(() => {
          resolve(new Error(`window ${winName} doesn't open!`));
        }, timeout || 10000);

        const wins = winService.getWindowByName(winName);
        if (wins.length > 0) {
          wins[0].ready().then(() => {
            if (!webviewId) {
              clearTimeout(timer);

              return resolve(true);
            }
            // wait for webview ready
            return winService
              .callBrowserWindow(winName, 'whenWebviewReady', webviewId || '')
              .then(() => {
                clearTimeout(timer);
                resolve(true);
              });
          });
        }
      });
    });
  },
};

interface IElectronTestOptions {
  mainServices?: any;
}

class ElectronTest {
  private readonly methods: Record<string, Function>;

  constructor(private readonly options: IElectronTestOptions) {
    const { mainServices } = options;
    this.methods = {
      ...mainServices,
      ...METHODS,
    };
    process.on('message', this.onMessage.bind(this));
  }

  getMethod(funcName: string) {
    let context: any = this.methods;
    let execFunc: string = funcName;
    const funcNameArray = funcName.split('.');
    while (funcNameArray.length > 1) {
      const name = funcNameArray.shift();
      if (name) {
        if (!this.methods[name]) {
          throw Error(`command not found: ${funcName}`);
        }
        context = this.methods[name];
      }
    }
    const _funcName = funcNameArray.shift();
    if (!_funcName) {
      throw Error(`exec command failed: ${funcName}`);
    }
    execFunc = _funcName;
    if (
      context[execFunc] ||
      (context.__proto__ && context.__proto__.hasOwnProperty(execFunc))
    ) {
      if (typeof context[execFunc] === 'function') {
        return (...args: any[]) => context[execFunc](...args);
      }
      return () => context[execFunc];
    }
    throw Error(`exec command failed: ${funcName}`);
  }

  private readonly onMessage = async ({
    msgId,
    funcName,
    args = [],
    winName,
  }: IMessage) => {
    let method = winName
      ? (..._args: any[]) =>
          winService
            .callBrowserWindow(winName, funcName, ..._args)
            .then((res: any) => {
              if (res instanceof Array) {
                return res.length > 0 ? res[0] : undefined;
              }
              return res;
            })
      : this.getMethod(funcName);

    if (!method) {
      method = () => {
        throw Error(`function ${funcName} doesn't exits!`);
      };
    }
    try {
      const resolve = await method(...args);
      process.send!({ msgId, resolve });
    } catch (err: any) {
      const reject = {
        message: err.message,
        stack: err.stack,
        name: err.name,
      };
      process.send!({ msgId, reject });
    }
  };
}

export const testServices = (services: any) => {
  if (process.env.APP_TEST_DRIVER) {
    app.setPath(
      'userData',
      `${os.tmpdir()}/electron_tests/${process.env.TEST_FOLDER || ''}/Electron`,
    );
    new ElectronTest({
      mainServices: services,
    });
  }
  return services;
};
