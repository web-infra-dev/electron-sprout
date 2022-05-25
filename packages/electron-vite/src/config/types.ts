import {
  UserConfig as ViteConfig,
  UserConfigExport as UserViteConfigExport,
} from 'vite';

export interface UserConfig {
  main?: ViteConfig; // ViteConfig：https://cn.vitejs.dev/config/
  renderer?: ViteConfig;
  preload?: ViteConfig;
}

export type InlineConfig = Omit<ViteConfig, 'base'> & {
  configFile?: string | false;
  envFile?: false;
  ignoreConfigWarning?: boolean;
};

export interface UserConfigSchema {
  main?: UserViteConfigExport;
  renderer?: UserViteConfigExport;
  preload?: UserViteConfigExport;
}

export type UserConfigExport = UserConfigSchema | Promise<UserConfigSchema>;
