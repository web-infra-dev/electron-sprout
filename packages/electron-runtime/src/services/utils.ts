import { ICustomServerChannel } from '@/core/base/parts/ipc/common/ipc';
import { IChannelReceiverOptions } from '@/core/base/parts/ipc/node/ipc';
import { Event } from '@/core/base/common/event';
import { revive } from '@/core/base/common/marshalling';

export function createCustomChannelReceiver(
  services: unknown,
  options?: IChannelReceiverOptions,
): ICustomServerChannel {
  const handlers = services as { [key: string]: unknown };
  const disableMarshalling = options && options.disableMarshalling;

  const isPromise = (obj: any) =>
    Boolean(obj) &&
    (typeof obj === 'object' || typeof obj === 'function') &&
    typeof obj.then === 'function';

  return new (class implements ICustomServerChannel {
    private services: { [key: string]: unknown } = handlers || {};

    updateServices(services: { [key: string]: unknown }) {
      this.services = {
        ...this.services,
        ...services,
      };
    }

    listen<T>(_: unknown, event: string): Event<T> {
      throw new Error(`Event not found: ${event}`);
    }

    call(_: unknown, command: string, args?: any[]): Promise<any> {
      let obj: any = this.services;
      let execFunc: string = command;
      const funcNameArray = command.split('.');
      while (funcNameArray.length > 1) {
        const name = funcNameArray.shift();
        if (name) {
          if (!obj[name]) {
            throw Error(`command not found: ${command}`);
          }
          obj = obj[name];
        }
      }
      const _command = funcNameArray.shift();
      if (!_command) {
        throw Error(`exec command failed: ${command}`);
      }
      execFunc = _command;

      const target = obj[execFunc];
      if (typeof target === 'function') {
        // Revive unless marshalling disabled
        if (!disableMarshalling && Array.isArray(args)) {
          for (let i = 0; i < args.length; i++) {
            args[i] = revive(args[i]);
          }
        }
        try {
          const result = target.apply(obj, args);
          if (isPromise(result)) {
            return result;
          }
          return Promise.resolve(result);
        } catch (error) {
          return Promise.reject(error);
        }
      }

      throw new Error(`Method not found in channel: ${command}`);
    }
  })();
}
