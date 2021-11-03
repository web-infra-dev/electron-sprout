import {
  createDecorator,
  IInstantiationService,
} from '../../../core/instantiation/instantiation';

export const IRenderService = createDecorator<IRenderService>('renderService');

export interface IRenderService {
  _serviceBrand: undefined;
  readonly instantiationService: IInstantiationService;
}
