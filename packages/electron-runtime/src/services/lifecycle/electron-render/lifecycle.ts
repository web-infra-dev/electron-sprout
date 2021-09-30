import { Client } from '../../../core/base/parts/ipc/electron-browser/ipc.electron-browser';
import { IChannel } from '../../../core/base/parts/ipc/common/ipc';
import { IQuitOptions, ILifecycleService } from '../common/lifecycle';

export class LifecycleService implements ILifecycleService {
  private readonly mainProcessConnection: Client;

  private readonly channel: IChannel;

  constructor(mainProcessConnection: Client) {
    this.mainProcessConnection = mainProcessConnection;
    this.channel = this.getChannel('lifeCycle');
  }

  quit(options?: IQuitOptions): Promise<boolean> {
    return this.channel.call('quit', [options]);
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
