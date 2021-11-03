import { IDisposable, IUpdateProgressInfo, UpdateOption } from '@/common';
import { updateService as service } from '@/services/index.render';

export const updateService = {
  checkUpdate(options: UpdateOption) {
    return service.checkUpdate(options);
  },
  onUpdateProgress(
    callBack: (progress: IUpdateProgressInfo) => any,
  ): IDisposable {
    return service.onUpdateProgress(callBack);
  },
  onUpdateIdle(callBack: (...args: any) => any): IDisposable {
    return service.onUpdateIdle(callBack);
  },
  onUpdateError(callBack: (...args: any) => any): IDisposable {
    return service.onUpdateError(callBack);
  },
  onUpdateDone(callBack: (...args: any) => any): IDisposable {
    return service.onUpdateDone(callBack);
  },
  restartAndInstall(...args: any): void {
    return service.restartAndInstall(...args);
  },
};
