import TestDriver from '@modern-js/electron-test';
// import TestDriver from '@modern-js/runtime/electron-test';
import { getOpenWindowConfig, sleep } from '../utils';

let testDriver: TestDriver | null = null;

beforeAll(async () => {
  testDriver = (global as any).testDriver;
  await testDriver?.whenReady('main');
});

describe('test lifecycle service', () => {
  // open a window, in lifecycle should have two windows
  // and close this will be 1
  it('test lifecycleService.registerWindow', async () => {
    const winName = 'test_register_window';

    await testDriver?.call(getOpenWindowConfig(winName));
    const curCount = await testDriver?.call({
      funcName: 'lifecycleService.getWindowCounter',
    });

    expect(curCount).toEqual(2);

    await testDriver?.call({
      funcName: 'winService.closeWindowByName',
      args: [winName],
    });

    const restCount = await testDriver?.call({
      funcName: 'lifecycleService.getWindowCounter',
    });

    expect(restCount).toEqual(1);
  });

  it('test lifecycleService.phase', async () => {
    const res = await testDriver?.call({
      funcName: 'setLifecyclePhase',
      args: [1],
    });
    expect(res).toBe('Lifecycle cannot go backwards');
  });

  it('test lifecycleService.when', async () => {
    const resultMsg = 'isReady';
    const res = await testDriver?.call({
      funcName: 'lifecycleWhenReady',
      args: [resultMsg],
    });
    expect(res).toBe(resultMsg);
  });
});

describe(`test lifecycleService.onClose, won't close window`, () => {
  let winId: number;
  const winName = 'test_lifecycle_service';
  beforeAll(async () => {
    const window = await testDriver?.call(
      getOpenWindowConfig(winName, {
        addBeforeCloseListener: true,
      }),
    );
    winId = window._id;
    return testDriver?.whenReady(winName);
  });
  it(`test lifecycleService.onClose has triggered`, async () => {
    const result = await new Promise(resolve => {
      testDriver
        ?.call({
          funcName: 'listenBeforeClose',
          winName,
          args: [],
        })
        .then(res => resolve(res));
      sleep(1).then(() => {
        testDriver?.call({
          funcName: 'winService.closeWindowById',
          args: [winId],
        });
      });
    });
    // received listenBeforeClose
    expect(result).toBe(true);
  });
  it(`test has two windows`, async () => {
    const windows = await testDriver?.call({
      funcName: 'winService.getWindows',
    });
    // didn't close ,so will be 2
    expect(windows.length).toBe(2);
  });
  it(`test force to close window`, async () => {
    await testDriver?.call({
      funcName: 'winService.closeWindowById',
      args: [
        winId,
        {
          closeMode: 'close',
        },
      ],
    });

    return sleep(1).then(async () => {
      const windows = await testDriver?.call({
        funcName: 'winService.getWindows',
      });
      // force close ,so will be 1
      expect(windows.length).toBe(1);
    });
  });
});

describe(`test lifecycleService.quit`, () => {
  const winName = 'main';
  let myDriver: TestDriver | null;
  beforeAll(async () => {
    myDriver = new TestDriver({
      cwd: process.cwd(),
      envs: {
        TEST_FOLDER: 2,
      },
    });
    await myDriver?.whenReady(winName);
  });
  it(`will not quit if doesn't set forceQuit=true`, async () => {
    myDriver?.call({
      funcName: 'listenBeforeClose',
      winName,
    });
    return sleep(1).then(async () => {
      await myDriver?.call({
        funcName: 'lifecycleService.quit',
      });
      expect(myDriver?.isRunning()).toBe(true);
    });
  });
  it(`will quit if set forceQuit=true`, async () => {
    await myDriver?.call({
      funcName: 'lifecycleService.quit',
      args: [
        {
          forceQuit: true,
        },
      ],
    });
    return sleep(1).then(() => {
      expect(myDriver?.isRunning()).toBe(false);
    });
  });
});

describe(`test lifecycleService.kill`, () => {
  const winName = 'main';
  let myDriver: TestDriver | null;
  beforeAll(async () => {
    myDriver = new TestDriver({
      cwd: process.cwd(),
      envs: {
        TEST_FOLDER: 3,
      },
    });
    await myDriver?.whenReady(winName);
  });
  it(`will quit when use kill`, async () => {
    myDriver?.call({
      funcName: 'listenBeforeClose',
      winName,
    });
    await sleep(1);
    await myDriver?.call({
      funcName: 'lifecycleService.kill',
    });
    await sleep(1);
    expect(myDriver?.isRunning()).toBe(false);
  });
});
