import * as path from 'path';
import { builtinModules } from 'module';
import { Plugin, mergeConfig } from 'vite';
import {
  ElectronPluginOptions,
  getElectronMainVer,
  getElectronNodeTarget,
  processEnvDefine,
} from './utils';
import { findLibEntry } from './findLibEntry';

export function electronPreloadVitePlugin(
  options?: ElectronPluginOptions,
): Plugin[] {
  return [
    {
      name: 'vite:electron-preload-preset-config',
      apply: 'build',
      enforce: 'pre',
      config(config): void {
        const root = options?.root || process.cwd();

        const electornVer = getElectronMainVer(root);
        const nodeTarget = getElectronNodeTarget(electornVer);

        const defaultConfig: any = {
          build: {
            outDir: path.resolve(root, 'out', 'preload'),
            target: nodeTarget,
            rollupOptions: {
              external: [
                'electron',
                ...builtinModules.flatMap(m => [m, `node:${m}`]),
              ],
              output: {
                entryFileNames: '[name].js',
              },
            },
            minify: false,
          },
        };

        const build = config.build || {};
        const rollupOptions = build.rollupOptions || {};
        if (!rollupOptions.input) {
          defaultConfig.build['lib'] = {
            entry: findLibEntry(root, 'preload'),
            formats: ['cjs'],
          };
        } else if (!rollupOptions.output) {
          defaultConfig.build.rollupOptions.output['format'] = 'cjs';
        }

        const buildConfig = mergeConfig(
          defaultConfig.build,
          config.build || {},
        );
        config.build = buildConfig;

        config.define = config.define || {};
        config.define = { ...processEnvDefine(), ...config.define };
      },
    },
    {
      name: 'vite:electron-preload-resolved-config',
      apply: 'build',
      enforce: 'post',
      configResolved(config): void {
        const { build } = config;
        if (!build.target) {
          throw new Error(
            'build target required for the electron vite preload config',
          );
        } else {
          const targets = Array.isArray(build.target)
            ? build.target
            : [build.target];
          if (targets.some(t => !t.startsWith('node'))) {
            throw new Error(
              'the electron vite preload config build target must be node',
            );
          }
        }

        const { lib } = build;
        if (!lib) {
          const { rollupOptions } = build;
          if (!rollupOptions?.input) {
            throw new Error(
              'build lib field required for the electron vite preload config',
            );
          } else {
            const output = rollupOptions?.output;
            if (output) {
              const formats = Array.isArray(output) ? output : [output];
              if (!formats.some(f => f !== 'cjs')) {
                throw new Error(
                  'the electron vite preload config output format must be cjs',
                );
              }
            }
          }
        } else {
          if (!lib.entry) {
            throw new Error(
              'build entry field required for the electron vite preload config',
            );
          }
          if (!lib.formats) {
            throw new Error(
              'build format field required for the electron vite preload config',
            );
          } else if (!lib.formats.includes('cjs')) {
            throw new Error(
              'the electron vite preload config lib format must be cjs',
            );
          }
        }
      },
    },
  ];
}
