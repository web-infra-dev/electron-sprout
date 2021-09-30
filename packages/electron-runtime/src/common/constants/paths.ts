import { app } from 'electron';
import { IS_DEV } from './constants';

const APP_ROOT = IS_DEV ? process.cwd() : app.getAppPath();

const defaultLoadUrl = (winName: string, useFileProtocolInDev?: boolean) => {
  const name = winName === 'main' ? '' : winName;
  if (IS_DEV && !useFileProtocolInDev) {
    return `http://localhost:8080/${name}`;
  }
  return `${IS_DEV ? 'dist' : ''}/html/${winName}/index.html`;
};

export { APP_ROOT, defaultLoadUrl };
