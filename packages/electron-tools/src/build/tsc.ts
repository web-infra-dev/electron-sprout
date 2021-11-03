import 'colors';
import { join, dirname } from 'path';
import { existsSync } from 'fs-extra';

import execa from 'execa';
import { DEFAULT_ELECTRON_MAIN_FOLDER } from '@/utils';

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
  args?: any[];
  exitOnError?: boolean; // exit when has error.
}

export const tscCode = async (options: TscOptions) => {
  const {
    mainProcessFolder = DEFAULT_ELECTRON_MAIN_FOLDER,
    userProjectPath,
    args = [],
    exitOnError = true,
  } = options;
  const tsconfig = join(userProjectPath, mainProcessFolder, 'tsconfig.json');
  if (!existsSync(tsconfig)) {
    return;
  }
  const childProcess = execa(
    typescrptCli,
    ['--project', tsconfig, '--noEmit', ...args],
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
