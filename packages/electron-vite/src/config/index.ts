import { UserConfigExport } from './types';

export function defineConfig(config: UserConfigExport): UserConfigExport {
  return config;
}

export * from './resolveConfig';
export * from './types';
