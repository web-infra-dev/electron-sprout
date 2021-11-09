import { WebviewTag } from 'electron';
import { renderLog } from '@modern-js/electron-log';
import { Connection, IPCServer } from '../../../core/base/parts/ipc/common/ipc';
import { WebviewIpcServer } from '../../../core/base/parts/ipc/electron-browser/ipc.electron-browser';
import { createChannelReceiver } from '../../../core/base/parts/ipc/node/ipc';
import { Disposable } from '../../../core/base/common/lifecycle';
import { IWebviewService } from '../common/webview';
import { Emitter, Event as CommonEvent } from '../../../core/base/common/event';

const WEBVIEW_IPC_CHANNEL = 'webview_ipc_channel';

interface WebviewServerInfo {
  webview: Electron.WebviewTag;
  webviewId: string;
  webviewServer?: IPCServer;
}

const WEBVIEW_IPC_CHANNEL_NAME = 'webviewIpcManager';
const PARENT_WINDOW_IPC_SERVER_CREATED_CHANNEL =
  'parent_window_ipc_server_created_channel';

type PromiseResult = {
  resolve?: (...args: any) => any;
  reject?: (...args: any) => any;
};

type PendingRequest = {
  data: any;
  funcName: string;
  promise: PromiseResult;
  timeoutTimer: any;
};

type IRawPromiseRequest = {
  webviewId: string;
  funcName: string;
  data: any;
};

// used in electron-render

export class WebviewService extends Disposable implements IWebviewService {
  _serviceBrand: undefined;

  private readonly webviewServers: Map<string, WebviewServerInfo> = new Map<
    string,
    WebviewServerInfo
  >();

  // webview services registered map.
  // key is webview id
  // value is whether has registered services.
  // private webviewServicesRegistedInfo: Map<string, boolean> = new Map<
  //   string,
  //   boolean
  // >();

  private readonly _onWebviewReady = this._register(new Emitter<WebviewTag>());

  readonly onWebviewReady: CommonEvent<WebviewTag> = this._onWebviewReady.event;

  private isRegistered: boolean = false;

  // Requests might come in for channels which are not yet registered.
  // They will timeout after `timeoutDelay`.
  private readonly pendingRequests = new Map<string, PendingRequest[]>();

  private services: any = null;

  constructor(private timeoutDelay: number = 1000) {
    super();
  }

  setTimeoutDelay(timeoutDelay: number) {
    this.timeoutDelay = timeoutDelay;
  }

  private getWebviewIpcServer(webviewId: string): IPCServer | undefined {
    const webviewInfo = this.webviewServers.get(webviewId);
    if (!webviewInfo) {
      return undefined;
    }
    return webviewInfo.webviewServer;
  }

  private collectPendingRequest(request: IRawPromiseRequest) {
    let pendingRequests = this.pendingRequests.get(request.webviewId);
    if (!pendingRequests) {
      pendingRequests = [];
      this.pendingRequests.set(request.webviewId, pendingRequests);
    }
    const promiseResult: PromiseResult = {};
    const promise: Promise<any> = new Promise((resolve, reject) => {
      promiseResult.resolve = resolve;
      promiseResult.reject = reject;
    });

    const timer = setTimeout(() => {
      const errMsg = `${request.webviewId} connect to browserWindow timeout!`;
      renderLog.error(errMsg);
      promiseResult.reject && promiseResult.reject(new Error(errMsg));
    }, this.timeoutDelay);

    pendingRequests.push({
      data: request.data,
      funcName: request.funcName,
      timeoutTimer: timer,
      promise: promiseResult,
    });
    return promise;
  }

  callWebview(
    webviewId: string,
    funcName: string,
    ...args: any[]
  ): Promise<any> {
    const webviewIpcServer = this.getWebviewIpcServer(webviewId);

    // wait for connection.
    if (!webviewIpcServer || webviewIpcServer.connections.length < 1) {
      return this.collectPendingRequest({ webviewId, data: args, funcName });
    }
    if (!webviewIpcServer) {
      renderLog.warn(
        `webview: ${webviewId} hasn't started ipcServer， you can use webviewService.addWebview to start！`,
      );
      return Promise.resolve();
    }
    // one webview only map to one ipcServier
    const connection = webviewIpcServer.connections[0];
    return connection.channelClient
      .getChannel(WEBVIEW_IPC_CHANNEL_NAME)
      .call(funcName, args);
  }

  dispose() {
    this.webviewServers.forEach(each => {
      each.webviewServer?.dispose();
    });
    this.webviewServers.clear();
  }

  getWebviewById(webviewId: string): WebviewTag | null {
    const element = document.getElementById(webviewId);

    if (!element) {
      return null;
    }
    if (element?.tagName !== 'WEBVIEW') {
      throw Error(
        `the element(with id: ${webviewId}) is not a webview type is：${element?.tagName}`,
      );
    }
    return element as WebviewTag;
  }

