import os from 'os';

export const YARN_BIN = os.platform() === 'darwin' ? 'yarn' : 'yarn.cmd';

export const getElectronBuilderBin = () => {
  try {
    // electron-builder >= 22.13
    return require.resolve('electron-builder/cli.js');
  } catch (error) {
    // electron-builder >= 22.10
    try {
      return require.resolve('electron-builder/out/cli/cli.js');
    } catch (_err) {
      throw Error('electron-builder version should >=22.10.0');
    }
  }
};
