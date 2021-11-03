import glob from 'glob';
import { DEFAULT_EXTENSIONS } from '@babel/core';

export type Extensions = string[];
export type ExtensionsFunc = (defaultExtensions: Extensions) => Extensions;

const getFinalExtensions = (extensions: Extensions | ExtensionsFunc) => {
  const isExtensions = (ext: Extensions | ExtensionsFunc): ext is Extensions =>
    Array.isArray(ext);

  const isExtensionsFunc = (
    ext: Extensions | ExtensionsFunc,
  ): ext is ExtensionsFunc => typeof ext === 'function';

  if (isExtensions(extensions)) {
    return extensions;
  } else if (isExtensionsFunc(extensions)) {
    return extensions(DEFAULT_EXTENSIONS);
  } else {
    return DEFAULT_EXTENSIONS;
  }
};

const getGlobPattern = (srcDir: string, extensions: string[]) =>
  `${srcDir}/**/*${extensions.join(',')}`;

export const findFiles = (options: {
  srcDir: string;
  ignore: string[];
  extensions: string[];
}) => {
  const { srcDir, ignore, extensions = DEFAULT_EXTENSIONS } = options;
  const finalExt = getFinalExtensions(extensions);
  const globPattern = getGlobPattern(srcDir, finalExt);
  const filenames = glob.sync(globPattern, {
    ignore,
  });
  return filenames;
};
