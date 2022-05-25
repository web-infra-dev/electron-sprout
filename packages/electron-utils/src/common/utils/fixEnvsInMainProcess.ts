import { userInfo } from 'os';
import * as shellPath from 'shell-path';
import * as shellEnv from 'shell-env';

const IS_DEV = process.env.NODE_ENV === 'development';

export const fixEnvsInMainProcess = () => {
  if (!IS_DEV) {
    try {
      console.info('start to sync envs by shell env');
      const { shell } = userInfo();
      process.env = {
        ...process.env,
        ...shellEnv.sync(shell),
      };
      console.info('start to sync path by shell path');
      // TODO: If we're running from the app package, we won't have access to env variable or PATH
      // TODO: So we need to add shell-path to resolve problem
      shellPath.sync();
    } catch (error) {
      console.error('initEnvironment error:', error);
    }
  }
};
