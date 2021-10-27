import { join } from 'path';
import babel from '@babel/register';
import { babelConfig } from '../config';
import { getElectronMainEntryPath, isTsProject } from '../utils';

babel({
  ...babelConfig,
  extensions: ['.ts', '.js'],
});

const cwd = process.cwd();

// should ensure whether is ts project herer.
// because js project will also use this to compile import grammer.
require(join(cwd, getElectronMainEntryPath(isTsProject(cwd))));
