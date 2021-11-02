import {
  LifecycleMainPhase,
  updateService,
  lifecycleService,
  winService,
} from '@modern-js/runtime/electron-main';
// import { updateService } from '@modern-js/runtime/electron-render';
import { shell } from 'electron';

export const openInBrowser = (url: string) => shell.openExternal(url);

export const openWindow = (winName: string) => {
  const window = winService.createWindow({
    name: winName,
  });
  window.win?.webContents.openDevTools();
  return window;
};

export const getWindowCount = () => winService.getWindows().length;

export const broadCastMsg = (channel: string, data: any) =>
  winService.broadCast(channel, data);

export const setLifecyclePhase = (phase: LifecycleMainPhase) => {
  try {
    lifecycleService.phase = phase;
    return 'success';
  } catch (error: any) {
    return error.message;
  }
};

export const lifecycleWhenReady = (msg: string) =>
  lifecycleService.when(2).then(() => msg);

export const startToUpdate = (url: string) =>
  updateService.checkForUpdates({
    url,
    receiver: 'upgrade',
  });
