import { join } from 'path';
import { compiler } from '@modern-js/babel-compiler';
import { babelConfig } from '../config';
import { DEFAULT_ELECTRON_MAIN_FOLDER } from '../utils/paths';

export type CompileOptions = {
  outDir?: string;
  quiet?: boolean; // default is false
  sourceMaps?: boolean; // default is false
  ignore?: string[]; // default is []
  srcDir?: string;
  extensions?: string[]; // default is ['.ts', '.js']
  watch?: boolean; // default is false
  cwd?: string;
  outExt?: string;
};

export const compileMainProcess = (options: {
  userProjectPath: string; // start folder
  env: Record<string, string | undefined>;
  compileOptions?: CompileOptions;
  outDir: string;
  mainProcessFolder?: string; // main entrance path relative start folder
}) => {
  const {
    userProjectPath,
    env,
    outDir,
    compileOptions = {},
    mainProcessFolder = DEFAULT_ELECTRON_MAIN_FOLDER,
  } = options;
  const defaultCompileOptions = {
    distDir: outDir,
    quiet: false,
    sourceMaps: false,
    ignore: ['**/tests/**/*', '**/*/*.dev.js'],
    sourceDir: join(userProjectPath, mainProcessFolder),
    rootDir: join(userProjectPath, mainProcessFolder),
    extensions: ['.ts', '.js'],
    watch: false,
    cwd: userProjectPath,
    outExt: undefined,
  };
  const getMinified = () => {
    if (babelConfig.hasOwnProperty('minified')) {
      return babelConfig.minified;
    }
    return env.NODE_ENV !== 'development';
  };
  console.log('compile options:', compileOptions, {
    ...babelConfig,
    minified: getMinified(),
  });
  return compiler(
    { ...defaultCompileOptions, ...compileOptions },
    {
      ...babelConfig,
      minified: getMinified(),
    },
  );
};
