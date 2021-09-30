import 'colors';
import { join, dirname } from 'path';
import { existsSync } from 'fs-extra';

import execa from 'execa';
import { DEFAULT_ELECTRON_MAIN_FOLDER } from '@/utils';

const typescrptCli = join(
  dirname(require.resolve('typescript')),
  '..',
  'bin',
  'tsc',
);

export interface TscOptions {
  mainProcessFolder?: string; // 相对于 userProjectPath
  userProjectPath: string;
  args?: any[];
}

export const tscCode = async (options: TscOptions) => {
  const {
    mainProcessFolder = DEFAULT_ELECTRON_MAIN_FOLDER,
    userProjectPath,
    args = [],
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
    process.exitCode = 1;
    process.exit();
  }
};
