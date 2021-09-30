import { WebviewTag } from 'electron';
import { WebviewIpcServer } from '../../../core/base/parts/ipc/electron-browser/ipc.electron-browser';
import { createDecorator } from '../../../core/instantiation/instantiation';
import { Event as CommonEvent } from '../../../core/base/common/event';

export const IWebviewService =
  createDecorator<IWebviewService>('webviewService');

export interface IWebviewService {
  getWebviewById(webviewId: string): WebviewTag | null;
  registerServices(services: object): void;
  setTimeoutDelay(timeoutDelay: number): void;
  getWebviewIds(): number[];
  callWebview(
    webviewId: string,
    funcName: string,
    ...data: any[]
  ): Promise<any>;
  addWebview(
    webviewId: string,
    withIpcServer?: boolean,
  ): WebviewIpcServer | undefined;
  sendToWebview(webviewId: string, channelName: string, ...args: any): void;
  broadCast(channel: string, ...args: any[]): void;
  dispose(): void;
  onMessage<T>(webviewId: string, channel: string): CommonEvent<T>;
}
