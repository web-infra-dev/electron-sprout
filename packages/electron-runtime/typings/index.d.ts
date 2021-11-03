export * from './applicationInsights';
export * from './applicationinsights-web';
export * from './chokidar';
export * from './es2015-proxy';
export * from './graceful-fs';
export * from './http-proxy-agent';
export * from './iconv-lite';
export * from './jschardet';
export * from './native-is-elevated';
export * from './native-keymap';
export * from './native-watchdog';
export * from './node-pty';
export * from './node.processEnv-ext';
export * from './nsfw';
export * from './onigasm-umd';
export * from './require';
export * from './require-monaco';
export * from './spdlog';
export * from './sudo-prompt';
export * from './thenable';
export * from './v8-inspect-profiler';
export * from './vsda';
export * from './windows-foreground-love';
export * from './windows-mutex';
export * from './windows-process-tree';
export * from './yauzl';
export * from './yazl';
export * from './https-proxy-agent';
export { default } from '../src/main';
export * from '../src/common';

declare global {
  namespace NodeJS {
    interface Global {
      electronCoreObj: any;
    }
  }
}