  registerServices(services: object) {
    if (!this.isRegistered) {
      this.isRegistered = true;
      this.services = services;
      this.webviewServers.forEach(each => {
        if (
          each.webviewServer &&
          !each.webviewServer.getChannelByName(WEBVIEW_IPC_CHANNEL)
        ) {
          const userServices = this.services || {};
          const channel = createChannelReceiver(userServices);
          each.webviewServer.registerChannel(WEBVIEW_IPC_CHANNEL, channel);
        }
      });
    } else {
      renderLog.warn('services has registered, do not regist again！');
    }
  }

  removeWebviewIpcServer(webviewId: string): void {
    const webview = this.webviewServers.get(webviewId);
    if (webview) {
      webview.webviewServer?.dispose();
      this.webviewServers.delete(webviewId);
    }
  }

  getWebviewIds(): number[] {
    const ids: number[] = [];
    this.webviewServers.forEach(each => {
      ids.push(each.webview.getWebContentsId());
    });
    return ids;
  }

  onMessage<T>(webviewId: string, channel: string): CommonEvent<T> {
    const webview: WebviewTag | null = this.getWebviewById(webviewId);
    if (!webview) {
      throw Error(`can't found webview: ${webviewId}`);
    }
    const event = CommonEvent.fromDOMEventEmitter(
      webview,
      'ipc-message',
      (e: Electron.IpcMessageEvent) => {
        if (e.args.length < 1) {
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
    return CommonEvent.map(
      CommonEvent.filter(event, ({ event }) => event.channel === channel),
      ({ message }) => message,
    );
  }

  private flushPendingRequests(
    webviewId: string,
    connection: Connection<string>,
  ): void {
    const requests = this.pendingRequests.get(webviewId) || [];
    const handler = async (request: PendingRequest) => {
      try {
        const result = await connection.channelClient
          .getChannel(WEBVIEW_IPC_CHANNEL_NAME)
          .call(request.funcName, request.data);
        request.promise.resolve && request.promise.resolve(result);
      } catch (error) {
        request.promise.reject && request.promise.reject(error);
      }
    };
    for (const request of requests) {
      clearTimeout(request.timeoutTimer);
      handler(request);
    }
    this.pendingRequests.delete(webviewId);
  }

  private createWebviewIpcServer(webviewId: string, webview: WebviewTag) {
    const server = new WebviewIpcServer(webview, webviewId);
    // if addWebview is used before registereds, so when registereds,
    // still need to create channel
    // if addWebview is used after registereds, here should registerServices
    if (this.services) {
      const channel = createChannelReceiver(this.services);
      server.registerChannel(WEBVIEW_IPC_CHANNEL, channel);
    }
    if (server) {
      let hasConnected = false;
      // each 0.1 s to send a msg for ipc server created.
      // if connect to the server, stop to send msg.
      // so can make sure that webview has known server created.
      const timer = setInterval(() => {
        this.sendToWebview(webviewId, PARENT_WINDOW_IPC_SERVER_CREATED_CHANNEL);
      }, 400);

      // set timeout for send msg with 10 s
      const timeout = setTimeout(() => {
        if (!hasConnected) {
          renderLog.warn(`wait for webview(${webviewId}) connect timeout!`);
          clearInterval(timer);
        }
      }, 10000);
      const onDidChangeConnections = CommonEvent.once(
        server.onDidChangeConnections,
      );
      onDidChangeConnections((e: Connection<string>) => {
        hasConnected = true;
        clearInterval(timer);
        clearTimeout(timeout);
        this.flushPendingRequests(webviewId, e);
      });
    }
    this.sendToWebview(webviewId, PARENT_WINDOW_IPC_SERVER_CREATED_CHANNEL);
    return server;
  }

  addWebview(
    webviewId: string,
    withIpcServer = true,
  ): WebviewIpcServer | undefined {
    const webview = this.getWebviewById(webviewId);
    if (webview) {
      let server: WebviewIpcServer | undefined;
      if (withIpcServer) {
        server = this.createWebviewIpcServer(webviewId, webview);
      }

      this.webviewServers.set(webviewId, {
        webview,
        webviewId,
        webviewServer: server,
      });
      return server;
    }
    throw Error(`can't found webview: ${webviewId}`);
  }

  sendToWebview(webviewId: string, channel: string, data?: any) {
    const webview = this.getWebviewById(webviewId);
    if (webview) {
      webview.send(channel, data);
    }
  }

  broadCast(channel: string, data: any): void {
    this.webviewServers.forEach(each => {
      this.sendToWebview(each.webviewId, channel, data);
    });
  }
}
