import {
  LifecycleMainPhase,
  updateService,
  lifecycleService,
  winService,
} from '@modern-js/runtime/electron-main';
// import { updateService } from '@modern-js/runtime/electron-render';
import { shell } from 'electron';

export const openInBrowser = (url: string) => {
  return shell.openExternal(url);
};

export const openWindow = (winName: string) => {
  return winService.createWindow({
    name: winName,
  });
};

export const getWindowCount = () => {
  return winService.getWindows().length;
};

export const broadCastMsg = (channel: string, data: any) => {
  return winService.broadCast(channel, data);
};

export const setLifecyclePhase = (phase: LifecycleMainPhase) => {
  try {
    lifecycleService.phase = phase;
    return 'success';
  } catch (error) {
    return error.message;
  }
};

export const lifecycleWhenReady = (msg: string) => {
  return lifecycleService.when(2).then(() => msg);
};

export const startToUpdate = (url: string) => {
  return updateService.checkForUpdates({
    url,
    receiver: 'main',
  });
};
