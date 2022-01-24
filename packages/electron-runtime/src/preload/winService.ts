import { Event, IDisposable, CloseReason, CloseMode } from '@/common';

import { winService as service } from '@/services/index.render';

export const winService = {
  windowId: service.windowId,
  disposeWebviewConnection(webviewIds: number[]) {
    return service.disposeWebviewConnection(webviewIds);
  },
  onMessage<T>(channel: string): Event<T> {
    return service.onMessage(channel);
  },
  registerServices(services: { [key: string]: unknown }) {
    return service.registerServices(services);
  },
  registerWillClose(callBack: () => any): IDisposable {
    return service.registerWillClose(callBack);
  },
  registerBeforeClose(
    callBack: (reason: CloseReason) => boolean | Promise<boolean>,
  ): IDisposable {
    return service.registerBeforeClose(callBack);
  },
  callBrowserWindow(
    receiver: string | number,
    funcName: string,
    ...args: any[]
  ): Promise<any> {
    return service.callBrowserWindow(receiver, funcName, ...args);
  },
  closeCurrentWindow(options?: { closeMode: CloseMode }): Promise<any> {
    return service.closeCurrentWindow(options);
  },
  closeWindowById(
    id: number,
    options?: { closeMode: CloseMode },
  ): Promise<any> {
    return service.closeWindowById(id, options);
  },
  closeWindowByName(
    name: string,
    options?: { closeMode: CloseMode },
  ): Promise<any> {
    return service.closeWindowByName(name, options);
  },
  broadCast(channel: string, ...args: any[]): Promise<any> {
    return service.broadCast(channel, ...args);
  },
  sendTo(
    receiver: string | number,
    channel: string,
    ...args: any[]
  ): Promise<any> {
    return service.sendTo(receiver, channel, ...args);
  },
  dispose() {
    return service.dispose();
  },
};
