import { defaultLoadUrl } from '../constants/paths';
import { WindowConfig } from '@/common';

const setWindowDefaultConfig = (config: WindowConfig[]) => {
  if (config) {
    for (const win of config) {
      if (!win.loadUrl) {
        win.loadUrl = defaultLoadUrl(win.name, win.useFileProtocolInDev);
      }
    }
  }
  return config;
};

export const handleWindowConfig = (config: WindowConfig[]) => {
  config = setWindowDefaultConfig(config);
  return config;
};
