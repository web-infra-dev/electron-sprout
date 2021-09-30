import { IQuitOptions } from '@/common';
import { lifecycleService as service } from '@/services/index.render';

export const lifecycleService = {
  quit(options?: IQuitOptions): Promise<boolean> {
    return service.quit(options);
  },
  relaunch(options?: {
    addArgs?: string[];
    removeArgs?: string[];
  }): Promise<void> {
    return service.relaunch(options);
  },
  call(funcName: string, ...args: any): Promise<any> {
    return service.call(funcName, ...args);
  },
};
