import { lifecycleService as service } from '@/services/index.render';

export const lifecycleService = {
  quit(): Promise<boolean> {
    return service.quit();
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
