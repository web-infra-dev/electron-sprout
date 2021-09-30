import { ChildProcess } from 'child_process';
import { PROCESS_TYPE } from './constant';

export type ProcessInfo = {
  process: ChildProcess;
  args: any[];
};

class ProcessManager {
  private readonly processes: Map<PROCESS_TYPE, ProcessInfo> = new Map<
    PROCESS_TYPE,
    ProcessInfo
  >();

  constructor() {
    process.on('beforeExit', () => {
      this.exitAllProcesses();
    });
  }

  exitAllProcesses() {
    this.processes.forEach(each => each.process.kill());
  }

  stopProcess(processType: PROCESS_TYPE) {
    this.processes.get(processType)?.process.kill();
  }

  restartProcess(
    processType: PROCESS_TYPE,
    restart: (...args: any[]) => ProcessInfo,
  ) {
    console.log('restart process:', processType);
    const processSpawn = this.processes.get(processType);
    processSpawn?.process.on('exit', () => {
      setTimeout(() => {
        this.setProcess(processType, restart(processSpawn.args));
      }, 0);
    });

    if (processSpawn) {
      processSpawn.process.kill();
    }
  }

  setProcess(processType: PROCESS_TYPE, processInfo: ProcessInfo) {
    this.processes.set(processType, processInfo);
  }
}

export const processManager = new ProcessManager();
