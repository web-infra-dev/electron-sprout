import { winService } from './winService';
import { updateService } from './updateService';
import { lifecycleService } from './lifecycleService';
import { webviewService } from './webviewService';
import { exposeInMainWorld as doExposeInMainWorld } from './utils';
import { bridge, APP_ROOT } from '@/services/index.render';

export type WinService = typeof winService;
export type UpdateService = typeof updateService;
export type LifecycleService = typeof lifecycleService;
export type WebviewService = typeof webviewService;

// call main services
const callMain = (funcName: string, ...args: any[]) =>
  bridge.callMain(funcName, ...args);

// api in preload of browserWindow
export const browserWindowPreloadApis = {
  callMain,
  winService,
  updateService,
  lifecycleService,
  webviewService,
  isElectron: true,
  APP_ROOT,
};
const exposeInMainWorld = (apis: Record<string, unknown>) =>
  doExposeInMainWorld('bridge', apis);
export { exposeInMainWorld };
