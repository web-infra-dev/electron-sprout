import { ServiceIdentifier } from '../core/instantiation/serviceCollection';
import { IInstantiationService } from '../core/instantiation/instantiation';
import { ILifecycleMainService } from './lifecycle/common/lifecycle';
import { IUpdateService } from './update/common/update';
import { IWindowsMainService } from './windows/common/windows';

class ServiceManager {
  public instanceService!: IInstantiationService;

  init(instanceService: IInstantiationService) {
    this.instanceService = instanceService;
  }

  whenReady() {
    if (this.instanceService) {
      return Promise.resolve(true);
    }
    const manager = this;
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('init services timeout!'));
      }, 1000);
      const timer = setInterval(() => {
        if (manager.instanceService) {
          clearInterval(timer);
          clearTimeout(timeout);
          resolve(true);
        }
      }, 10);
    });
  }

  getService<T>(id: ServiceIdentifier<T>): T {
    const manager = this;
    const checkInstance = () => {
      if (!manager.instanceService) {
        throw Error('should use this after runtime.start !');
      }
    };
    return new Proxy(Object.create(null), {
      get(_target: T, prop: PropertyKey): any {
        checkInstance();
        const service = manager.instanceService.invokeFunction(accessor =>
          accessor.get(id),
        );
        return (service as any)[prop];
      },
      set(_target: T, p: PropertyKey, value: any): boolean {
        checkInstance();
        const service = manager.instanceService.invokeFunction(accessor =>
          accessor.get(id),
        );
        (service as any)[p] = value;
        return true;
      },
    });
  }

  getUpdateService(): IUpdateService {
    return this.getService(IUpdateService);
  }

  getLifecycleMainService(): ILifecycleMainService {
    return this.getService(ILifecycleMainService);
  }

  getWindowsService(): IWindowsMainService {
    return this.getService(IWindowsMainService);
  }
}

const serviceManager = new ServiceManager();
const winService = serviceManager.getWindowsService();
const updateService = serviceManager.getUpdateService();
const lifecycleService = serviceManager.getLifecycleMainService();

export { serviceManager, winService, updateService, lifecycleService };
