import type {
  WebviewService,
  WinService,
  UpdateService,
  LifecycleService,
} from './preload/index.render';

import { Event } from '@/common';

export * from './interfaces/common';
export type { WindowConfig } from './services/windows/common/windows';

export * from './services/lifecycle/common/lifecycle';
export * from './core/base/common/lifecycle';
export * from './services/update/common/update';
export * from './core/base/common/event';
export * from './core/base/parts/ipc/electron-browser/ipc.electron-browser';
export * from './core/base/parts/ipc/electron-webview/ipc.electron-webview';
export * from './services/windows/common/windows';

export interface BrowserWindowApis {
  callMain: (funcName: string, ...args: any[]) => Promise<any>;
  winService: WinService;
  updateService: LifecycleService;
  lifecycleService: UpdateService;
  webviewService: WebviewService;
  isElectron: boolean;
  APP_ROOT: string;
}

export interface WebviewApis {
  callMain: (funcName: string, ...args: any[]) => Promise<any>;
  onMessage: <T>(channel: string) => Event<T>;
  callBrowserWindow: (funcName: string, ...args: any[]) => Promise<any>;
  registerServices: (services: { [key: string]: unknown }) => Promise<void>;
  send: (channel: string, data: any) => void;
  dispose: () => void;
}
