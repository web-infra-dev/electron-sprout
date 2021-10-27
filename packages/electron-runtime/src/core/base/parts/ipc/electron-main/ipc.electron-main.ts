/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ipcMain } from 'electron';
import { mainLog } from '@modern-js/electron-log';
import { Event, Emitter } from '../../../common/event';
import { IPCServer, ClientConnectionEvent } from '../common/ipc';
import { Protocol } from '../node/ipc.electron';
import { IDisposable, toDisposable } from '../../../common/lifecycle';
import { VSBuffer } from '../../../common/buffer';

interface IIPCEvent {
  event: { sender: Electron.WebContents };
  message: Buffer | null;
}

function createScopedOnMessageEvent(
  senderId: number,
  eventName: string,
): Event<VSBuffer | Buffer> {
  const onMessage = Event.fromNodeEventEmitter<IIPCEvent>(
    ipcMain,
    eventName,
    (event, message) => ({ event, message }),
  );
  const onMessageFromSender = Event.filter(
    onMessage,
    ({ event }) => event.sender.id === senderId,
  );
  return Event.map(onMessageFromSender, ({ message }) =>
    message ? (VSBuffer.wrap(message) as any) : message,
  );
}

export class Server extends IPCServer {
  private static readonly Clients: Map<number, IDisposable> = new Map<
    number,
    IDisposable
  >();

  // 根据 id 主动释放一些连接
  disposeConnection(ids: number[]) {
    mainLog.info('dispose connections:', ids);
    ids.forEach(x => {
      Server.Clients.get(x)?.dispose();
    });
  }

  private static getOnDidClientConnect(): Event<ClientConnectionEvent> {
    const onHello = Event.fromNodeEventEmitter<Electron.WebContents>(
      ipcMain,
      'ipc:hello',
      ({ sender }) => sender,
    );

    return Event.map(onHello, webContents => {
      const { id } = webContents;
      const client = Server.Clients.get(id);
      if (client) {
        client.dispose();
      }

      const onDidClientReconnect = new Emitter<void>();
      Server.Clients.set(
        id,
        toDisposable(() => onDidClientReconnect.fire()),
      );

      const onMessage = createScopedOnMessageEvent(
        id,
        'ipc:message',
      ) as Event<VSBuffer>;
      const onDidClientDisconnect = Event.once(
        Event.any(
          Event.signal(createScopedOnMessageEvent(id, 'ipc:disconnect')),
          onDidClientReconnect.event,
        ),
      );
      const protocol = new Protocol(webContents, onMessage);
      return { protocol, onDidClientDisconnect };
    });
  }

  constructor() {
    super(Server.getOnDidClientConnect());
  }
}
