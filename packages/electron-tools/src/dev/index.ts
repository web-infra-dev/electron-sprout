import { StdioOptions } from 'child_process';
import { join } from 'path';
import spawn from 'cross-spawn';
import { dirname } from 'upath';
import { tscCode } from '../build';
import { DEFAULT_ELECTRON_MAIN_FOLDER } from '@/utils/paths';

// start main process
export const devMainProcess = (options: {
  userProjectPath: string; // start folder
  entryFilePath?: string; // main process entrance file, relative to userProject
  env: Record<string, string | undefined>;
  stdio?: StdioOptions | undefined;
}) => {
  const { userProjectPath, entryFilePath = '', env, stdio } = options;
  const electronBin = require('electron');

  if (entryFilePath) {
    process.env.MAIN_ENTRY_FILE = entryFilePath;
  }

  tscCode({
    mainProcessFolder: entryFilePath
      ? dirname(entryFilePath)
      : DEFAULT_ELECTRON_MAIN_FOLDER,
    userProjectPath,
    exitOnError: false,
  });

  const index = join(__dirname, 'index.dev.js');

  const exec = spawn(electronBin, [index, ...process.argv], {
    cwd: userProjectPath,
    stdio: stdio || 'inherit',
    env: {
      ...process.env,
      ...env,
      NODE_ENV: 'development',
    },
  });
  return exec;
};
