import { Disposable } from '../../../core/base/common/lifecycle';
import { IInstantiationService } from '../../../core/instantiation/instantiation';
import { IRenderService } from '../common/render';

export class RenderService extends Disposable implements IRenderService {
  _serviceBrand: undefined;

  public readonly serviceName: string = 'RenderService';

  constructor(
    @IInstantiationService
    public readonly instantiationService: IInstantiationService,
  ) {
    super();
  }
}
