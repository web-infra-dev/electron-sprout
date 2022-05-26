import { app } from 'electron';
import { IWindowsBaseConfig } from '../../interfaces/common';
import { IS_DEV } from './constants';

const APP_ROOT = IS_DEV ? process.cwd() : app.getAppPath();

const defaultLoadUrl = (options: {
  winName: string;
  baseConfig?: IWindowsBaseConfig;
}) => {
  const { winName, baseConfig = {} as IWindowsBaseConfig } = options;
  const { devBaseUrl, prodBaseUrl } = baseConfig;

  const name = winName === 'main' ? '' : winName;

  const _devBaseUrl = devBaseUrl
    ? devBaseUrl(winName)
    : `http://localhost:8080/${name}`;

  const _prodBaseUrl = prodBaseUrl
    ? prodBaseUrl(winName)
    : `file://${APP_ROOT}/${IS_DEV ? 'dist' : ''}/html/${winName}/index.html`;

  return IS_DEV ? _devBaseUrl : _prodBaseUrl;
};

export { APP_ROOT, defaultLoadUrl };
