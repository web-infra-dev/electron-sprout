import { ipcRenderer } from 'electron';
import { Event } from '../../../common/event';
import { IPCClient } from '../common/ipc';
import { IDisposable } from '../../../common/lifecycle';
import { VSBuffer } from '../../../common/buffer';
import { WebviewProtocol } from '../node/ipc.webview';

// webview 中
export class WebviewIpcClient extends IPCClient implements IDisposable {
  private readonly protocol: WebviewProtocol;

  private static createProtocol(): WebviewProtocol {
    const onMessage = Event.fromNodeEventEmitter<VSBuffer>(
      ipcRenderer,
      'webview:ipc:message',
      (_, message: Buffer) => VSBuffer.wrap(message),
    );
    ipcRenderer.sendToHost('webview:ipc:hello');
    return new WebviewProtocol(ipcRenderer, onMessage);
  }

  constructor(id: string) {
    const protocol = WebviewIpcClient.createProtocol();
    super(protocol, id);
    this.protocol = protocol;
  }

  dispose(): void {
    this.protocol.dispose();
  }
}
