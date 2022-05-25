import * as path from 'path';
import _ from 'lodash';
import { existsSync, unlinkSync, writeFileSync } from 'fs';
import { ConfigEnv, LogLevel, createLogger, normalizePath } from 'vite';
import colors from 'picocolors';
import { bundleConfigFile } from './bundleConfigFile';
import { CONFIG_FILE_NAME } from './contant';
import { findConfigFile } from './findConfigFile';
import { UserConfig } from './types';
import { dynamicImport, isObject, promiseReduce } from './utils';

export interface LoadConfigOption {
  configEnv: ConfigEnv;
  configRoot: string;
  configFile?: string;
  ignoreConfigWarning: boolean;
  logLevel?: LogLevel;
}

const checkConfigFileName = (configFile?: string) => {
  if (configFile && /^vite.config.(js)|(ts)|(mjs)|(cjs)$/.test(configFile)) {
    throw new Error(`config file cannot be named ${configFile}.`);
  }
};

const isESMType = (configRoot: string, resolvedPath: string) => {
  let isESM = false;
  if (resolvedPath.endsWith('.mjs')) {
    isESM = true;
  }

  if (resolvedPath.endsWith('.js')) {
    const pkg = path.join(configRoot, 'package.json');
    if (existsSync(pkg)) {
      isESM = require(pkg).type === 'module';
    }
  }
  return isESM;
};

const getOriginConfig = async (configRoot: string, resolvedPath: string) => {
  let configPath = resolvedPath;
  const bundled = await bundleConfigFile(resolvedPath);
  const isESM = isESMType(configRoot, resolvedPath);
  if (!isESM) {
    configPath = path.resolve(configRoot, `${CONFIG_FILE_NAME}.mjs`);
    writeFileSync(configPath, bundled.code);
  }

  const fileUrl = require('url').pathToFileURL(configPath);

  const userConfig = (await dynamicImport(fileUrl)).default;

  if (!isESM) {
    unlinkSync(configPath);
  }

  const config = await (typeof userConfig === 'function'
    ? userConfig()
    : userConfig);
  if (!isObject(config)) {
    throw new Error(`config must export or return an object`);
  }
  return {
    config,
    bundled,
  };
};

const analysisConfig = (options: {
  configEnv: ConfigEnv;
  config: UserConfig;
  ignoreConfigWarning: boolean;
  logLevel?: LogLevel;
}) => {
  const { configEnv, config, ignoreConfigWarning, logLevel } = options;
  const configRequired: string[] = [];
  const result: UserConfig = {
    main: {},
    renderer: {},
    preload: {},
  };
  const configKeys = Object.keys(result);
  return promiseReduce(
    configKeys.map((each: string) => async() => {
      const viteConfig = _.get(config, each);
      if (viteConfig) {
        _.set(
          result,
          each,
          typeof viteConfig === 'function'
            ? await viteConfig(configEnv)
            : viteConfig,
        );
        if (!isObject(viteConfig)) {
          throw new Error(`${each} config must export or return an object`);
        }
      } else {
        configRequired.push(each);
      }
    }),
  ).then(() => {
    if (!ignoreConfigWarning && configRequired.length > 0) {
      createLogger(logLevel).warn(
        colors.yellow(`${configRequired.join(' and ')} config is missing`),
      );
    }
    return result;
  });
};

async function loadConfigFromFile(options: LoadConfigOption): Promise<{
  path: string;
  config: UserConfig;
  dependencies: string[];
}> {
  const {
    configEnv,
    configRoot = process.cwd(),
    configFile,
    ignoreConfigWarning = false,
    logLevel,
  } = options;

  checkConfigFileName(configFile);

  const resolvedPath = configFile
    ? path.resolve(configFile)
    : findConfigFile(configRoot, ['js', 'ts', 'mjs', 'cjs']);

  if (!resolvedPath) {
    return {
      path: '',
      config: { main: {}, preload: {}, renderer: {} },
      dependencies: [],
    };
  }
  const configFilePath = resolvedPath;
  try {
    const { config, bundled } = await getOriginConfig(configRoot, resolvedPath);

    const configRes = await analysisConfig({
      configEnv,
      config,
      ignoreConfigWarning,
      logLevel,
    });
    return {
      path: normalizePath(configFilePath),
      config: configRes,
      dependencies: bundled.dependencies,
    };
  } catch (e) {
    createLogger(logLevel).error(
      colors.red(`failed to load config from ${configFilePath}`),
      { error: e as Error },
    );
    throw e;
  }
}

export { loadConfigFromFile };
