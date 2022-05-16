/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ipcRenderer } from 'electron';
import { Event, Emitter } from '../../../common/event';
import { IPCServer, ClientConnectionEvent, IPCClient } from '../common/ipc';

import { Protocol } from '../node/ipc.electron';
import { IDisposable, toDisposable } from '../../../common/lifecycle';

import { VSBuffer } from '../../../common/buffer';
import { BrowserWindowProtocol } from '../node/ipc.webview';

export class Client extends IPCClient implements IDisposable {
  private readonly protocol: Protocol;

  private static createProtocol(): Protocol {
    const onMessage = Event.fromNodeEventEmitter<VSBuffer>(
      ipcRenderer,
      'ipc:message',
      (_, message: Buffer) => VSBuffer.wrap(message),
    );
    // ready to listen msg
    const protocol = new Protocol(ipcRenderer, onMessage);
    // send connect
    ipcRenderer.send('ipc:hello');
    return protocol;
  }

  constructor() {
    const protocol = Client.createProtocol();
    super(protocol);
    this.protocol = protocol;
  }

  dispose(): void {
    super.dispose();
    this.protocol.dispose();
  }
}

interface IIPCEvent {
  event: Electron.IpcMessageEvent;
  message: Buffer | null;
}

function createScopedOnMessageEvent(
  webview: Electron.WebviewTag,
  eventName: string,
): Event<VSBuffer | Buffer> {
  const onMessage = Event.fromDOMEventEmitter<IIPCEvent>(
    webview,
    'ipc-message',
    (e: Electron.IpcMessageEvent) => {
      if (e.args.length === 0 || e.args.length > 1) {
        // 表示非内核封装方式的消息通信，无需处理
        return {
          event: e,
          message: null,
        };
      }
      return {
        event: e,
        message: e.args[0],
      };
    },
  );

  // args > 1 表示非内部封装通信方式，无需处理
  const onMessageOfEvent = Event.filter(
    onMessage,
    ({ event }) => event.channel === eventName && event.args.length <= 1,
  );
  return Event.map(onMessageOfEvent, ({ message }) =>
    message ? (VSBuffer.wrap(message) as any) : message,
  );
}

export const WEBVIEW_CONNECT_CHANNEL = 'webview:ipc:hello';

// Browserwindow 中
export class WebviewIpcServer extends IPCServer {
  private static readonly Clients: Map<string, IDisposable> = new Map<
    string,
    IDisposable
  >();

  private static getOnDidClientConnect(
    webview: Electron.WebviewTag,
    webviewId: string,
  ): Event<ClientConnectionEvent> {
    const onHello = Event.filter(
      Event.fromDOMEventEmitter<Electron.IpcMessageEvent>(
        webview,
        'ipc-message',
        (e: Electron.IpcMessageEvent) => e,
      ),
      (e: Electron.IpcMessageEvent) => e.channel === WEBVIEW_CONNECT_CHANNEL,
    );

    return Event.map(onHello, () => {
      const client = WebviewIpcServer.Clients.get(webviewId);

      if (client) {
        // client.dispose();
        WebviewIpcServer.Clients.delete(webviewId);
      }

      const onDidClientReconnect = new Emitter<void>();
      WebviewIpcServer.Clients.set(
        webviewId,
        toDisposable(() => onDidClientReconnect.fire()),
      );

      const onMessage = createScopedOnMessageEvent(
        webview,
        'webview:ipc:message',
      ) as Event<VSBuffer>;
      const onDidClientDisconnect = Event.once(
        Event.any(
          Event.signal(
            createScopedOnMessageEvent(webview, 'webview:ipc:disconnect'),
          ),
          onDidClientReconnect.event,
        ),
      );
      const protocol = new BrowserWindowProtocol(webview, onMessage);
      return { protocol, onDidClientDisconnect, ctx: webviewId };
    });
  }

  constructor(webview: Electron.WebviewTag, webviewId: string) {
    super(WebviewIpcServer.getOnDidClientConnect(webview, webviewId));
  }
}
