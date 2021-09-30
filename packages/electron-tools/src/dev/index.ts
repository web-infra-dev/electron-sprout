import { StdioOptions } from 'child_process';
import { join } from 'path';
import spawn from 'cross-spawn';

// start main process
export const devMainProcess = (options: {
  userProjectPath: string; // start folder
  entryFilePath?: string; // main process entrance file, relative to userProject
  env: Record<string, string | undefined>;
  stdio?: StdioOptions | undefined;
}) => {
  const { userProjectPath, entryFilePath, env, stdio } = options;
  const electronBin = require('electron');

  if (entryFilePath) {
    process.env.MAIN_ENTRY_FILE = entryFilePath;
  }

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
