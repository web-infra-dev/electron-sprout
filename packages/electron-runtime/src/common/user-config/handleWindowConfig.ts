import { defaultLoadUrl } from '../constants/paths';
import { IWindowsBaseConfig, WindowConfig } from '@/common';

const setWindowDefaultConfig = (
  config: WindowConfig[],
  baseConfig?: IWindowsBaseConfig,
) => {
  if (config) {
    for (const win of config) {
      if (!win.loadUrl) {
        win.loadUrl = defaultLoadUrl({
          winName: win.name,
          baseConfig,
        });
      }
    }
  }
  return config;
};

export const handleWindowConfig = (
  config: WindowConfig[],
  baseConfig?: IWindowsBaseConfig,
) => {
  config = setWindowDefaultConfig(config, baseConfig);
  return config;
};
