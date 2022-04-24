import { mainLog } from '@modern-js/electron-log';
import _ from 'lodash';
import { app, Menu } from 'electron';
import { initialize } from '@electron/remote/main';
import { Application } from './application';
import { IS_DEV } from './common/constants/constants';
import { handleWindowConfig } from './common/user-config';
import { configureCommandlineSwitche } from './common/utils/configureCommandlineSwitch';
import { fixDotNetVersionBug } from './common/utils/fixDotNetVersionBug';
import { fixEnvsInMainProcess } from './common/utils/fixEnvsInMainProcess';
import { MENU_TEMPLATE } from './common/utils/menuTemplate';
import { SyncDescriptor } from './core/instantiation/descriptors';
import { InstantiationService } from './core/instantiation/instantiationService';
import { ServiceCollection } from './core/instantiation/serviceCollection';
import { IStartOption } from './interfaces/common';
import { ILifecycleMainService } from './services/lifecycle/common/lifecycle';
import { LifecycleService } from './services/lifecycle/electron-main/lifecycle';

class ElectronRuntime {
  private syncShellEnv: boolean = true; // 默认为 true

  private fixDotNetVersion: boolean = true;

  constructor(private readonly options: IStartOption) {
    this.syncShellEnv = _.has(options, 'syncShellEnv')
      ? (options.syncShellEnv as boolean)
      : true;
    this.fixDotNetVersion = _.has(options, 'fixDotNetVersion')
      ? (options.fixDotNetVersion as boolean)
      : true;
    this.initEnvs();
  }

  /**
   * do somework before app ready
   * such as fix .net version bug.
   */
  private initEnvs() {
    if (this.fixDotNetVersion) {
      fixDotNetVersionBug();
    }
    this.initEnvironment();
  }

  init(): Promise<void> {
    if (!app.isReady()) {
      throw Error('should use initServices after app ready!');
    }
    this.setDefaultMenu();
    this.installExtensions();
    return this.createIOCInstance();
  }

  private initEnvironment() {
    initialize();
    configureCommandlineSwitche();
    if (this.syncShellEnv) {
      fixEnvsInMainProcess();
    }
  }

  private installExtensions() {
    if (IS_DEV) {
      // 安装 react devtools
      const extenions = require('electron-devtools-installer').default;
      const { REACT_DEVELOPER_TOOLS } = require('electron-devtools-installer');
      extenions(REACT_DEVELOPER_TOOLS)
        .then((name: any) => mainLog.info(`add plugin：${name}`))
        .catch((err: Error) =>
          mainLog.error(`add plugin ${err.message} error:`, err),
        );
    }
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
