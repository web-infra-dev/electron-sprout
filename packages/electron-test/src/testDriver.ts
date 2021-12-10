// used in tests

import { ChildProcess } from 'child_process';
import { join } from 'path';
import { existsSync } from 'fs';
import { devMainProcess } from '@modern-js/electron-tools';

export type IMessage = {
  msgId: number;
  resolve: (value: unknown) => void;
  reject: (reason?: any) => void;
};

interface ITestDriverOptions {
  cwd: string;
  envs?: any;
}

export const isTsProject = (cwd: string) => {
  const tsconfig = join(cwd, 'tsconfig.json');
  return existsSync(tsconfig);
};

class ElectronTestDriver {
  public isReady: Record<string, boolean> = {};

  private rpcCalls: ({
    resolve: (value: unknown) => void;
    reject: (reason?: any) => void;
  } | null)[];

  private readonly process: ChildProcess;

  private _isRunning: boolean = true;

  constructor(options: ITestDriverOptions) {
    const { envs, cwd } = options;
    this.rpcCalls = [];

    this.process = devMainProcess({
      userProjectPath: cwd,
      env: {
        ...process.env,
        APP_TEST_DRIVER: '1',
        TEST_FOLDER: 1,
        NODE_ENV: 'development',
        ...envs,
      },
      entryFilePath: `./electron/main${isTsProject(cwd) ? '.ts' : '.js'}`,
      stdio: ['inherit', 'inherit', 'inherit', 'ipc'],
    });
    this.registerMessageListener();

    this.process.on('close', () => {
      this._isRunning = false;
    });
  }

  isRunning() {
    return this._isRunning;
  }

  checkReady(options: { winName?: string; webviewId?: string }) {
    const { webviewId, winName } = options;
    if (!winName) {
      return this.isReady.__main_process_;
    }
    if (!webviewId) {
      return this.isReady[winName];
    }
    return this.isReady[`${winName}_${webviewId}`];
  }

  setReady(options: { winName?: string; webviewId?: string }) {
    const { webviewId, winName } = options;
    if (!winName) {
      this.isReady.__main_process_ = true;
      return;
    }
    if (!webviewId) {
      this.isReady[winName] = true;
      return;
    }
    this.isReady[`${winName}_${webviewId}`] = true;
  }

  whenReady(
    winName?: string,
    options?: {
      timeout?: number;
      webviewId?: string;
    },
  ) {
    if (this.checkReady({ winName, webviewId: options?.webviewId })) {
      return Promise.resolve(true);
    }
    const { timeout, webviewId } = options || {};
    return this.call({
      funcName: 'isReady',
      args: [{ winName, timeout, webviewId }],
    })
      .then(() => {
        this.setReady({ webviewId, winName });
      })
      .catch(err => {
        console.error('Application failed to start', err);
        this.stop();
        process.exit(1);
      });
  }

  stop() {
    this.process.kill();
  }

  async call(options: {
    funcName: string;
    winName?: string;
    args?: any[];
  }): Promise<any> {
    // send rpc request
    const msgId = this.rpcCalls.length;
    this.process.send({ ...options, msgId });
    return new Promise((resolve, reject) =>
      this.rpcCalls.push({ resolve, reject }),
    );
  }

  private registerMessageListener() {
    this.process.on('message', (message: IMessage) => {
      // pop the handler
      const rpcCall = this.rpcCalls[message.msgId];
      if (!rpcCall) {
        return;
      }
      this.rpcCalls[message.msgId] = null;
      // reject/resolve
      if (message.reject) {
        rpcCall.reject(message.reject);
      } else {
        rpcCall.resolve(message.resolve);
      }
    });
  }
}

export type ElectronTestDriverType = ElectronTestDriver;

export default ElectronTestDriver;
