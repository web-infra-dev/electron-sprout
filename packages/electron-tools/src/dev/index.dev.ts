import { join } from 'path';
import babel from '@babel/register';
import { babelConfig } from '../config';
import { getElectronMainEntryPath } from '../utils/paths';

babel({
  ...babelConfig,
  extensions: ['.ts', '.js'],
});

require(join(process.cwd(), getElectronMainEntryPath(true)));
