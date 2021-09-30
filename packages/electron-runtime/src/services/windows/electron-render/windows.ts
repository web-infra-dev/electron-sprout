import { ipcRenderer } from 'electron';
import { renderLog } from '@modern-js/electron-log';
import { Disposable, IDisposable } from '../../../core/base/common/lifecycle';
import { IChannel } from '../../../core/base/parts/ipc/common/ipc';
import { Client } from '../../../core/base/parts/ipc/electron-browser/ipc.electron-browser';
import { Event, Emitter } from '../../../core/base/common/event';
import { isThenable } from '../../../core/base/common/async';
import {
  BeforeCloseEvent,
  CloseReason,
  WillCloseEvent,
} from '../../lifecycle/common/lifecycle';

import { handleVetos } from '../../lifecycle/common/utils';
import { CloseMode, IWindowsService } from './IWindows';
import { getIpcChannelName, CONNECTION_TARGET } from '@/common/utils/ipc';
import { createCustomChannelReceiver } from '@/services/utils';

const WINDOWS_MANAGER_NAME = 'windowsManager';

interface MainProcessBroadCastEvent {
  channel: string;
  data: any;
}
export class WindowsService extends Disposable implements IWindowsService {
  protected readonly mainProcessConnection: Client;

  private readonly windowsManagerChannel: IChannel;

  private registered = false; // services registered status

  private readonly _windowId: number;

  protected readonly _onMainProcessBroadCast: Emitter<MainProcessBroadCastEvent> =
    this._register(new Emitter<MainProcessBroadCastEvent>());

  protected readonly _onWillColse: Emitter<WillCloseEvent> = this._register(
    new Emitter<WillCloseEvent>(),
  );

  private readonly onWillColse: Event<WillCloseEvent> = this._onWillColse.event;

  protected readonly _onBeforeClose = this._register(
    new Emitter<BeforeCloseEvent>(),
  );

  private readonly onBeforeClose = this._onBeforeClose.event;

  constructor(mainProcessConnection: Client, windowId: number) {
    super();
    this.mainProcessConnection = mainProcessConnection;

    this.windowsManagerChannel = this.getChannel(WINDOWS_MANAGER_NAME);

    this._windowId = windowId;

    this.registerListeners();
  }

  disposeWebviewConnection(webviewIds: number[]): Promise<any> {
    renderLog.info('call main to dispose webview connection', webviewIds);
    return this.callWindowsManager('disposeWebviewConnection', webviewIds);
  }

  private async handleWillShutdown(
    reason: CloseReason,
    _windowName: string,
  ): Promise<void> {
    const joiners: Array<Promise<void>> = [];

    this._onWillColse.fire({
      join(promise) {
        if (promise) {
          joiners.push(promise);
        }
      },
      reason,
    });

    await Promise.all(joiners);
  }

  private registOnBeforeUnload(): void {
    ipcRenderer.on(
      'app:onBeforeUnload',
      async (
        _event: unknown,
        reply: {
          okChannel: string;
          cancelChannel: string;
          reason: CloseReason;
        },
      ) => {
        renderLog.info('app:onBeforeUnload:', JSON.stringify(reply, null, 2));
        this.handleBeforeClose(reply.reason).then(veto => {
          if (veto) {
            renderLog.info('lifecycle: onBeforeUnload prevented via veto');
            ipcRenderer.send(reply.cancelChannel, '');
          } else {
            renderLog.info('lifecycle: veto to close window');
            ipcRenderer.send(reply.okChannel, '');
          }
        });
      },
    );
  }

  private registOnWillUnload(): void {
    ipcRenderer.on(
      'app:onWillUnload',
      async (
        _event: unknown,
        reply: {
          replyChannel: string;
          reason: CloseReason;
          windowName: string;
        },
      ) => {
        renderLog.info('handle on will unload...');
        // trigger onWillColse events and joining
        await this.handleWillShutdown(reply.reason, reply.windowName);

        // trigger onShutdown event now that we know we will quit
        // this._onShutdown.fire();

        // acknowledge to main side
        ipcRenderer.send(reply.replyChannel, '');
      },
    );
  }

