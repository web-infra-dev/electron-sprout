import { join } from 'upath';
import { getProjectInfo } from './get-output-dir';
import { createNodeModulesPkg } from './create-pkg';
import { compileMainProcess, CompileOptions } from './compile';
import { uglify } from './uglifyjs';
import { tscCode } from './tsc';
import { ENVS, ENV_NAME } from '@/utils';

/**
 * 1. build main process with babel
 * 2. get dependences which used in main process and vim a package.json in node_modules/.main-process-modules
 * by babel plugin
 */
export const buildMainProcess = async (options: {
  userProjectPath: string; // start folder
  env: Record<string, string | undefined>;
  compileOptions?: CompileOptions;
  externalDependencies?: Record<string, string>;
  ignoreDependencies?: string[];
  mainProcessFolder?: string; // main entrance path relative start folder
  exitWhenDone?: boolean; // exit process when done, default is true
}) => {
  const {
    userProjectPath,
    mainProcessFolder,
    compileOptions,
    externalDependencies,
    ignoreDependencies,
    exitWhenDone,
  } = options;
  const { outDir } = getProjectInfo(options);

  await tscCode({
    mainProcessFolder,
    userProjectPath,
  });

  // compile
  const result = await compileMainProcess({
    ...options,
    outDir,
  });
  if (result.code === 1) {
    (result.messageDetails || []).map(console.log);
    process.exitCode = 1;
    throw Error('compile main process error');
  }
  // use uglifyjs
  // if is Js project, srcDir is origin folder: electron
  // if is Ts project, srcDir is dist folder of babel compile: dist/electron
  if (process.env[ENVS.ELECTRON_BUILD_ENV] === ENV_NAME.PROD) {
    await uglify({
      srcDir: join(userProjectPath, outDir),
      ignore: compileOptions?.ignore || [],
    });
  }
  // create package.json of main process node_modules.
  createNodeModulesPkg({
    userProjectPath,
    externalDependencies: externalDependencies || {},
    ignoreDependencies,
  });
  if (exitWhenDone !== false) {
    process.exit();
  }
};

export * from './compile';
export * from './tsc';
