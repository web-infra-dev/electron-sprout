import { IServerChannel } from '../../../core/base/parts/ipc/common/ipc';
import { Event } from '../../../core/base/common/event';
import { IWindowsMainService } from '../../windows/common/windows';
import { IRenderService } from './render';

const isPromise = (obj: any) =>
  Boolean(obj) &&
  (typeof obj === 'object' || typeof obj === 'function') &&
  typeof obj.then === 'function';

export class RenderChannel implements IServerChannel {
  constructor(
    private readonly service: IRenderService,
    @IWindowsMainService
    public readonly windowsMainService: IWindowsMainService,
  ) {}

  listen(_: unknown, event: string): Event<any> {
    throw new Error(`Not support listen event currently: ${event}`);
  }

  call(_: unknown, command: string, arg?: any): Promise<any> {
    let obj: any = this.service;
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

    if (
      obj[execFunc] ||
      (obj.__proto__ && obj.__proto__.hasOwnProperty(execFunc))
    ) {
      if (typeof obj[execFunc] === 'function') {
        try {
          const result = obj[execFunc](...arg);
          if (isPromise(result)) {
            return result;
          }
          return Promise.resolve(result);
        } catch (error) {
          return Promise.reject(error);
        }
      } else {
        return Promise.resolve(obj[execFunc]);
      }
    }
    throw new Error(`command not found: ${command}`);
  }
}
