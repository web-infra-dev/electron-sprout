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

export function electronMainVitePlugin(
  options?: ElectronPluginOptions,
): Plugin[] {
  return [
    {
      name: 'vite:electron-main-preset-config',
      apply: 'build',
      enforce: 'pre',
      config(config): void {
        const root = options?.root || process.cwd();

        const electornVer = getElectronMainVer(root);
        const nodeTarget = getElectronNodeTarget(electornVer);

        const defaultConfig = {
          build: {
            outDir: path.resolve(root, 'out', 'main'),
            target: nodeTarget,
            lib: {
              entry: findLibEntry(root, 'main'),
              formats: ['cjs'],
            },
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
      name: 'vite:electron-main-resolved-config',
      apply: 'build',
      enforce: 'post',
      configResolved(config): void {
        const { build } = config;
        if (!build.target) {
          throw new Error(
            'build target required for the electron vite main config',
          );
        } else {
          const targets = Array.isArray(build.target)
            ? build.target
            : [build.target];
          if (targets.some(t => !t.startsWith('node'))) {
            throw new Error(
              'the electron vite main config build target must be node',
            );
          }
        }

        const { lib } = build;
        if (!lib) {
          throw new Error(
            'build lib field required for the electron vite main config',
          );
        } else {
          if (!lib.entry) {
            throw new Error(
              'build entry field required for the electron vite main config',
            );
          }
          if (!lib.formats) {
            throw new Error(
              'build format field required for the electron vite main config',
            );
          } else if (!lib.formats.includes('cjs')) {
            throw new Error(
              'the electron vite main config build lib format must be cjs',
            );
          }
        }
      },
    },
  ];
}
