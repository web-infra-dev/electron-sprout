import { IDisposable } from '../../../core/base/common/lifecycle';

import { createDecorator } from '../../../core/instantiation/instantiation';
import { Event } from '../../../core/base/common/event';
import { CloseReason } from '../../lifecycle/common/lifecycle';

export type CloseMode = 'close' | 'confirmOrClose';

export const IWindowsService =
  createDecorator<IWindowsService>('windowsService');

export interface IWindowsService {
  registerServices(service: { [key: string]: unknown }): void;
  registerWillClose(callBack: () => any): IDisposable;
  registerBeforeClose(
    callBack: (reason: CloseReason) => boolean | Promise<boolean>,
  ): IDisposable;
  callBrowserWindow(
    receiver: string | number, // window name or window id
    funcName: string,
    ...args: any[]
  ): Promise<any>;
  onMessage<T>(channel: string): Event<T>;
  closeCurrentWindow(options?: { closeMode: CloseMode }): Promise<any>;
  closeWindowById(
    id: number,
    options?: {
      closeMode: CloseMode;
    },
  ): Promise<boolean>;
  closeWindowByName(
    name: string,
    options?: {
      closeMode: CloseMode;
    },
  ): Promise<boolean>;
  disposeWebviewConnection(webviewIds: number[]): Promise<any>;
  broadCast(channel: string, ...args: any[]): Promise<any>;
  openExplorerWindow(hide?: boolean, userId?: string): Promise<any>;
  dispose(): void;
  sendTo(
    receiver: string | number,
    channel: string,
    ...args: any[]
  ): Promise<any>;
}
