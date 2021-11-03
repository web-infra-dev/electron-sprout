import { join } from 'path';
import dayjs from 'dayjs';
import electronLog, { ElectronLog, PathVariables } from 'electron-log';

import 'colors';

const mainLog = electronLog.create('main-process');
const renderLog = electronLog.create('render-process');
const cliLog = electronLog.create('cli-log');

const DATE_FORMAT = 'YYYY-MM-DD HH:mm:ss';

const infoLogStyle = (data: any) =>
  data.map((each: any) => `${each}`.green).join('');

const warnLogStyle = (data: any) =>
  data.map((each: any) => `${each}`.yellow).join('');

const errorLogStyle = (data: any) =>
  data.map((each: any) => `${each}`.red).join('');

const getProcessType = () => {
  if ((process as any).type === 'browser') {
    return 'electron_main';
  } else if ((process as any).type === 'renderer') {
    return 'electron_renderer';
  }
  return (process as any).type || 'cli';
};

const formatLog = (logMsg: any) => {
  const msgPrefix = [`[${getProcessType()}]`, `[${logMsg.level}] > `];
  const msgContent = logMsg.data.join('');
  const dateContent = `[${dayjs(logMsg.date).format(DATE_FORMAT)}]`.grey;

  switch (logMsg.level) {
    case 'warn':
      return dateContent + warnLogStyle(msgPrefix) + msgContent;
    case 'error':
      return dateContent + errorLogStyle(msgPrefix) + msgContent;
    default:
      return dateContent + infoLogStyle(msgPrefix) + msgContent;
  }
};

const formatAllLogs = (log: ElectronLog) => {
  log.transports.console.format = formatLog;
  log.transports.file.format = formatLog;
};

const initLabel = (log: ElectronLog) => {
  log.variables.label = 'scope';
};

const disableLog = (log: ElectronLog) => {
  // only show errors
  log.transports.console.level = 'error';
};

const disableIpcLog = (log: ElectronLog) => {
  if (log.transports.ipc) {
    log.transports.ipc.level = false;
  }
};

const setDefaultLogPath = (log: ElectronLog, name: string) => {
  log.transports.file.resolvePath = (vars: PathVariables) =>
    join(vars.userData, `logs/${name}.log`);
};

[renderLog, mainLog, cliLog].forEach(x => {
  formatAllLogs(x);
  initLabel(x);
  disableLog(x);
  disableIpcLog(x);
});

setDefaultLogPath(renderLog, 'renderer');
setDefaultLogPath(mainLog, 'main');
setDefaultLogPath(cliLog, 'cli');

export { mainLog, renderLog, cliLog, formatLog };
