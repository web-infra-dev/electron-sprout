import { Client } from '../../../core/base/parts/ipc/electron-browser/ipc.electron-browser';
import { IChannel } from '../../../core/base/parts/ipc/common/ipc';
import { ILifecycleService } from '../common/lifecycle';
import { IPC_CHANNELS } from '@/common/constants/ipc';

export class LifecycleService implements ILifecycleService {
  private readonly mainProcessConnection: Client;

  private readonly channel: IChannel;

  constructor(mainProcessConnection: Client) {
    this.mainProcessConnection = mainProcessConnection;
    this.channel = this.getChannel(IPC_CHANNELS.LIFECYCLE);
  }

  quit(): Promise<boolean> {
    return this.channel.call('quit');
  }

  kill(exitCode?: number): Promise<boolean> {
    return this.channel.call('kill', [exitCode]);
  }

  relaunch(options?: {
    addArgs?: string[];
    removeArgs?: string[];
  }): Promise<void> {
    return this.channel.call('relaunch', [options]);
  }

  call(funcName: string, ...args: any): Promise<any> {
    return this.channel.call(funcName, ...args);
  }

  private getChannel(channelName: string): IChannel {
    return this.mainProcessConnection.getChannel(channelName);
  }
}
