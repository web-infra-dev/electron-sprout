import { WebviewTag } from 'electron';
import { webviewService as service } from '@/services/index.render';
import { Event as CommonEvent, WebviewIpcServer } from '@/common';

export const webviewService = {
  setTimeoutDelay(timeoutDelay: number) {
    return service.setTimeoutDelay(timeoutDelay);
  },
  callWebview(
    webviewId: string,
    funcName: string,
    ...data: any[]
  ): Promise<any> {
    return service.callWebview(webviewId, funcName, ...data);
  },
  dispose() {
    return service.dispose();
  },
  getWebviewById(webviewId: string): WebviewTag | null {
    return service.getWebviewById(webviewId);
  },

  registerServices(services: Record<string, unknown>) {
    return service.registerServices(services);
  },
  getWebviewIds(): number[] {
    return service.getWebviewIds();
  },
  onMessage<T>(webviewId: string, channel: string): CommonEvent<T> {
    return service.onMessage(webviewId, channel);
  },

  addWebview(
    webviewId: string,
    withIpcServer?: boolean,
  ): WebviewIpcServer | undefined {
    return service.addWebview(webviewId, withIpcServer);
  },
  sendToWebview(webviewId: string, channel: string, data: any) {
    return service.sendToWebview(webviewId, channel, data);
  },
  broadCast(channel: string, data: any): void {
    return service.broadCast(channel, data);
  },
};
