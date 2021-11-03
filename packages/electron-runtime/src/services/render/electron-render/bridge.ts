import { IChannel } from '../../../core/base/parts/ipc/common/ipc';
import { Client } from '../../../core/base/parts/ipc/electron-browser/ipc.electron-browser';

class Bridge {
  private readonly mainProcessConnection: Client;

  private readonly channel: IChannel;

  constructor(mainProcessConnection: Client) {
    this.mainProcessConnection = mainProcessConnection;
    this.channel = this.getChannel('render');
  }

  public callMain(funcName: string, ...args: any[]): Promise<any> {
    return this.channel.call(funcName, args);
  }

  private getChannel(channelName: string): IChannel {
    return this.mainProcessConnection.getChannel(channelName);
  }
}

export { Bridge };
