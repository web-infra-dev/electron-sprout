import { userInfo } from 'os';
import * as shellPath from 'shell-path';
import * as shellEnv from 'shell-env';
import { mainLog } from '@modern-js/electron-log';
import { IS_DEV } from '../constants/constants';

export const fixEnvsInMainProcess = () => {
  if (!IS_DEV) {
    try {
      mainLog.info('start to sync envs by shell env');
      const { shell } = userInfo();
      process.env = {
        ...process.env,
        ...shellEnv.sync(shell),
      };
      mainLog.info('start to sync path by shell path');
      // TODO: If we're running from the app package, we won't have access to env variable or PATH
      // TODO: So we need to add shell-path to resolve problem
      shellPath.sync();
      mainLog.info('end to sync envs by shell env');
    } catch (error) {
      mainLog.error('initEnvironment error:', error);
    }
  }
};
