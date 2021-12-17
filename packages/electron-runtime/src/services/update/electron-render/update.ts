import { ipcRenderer as ipc } from 'electron';
import { renderLog } from '@modern-js/electron-log';
import { Event } from '../../../core/base/common/event';
import { IPC_EVENTS } from '../../../common/constants/events';
import { IChannel } from '../../../core/base/parts/ipc/common/ipc';
import { Client } from '../../../core/base/parts/ipc/electron-browser/ipc.electron-browser';
import { IDisposable } from '../../../core/base/common/lifecycle';
import { IUpdateProgressInfo, UpdateOption } from '../common/update';
import { IUpdateService } from './IUpdate';

export class UpdateService implements IUpdateService {
  private readonly mainProcessConnection: Client;

  private readonly channel: IChannel;

  constructor(mainProcessConnection: Client) {
    this.mainProcessConnection = mainProcessConnection;
    this.channel = this.getChannel('update');
  }

  protected getChannel(channelName: string): IChannel {
    return this.mainProcessConnection.getChannel(channelName);
  }

  checkUpdate(options: UpdateOption) {
    return this.channel.call('checkForUpdates', [options]);
  }

  onUpdateProgress(
    callBack: (progress: IUpdateProgressInfo) => any,
  ): IDisposable {
    const registerListeners = Event.fromNodeEventEmitter<any>(
      ipc,
      IPC_EVENTS.APP_UPDATE_PROGRESS,
      (_, args) => args,
    );
    return registerListeners(callBack);
  }

  // current is the latest version.
  onUpdateIdle(callBack: (...args: any) => any): IDisposable {
    const registerListeners = Event.fromNodeEventEmitter<any>(
      ipc,
      IPC_EVENTS.APP_UPDATE_IDLE,
      (_, args) => args,
    );
    return registerListeners(callBack);
  }

  onUpdateError(callBack: (...args: any) => any): IDisposable {
    const registerListeners = Event.fromNodeEventEmitter<any>(
      ipc,
      IPC_EVENTS.APP_UPDATE_ERROR,
      (_, args) => args,
    );
    return registerListeners(callBack);
  }

  onUpdateDone(callBack: (...args: any) => any): IDisposable {
    const registerListeners = Event.fromNodeEventEmitter<any>(
      ipc,
      IPC_EVENTS.APP_UPDATE_AND_RESTART,
      (_, args) => args,
    );
    return registerListeners(callBack);
  }

  restartAndInstall(...args: any): void {
    this.channel
      .call('applyUpdate', args)
      .catch(err => renderLog.info('call restartAndInstallError:', err));
  }
}
