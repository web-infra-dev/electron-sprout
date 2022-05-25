import * as path from 'path';
import { builtinModules } from 'module';
import colors from 'picocolors';
import { Plugin, mergeConfig, normalizePath } from 'vite';
import { findInput } from './findInput';
import {
  ElectronPluginOptions,
  getElectronChromeTarget,
  getElectronMainVer,
} from './utils';

export function electronRendererVitePlugin(
  options?: ElectronPluginOptions,
): Plugin[] {
  return [
    {
      name: 'vite:electron-renderer-preset-config',
      enforce: 'pre',
      config(config): void {
        const root = options?.root || process.cwd();

        config.base = config.mode === 'production' ? './' : config.base;
        config.root = config.root || './src';

        const electornVer = getElectronMainVer(root);
        const chromeTarget = getElectronChromeTarget(electornVer);

        const emptyOutDir = (): boolean => {
          let outDir = config.build?.outDir;
          if (outDir) {
            if (!path.isAbsolute(outDir)) {
              outDir = path.resolve(root, outDir);
            }
            const resolvedRoot = normalizePath(path.resolve(root));
            return normalizePath(outDir).startsWith(`${resolvedRoot}/`);
          }
          return true;
        };

        const defaultConfig = {
          build: {
            outDir: path.resolve(root, 'out', 'renderer'),
            target: chromeTarget,
            polyfillModulePreload: false,
            rollupOptions: {
              input: findInput(root),
              external: [...builtinModules.flatMap(m => [m, `node:${m}`])],
            },
            minify: false,
            emptyOutDir: emptyOutDir(),
          },
        };

        const buildConfig = mergeConfig(
          defaultConfig.build,
          config.build || {},
        );
        config.build = buildConfig;
      },
    },
    {
      name: 'vite:electron-renderer-resolved-config',
      enforce: 'post',
      configResolved(config): void {
        if (config.base !== './' && config.base !== '/') {
          config.logger.warn(
            colors.yellow(
              'should not set base field for the electron vite renderer config',
            ),
          );
        }

        const { build } = config;
        if (!build.target) {
          throw new Error(
            'build target required for the electron vite renderer config',
          );
        } else {
          const targets = Array.isArray(build.target)
            ? build.target
            : [build.target];
          if (targets.some(t => !t.startsWith('chrome'))) {
            throw new Error(
              'the electron vite renderer config build target must be chrome',
            );
          }
        }

        const { rollupOptions } = build;
        if (!rollupOptions.input) {
          config.logger.warn(
            colors.yellow(
              `index.html file is not found in ${colors.dim(
                '/src/renderer',
              )} directory`,
            ),
          );
          throw new Error(
            'build rollupOptions input field required for the electron vite renderer config',
          );
        }
      },
    },
  ];
}
