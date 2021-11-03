import { initialize, enable } from '@electron/remote/main';
import { app } from 'electron';

export const initRemote = () => {
  initialize();
  app.on('web-contents-created', (_, webContent: Electron.webContents) => {
    enable(webContent);
  });
};
