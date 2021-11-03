import { autoUpdater } from 'electron-updater';
import { mainLog } from '@modern-js/electron-log';
import { IPC_EVENTS } from '../../../common/constants/events';
import { IDisposable, dispose } from '../../../core/base/common/lifecycle';

import { memoize } from '../../../core/base/common/decorator';
import { Event } from '../../../core/base/common/event';
import {
  IUpdate,
  StateType,
  UpdateType,
  State,
  UpdateOption,
  IUpdateProgressInfo,
} from '../common/update';
import { ILifecycleMainService } from '../../lifecycle/common/lifecycle';
import { IWindowsMainService } from '../../windows/common/windows';
import { AbstractUpdateService } from './abstractUpdateService';

export class DarwinUpdateService extends AbstractUpdateService {
  _serviceBrand: undefined;

  private disposables: IDisposable[] = [];

  @memoize private get onRawError(): Event<string> {
    return Event.fromNodeEventEmitter(autoUpdater, 'error', message => message);
  }

  @memoize private get onRawUpdateNotAvailable(): Event<void> {
    return Event.fromNodeEventEmitter<void>(
      autoUpdater,
      'update-not-available',
    );
  }

  @memoize private get onRawUpdateAvailable(): Event<IUpdate> {
    return Event.fromNodeEventEmitter(
      autoUpdater,
      'update-available',
      (versionInfo: any) => {
        if (versionInfo) {
          return {
            ...versionInfo,
            productVersion: versionInfo.version,
          };
        }
        return null;
      },
    );
  }

  @memoize private get onRawDownloadProgress(): Event<IUpdateProgressInfo> {
    return Event.fromNodeEventEmitter(
      autoUpdater,
      'download-progress',
      progressObj => progressObj,
    );
  }

  @memoize private get onRawUpdateDownloaded(): Event<IUpdate> {
    return Event.fromNodeEventEmitter(
      autoUpdater,
      'update-downloaded',
      (downloadedInfo: any) => {
        if (downloadedInfo) {
          return {
            ...downloadedInfo,
            productVersion: downloadedInfo.version,
          };
        }
        return null;
      },
    );
  }

  constructor(
    @ILifecycleMainService lifecycleService: ILifecycleMainService,
    @IWindowsMainService windowsMainService: IWindowsMainService,
  ) {
    super(lifecycleService, windowsMainService);
    this.onRawError(this.onError, this, this.disposables);
    this.onRawUpdateAvailable(this.onUpdateAvailable, this, this.disposables);
    this.onRawUpdateDownloaded(this.onUpdateDownloaded, this, this.disposables);
    this.onRawUpdateNotAvailable(
      this.onUpdateNotAvailable,
      this,
      this.disposables,
    );
    this.onRawDownloadProgress(this.onDownloadProgress, this, this.disposables);
  }

  protected buildUpdateFeedUrl(upgradeOption: UpdateOption): string {
    this.url = upgradeOption.url || '';
    autoUpdater.setFeedURL(this.url);
    return this.url;
  }

  protected doCheckForUpdates(context: any): void {
    this.setState(State.CheckingForUpdates(context));
    autoUpdater.checkForUpdates().catch(err => this.onError(err.message));
    process.on('uncaughtException', err => {
      mainLog.error(`[uncaughtException]: ${err.message}`);
    });
  }

  private onDownloadProgress(progressObj: IUpdateProgressInfo): void {
    let logMsg = `[auto download] download speed: ${Math.floor(
      Number(progressObj.bytesPerSecond) / 1000,
    ).toFixed(2)}kb`;
    logMsg = `${logMsg} - downloaded ${progressObj.percent.toFixed(2)}%`;
    logMsg = `${logMsg}(${progressObj.transferred}/${progressObj.total})`;
    // send progress msg to win
    this.sendMsgToWindow(IPC_EVENTS.APP_UPDATE_PROGRESS, {
      ...progressObj,
      text: logMsg,
    });
  }

  private onUpdateDownloaded(update: IUpdate): void {
    if (this.state.type !== StateType.Downloading) {
      return;
    }
    this.setState(State.Ready(update));
    this.sendMsgToWindow(IPC_EVENTS.APP_UPDATE_AND_RESTART);
  }

  private onUpdateAvailable(update: IUpdate): void {
    if (this.state.type !== StateType.CheckingForUpdates) {
      return;
    }
    this.setState(State.Downloading(update));
  }

  private onUpdateNotAvailable(): void {
    if (this.state.type !== StateType.CheckingForUpdates) {
      return;
    }
    this.sendMsgToWindow(IPC_EVENTS.APP_UPDATE_IDLE);
    this.setState(State.Idle(UpdateType.Archive));
  }

  protected doApplyUpdate(isSlient?: boolean): Promise<void> {
    return this.quitAndInstall(isSlient);
  }

  protected doQuitAndInstall(isSlient?: boolean): void {
    autoUpdater.quitAndInstall(isSlient);
  }

  dispose(): void {
    this.disposables = dispose(this.disposables);
  }

  private onError(err: string): void {
    mainLog.info('update error:', err);
    const shouldShowMessage =
      this.state.type === StateType.CheckingForUpdates
        ? Boolean(this.state.context)
        : false;
    const message: string | undefined = shouldShowMessage ? err : undefined;
    this.sendMsgToWindow(IPC_EVENTS.APP_UPDATE_ERROR, {
      error: err,
    });
    this.setState(State.Idle(UpdateType.Archive, message));
  }
}
