import os from 'os';

export const YARN_BIN = os.platform() === 'darwin' ? 'yarn' : 'yarn.cmd';
