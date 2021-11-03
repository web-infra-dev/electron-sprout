import { platform } from 'os';
import { app } from 'electron';

const IS_DEV = !app.isPackaged;

const PLATFORM = platform() === 'darwin' ? 'mac' : 'win';

export { IS_DEV, PLATFORM };
