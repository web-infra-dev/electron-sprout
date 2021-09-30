import { IWindow, WindowConfig } from '../services/windows/common/windows';

export type { IWindow };
export interface IStartOption {
  mainServices?: any; // for render to call
  windowsConfig: WindowConfig[];
  menuTemplate?: (Electron.MenuItemConstructorOptions | Electron.MenuItem)[];
}
