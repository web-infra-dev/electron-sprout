import { app } from 'electron';

export const configureCommandlineSwitche = () => {
  app.commandLine.appendSwitch('disable-color-correct-rendering');
};
