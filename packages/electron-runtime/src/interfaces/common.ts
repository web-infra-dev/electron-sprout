import { IWindow, WindowConfig } from '../services/windows/common/windows';

export type { IWindow };

export type IWindowsBaseConfig = {
  devBaseUrl?: (winName: string) => string; // dev default loadUrl, default is http://localhost:3000
  prodBaseUrl?: (winName: string) => string; // prod default loadUrl，default is html/${winName}/index.html
};
export interface IStartOption {
  mainServices?: { [key: string]: unknown }; // for render to call
  windowsConfig: WindowConfig[];
  windowsBaseConfig?: IWindowsBaseConfig;
  menuTemplate?: (Electron.MenuItemConstructorOptions | Electron.MenuItem)[];
}
