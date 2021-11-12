#!/usr/bin/env node
const { join } = require('path');
const { cliLog } = require('@modern-js/electron-log');
const program = require('commander');
const {
  devMainProcess,
  buildMainProcess,
  pack,
  ENVS,
  ENV_NAME,
} = require('./dist/js/node');

/**
 * start main process
 */
program
  .command('dev')
  .option(
    '-e, --entry <entry>',
    'specify the entry path of main process such as: xx/xx.ts(js)',
  )
  .description('start electron main process')
  .action(options => {
    const userProjectPath = process.cwd();
    cliLog.log('options:', options);
    devMainProcess({
      userProjectPath,
      env: process.env,
      entryFilePath: options.entry,
    });
  });

/**
 * build main process
 */
program
  .command('build')
  .option('-d, --development', 'build with NODE_ENV=development')
  .option(
    '-em, --main  <main>',
    'specify the entry folder path of main process, such as: electron/ (with tsconfig.json)',
  )
  .option('-e, --extra <extra...>', 'specify extra folders to compile')
  .option('-i, --ignore <ignore>', 'ignore folder or file')
  .description('build electron main process')
  .action(options => {
    const userProjectPath = process.cwd();
    const processEnv = process.env;
    const compileOptions = {};
    if (options.ignore) {
      compileOptions.ignore = options.ignore.split(',');
    }

    // used for whether to compress js.
    process.env[ENVS.ELECTRON_BUILD_ENV] = options.development
      ? ENV_NAME.DEV
      : ENV_NAME.PROD;

    process.env.NODE_ENV = ENV_NAME.PROD;

    buildMainProcess({
      userProjectPath,
      env: processEnv,
      compileOptions,
      mainProcessFolder: options.main,
    });
  });

/**
 * pack electron app
 */
program
  .command('pack')
  .description('pack electron app')
  // .option('-d, --development', 'build with NODE_ENV=development')
  .action(() => {
    const userProjectPath = process.cwd();
    const processEnv = process.env;
    // if is dev, do not use byte encr.
    const pkg = require(join(userProjectPath, 'package.json'));

    processEnv.VERSION = processEnv.VERSION || pkg.version || '1.0.0';
    const version = processEnv.VERSION;

    const platform = processEnv.PLATFORM || 'mac';

    return pack({
      userProjectPath,
      env: processEnv,
      platform,
      version,
    });
  });

program.parse(process.argv);
