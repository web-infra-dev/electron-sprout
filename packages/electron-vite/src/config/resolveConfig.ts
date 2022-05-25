import * as path from 'path';
import {
  mergeConfig,
  normalizePath,
  Plugin,
  UserConfig as ViteConfig,
} from 'vite';
import {
  electronMainVitePlugin,
  ElectronPluginOptions,
  electronPreloadVitePlugin,
  electronRendererVitePlugin,
} from '../plugins';
import { loadConfigFromFile } from './loadConfigFromFile';
import { InlineConfig, UserConfig } from './types';
import { deepClone, mergePlugins } from './utils';

export interface ResolvedConfig {
  config?: UserConfig;
  configFile?: string;
  configFileDependencies: string[];
}

function resetOutDir(
  config: ViteConfig,
  outDir: string,
  subOutDir: string,
): void {
  let userOutDir = config.build?.outDir;
  if (outDir === userOutDir) {
    userOutDir = path.resolve(config.root || process.cwd(), outDir, subOutDir);
    if (config.build) {
      config.build.outDir = userOutDir;
    } else {
      config.build = { outDir: userOutDir };
    }
  }
}

const wrapLoadResult = (options: {
  root?: string;
  loadResult: any;
  key: string;
  config: InlineConfig;
  outDir?: string;
  plugin: (options?: ElectronPluginOptions) => Plugin[];
}) => {
  const { root, loadResult, key, config, outDir, plugin } = options;
  if (loadResult.config[key]) {
    const viteConfig: ViteConfig = mergeConfig(
      loadResult.config[key],
      deepClone(config),
    );

    if (outDir) {
      resetOutDir(viteConfig, outDir, key);
    }

    mergePlugins(viteConfig, plugin({ root }));

    loadResult.config[key] = viteConfig;
    loadResult.config[key].configFile = false;
  }
};

export async function resolveConfig(
  inlineConfig: InlineConfig,
  command: 'build' | 'serve',
  defaultMode = 'development',
): Promise<ResolvedConfig> {
  const config = inlineConfig;
  const mode = inlineConfig.mode || defaultMode;
  config.mode = mode;
  if (mode === 'production') {
    process.env.NODE_ENV = 'production';
  }
  const { configFile } = config;
  if (configFile !== false) {
    const configEnv = {
      mode,
      command,
    };
    const loadResult = await loadConfigFromFile({
      configEnv,
      configFile,
      configRoot: config.root || '',
      logLevel: config.logLevel,
      ignoreConfigWarning: config.ignoreConfigWarning || false,
    });
    if (loadResult) {
      const { root } = config;
      delete config.root;
      delete config.configFile;
      const outDir = config.build?.outDir;
      const plugins = [
        {
          key: 'main',
          plugin: electronMainVitePlugin,
        },
        {
          key: 'renderer',
          plugin: electronRendererVitePlugin,
        },
        {
          key: 'preload',
          plugin: electronPreloadVitePlugin,
        },
      ];

      plugins.forEach(plugin =>
        wrapLoadResult({
          root,
          loadResult,
          key: plugin.key,
          config,
          outDir,
          plugin: plugin.plugin,
        }),
      );
      const resolved: ResolvedConfig = {
        config: loadResult.config,
        configFile: configFile ? normalizePath(configFile) : undefined,
        configFileDependencies: loadResult.dependencies,
      };
      return resolved;
    }
  }
  const resolved: ResolvedConfig = {
    config: undefined,
    configFile: configFile ? normalizePath(configFile) : undefined,
    configFileDependencies: [],
  };

  return resolved;
}
