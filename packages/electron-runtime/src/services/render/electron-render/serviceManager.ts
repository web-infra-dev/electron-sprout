import { renderLog } from '@modern-js/electron-log';
import { Event } from '@/core/base/common/event';
import { ServiceCollection } from '@/core/instantiation/serviceCollection';
import { IUpdateService } from '@/services/update/electron-render/IUpdate';
import { IWindowsService } from '@/services/windows/electron-render/IWindows';
import { WindowsService } from '@/services/windows/electron-render/windows';
import { IWebviewService } from '@/services/webview/common/webview';
import { WebviewService } from '@/services/webview/electron-render/webview';
import { Client } from '@/core/base/parts/ipc/electron-browser/ipc.electron-browser';
import { ILifecycleService } from '@/services/lifecycle/common/lifecycle';
import { LifecycleService } from '@/services/lifecycle/electron-render/lifecycle';
import { UpdateService } from '@/services/update/electron-render/update';

export default class ServiceManager {
  private readonly services: ServiceCollection;

  constructor(
    private readonly mainProcessConnection: Client,
    private readonly windowId: number,
  ) {
    this.services = new ServiceCollection();
  }

  getWindowsService(): IWindowsService {
    const service = this.services.get(IWindowsService);
    if (service) {
      return this.services.get(IWindowsService) as IWindowsService;
    }
    const webviewService = this.getWebviewService();
    const winService = new WindowsService(
      this.mainProcessConnection,
      this.windowId,
    );
    // unload this when browserWindow is unmounting.
    const onUnload = Event.once(
      Event.fromDOMEventEmitter(window, 'unload', e => e),
    );

    onUnload(async () => {
      const webviewIds = webviewService.getWebviewIds();
      renderLog.info(
        'dispose all webview connections',
        webviewIds,
        new Date().getTime(),
      );

      if (webviewIds.length > 0) {
        await winService.disposeWebviewConnection(webviewIds);
      }
      webviewService.dispose();
      winService.dispose();
    });
    this.services.set(IWindowsService, winService);
    return this.services.get(IWindowsService) as IWindowsService;
  }

  getUpdateService(): IUpdateService {
    if (this.services.has(IUpdateService)) {
      return this.services.get(IUpdateService) as IUpdateService;
    }
    this.services.set(
      IUpdateService,
      new UpdateService(this.mainProcessConnection),
    );
    return this.services.get(IUpdateService) as IUpdateService;
  }

  getLifecycleService(): ILifecycleService {
    if (this.services.has(ILifecycleService)) {
      return this.services.get(ILifecycleService) as ILifecycleService;
    }
    this.services.set(
      ILifecycleService,
      new LifecycleService(this.mainProcessConnection),
    );
    return this.services.get(ILifecycleService) as ILifecycleService;
  }

  getWebviewService(): IWebviewService {
    if (this.services.has(IWebviewService)) {
      return this.services.get(IWebviewService) as IWebviewService;
    }
    const webviewService = new WebviewService();
    this.services.set(IWebviewService, webviewService);
    return this.services.get(IWebviewService) as IWebviewService;
  }
}
