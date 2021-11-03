import { join } from 'path';
import { readConfig } from './read-config';

const customBabelConfig = readConfig(process.cwd())?.babel || {};

const defaultBabelConfig = {
  cwd: process.cwd(),
  presets: [
    require.resolve('@babel/preset-typescript'),
    require.resolve('@babel/preset-env'),
  ],
  plugins: [
    require.resolve('babel-plugin-transform-inline-environment-variables'),
    [
      require.resolve('@babel/plugin-transform-runtime'),
      {
        regenerator: true,
        coreJs: false,
      },
    ],
    [require.resolve('@babel/plugin-proposal-decorators'), { legacy: true }],
    [
      require.resolve('@babel/plugin-proposal-private-property-in-object'),
      { loose: true },
    ],
    [
      require.resolve('@babel/plugin-proposal-private-methods'),
      { loose: true },
    ],
    [
      require.resolve('@babel/plugin-proposal-class-properties'),
      { loose: true },
    ],
    [require.resolve('@vjpr/babel-plugin-parameter-decorator'), {}],
    join(__dirname, '..', 'babel-plugin', 'replace-pkg-name.js'),
    join(__dirname, '..', 'babel-plugin', 'find-dependencies.js'),
  ],
};

const combineConfig = (userConfig: any) => {
  const { presets = [], plugins = [], ...restConfig } = userConfig;

  defaultBabelConfig.presets = [...defaultBabelConfig.presets, ...presets];
  defaultBabelConfig.plugins = [...defaultBabelConfig.plugins, ...plugins];

  const finalBabelConfig = {
    ...defaultBabelConfig,
    ...restConfig,
  };
  return finalBabelConfig;
};

export const babelConfig =
  typeof customBabelConfig === 'function'
    ? customBabelConfig(defaultBabelConfig)
    : combineConfig(customBabelConfig);
