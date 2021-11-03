import { mainLog } from '@modern-js/electron-log';
import { PROCESS_ENV } from './common/constants/envs';
import { IPC_CHANNELS } from './common/constants/ipc';
import { injectServices } from './common/utils/injectUserServices';
import { Disposable } from './core/base/common/lifecycle';
import { Server as ElectronIPCServer } from './core/base/parts/ipc/electron-main/ipc.electron-main';
import { createChannelReceiver } from './core/base/parts/ipc/node/ipc';
import { SyncDescriptor } from './core/instantiation/descriptors';
import {
  IInstantiationService,
  ServicesAccessor,
} from './core/instantiation/instantiation';
import { ServiceCollection } from './core/instantiation/serviceCollection';
import { IStartOption } from './interfaces/common';
import { serviceManager } from './services/index.main';
import {
  ILifecycleMainService,
  LifecycleMainPhase,
} from './services/lifecycle/common/lifecycle';
import { IRenderService } from './services/render/common/render';
import { RenderChannel } from './services/render/common/renderIpc';
import { RenderService } from './services/render/electron-main/render';
import { IUpdateService } from './services/update/common/update';
import { DarwinUpdateService } from './services/update/electron-main/updateService.darwin';
import {
  IWindow,
  IWindowsMainService,
} from './services/windows/common/windows';
import { WindowsMainService } from './services/windows/electron-main/windows';

export class Application extends Disposable {
  constructor(
    @IInstantiationService
    private readonly instantiationService: IInstantiationService,
    @ILifecycleMainService
    private readonly lifecycleMainService: ILifecycleMainService,
  ) {
    super();
  }

  async init(options: IStartOption): Promise<void> {
    // create ipc server
    const { appInstantiationService, electronIpcServer } =
      await this.initIpcAndServices(options);

    // init ipc channel
    appInstantiationService.invokeFunction(accessor =>
      this.initIpcChannels(accessor, electronIpcServer),
    );
    // set process pid
    process.env[PROCESS_ENV.APP_PID] = String(process.pid);
  }

  private initIpcChannels(
    accessor: ServicesAccessor,
    electronIpcServer: ElectronIPCServer,
  ): void {
    const updateService = accessor.get(IUpdateService);
    const updateChannel = createChannelReceiver(updateService);
    electronIpcServer.registerChannel(IPC_CHANNELS.UPDATE, updateChannel);

    const renderService = accessor.get(IRenderService);
    const windowsMainService = accessor.get(IWindowsMainService);
    const renderChannel = new RenderChannel(renderService, windowsMainService);
    mainLog.info('register ipc server first');
    electronIpcServer.registerChannel(IPC_CHANNELS.RENDER, renderChannel);

    const lifeCycleService = accessor.get(ILifecycleMainService);
    const lifeCycleChannel = createChannelReceiver(lifeCycleService);
    electronIpcServer.registerChannel(IPC_CHANNELS.LIFECYCLE, lifeCycleChannel);

    const windowsMainServiceChannel = createChannelReceiver(windowsMainService);
    electronIpcServer.registerChannel(
      IPC_CHANNELS.WINDOWS_MANAGER,
      windowsMainServiceChannel,
    );

    // Signal phase: ready (services set)
    this.lifecycleMainService.phase = LifecycleMainPhase.Ready;
  }

  private async initIpcAndServices(options: IStartOption): Promise<{
    electronIpcServer: ElectronIPCServer;
    appInstantiationService: IInstantiationService;
  }> {
    const electronIpcServer = new ElectronIPCServer();
    const appInstantiationService = await this.createServices(
      electronIpcServer,
      options,
    );
    return {
      electronIpcServer,
      appInstantiationService,
    };
  }

  private createServices(
    electronIPCServer: ElectronIPCServer,
    options: IStartOption,
  ): Promise<IInstantiationService> {
    const services = new ServiceCollection();
    const { windowsConfig, mainServices } = options;
    services.set(
      IWindowsMainService,
      new SyncDescriptor(WindowsMainService, [
        electronIPCServer,
        windowsConfig,
      ]),
    );

    // use electron-updater for all
    services.set(IUpdateService, new SyncDescriptor(DarwinUpdateService));

    const renderService = new RenderService(this.instantiationService);
    services.set(
      IRenderService,
      injectServices(mainServices || {}, renderService),
    );
    const result = this.instantiationService.createChild(services);

    // init serviceManager, need to createChild first
    serviceManager.init(result);

    return Promise.resolve(result);
  }
}
