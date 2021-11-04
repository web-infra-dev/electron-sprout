import { IUpdateProgressInfo, UpdateOption } from '../common/update';
import { IDisposable } from '../../../core/base/common/lifecycle';

import { createDecorator } from '../../../core/instantiation/instantiation';

export const IUpdateService = createDecorator<IUpdateService>('updateService');

export interface IUpdateService {
  checkUpdate(options: UpdateOption): Promise<any>;
  onUpdateProgress(
    callBack: (progress: IUpdateProgressInfo) => any,
  ): IDisposable;
  onUpdateIdle(callBack: (...args: any) => any): IDisposable;
  onUpdateError(callBack: (...args: any) => any): IDisposable;
  onUpdateDone(callBack: (...args: any) => any): IDisposable;
  restartAndInstall(...args: any): void;
}
