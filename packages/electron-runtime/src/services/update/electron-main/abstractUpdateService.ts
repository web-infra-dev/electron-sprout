import { Event, Emitter } from '../../../core/base/common/event';
import {
  IUpdateService,
  State,
  UpdateType,
  StateType,
  AvailableForDownload,
  UpdateOption,
} from '../common/update';
import { ILifecycleMainService } from '../../lifecycle/common/lifecycle';
import { IWindowsMainService } from '../../windows/common/windows';

export abstract class AbstractUpdateService implements IUpdateService {
  _serviceBrand: undefined;

  protected url: string | undefined;

  protected receiver: string | undefined; // windowName

  protected progressInterval: number | undefined; // interval of progress msg (ms)

  private _state: State = State.Uninitialized;

  private readonly _onStateChange = new Emitter<State>();

  readonly onStateChange: Event<State> = this._onStateChange.event;

  protected getUpdateType(): UpdateType {
    return UpdateType.Archive;
  }

  get state(): State {
    return this._state;
  }

  protected setState(state: State): void {
    this._state = state;
    this._onStateChange.fire(state);
  }

  constructor(
    @ILifecycleMainService
    private readonly lifecycleService: ILifecycleMainService,
    @IWindowsMainService
    public readonly windowsMainService: IWindowsMainService,
  ) {
    this.setState(State.Idle(this.getUpdateType()));

    // this.scheduleCheckForUpdates().then(undefined, err => log.error(err));
  }

  public checkForUpdates(upgradeOption: UpdateOption): void {
    if (upgradeOption.receiver) {
      this.receiver = upgradeOption.receiver;
    }
    this.buildUpdateFeedUrl(upgradeOption);
    this._checkForUpdates(null);
  }

  private _checkForUpdates(context: any): void {
    if (this.state.type !== StateType.Idle) {
      return;
    }
    this.doCheckForUpdates(context);
  }

  quitAndInstall(isSlient?: boolean): Promise<void> {
    this.lifecycleService.setForceQuit(true);
    this.doQuitAndInstall(isSlient);
    return Promise.resolve(undefined);
  }

  async downloadUpdate(): Promise<void> {
    if (this.state.type !== StateType.AvailableForDownload) {
      return;
    }
    await this.doDownloadUpdate(this.state);
  }

  async applyUpdate(isSlient?: boolean): Promise<void> {
    await this.doApplyUpdate(isSlient);
  }

  protected async doDownloadUpdate(
    _state: AvailableForDownload,
  ): Promise<void> {
    // noop
  }

  protected sendMsgToWindow(event: string, data?: any): void {
    if (!this.receiver) {
      throw Error('please set receiver of upgrade info!');
    }
    this.windowsMainService.sendTo(this.receiver, event, data || {});
  }

  protected doQuitAndInstall(_isSlient?: boolean): Promise<void> | void {
    // noop
  }

  protected async doApplyUpdate(_isSlient?: boolean): Promise<void> {
    // noop
  }

  protected abstract buildUpdateFeedUrl(upgradeOption: UpdateOption): string;

  protected abstract doCheckForUpdates(context: any): void;
}
