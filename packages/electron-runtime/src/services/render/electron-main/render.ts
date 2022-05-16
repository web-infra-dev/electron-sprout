import { ipcMain } from 'electron';
import { Disposable } from '../../../core/base/common/lifecycle';
import { IInstantiationService } from '../../../core/instantiation/instantiation';
import { IRenderService } from '../common/render';
import { IPC_EVENTS } from '@/common/constants/events';
import { APP_ROOT } from '@/common/constants/paths';

export class RenderService extends Disposable implements IRenderService {
  _serviceBrand: undefined;

  public readonly serviceName: string = 'RenderService';

  constructor(
    @IInstantiationService
    public readonly instantiationService: IInstantiationService,
  ) {
    super();
    ipcMain.on(IPC_EVENTS.GET_APP_ROOT, e => {
      e.returnValue = APP_ROOT;
    });
  }
}
