import { ipcMain } from 'electron';
import { mainLog } from '@modern-js/electron-log';
import { once } from '../../../core/base/common/functional';
import { IInstantiationService } from '../../../core/instantiation/instantiation';
import {
  ILifecycleMainService,
  LifecycleMainPhase,
} from '../../lifecycle/common/lifecycle';
import { Disposable } from '../../../core/base/common/lifecycle';
import { Server as ElectronIPCServer } from '../../../core/base/parts/ipc/electron-main/ipc.electron-main';
import {
  CloseMode,
  IOpenConfiguration,
  IWindow,
  IWindowsMainService,
  WindowConfig,
} from '../common/windows';
import { IPC_EVENTS } from '../../../common/constants/events';
import { Emitter, Event as CommonEvent } from '../../../core/base/common/event';
import { mergeObj } from '../../../common/utils/util';
import { Connection } from '../../../core/base/parts/ipc/common/ipc';
import { WindowObj } from './windowObj';
import {
  getConnectionId,
  CONNECTION_TARGET,
  getIpcChannelName,
} from '@/common/utils/ipc';

export class WindowsMainService
  extends Disposable
  implements IWindowsMainService
{
  _serviceBrand: undefined;

  static readonly WINDOWS: IWindow[] = [];

  private _windowsConfig: WindowConfig[] = [];

  private readonly _onWindowReady = this._register(new Emitter<IWindow>());

  readonly onWindowReady: CommonEvent<IWindow> = this._onWindowReady.event;

  private readonly _onWindowClosed = this._register(
    new Emitter<{ name: string; id: number }>(),
  );

  readonly onWindowClosed: CommonEvent<{ name: string; id: number }> =
    this._onWindowClosed.event;

  private readonly _onWindowClose = this._register(new Emitter<string>());

  readonly onWindowClose: CommonEvent<string> = this._onWindowClose.event;

  constructor(
    private readonly electronIPCServer: ElectronIPCServer,
    windowsConfig: WindowConfig[] = [],
    @ILifecycleMainService
    private readonly lifecycleService: ILifecycleMainService,
    @IInstantiationService
    private readonly instantiationService: IInstantiationService,
  ) {
    super();
    this.checkAndSetWindowConfig(windowsConfig);
    this.lifecycleService
      .when(LifecycleMainPhase.Ready)
      .then(() => this.registerListeners());
  }

  private registerListeners(): void {
    ipcMain.on(
      IPC_EVENTS.ELECTRON_RENDER_READY,
      (_event: Event, windowId: number) => {
        const win = this.getWindowById(windowId);
        if (win) {
          win.setReady();
        }
      },
    );
  }

  private setWindowsConfigByName(config: WindowConfig): WindowConfig {
    let windowConfig;
    this._windowsConfig = this._windowsConfig.map(x => {
      if (x.name === config.name) {
        const temp = {
          ...x,
          ...config,
        };
        temp.options = mergeObj(x.options || {}, config.options || {});
        windowConfig = temp;
        return temp;
      }
      return x;
    });
    if (!windowConfig) {
      windowConfig = config;
      this._windowsConfig.push(windowConfig);
    }
    return windowConfig;
  }

  createWindow(openConfig: IOpenConfiguration): IWindow {
    const windowConfig = this.setWindowsConfigByName(openConfig);
    // const windowConfig = this.getWindowConfig(openConfig.name);
    const doCreate = () => {
      const window = this.instantiationService.createInstance(WindowObj, {
        windowConfig: windowConfig as WindowConfig,
      });
      WindowsMainService.WINDOWS.push(window);
      once(window.onClosed)(() => this.handleWindowClosed(window));

      this.lifecycleService.registerWindow(window);

      const needAddOnCloseListener = () =>
        openConfig.addBeforeCloseListener ||
        openConfig.hideWhenClose ||
        windowConfig?.addBeforeCloseListener ||
        windowConfig?.hideWhenClose;
      if (needAddOnCloseListener()) {
        this.lifecycleService.onClose(window!, winName =>
          this.getWindowConfig(winName),
        );
      }
      return window;
    };
    const windows = this.getWindowByName(openConfig.name);

    if ((windowConfig && windowConfig.multiple) || windows.length === 0) {
      mainLog.info(`open window: ${openConfig.name}`);
      return doCreate();
    }
    windows[0].win?.show();
    windows[0].win?.focus();
    return windows[0];
  }

  private checkAndSetWindowConfig(windowsConfig: WindowConfig[]) {
    const checkRepeatName = (config: WindowConfig[]) => {
      const names = config.map(x => x.name);
      let name = '';
      while (names.length > 0) {
        name = names.pop() as string;
        if (names.includes(name)) {
          throw Error(
            'window name has repeated, please check: electron.config.js',
          );
        }
      }
    };
    checkRepeatName(windowsConfig);
    this._windowsConfig = windowsConfig;
  }

  private doGetWindowByName(name: string): IWindow[] {
    return WindowsMainService.WINDOWS.filter(x => x.name === name);
  }

  private handleWindowClosed(win: IWindow): void {
    const index = WindowsMainService.WINDOWS.indexOf(win);
    WindowsMainService.WINDOWS.splice(index, 1);
    this._onWindowClosed.fire({
      name: win.name,
      id: win.id,
    });
  }

  private sendToByName(name: string, channel: string, ...args: any[]): void {
    const windows = this.getWindowByName(name);
    if (windows.length === 0) {
      mainLog.warn(`window: ${name} doesn't exist!`);
      return;
    }
    windows.forEach(window => window.sendWhenReady(channel, ...args));
  }

  private sendToById(id: number, channel: string, ...args: any[]) {
    const window = this.getWindowById(id);
    if (!window) {
      mainLog.warn(`window: ${id} doesn't exist!`);
      return;
    }
    window.sendWhenReady(channel, ...args);
  }

  private getConnectionNames(receiver: number | string): string[] {
    if (typeof receiver === 'number') {
      return [getConnectionId(CONNECTION_TARGET.BROWSER_WINDOW, `${receiver}`)];
    }
    const winIds = this.getWindowByName(receiver).map(x => x.id);
    return winIds.map(id =>
      getConnectionId(CONNECTION_TARGET.BROWSER_WINDOW, `${id}`),
    );
  }

  private getConnections(receiver: number | string): Connection<string>[] {
    return this.electronIPCServer.connections.filter(x =>
      this.getConnectionNames(receiver).includes(x.ctx),
    );
  }

  getWindows(): IWindow[] {
    return WindowsMainService.WINDOWS;
  }

  getWindowByName(name: string): IWindow[] {
    const windowConfig = this.getWindowConfig(name);
    if (!windowConfig) {
      throw Error(`didn't found window config of ${name}`);
    }
    return this.doGetWindowByName(windowConfig.name);
  }

  private updateCloseModeConfig(
    winName: string,
    options?: { closeMode: CloseMode },
  ) {
    switch (options?.closeMode) {
      case 'confirmOrClose':
        this.setWindowsConfigByName({
          name: winName,
          hideWhenClose: false,
          addBeforeCloseListener: true,
        });
        break;
      case 'close':
        this.setWindowsConfigByName({
          name: winName,
          hideWhenClose: false,
          addBeforeCloseListener: false,
        });
        break;
      default:
        break;
    }
  }

  closeWindowById(
    id: number,
    options?: {
      closeMode: CloseMode;
    },
  ): Promise<boolean> {
    const win = this.getWindowById(id);
    this.updateCloseModeConfig(win?.name as string, options);

    return new Promise(resolve => {
      this.onWindowClosed(({ id }: { name: string; id: number }) => {
        if (id === win?.id) {
          resolve(true);
        }
      });
      if (win) {
        win.close();
      }
    });
  }

  closeWindowByName(
    name: string,
    options?: {
      closeMode: CloseMode;
      interval?: number;
    },
  ): Promise<boolean> {
    const wins = this.getWindowByName(name);

    let closedCount = 0;
    this.onWindowClosed(({ name: _name }: { name: string; id: number }) => {
      if (_name.includes(name)) {
        closedCount++;
      }
    });
    return new Promise(resolve => {
      const timer = setInterval(() => {
        if (closedCount === wins.length) {
          clearInterval(timer);
          resolve(true);
        }
      }, options?.interval || 200);
      wins.forEach(each => {
        this.updateCloseModeConfig(each?.name as string, options);
        each.close();
      });
      if (closedCount === wins.length) {
        resolve(true);
        clearInterval(timer);
      }
    });
  }

  getWindowConfig(name: string): WindowConfig | undefined {
    const winConfig = this._windowsConfig.find(x => x.name === name);
    return winConfig;
  }

  sendTo(receiver: string | number, channel: string, ...args: any[]): void {
    if (typeof receiver === 'number') {
      mainLog.info('send msg to win id:', receiver);
      this.sendToById(receiver, channel, ...args);
    } else {
      mainLog.info('send msg to win name:', receiver, '-', channel, '-');
      this.sendToByName(receiver, channel, ...args);
    }
  }

  callBrowserWindow(
    receiver: number | string,
    funcName: string,
    ...args: any[]
  ): Promise<any> {
    const connections = this.getConnections(receiver);
    const doCall = (connection: Connection<string>) =>
      connection.channelClient
        .getChannel(
          getIpcChannelName({
            connectionId: connection.ctx,
            target: CONNECTION_TARGET.BROWSER_WINDOW,
          }),
        )
        .call(funcName, args)
        .catch(err => {
          const getErrMsg = () => {
            if (err.name === 'Unknown channel') {
              return `can't found ${funcName} service function, you need to regist services in window ${receiver} first!`;
            }
            return err.message;
          };
          return { msg: getErrMsg() };
        });
    if (connections.length === 1) {
      return doCall(connections[0]);
    }
    return Promise.all(connections.map(connection => doCall(connection)));
  }

  broadCast(channel: string, ...args: any[]): void {
    WindowsMainService.WINDOWS.forEach(each => {
      this.sendTo(each.name, channel, ...args);
    });
  }

  getWindowById(windowId: number): IWindow | undefined {
    const res = WindowsMainService.WINDOWS.filter(
      window => window.id === windowId,
    );
    if (res && res.length === 1) {
      return res[0];
    }

    return undefined;
  }

  disposeWebviewConnection(webviewIds: number[]) {
    return this.electronIPCServer.disposeConnection(webviewIds);
  }
}
