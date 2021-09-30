import { join, dirname } from 'path';
import fse from 'fs-extra';
import {
  pack,
  buildMainProcess as doBuildMainProcess,
  spawnPromise,
} from '@modern-js/electron-tools';
import { BUILD_MODE } from './constant';

type BuildOptions = {
  electronMain?: boolean;
  electronApp?: boolean;
  development?: boolean;
  main?: string; // entry folder for main process
  ignore?: string;
};

export const registerBuildMainCmd = (program: any) => {
  const cmds = program.commandsMap;
  if (cmds.get('build')) {
    cmds
      .get('build')
      .command('electron-main')
      // .option('-em, --electron-main', 'build electron main process code')
      .option('-d, --development', 'build with NODE_ENV=development')
      .option(
        '-m, --main <main>',
        'specify the entrance folder path of main process, such as: electron/',
      )
      // .option('-ea, --electron-app', 'pack electron app')
      .option('-i, --ignore <ignore>', 'ignore folder or file')
      .action((options: BuildOptions) => {
        buildMainProcess(options);
      });
  }
};

// temp solution, wait for env(CUSTOM_BUILD_MODE) support.
export const registerPackCmd = (program: any) => {
  const cmds = program.commandsMap;
  if (cmds.get('build')) {
    cmds
      .get('build')
      .command('electron-app')
      .action(() => {
        packApp();
      });
  }
};

export const buildRenderProcess = () => {
  const modernCli = join(
    dirname(require.resolve('@modern-js/app-tools')),
    '..',
    '..',
    '..',
    'bin',
    'modern.js',
  );
  return spawnPromise({
    processEnv: {
      ...process.env,
      NODE_ENV: 'production',
    },
    cwd: process.cwd(),
    cmd: modernCli,
    params: ['build'],
    stdio: 'inherit',
  });
};

export const registerBuildRendererCmd = (program: any) => {
  const cmds = program.commandsMap;
  if (cmds.get('build')) {
    cmds
      .get('build')
      .command('electron-web')
      .action(() => {
        process.env.BUILD_MODE = BUILD_MODE.ELECTRON_WEB;
        buildRenderProcess();
      });
  }
};

export const registerBuildAppCmd = (program: any) => {
  const cmds = program.commandsMap;
  if (cmds.get('build')) {
    cmds
      .get('build')
      .command('electron')
      .option('-d, --development', 'build with NODE_ENV=development')
      .option(
        '-m, --main <main>',
        'specify the entrance folder path of main process, such as: electron/',
      )
      .option('-i, --ignore <ignore>', 'ignore folder or file')
      .option('-en, --enableNode', 'enable use node in electron render')
      .action(
        async (
          options: BuildOptions & {
            enableNode?: boolean;
          },
        ) => {
          if (options.enableNode) {
            process.env.BUILD_MODE = BUILD_MODE.ELECTRON_WEB;
          }
          await buildRenderProcess();
          await buildMainProcess(options, false);
          return packApp();
        },
      );
  }
};

export const buildMainProcess = (
  options: BuildOptions,
  exitWhenDone?: boolean, // exit when finished, default is true
) => {
  const userProjectPath = process.cwd();
  const processEnv = process.env;
  processEnv.NODE_ENV = options.development ? 'development' : 'production';
  const compileOptions: any = {};

  const pkg = fse.readJSONSync(
    join(
      dirname(require.resolve('@modern-js/plugin-electron')),
      '..',
      '..',
      '..',
      'package.json',
    ),
  );

  if (options.ignore) {
    compileOptions.ignore = options.ignore.split(',');
  }
  return doBuildMainProcess({
    userProjectPath,
    exitWhenDone,
    env: {
      ...processEnv,
      BUILD_MODE: BUILD_MODE.ELECTRON_MAIN,
    },
    compileOptions,
    ignoreDependencies: ['@modern-js/runtime'],
    mainProcessFolder: options.main,
    externalDependencies: {
      // this is for modernjs alias import
      '@modern-js/plugin-electron':
        pkg.dependencies['@modern-js/plugin-electron'],
      // '@modern-js/electron-runtime':
      //   pkg.dependencies['@modern-js/electron-runtime'],
      // '@modern-js/electron-test': pkg.dependencies['@modern-js/electron-test'],
    },
  });
};

export const packApp = () => {
  const userProjectPath = process.cwd();
  const processEnv = process.env;
  const pkg = require(join(userProjectPath, 'package.json'));

  processEnv.VERSION = processEnv.VERSION || pkg.version || '1.0.0';
  const version = processEnv.VERSION || '';
  const platform = processEnv.PLATFORM || 'mac';
  return pack({
    userProjectPath,
    env: processEnv,
    platform: platform as any,
    version,
  });
};
