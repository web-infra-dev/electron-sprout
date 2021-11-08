import { createDecorator } from '../../../core/instantiation/instantiation';
import { Event } from '../../../core/base/common/event';
import { IWindow, WindowConfig } from '../../windows/common/windows';

export const ILifecycleMainService = createDecorator<ILifecycleMainService>(
  'lifecycleMainService',
);

export const ILifecycleService =
  createDecorator<ILifecycleService>('lifecycleService');

export interface ILifecycleService {
  quit(): Promise<boolean>;
  call(funcName: string, ...args: any): Promise<any>;
  kill(exitCode?: number): Promise<boolean>;
  relaunch(options?: {
    addArgs?: string[];
    removeArgs?: string[];
  }): Promise<void>;
}

export enum CloseReason {
  /** Window is closed */
  CLOSE = 1,

  /** Application is quit */
  QUIT = 2,

  /** Window is reloaded */
  RELOAD = 3,

  /** Other configuration loaded into window */
  LOAD = 4,
}

export interface WillCloseEvent {
  /**
   * Allows to join the shutdown. The promise can be a long running operation but it
   * will block the application from closing.
   */
  join: (promise: Promise<void>) => void;

  /**
   * The reason why the application is shutting down.
   */
  readonly reason: CloseReason;
}

export enum LifecycleMainPhase {
  /**
   * The first phase signals that we are about to startup.
   */
  Starting = 1,

  /**
   * Services are ready and first window is about to open.
   */
  Ready = 2,

  /**
   * This phase signals a point in time after the window has opened
   * and is typically the best place to do work that is not required
   * for the window to open.
   */
  AfterWindowOpen = 3,
}

export interface ShutdownEvent {
  /**
   * Allows to join the shutdown. The promise can be a long running operation but it
   * will block the application from closing.
   */
  join: (promise: Promise<void>) => void;
}

export const enum UnloadReason {
  CLOSE = 1,
  QUIT = 2,
  RELOAD = 3,
  LOAD = 4,
}

export interface BeforeCloseEvent {
  /**
   * Allows to veto the shutdown. The veto can be a long running operation but it
   * will block the application from closing.
   */
  veto: (value: boolean | Promise<boolean>) => void;

  /**
   * The reason why the application will be shutting down.
   */
  readonly reason: CloseReason;
}

export interface IWindowUnloadEvent {
  window: IWindow;
  reason: UnloadReason;
  veto: (value: boolean | Promise<boolean>) => void;
}

export type IRelaunchOptions = {
  addArgs?: string[];
  removeArgs?: string[];
  forceQuit?: boolean;
};

export interface ILifecycleMainService {
  _serviceBrand: undefined;
  phase: LifecycleMainPhase;
  readonly onBeforeClose: Event<void>;
  // readonly onBeforeWindowClose: Event<IWindow>;
  readonly onBeforeWindowUnload: Event<IWindowUnloadEvent>;
  readonly onWillClose: Event<ShutdownEvent>;
  addWindowToToCloseRequest(id: number);
  onClose(
    window: IWindow,
    getWinConfig: (winName: string) => WindowConfig | undefined,
  );
  registerWindow: (window: IWindow) => void;
  getForceQuit: () => boolean;
  setForceQuit: (forceQuit: boolean) => void;
  getWindowCounter: () => number;
  quit: () => Promise<boolean /* veto */>;
  kill: (code?: number) => void;
  relaunch: (options?: IRelaunchOptions) => void;
  when: (phase: LifecycleMainPhase) => Promise<void>;
  unload: (
    window: IWindow,
    reason: UnloadReason,
  ) => Promise<boolean /* veto */>;
}
