import { isModernJsMWA } from '@/utils';

const defaultBuildResouces = isModernJsMWA(process.cwd())
  ? 'config/electron'
  : 'assets';

const baseConfig = {
  baseConfig: {
    asar: false,
    publish: {
      provider: 'generic',
      url: '',
    },
    directories: {
      buildResources: defaultBuildResouces,
      output: './release',
    },
  },
  macConfig: {
    dmg: {
      sign: true,
    },
    mac: {
      entitlements: 'assets/entitlements.mac.plist',
      entitlementsInherit: 'assets/entitlements.mac.plist',
      hardenedRuntime: true,
      gatekeeperAssess: false,
      extendInfo: {
        NSMicrophoneUsageDescription: '请允许本程序访问您的麦克风',
        NSCameraUsageDescription: '请允许本程序访问您的摄像头',
      },
    },
  },
  winConfig: {},
  win64Config: {},
  linuxConfig: {},
};

export { baseConfig };
