import * as path from 'path';
import colors from 'picocolors';
import { Plugin } from 'vite';

export function electronConfigServeVitePlugin(options: {
  configFile: string;
  configFileDependencies: string[];
}): Plugin {
  const getShortName = (file: string, root: string): string => {
    return file.startsWith(`${root}/`) ? path.posix.relative(root, file) : file;
  };

  return {
    name: 'vite:electron-config-serve',
    apply: 'serve',
    handleHotUpdate({ file, server }): void {
      const { config } = server;
      const { logger } = config;
      const shortFile = getShortName(file, config.root);
      const isConfig = file === options.configFile;
      const isConfigDependency = options.configFileDependencies.some(
        name => file === path.resolve(name),
      );
      if (isConfig || isConfigDependency) {
        logger.info(`[config change] ${colors.dim(shortFile)}`);
        logger.info(
          colors.green(
            `${path.relative(
              process.cwd(),
              file,
            )} changed, restarting server...`,
          ),
          {
            clear: true,
            timestamp: true,
          },
        );
        try {
          server.restart();
        } catch (e) {
          logger.error(colors.red('failed to restart server'), {
            error: e as Error,
          });
        }
      }
    },
  };
}
