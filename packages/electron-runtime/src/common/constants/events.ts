const IPC_EVENTS = {
  ON_BEFORE_UNLOAD: 'app:onBeforeUnload',
  ON_WILL_UNLOAD: 'app:onWillUnload',
  GET_WINDOW_ID: 'app:getWindowId',
  GET_APP_ROOT: 'app:getAppRoot',
  ELECTRON_RENDER_READY: 'app:electronRenderReady',
  WEB_VIEW_READY: 'app:webviewReady',
  ON_CLOSE_WINDOW_OK: (oneTimeEventToken: number) =>
    `app:ok${oneTimeEventToken}`, // event of close window confirm
  ON_CLOSE_WINDOW_CANCEL: (oneTimeEventToken: number) =>
    `app:cancel${oneTimeEventToken}`, // event of cancel close window confirm
  ON_WILL_UNLOAD_REPLY: (oneTimeEventToken: number) =>
    `app:reply${oneTimeEventToken}`,
  APP_UPDATE_PROGRESS: 'app:updateProgress',
  APP_UPDATE_AND_RESTART: 'app:updateAndRestart',
  APP_UPDATE_ERROR: 'app:updateError',
  APP_UPDATE_IDLE: 'app:updateIdel',
};

const MONOITOR_EVENTS = {
  WINDOW_INFO_REQUEST: 'sprout:windowsInfoRequest',
  WINDOW_INFO_RESPONSE: 'sprout:windowsInfoResponse',
  PROCESS_LIST_REQUEST: 'sprout:listProcessesRequest',
  PROCESS_LIST_RESPONSE: 'sprout:listProcessesResponse',
  CLOSE_PROCESS_EXPLORER: 'sprout:closeProcessExplorer',
};

export { IPC_EVENTS, MONOITOR_EVENTS };
