import { join } from 'path';
import { BrowserWindow } from 'electron';
import { mainLog } from '@modern-js/electron-log';
import { mergeObj } from '../../../common/utils/util';
import { IS_DEV } from '../../../common/constants/constants';
import { APP_ROOT } from '../../../common/constants/paths';
import { Emitter, Event as CommonEvent } from '../../../core/base/common/event';
import { Disposable } from '../../../core/base/common/lifecycle';
import { IWindow, IWindowCreationOptions, ReadyState } from '../common/windows';
import { DEFAULT_WINDOW_CONFIG } from '../../../common/constants/windowConfig';

const enum WindowError {
  UNRESPONSIVE = 1,
  CRASHED = 2,
}

export class WindowObj extends Disposable implements IWindow {
  private _readyState: ReadyState = ReadyState.NONE;

  private _id: number = -1;

  private _win: Electron.BrowserWindow | null = null;

  private _name: string = '';

  private readonly _config: IWindowCreationOptions;

  private readonly whenReadyCallbacks: Array<(window: IWindow) => void>;

  private readonly _onClosed = this._register(new Emitter<void>());

  readonly onClosed: CommonEvent<void> = this._onClosed.event;

  private readonly _onDestroy = this._register(new Emitter<void>());

  readonly onDestroy: CommonEvent<void> = this._onDestroy.event;

  close(): void {
    if (this._win) {
      this._win.close();
    }
  }

  sendWhenReady(channel: string, args: any): void {
    if (this.isReady) {
      this.send(channel, args);
    } else {
      this.ready().then(() => this.send(channel, args));
    }
  }

  send(channel: string, args: any): void {
    if (this._win) {
      try {
        this._win.webContents.send(channel, args);
      } catch (error) {
        mainLog.info('window has been destroyed:', error);
      }
    }
  }

  setReady(): void {
    this._readyState = ReadyState.READY;
    // inform all waiting promises that we are ready now
    while (this.whenReadyCallbacks.length) {
      this.whenReadyCallbacks.pop()!(this);
    }
  }

  ready(): Promise<IWindow> {
    return new Promise<IWindow>(resolve => {
      if (this.isReady) {
        return resolve(this);
      }

      // otherwise keep and call later when we are ready
      this.whenReadyCallbacks.push(resolve);
    });
  }

  get isReady(): boolean {
    return this._readyState === ReadyState.READY;
  }

  get id(): number {
    return this._id;
  }

  get name(): string {
    return this._name;
  }

  get win(): Electron.BrowserWindow | null {
    return this._win;
  }

  get config(): IWindowCreationOptions {
    return this._config;
  }

  constructor(config: IWindowCreationOptions) {
    super();
    this.whenReadyCallbacks = [];

    this._config = config;

    // create browser window
    this.createBrowserWindow();
  }

  private onWindowError(error: WindowError) {
    mainLog.info('window error:', error);
    if (error === WindowError.CRASHED) {
      // 弹窗提示?
    }
  }

  private registerListeners(): void {
    if (this.win) {
      this._win?.webContents.on('crashed', () =>
        this.onWindowError(WindowError.CRASHED),
      );
      this._win?.webContents.on('unresponsive', () =>
        this.onWindowError(WindowError.UNRESPONSIVE),
      );
      this._win?.once('closed', () => {
        // e.preventDefault();
        this._onClosed.fire();
        this.dispose();
      });
    }
  }

  private getUrl(config: IWindowCreationOptions): string {
    const { windowConfig } = config;
    const { loadUrl = '' } = windowConfig;

    if (
      (IS_DEV && loadUrl.startsWith('file:')) ||
      (!IS_DEV && !loadUrl.startsWith('http'))
    ) {
      /**
       * if useFileProtocolInDev
       * or in production and loadUrl not startWith http
       * then we will use file protocol
       */
      return `file://${join(APP_ROOT, loadUrl)}`;
    }
    return loadUrl;
  }

  private createBrowserWindow(): void {
    const { disableAutoLoad, loadUrl, options, name } =
      this.config.windowConfig;
    this._win = new BrowserWindow(
      mergeObj(DEFAULT_WINDOW_CONFIG, options || {}),
    );

    if (loadUrl && !disableAutoLoad) {
      this._win?.loadURL(this.getUrl(this.config));
    } else {
      mainLog.warn('you can load page by loadURL() !');
    }
    this._id = this._win?.id;

    this._name = name;

    this.registerListeners();
  }

  dispose(): void {
    super.dispose();
    this._win = null;
  }
}
