import { BrowserWindowConstructorOptions } from 'electron';
import { createDecorator } from '../../../core/instantiation/instantiation';
import { Event } from '../../../core/base/common/event';

export const IWindowsMainService =
  createDecorator<IWindowsMainService>('windowsMainService');

export interface IWindowsCountChangedEvent {
  readonly oldCount: number;
  readonly newCount: number;
}

export type CloseMode = 'close' | 'confirmOrClose';

export interface IWindowsMainService {
  _serviceBrand: undefined;
  readonly onWindowReady: Event<IWindow>;

  callBrowserWindow: (
    receiver: number | string,
    funcName: string,
    ...args: any[]
  ) => Promise<any>;
  broadCast(channel: string, ...args: any[]): void;
  getWindowById: (windowId: number) => IWindow | undefined;
  getWindows: () => IWindow[];
  sendTo: (receiver: string | number, channel: string, ...args: any[]) => void; // 可以通过名字或者窗口id 发送消息
  createWindow: (openConfig: IOpenConfiguration) => IWindow;
  getWindowConfig: (name: string) => WindowConfig | undefined; // 根据名字获取窗口的配置内容
  closeWindowById: (
    id: number,
    options?: {
      closeMode: CloseMode;
    },
  ) => Promise<boolean>;
  closeWindowByName: (
    name: string,
    options?: {
      closeMode: CloseMode;
      interval?: number; // ms Set the time interval for whether the rotation training window is completely closed
    },
  ) => Promise<boolean>;
  getWindowByName: (name: string) => IWindow[];
  // openExplorerWindow: (hide?: boolean, userId?: string) => IWindow;
  disposeWebviewConnection: (webviewIds: number[]) => void;
}

export interface IOpenConfiguration {
  readonly name: string; // window name, can't be repeated
  readonly options?: Electron.BrowserWindowConstructorOptions;
  readonly loadUrl?: string;
  readonly addBeforeCloseListener?: boolean; // whether open onBeforeClose listener
  readonly hideWhenClose?: boolean; // whether replace close with hidding window.
}

export enum ReadyState {
  /**
   * This window has not loaded any HTML yet
   */
  NONE,

  /**
   * This window is loading HTML
   */
  LOADING,

  /**
   * This window is navigating to another HTML
   */
  NAVIGATING,

  /**
   * This window is done loading HTML
   */
  READY,
}

export interface IWindowState {
  width?: number;
  height?: number;
  x?: number;
  y?: number;
  mode?: WindowMode;
  display?: number;
}

export enum WindowMode {
  Maximized,
  Normal,
  Minimized, // not used anymore, but also cannot remove due to existing stored UI state (needs migration)
  Fullscreen,
}

export interface IWindowCreationOptions {
  state?: IWindowState;
  windowConfig: WindowConfig;
}

export interface WindowConfig {
  loadUrl?: string; // when disableAutoLoad is true, it will be useless
  name: string; // window name
  multiple?: boolean; // whether allow to open multiple
  options?: BrowserWindowConstructorOptions; // electron windows options
  disableAutoLoad?: boolean; // disable auto load default url
  useFileProtocolInDev?: boolean; // whether use file protocol in dev.
  hideWhenClose?: boolean; // whether replace close with hidding window.
  addBeforeCloseListener?: boolean; // whether open onBeforeClose listener
}

export interface IWindow {
  readonly onClosed: Event<void>; // onClosed
  readonly onDestroy: Event<void>;
  readonly id: number;
  readonly name: string; // window name
  readonly win: Electron.BrowserWindow | null;
  readonly config: IWindowCreationOptions;

  readonly isReady: boolean;
  ready: () => Promise<IWindow>;

  send: (channel: string, ...args: any[]) => void;
  sendWhenReady: (channel: string, ...args: any[]) => void;

  setReady: () => void;
  close: () => void;

  dispose: () => void;
}
