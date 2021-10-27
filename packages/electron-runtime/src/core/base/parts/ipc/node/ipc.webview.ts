/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { IMessagePassingProtocol } from '../common/ipc';
import { Event } from '../../../common/event';
import { VSBuffer } from '../../../common/buffer';

export interface WebviewSender {
  sendToHost: (channel: string, msg: Buffer | null) => void;
}

export interface BrowserWindowSender {
  send: (channel: string, msg: Buffer | null) => void;
}

// 从 webview 中 通信 browserWindow
export class WebviewProtocol implements IMessagePassingProtocol {
  constructor(
    private readonly sender: WebviewSender,
    readonly onMessage: Event<VSBuffer>,
  ) {}

  send(message: VSBuffer): void {
    try {
      this.sender.sendToHost('webview:ipc:message', message.buffer as Buffer);
    } catch (e) {
      // systems are going down
    }
  }

  dispose(): void {
    this.sender.sendToHost('webview:ipc:disconnect', null);
  }
}

// 从 browserwindow 通信 webview 的协议
export class BrowserWindowProtocol implements IMessagePassingProtocol {
  constructor(
    private readonly sender: BrowserWindowSender,
    readonly onMessage: Event<VSBuffer>,
  ) {}

  send(message: VSBuffer): void {
    try {
      this.sender.send('webview:ipc:message', message.buffer as Buffer);
    } catch (e) {
      // systems are going down
    }
  }

  dispose(): void {
    this.sender.send('webview:ipc:disconnect', null);
  }
}
