import * as path from 'path';
import * as fs from 'fs';
import { CONFIG_FILE_NAME } from './contant';

export function findConfigFile(
  configRoot: string,
  extensions: string[],
): string {
  for (const ext of extensions) {
    const configFile = path.resolve(configRoot, `${CONFIG_FILE_NAME}.${ext}`);
    if (fs.existsSync(configFile)) {
      return configFile;
    }
  }
  return '';
}
