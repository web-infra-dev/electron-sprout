import * as path from 'path';
import { createRequire } from 'module';
import * as fs from 'fs';

export function getElectronMainVer(root: string): string {
  let mainVer = process.env.ELECTRON_MAIN_VER || '';
  if (!mainVer) {
    const electronModulePath = path.resolve(root, 'node_modules', 'electron');
    const pkg = path.join(electronModulePath, 'package.json');
    if (fs.existsSync(pkg)) {
      const require = createRequire(import.meta.url);
      const { version } = require(pkg);
      mainVer = version.split('.')[0];
      process.env.ELECTRON_MAIN_VER = mainVer;
    }
  }
  return mainVer;
}

export function getElectronNodeTarget(electronVer: string): string {
  const nodeVer: any = {
    '19': '16.14',
    '18': '16.13',
    '17': '16.13',
    '16': '16.9',
    '15': '16.5',
    '14': '14.17',
    '13': '14.17',
    '12': '14.16',
    '11': '12.18',
  };
  if (electronVer && parseInt(electronVer) > 10) {
    return `node${nodeVer[electronVer]}`;
  }
  return '';
}

export function getElectronChromeTarget(electronVer: string): string {
  const chromeVer: any = {
    '19': '102',
    '18': '100',
    '17': '98',
    '16': '96',
    '15': '94',
    '14': '93',
    '13': '91',
    '12': '89',
    '11': '87',
  };
  if (electronVer && parseInt(electronVer) > 10) {
    return `chrome${chromeVer[electronVer]}`;
  }
  return '';
}

export function processEnvDefine(): Record<string, string> {
  return {
    'process.env': `process.env`,
    'global.process.env': `global.process.env`,
    'globalThis.process.env': `globalThis.process.env`,
  };
}

export interface ElectronPluginOptions {
  root?: string;
}
