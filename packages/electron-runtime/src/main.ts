import _ from 'lodash';
import { app, Menu } from 'electron';
import { Application } from './application';
import { handleWindowConfig } from './common/user-config';
import { MENU_TEMPLATE } from './common/utils/menuTemplate';
import { SyncDescriptor } from './core/instantiation/descriptors';
import { InstantiationService } from './core/instantiation/instantiationService';
import { ServiceCollection } from './core/instantiation/serviceCollection';
import { IStartOption } from './interfaces/common';
import { ILifecycleMainService } from './services/lifecycle/common/lifecycle';
import { LifecycleService } from './services/lifecycle/electron-main/lifecycle';

class ElectronRuntime {
  constructor(private readonly options: IStartOption) {}

  init(): Promise<void> {
    if (!app.isReady()) {
      throw Error('should use initServices after app ready!');
    }
    this.setDefaultMenu();
    return this.createIOCInstance();
  }

  private createIOCInstance() {
    const services = this.createServices();
    const instantiationService = new InstantiationService(services, true);
    const { windowsConfig, windowsBaseConfig } = this.options;
    return instantiationService.createInstance(Application).init({
      ...this.options,
      windowsConfig: handleWindowConfig(windowsConfig, windowsBaseConfig),
    });
  }

  /**
   * create default services
   * register services for render process to call
   * same way as v3
   */
  private createServices(): ServiceCollection {
    const services = new ServiceCollection();
    // const environmentService = new EnvironmentService(process.execPath);
    // services.set(IEnvironmentService, environmentService);
    services.set(ILifecycleMainService, new SyncDescriptor(LifecycleService));
    // render service for render to call
    return services;
  }

  private setDefaultMenu() {
    Menu.setApplicationMenu(
      Menu.buildFromTemplate(this.options.menuTemplate || MENU_TEMPLATE),
    );
  }
}

export default ElectronRuntime;
