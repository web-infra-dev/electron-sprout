import { join, dirname } from 'path';
import spawn from 'cross-spawn';
import { minimist } from '@modern-js/utils';
import { devMainProcess } from '@modern-js/electron-tools';
import { BUILD_MODE, ENVS, ENV_NAME, PROCESS_TYPE } from './constant';
import { processManager } from './process-manager';

export const execDevMain = (entry?: string) => {
  const exec = devMainProcess({
    userProjectPath: process.cwd(),
    env: {
      ...process.env,
      BUILD_MODE: BUILD_MODE.ELECTRON_MAIN,
    },
    entryFilePath: entry || undefined,
  });

  return exec;
};

export const registerDevMainCmd = (program: any) => {
  const cmds = program.commandsMap;
  if (cmds.get('dev')) {
    cmds
      .get('dev')
      .command('electron-main')
      .option(
        '-e, --entry <entry>',
        'specify the entry path of main process such as: xx/xx.ts(js)',
      )
      .action(() => {
        const { entry } = minimist(process.argv);
        processManager.setProcess(PROCESS_TYPE.MAIN, {
          process: execDevMain(entry),
          args: entry ? [entry] : [],
        });
      });
  }
};

const execDev = () => {
  const modernCli = join(
    dirname(require.resolve('@modern-js/app-tools')),
    '..',
    '..',
    '..',
    'bin',
    'modern.js',
  );
  const exec = spawn(modernCli, ['dev'], {
    env: {
      ...process.env,
      NODE_ENV: ENV_NAME.DEV,
    },
    stdio: 'inherit',
    cwd: process.cwd(),
  });

  processManager.setProcess(PROCESS_TYPE.RENDERER, {
    process: exec,
    args: [],
  });
  return exec;
};

export const registerDevRenderCmd = (program: any) => {
  const cmds = program.commandsMap;
  if (cmds.get('dev')) {
    cmds
      .get('dev')
      .command('electron-web')
      .action(() => {
        process.env[ENVS.BUILD_MODE] = BUILD_MODE.ELECTRON_WEB;
        return execDev();
      });
  }
};

// const registerRestartListener = () => {
//   process.stdin.on('data', data => {
//     const command = data.toString().trim();
//     switch (command) {
//       case USER_CLI_COMMAND.RESTART_ELECTRON_MAIN_PROCESS:
//         processManager.restartProcess(PROCESS_TYPE.MAIN, (args: any[]) => ({
//           args,
//           process: execDevMain(...args),
//         }));
//         break;
//       case USER_CLI_COMMAND.RESTART_RENDERER_PROCESS:
//         processManager.restartProcess(PROCESS_TYPE.RENDERER, (args: any[]) => ({
//           args,
//           process: execDev(),
//         }));
//         break;
//       case USER_CLI_COMMAND.STOP_MAIN_PROCESS:
//         processManager.stopProcess(PROCESS_TYPE.MAIN);
//         break;
//       case USER_CLI_COMMAND.STOP_RENDERER_PROCESS:
//         processManager.stopProcess(PROCESS_TYPE.RENDERER);
//         break;
//       default:
//         break;
//     }
//   });
// };

export const registerDevElectronCmd = (program: any) => {
  const cmds = program.commandsMap;
  if (cmds.get('dev')) {
    cmds
      .get('dev')
      .command('electron')
      .option('-en, --enableNode', 'enable use node in electron render')
      .option(
        '-e, --entry <entry>',
        'specify the entry path of main process such as: xx/xx.ts(js)',
      )
      .action(() => {
        const { entry, enableNode } = minimist(process.argv);
        if (enableNode) {
          process.env[ENVS.BUILD_MODE] = BUILD_MODE.ELECTRON_WEB;
        }
        process.env[ENVS.IS_ELECTRON_COMMAND] = 'true';

        if (entry) {
          process.env[ENVS.MAIN_PROCESS_ENTRY_FILE] = entry;
        }
        // TODO: @pikun won't support to restart, it will have some problem
        // registerRestartListener();
        return execDev();
      });
  }
};
