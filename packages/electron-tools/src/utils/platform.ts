import os from 'os';
import { cliLog } from '@modern-js/electron-log';

const getPlatform = () => {
  if (process.env.PLATFORM) {
    return process.env.PLATFORM;
  }

  // 兼容 goofy
  if (process.env.CUSTOM_PLATFORM) {
    return process.env.CUSTOM_PLATFORM;
  }
  cliLog.warn('not found process.env.PLATFORM，so use os.platform() instead！');
  if (os.platform() === 'win32') {
    return os.arch() === 'x64' ? 'win64' : 'win32';
  } else if (os.platform() === 'darwin') {
    return 'mac';
  } else {
    return os.platform();
  }
};

const getArchAndPlatform = () => {
  const platform = getPlatform();
  const getArch = () => {
    if (['win32', 'win'].includes(platform)) {
      return 'ia32';
    }
    if (platform === 'win64') {
      return 'x64';
    }
    return os.arch();
  };
  return {
    platform: platform === 'mac' ? 'darwin' : 'win32',
    arch: getArch(),
  };
};

export { getPlatform, getArchAndPlatform };
