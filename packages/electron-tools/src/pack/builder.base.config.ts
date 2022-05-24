import { isModernJsMWA } from '@/utils';

const defaultBuildResouces = isModernJsMWA(process.cwd())
  ? 'config/electron'
  : 'assets';

const baseConfig = {
  asar: false,
  publish: {
    provider: 'generic',
    url: '',
  },
  directories: {
    buildResources: defaultBuildResouces,
    output: './release',
  },
  dmg: {
    sign: true,
  },
  mac: {
    entitlements: `${defaultBuildResouces}/entitlements.mac.plist`,
    entitlementsInherit: `${defaultBuildResouces}/entitlements.mac.plist`,
    hardenedRuntime: true,
    gatekeeperAssess: false,
    extendInfo: {
      NSMicrophoneUsageDescription: '请允许本程序访问您的麦克风',
      NSCameraUsageDescription: '请允许本程序访问您的摄像头',
    },
  },
};

export { baseConfig };
