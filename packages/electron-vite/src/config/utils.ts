import { UserConfig as ViteConfig, Plugin } from 'vite';

export function isObject(value: unknown): value is Record<string, unknown> {
  return Object.prototype.toString.call(value) === '[object Object]';
}

export const dynamicImport = new Function('file', 'return import(file)');

export function deepClone<T>(data: T): T {
  return JSON.parse(JSON.stringify(data));
}

export const promiseReduce = (promises: any[]) =>
  promises.reduce(
    (previousPromise, nextPromise) => previousPromise.then(() => nextPromise()),
    Promise.resolve(),
  );

export function mergePlugins(config: ViteConfig, plugins: Plugin[]): void {
  const userPlugins = config.plugins || [];
  config.plugins = userPlugins.concat(plugins);
}
