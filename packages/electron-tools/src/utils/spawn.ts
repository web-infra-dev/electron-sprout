import { ChildProcess, StdioOptions } from 'child_process';
import spawn from 'cross-spawn';
import { cliLog } from '@modern-js/electron-log';

const spawnPromise = (options: {
  cmd: string;
  cwd: string;
  params: string[];
  processEnv: any;
  error?: string;
  stdio?: StdioOptions;
  registerListener?: (childProcess: ChildProcess) => void;
}) => {
  const { cmd, cwd, params, processEnv, registerListener, error, stdio } =
    options;
  return new Promise((resolve, reject) => {
    const result = spawn(cmd, params, {
      env: processEnv,
      cwd,
      stdio: stdio || 'inherit',
    });

    if (registerListener) {
      registerListener(result);
    }

    result
      .on('error', (e: any) => {
        cliLog.error(error || `exec ${cmd} error`, e);
        process.exitCode = -1;
        reject(error);
      })
      .on('close', code => {
        if (code) {
          process.exitCode = code;
        }
        resolve(true);
      });
  });
};

export { spawnPromise };
