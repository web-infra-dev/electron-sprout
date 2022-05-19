import { app, ipcMain } from 'electron';
import { mainLog } from '@modern-js/electron-log';
import { Disposable } from '../../../core/base/common/lifecycle';
import { Emitter } from '../../../core/base/common/event';
import { isMacintosh, isWindows } from '../../../core/base/common/platform';
import { Barrier } from '../../../core/base/common/async';
import {
  ILifecycleMainService,
  IRelaunchOptions,
  IWindowUnloadEvent,
  LifecycleMainPhase,
  ShutdownEvent,
  UnloadReason,
} from '../common/lifecycle';
import { IPC_EVENTS } from '../../../common/constants/events';
import { PROCESS_ENV } from '../../../common/constants/envs';
import { IWindow, WindowConfig } from '../../windows/common/windows';
import { handleVetos } from '../common/utils';

export class LifecycleService
  extends Disposable
  implements ILifecycleMainService
{
  _serviceBrand: undefined;

  private readonly windowToCloseRequest = new Set<number>();

  private readonly windowToUnloadRequest = new Set<number>();

  private oneTimeListenerTokenGenerator = 0;

  private windowCounter = 0;

  private forceQuit = false; // 置为true后，其余窗口的 onBeforeClose 强制失效，不再询问。

  private readonly _onBeforeClose = this._register(new Emitter<void>());

  readonly onBeforeClose = this._onBeforeClose.event;

  // 应用结束前，该干嘛干嘛，干完就关闭，不能阻止关闭了。
  private readonly _onWillClose = this._register(new Emitter<ShutdownEvent>());

  readonly onWillClose = this._onWillClose.event;

  // 主进程里，某个窗口要关闭了，该干嘛干嘛，不能阻止窗口关闭
  private readonly _onBeforeWindowUnload = this._register(
    new Emitter<IWindowUnloadEvent>(),
  );

  readonly onBeforeWindowUnload = this._onBeforeWindowUnload.event;

  private _phase: LifecycleMainPhase = LifecycleMainPhase.Starting;

  get phase(): LifecycleMainPhase {
    return this._phase;
  }

  getForceQuit(): boolean {
    return this.forceQuit;
  }

  getWindowCounter(): number {
    return this.windowCounter;
  }

  private readonly phaseWhen: Map<LifecycleMainPhase, Barrier> = new Map<
    LifecycleMainPhase,
    Barrier
  >();

  private pendingQuitPromiseResolve: ((veto: boolean) => void) | null = null;

  private pendingWillShutdownPromise: Promise<void> | null = null;

  private readonly _wasRestarted: boolean = false;

  get wasRestarted(): boolean {
    return this._wasRestarted;
  }

  private _quitRequested = false;

  get quitRequested(): boolean {
    return this._quitRequested;
  }

  private pendingQuitPromise: Promise<boolean> | null = null;

  constructor() {
    super();
    this.when(LifecycleMainPhase.Ready).then(() => this.registerListeners());
  }

  private resolvePendingQuitPromise(veto: boolean): void {
    if (this.pendingQuitPromiseResolve) {
      this.pendingQuitPromiseResolve(veto);
      this.pendingQuitPromiseResolve = null;
      this.pendingQuitPromise = null;
    }
  }

  setForceQuit(forceQuit: boolean) {
    this.forceQuit = forceQuit;
  }

  relaunch(options?: IRelaunchOptions): void {
    if (options?.forceQuit) {
      this.setForceQuit(true);
    }

    const args = process.argv.slice(1);

    if (options?.addArgs) {
      args.push(...options.addArgs);
    }

    if (options?.removeArgs) {
      for (const a of options.removeArgs) {
        const idx = args.indexOf(a);
        if (idx >= 0) {
          args.splice(idx, 1);
        }
      }
    }
    let quitVetoed = false;
    app.once('quit', (_, exitCode: number) => {
      if (!quitVetoed) {
        mainLog.info('no veto, start to relaunch');
        // Remember the reason for quit was to restart

        // Windows: we are about to restart and as such we need to restore the original
        // current working directory we had on startup to get the exact same startup
        // behaviour. As such, we briefly change back to the VSCODE_CWD and then when
        // Code starts it will set it back to the installation directory again.
        try {
          if (isWindows) {
            const vscodeCwd = process.env[PROCESS_ENV.APP_CWD];
            if (vscodeCwd) {
              process.chdir(vscodeCwd);
            }
          }
        } catch (err) {
          mainLog.error(err);
        }

        // relaunch after we are sure there is no veto
        mainLog.info('relaunch() - calling app.relaunch()');
        app.relaunch({ args });
      }
    });
    this.quit().then(veto => {
      quitVetoed = veto;
      return veto;
    });
  }

  private registerListeners(): void {
    const beforeQuitListener = () => {
      this.setForceQuit(true);

      if (this._quitRequested) {
        return;
      }

      mainLog.info('app.on(before-quit)');
      this._quitRequested = true;

      // Emit event to indicate that we are about to shutdown
      mainLog.info('onBeforeClose.fire()');
      this._onBeforeClose.fire();

      // macOS: can run without any window open. in that case we fire
      // the onWillShutdown() event directly because there is no veto
      // to be expected.
      if (isMacintosh && this.windowCounter === 0) {
        this.beginOnWillShutdown();
      }
    };
    app.addListener('before-quit', beforeQuitListener);

    const windowAllClosedListener = () => {
      mainLog.info('app.on(window-all-closed)');

      // Windows/Linux: we quit when all windows have closed
      // Mac: we only quit when quit was requested
      if (this._quitRequested || !isMacintosh) {
        app.quit();
      }
      // TODO: pikun app.quit();
    };
    app.addListener('window-all-closed', windowAllClosedListener);

    app.once('will-quit', e => {
      mainLog.info('app.on(will-quit)');

      // Prevent the quit until the shutdown promise was resolved
      e.preventDefault();

      // Start shutdown sequence
      const shutdownPromise = this.beginOnWillShutdown();

      // Wait until shutdown is signaled to be complete
      shutdownPromise.finally(() => {
        // Resolve pending quit promise now without veto
        this.resolvePendingQuitPromise(false /* no veto */);

        // Quit again, this time do not prevent this, since our
        // will-quit listener is only installed "once". Also
        // remove any listener we have that is no longer needed
        app.removeListener('before-quit', beforeQuitListener);
        app.removeListener('window-all-closed', windowAllClosedListener);

        // there are some problem, so you need to set defaultPrevented to false!
        // see https://github.com/electron/electron/issues/33643
        (e.defaultPrevented as any) = false;
        app.quit();
      });
    });
  }

  // used to force close a
  addWindowToToCloseRequest(id: number) {
    this.windowToCloseRequest.add(id);
  }

  onClose(
    window: IWindow,
    getWinConfig: (winName: string) => WindowConfig | undefined,
  ) {
    window.win?.on('close', e => {
      const windowId = window.id;
      const winConfig = getWinConfig(window.name);
      if (
        this.windowToCloseRequest.has(windowId) ||
        this.forceQuit ||
        (!winConfig?.addBeforeCloseListener && !winConfig?.hideWhenClose) // not hidden, not confirm, just close
      ) {
        mainLog.info(
          `window.on('close') second time - window ID ${window.id}, just close`,
        );
        this.windowToCloseRequest.delete(windowId);
        return;
      }

      if (winConfig?.hideWhenClose) {
        window.win?.hide();
        e.preventDefault();
        return;
      }
      mainLog.info(`window.on('close') - window ID ${window.id}`);
      e.preventDefault();

      if (this.windowToUnloadRequest.has(windowId)) {
        return;
      }

      this.windowToUnloadRequest.add(windowId);

      this.unload(window, UnloadReason.CLOSE).then(veto => {
        this.windowToUnloadRequest.delete(windowId);
        if (veto) {
          this.windowToCloseRequest.delete(windowId);
          return;
        }
        this.windowToCloseRequest.add(windowId);
        mainLog.info(`onBeforeWindowClose.fire() - window ID ${windowId}`);
        window.close();
      });
    });
  }

  registerWindow(window: IWindow): void {
    this.windowCounter++;
    window.win?.on('closed', () => {
      mainLog.info(`window.on('closed') - window ID ${window.id}`);
      this.windowCounter--;

      if (this.windowCounter === 0 && (!isMacintosh || this.quitRequested)) {
        this.beginOnWillShutdown();
      }
    });
  }

  // before app quit, dosomething
  private beginOnWillShutdown(): Promise<void> {
    if (this.pendingWillShutdownPromise) {
      return this.pendingWillShutdownPromise;
    }

    const joiners: Array<Promise<void>> = [];

    this._onWillClose.fire({
      join(promise) {
        if (promise) {
          joiners.push(promise);
        }
      },
    });
    this.pendingWillShutdownPromise = Promise.all(joiners).then(
      () => undefined,
      mainLog.error.bind(this),
    );
    return this.pendingWillShutdownPromise;
  }

  set phase(value: LifecycleMainPhase) {
    if (value < this.phase) {
      throw new Error('Lifecycle cannot go backwards');
    }

    if (this._phase === value) {
      return;
    }

    this._phase = value;

    const barrier = this.phaseWhen.get(this._phase);
    if (barrier) {
      barrier.open();
      this.phaseWhen.delete(this._phase);
    }
  }

  async when(phase: LifecycleMainPhase): Promise<void> {
    if (phase <= this._phase) {
      return;
    }

    let barrier = this.phaseWhen.get(phase);
    if (!barrier) {
      barrier = new Barrier();
      this.phaseWhen.set(phase, barrier);
    }

    await barrier.wait();
  }

  kill(code?: number): void {
    app.exit(code);
  }

  private onBeforeUnloadWindowInRenderer(
    window: IWindow,
    reason: UnloadReason,
  ): Promise<boolean /* veto */> {
    return new Promise<boolean>(c => {
      const oneTimeEventToken = this.oneTimeListenerTokenGenerator++;
      const okChannel = IPC_EVENTS.ON_CLOSE_WINDOW_OK(oneTimeEventToken);
      const cancelChannel =
        IPC_EVENTS.ON_CLOSE_WINDOW_CANCEL(oneTimeEventToken);

      ipcMain.once(okChannel, () => {
        c(false); // no veto
      });

      ipcMain.once(cancelChannel, () => {
        c(true); // veto
      });
      window.send(IPC_EVENTS.ON_BEFORE_UNLOAD, {
        okChannel,
        cancelChannel,
        reason,
      });
    });
  }

  async unload(
    window: IWindow,
    reason: UnloadReason,
  ): Promise<boolean /* veto */> {
    // Always allow to unload a window that is not yet ready
    if (!window.isReady) {
      return Promise.resolve(false);
    }

    mainLog.info(`unload() - window ID ${window.id}`);

    // first ask the window itself if it vetos the unload
    const windowUnloadReason = this._quitRequested ? UnloadReason.QUIT : reason;
    let veto = await this.onBeforeUnloadWindowInRenderer(
      window,
      windowUnloadReason,
    );
    if (veto) {
      mainLog.info(`unload() - veto in renderer (window ID ${window.id})`);

      return this.handleWindowUnloadVeto(veto);
    }

    // then check for vetos in the main side
    veto = await this.onBeforeUnloadWindowInMain(window, windowUnloadReason);
    if (veto) {
      mainLog.info(`unload() - veto in main (window ID ${window.id})`);

      return this.handleWindowUnloadVeto(veto);
    }

    mainLog.info(`unload() - no veto (window ID ${window.id})`);

    // finally if there are no vetos, unload the renderer
    await this.onWillUnloadWindowInRenderer(window, windowUnloadReason);

    return false;
  }

  private onWillUnloadWindowInRenderer(
    window: IWindow,
    reason: UnloadReason,
  ): Promise<void> {
    return new Promise<void>(resolve => {
      const oneTimeEventToken = this.oneTimeListenerTokenGenerator++;
      const replyChannel = IPC_EVENTS.ON_WILL_UNLOAD_REPLY(oneTimeEventToken);

      ipcMain.once(replyChannel, () => resolve());

      window.send(IPC_EVENTS.ON_WILL_UNLOAD, {
        replyChannel,
        reason,
        windowName: window.name,
      });
    });
  }

  private onBeforeUnloadWindowInMain(
    window: IWindow,
    reason: UnloadReason,
  ): Promise<boolean /* veto */> {
    const vetos: (boolean | Promise<boolean>)[] = [];

    this._onBeforeWindowUnload.fire({
      reason,
      window,
      veto(value) {
        vetos.push(value);
      },
    });

    return handleVetos(vetos, err => mainLog.error('handle veto:', err));
  }

  private handleWindowUnloadVeto(veto: boolean): boolean {
    if (!veto) {
      // return false means to close window
      return false; // no veto
    }

    // a veto resolves any pending quit with veto
    this.resolvePendingQuitPromise(true /* veto */);

    // a veto resets the pending quit request flag
    this._quitRequested = false;

    return true; // veto
  }

  quit(): Promise<boolean> {
    if (this.pendingQuitPromise) {
      return this.pendingQuitPromise;
    }
    this.pendingQuitPromise = new Promise(resolve => {
      this.pendingQuitPromiseResolve = resolve;
      app.quit();
    });

    return this.pendingQuitPromise;
  }
}