  private registerListeners(): void {
    this.registOnBeforeUnload();
    this.registOnWillUnload();

    window.addEventListener('DOMContentLoaded', () => {
      this.setReady();
    });
  }

  private setReady(): void {
    ipcRenderer.send('app:electronRenderReady', this.windowId);
  }

  private handleBeforeClose(reason: CloseReason): Promise<boolean> {
    const vetos: (boolean | Promise<boolean>)[] = [];

    this._onBeforeClose.fire({
      veto(value) {
        vetos.push(value);
      },
      reason,
    });

    return handleVetos(vetos, error => {
      renderLog.info(reason.toString(), 'exit error:', error);
    });
  }

  protected getChannel(channelName: string): IChannel {
    return this.mainProcessConnection.getChannel(channelName);
  }

  protected callWindowsManager(funcName: string, ...args: any): Promise<any> {
    return this.windowsManagerChannel.call(funcName, args);
  }

  get windowId() {
    return this._windowId;
  }

  onMessage<T>(channel: string): Event<T> {
    return Event.any(
      Event.fromNodeEventEmitter(ipcRenderer, channel, (_, args) => args),
      Event.map(
        Event.filter(
          this._onMainProcessBroadCast.event,
          ({ channel: _channel }) => _channel === channel,
        ),
        ({ data }) => data,
      ),
    );
  }

  registerServices(service: { [key: string]: unknown }) {
    if (!this.registered) {
      this.registered = true;
      const channel = createCustomChannelReceiver(service);
      this.mainProcessConnection.registerChannel(
        getIpcChannelName({
          target: CONNECTION_TARGET.BROWSER_WINDOW,
          targetId: `${this.windowId || ''}`,
        }),
        channel,
      );
    } else {
      renderLog.info('services have been registered, do not regist again!');
    }
  }

  registerWillClose(callBack: () => any | Promise<any>): IDisposable {
    return this.onWillColse(e => e.join(callBack()));
  }

  registerBeforeClose(
    callBack: (reason: CloseReason) => boolean | Promise<boolean>,
  ): IDisposable {
    return this.onBeforeClose(e => {
      const result = callBack(e.reason);
      // 'true' means to close
      const vetoResult = isThenable(result)
        ? result.then(res => !res)
        : !result;
      return e.veto(vetoResult);
    });
  }

  closeCurrentWindow(options?: { closeMode: CloseMode }): Promise<any> {
    return this.closeWindowById(this.windowId, options);
  }

  closeWindowById(
    id: number,
    options?: {
      closeMode: CloseMode;
    },
  ): Promise<boolean> {
    return this.callWindowsManager('closeWindowById', id, options);
  }

  closeWindowByName(
    name: string,
    options?: {
      closeMode: CloseMode;
      interval?: number;
    },
  ): Promise<boolean> {
    return this.callWindowsManager('closeWindowByName', name, options);
  }

  // broadcast msg to all windows
  broadCast(channel: string, ...args: any[]): Promise<any> {
    return this.callWindowsManager('broadCast', channel, ...args);
  }

  // send msg to window receiver
  sendTo(
    receiver: string | number,
    channel: string,
    ...args: any[]
  ): Promise<any> {
    return this.callWindowsManager('sendTo', receiver, channel, ...args);
  }

  // call browserwindow services
  callBrowserWindow(
    receiver: string | number,
    funcName: string,
    ...args: any[]
  ): Promise<any> {
    return this.callWindowsManager(
      'callBrowserWindow',
      receiver,
      funcName,
      ...args,
    );
  }

  openExplorerWindow(hide?: boolean, userId?: string) {
    return this.callWindowsManager('openExplorerWindow', hide, userId);
  }

  dispose() {
    this.mainProcessConnection.dispose();
  }
}
