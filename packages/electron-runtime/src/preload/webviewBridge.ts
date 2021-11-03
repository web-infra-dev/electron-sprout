import bridge from '@/services/index.webview';
import { Event } from '@/common';

export const webviewBridge = {
  registerServices(services: { [key: string]: unknown }) {
    return bridge.registerServices(services);
  },
  onMessage<T>(channel: string): Event<T> {
    return bridge.onMessage(channel);
  },
  callBrowserWindow(funcName: string, ...args: any[]): Promise<any> {
    return bridge.callBrowserWindow(funcName, args);
  },
  send(channel: string, data: any) {
    return bridge.send(channel, data);
  },
  dispose() {
    return bridge.dispose();
  },
};
