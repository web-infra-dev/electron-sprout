#!/usr/bin/env node
const { join } = require('path');
const { cliLog } = require('@modern-js/electron-log');
const program = require('commander');
const { devMainProcess, buildMainProcess, pack } = require('./dist/js/node');

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
    '-em, --main <main>',
    'specify the entrance folder path of main process, such as: electron/',
  )
  .option('-i, --ignore <ignore>', 'ignore folder or file')
  .description('build electron main process')
  .action(options => {
    const userProjectPath = process.cwd();
    const processEnv = process.env;
    processEnv.NODE_ENV = options.development ? 'development' : 'production';
    const compileOptions = {};
    if (options.ignore) {
      compileOptions.ignore = options.ignore.split(',');
    }
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
  .option('-d, --development', 'build with NODE_ENV=development')
  .action(options => {
    const userProjectPath = process.cwd();
    const processEnv = process.env;
    processEnv.NODE_ENV = options.development ? 'development' : 'production';
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
