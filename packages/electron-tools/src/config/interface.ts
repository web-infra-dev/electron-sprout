import { TransformOptions } from '@babel/core';
import { Configuration } from 'electron-builder';

export type UserConfig = {
  builder?: Configuration;
  babel?:
    | TransformOptions
    | ((defaultBabelConfig: TransformOptions) => TransformOptions);
};
