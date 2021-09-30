import { join } from 'path';
import spawn from 'cross-spawn';

export type PLATFORM = 'mac' | 'win32' | 'win64' | 'linux' | 'linuxArm64';

const getPackParams = (options: { version: string; platform: PLATFORM }) => {
  const { version, platform } = options;
  const isWindows = ['win32', 'win', 'win64'].includes(platform);
  const isWin64 = platform === 'win64';
  const isLinux = platform === 'linux';
  const isLinuxArm64 = platform === 'linuxArm64';
  const configJs = join(__dirname, 'builder-config.js');
  const params = [`-c.extraMetadata.version=${version}`, 'build'];
  if (isLinuxArm64) {
    params.push('--arm64');
  }
  params.push('--publish', 'never', '--config', configJs);
  if (isWindows) {
    params.push('--win');
    params.push(isWin64 ? '--x64' : '--ia32');
  }
  if (isLinux) {
    params.push('--linux');
    params.push('deb');
    params.push('tar.xz');
  }
  return params;
};

const doPack = (options: {
  userProjectPath: string; // running folder
  env: Record<string, string | undefined>;
  platform: PLATFORM;
  version: string;
}) => {
  const { userProjectPath, env, version, platform } = options;
  const electronBuilderBin = require.resolve('electron-builder/cli.js');
  const exec = spawn(electronBuilderBin, getPackParams({ version, platform }), {
    cwd: userProjectPath,
    env: {
      ...process.env,
      ...env,
    },
    stdio: 'inherit',
  });
  exec.on('close', code => {
    if (code) {
      process.exitCode = code;
    }
  });
};

export const pack = (options: {
  userProjectPath: string; // running folder
  env: Record<string, string | undefined>;
  platform: PLATFORM;
  version: string;
}) => doPack(options);
