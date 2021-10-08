import { join } from 'path';

export const sleep = (sec: number) =>
  new Promise(resolve => {
    setTimeout(() => resolve(true), sec * 1000);
  });

export const getOpenWindowConfig = (
  winName: string,
  customConfig: Record<string, any> = {},
) => ({
  funcName: 'winService.createWindow',
  args: [
    {
      name: winName,
      options: {
        width: 400,
        webPreferences: {
          enableRemoteModule: true,
          preload: join(
            __dirname,
            '..',
            'preload',
            'browserWindow',
            'index.dev.js',
          ),
        },
      },
      loadUrl: 'https://www.baidu.com',
      ...customConfig,
    },
  ],
});
