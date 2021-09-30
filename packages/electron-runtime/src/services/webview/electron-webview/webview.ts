import { ipcRenderer } from 'electron';
import { renderLog } from '@modern-js/electron-log';
import {
  Disposable,
  Emitter,
  Event,
  IDisposable,
  WebviewIpcClient,
} from '@/common';
import {
  IChannel,
  ICustomServerChannel,
} from '@/core/base/parts/ipc/common/ipc';
import { createCustomChannelReceiver } from '@/services/utils';

interface IpcEvent {
  channel: string;
  data?: any;
}

const id = `webview_${new Date().getTime()}`;
const WEBVIEW_IPC_CHANNEL = 'webview_ipc_channel';
const WEBVIEW_IPC_CHANNEL_NAME = 'webviewIpcManager';

// ipc of parent window created connection
const PARENT_WINDOW_IPC_SERVER_CREATED_CHANNEL =
  'parent_window_ipc_server_created_channel';

class WebviewBridge extends Disposable {
  private registered = false; // services registered status

  private browserwindowConnection: WebviewIpcClient | null = null; // connect to browserwindow

  private browserWindowChannel: IChannel | null = null;

  protected readonly _onServicesRegisted: Emitter<IpcEvent> = this._register(
    new Emitter<IpcEvent>(),
  );

  // onConnect to parentWindow
  protected readonly _onConnected: Emitter<IpcEvent> = this._register(
    new Emitter<IpcEvent>(),
  );

  public whenServicesRegisted() {
    if (this.registered) {
      return Promise.resolve(true);
    }
    return new Promise(resolve => {
      this.onServicesRegisted(() => resolve(true));
    });
  }

  private onServicesRegisted(callback: (...args: any[]) => any): IDisposable {
    const event = Event.map(this._onServicesRegisted.event, ({ data }) => data);
    return event(callback);
  }

  public whenConnected() {
    if (this.browserwindowConnection) {
      return Promise.resolve(true);
    }
    return new Promise(resolve => {
      this.onConnected(() => resolve(true));
    });
  }

  constructor() {
    super();
    this.registerListener();
  }

  private registerListener() {
    // only listen this event for once
    const onParentWindowIpcCreated = Event.once(
      this.onMessage(PARENT_WINDOW_IPC_SERVER_CREATED_CHANNEL),
    );

    onParentWindowIpcCreated(() => {
      this.browserwindowConnection = new WebviewIpcClient(id);
      this.browserWindowChannel =
        this.getBrowserWindowChannel(WEBVIEW_IPC_CHANNEL);
      // here doesn't need a channel name
      this._onConnected.fire({
        channel: '',
      });
    });

    const onUnload = Event.once(
      Event.fromDOMEventEmitter(window, 'unload', e => e),
    );

    onUnload(() => {
      this.dispose();
    });
  }

  onConnected<T>(callBack: (...args: any[]) => any): IDisposable {
    const _onConnected = Event.map(
      Event.filter(this._onConnected.event, () => true),
      ({ data }) => data,
    );
    return _onConnected(callBack);
  }

  async registerServices(services: { [key: string]: unknown }) {
    await this.whenConnected();
    if (!this.registered && this.browserwindowConnection) {
      this.registered = true;

      const channel = createCustomChannelReceiver(services);
      this.browserwindowConnection.registerChannel(
        WEBVIEW_IPC_CHANNEL_NAME,
        channel,
      );
      this._onServicesRegisted.fire({
        channel: '',
      });
    } else if (this.browserwindowConnection) {
      // update services
      const channel =
        this.browserwindowConnection.getServerChannel<ICustomServerChannel>(
          WEBVIEW_IPC_CHANNEL_NAME,
        );
      channel?.updateServices(services);
    } else {
      renderLog.warn(
        'You can call registerServices only for one time in the same renderer process, do not call this again (webviewBridge.registerServices)',
      );
    }
  }

  onMessage<T>(channel: string): Event<T> {
    return Event.fromNodeEventEmitter(ipcRenderer, channel, (_, args) => args);
  }

  async callBrowserWindow(funcName: string, ...args: any[]): Promise<any> {
    await this.whenConnected();
    if (this.browserWindowChannel) {
      return this.browserWindowChannel.call(funcName, ...args);
    }
    return Promise.resolve();
  }

  private getBrowserWindowChannel(channelName: string): IChannel | null {
    if (!this.browserwindowConnection) {
      return null;
    }
    return this.browserwindowConnection.getChannel(channelName);
  }

  send(channel: string, data: any) {
    ipcRenderer.sendToHost(channel, data);
  }

  dispose() {
    if (this.browserwindowConnection) {
      this.browserwindowConnection.dispose();
    }
  }
}

export const webviewBridge = new WebviewBridge();
