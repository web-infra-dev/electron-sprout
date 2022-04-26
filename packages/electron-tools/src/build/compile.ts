import { join } from 'path';
import { compiler } from '@modern-js/babel-compiler';
import { dirname } from 'upath';
import { babelConfig } from '../config';
import { DEFAULT_ELECTRON_MAIN_FOLDER } from '../utils/paths';
import { ENVS, ENV_NAME } from '@/utils';

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

const DEFAULT_IGNORE = ['**/tests/**/*', '**/*/*.dev.js'];

export const compileMainProcess = (options: {
  userProjectPath: string; // start folder
  env: Record<string, string | undefined>;
  compileOptions?: CompileOptions;
  outDir: string;
  extra?: string[];
  mainProcessFolder?: string; // main entrance path relative start folder
}) => {
  const {
    extra = [],
    outDir,
    mainProcessFolder = DEFAULT_ELECTRON_MAIN_FOLDER,
  } = options;
  return Promise.all(
    [...extra, mainProcessFolder].map(each =>
      doCompile({
        ...options,
        mainProcessFolder: each,
        outDir:
          each === mainProcessFolder ? outDir : join(dirname(outDir), each),
      }),
    ),
  );
};

const doCompile = (options: {
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
    ignore: DEFAULT_IGNORE,
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

    return env[ENVS.ELECTRON_BUILD_ENV] !== ENV_NAME.DEV;
  };

  compileOptions.ignore = compileOptions.ignore || [];
  compileOptions.ignore = compileOptions.ignore.concat(DEFAULT_IGNORE);
  babelConfig.sourceMaps = compileOptions.sourceMaps;
  return compiler(
    { ...defaultCompileOptions, ...compileOptions },
    {
      ...babelConfig,
      minified: getMinified(),
    },
  );
};
