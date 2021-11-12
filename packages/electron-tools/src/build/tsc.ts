import 'colors';
import { join, dirname } from 'path';
import { existsSync } from 'fs-extra';

import execa from 'execa';
import {
  DEFAULT_ELECTRON_MAIN_DIST_FOLDER,
  DEFAULT_ELECTRON_MAIN_FOLDER,
} from '@/utils';

const getTypescriptCli = () => {
  try {
    return join(dirname(require.resolve('typescript')), '..', 'bin', 'tsc');
  } catch (error) {
    return '';
  }
};

const typescrptCli = getTypescriptCli();

export interface TscOptions {
  mainProcessFolder?: string; // relative to userProjectPath.
  userProjectPath: string;
  extra?: string[];
  args?: any[];
  exitOnError?: boolean; // exit when has error.
}

export const tscCode = async (options: TscOptions) => {
  const { mainProcessFolder = DEFAULT_ELECTRON_MAIN_FOLDER, userProjectPath } =
    options;
  const tsconfig = join(userProjectPath, mainProcessFolder, 'tsconfig.json');
  await tscExtra(tsconfig, options);
  // compile main process code
  return doTsc(tsconfig, options);
};

const tscExtra = (tsconfig: string, options: TscOptions) => {
  const { extra = [] } = options;
  return Promise.all(
    extra.map(x =>
      doTsc(tsconfig, {
        ...options,
        mainProcessFolder: x,
      }),
    ),
  );
};

export const doTsc = async (tsConfig: string, options: TscOptions) => {
  const { args = [] } = options;
  const { exitOnError = true } = options;
  if (!existsSync(tsConfig)) {
    return;
  }
  const childProcess = execa(
    typescrptCli,
    ['--project', tsConfig, '--noEmit', ...args],
    {
      stdio: 'pipe',
    },
  );
  try {
    await childProcess;
  } catch (error: any) {
    error.stdout
      .split('\n')
      .forEach((x: string) => console.log(`${x.red}\n\r`));
    if (exitOnError) {
      process.exitCode = 1;
      process.exit();
    }
  }
};
