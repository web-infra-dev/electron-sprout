/**
 * handle webpack config of renderer process
 */

export const prepareRendererWebpack = (config: any) => {
  config.node = {
    __dirname: false,
    __filename: false,
  };
  config.target = 'electron-renderer';
  return config;
};
