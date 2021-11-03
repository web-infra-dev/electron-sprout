import TestDriver from '@modern-js/electron-test';
import { getOpenWindowConfig, sleep } from '../utils';

let testDriver: TestDriver | null = null;

beforeAll(async () => {
  testDriver = (global as any).testDriver;
  await testDriver?.whenReady('main');
});

describe('test winService api', () => {
  it('test winService.onMainBroadCast', async () => {
    const data = 'broadcastTest';
    const channel = 'broad_cast_test_channel';
    // await sleep(3);
    const result = await new Promise(resolve => {
      testDriver
        ?.call({
          funcName: 'listenMessage',
          winName: 'main',
          args: [channel],
        })
        .then((_result: any) => resolve(_result));

      sleep(1).then(() => {
        testDriver?.call({
          funcName: 'broadCastMsg',
          args: [channel, data],
        });
      });
    });

    expect(result).toEqual(data);
  });

  it('test winService.onMessage', async () => {
    const winName = 'main';
    const channel = 'on_message_channel';
    const msg = 'this is msg';
    const result = await new Promise(resolve => {
      testDriver
        ?.call({
          funcName: 'listenMessage',
          winName,
          args: [channel],
        })
        .then(data => resolve(data));
      sleep(1).then(() => {
        testDriver?.call({
          funcName: 'winService.sendTo',
          args: [winName, channel, msg],
        });
      });
    });

    expect(result).toBe(msg);
  });

  it('test winService.broadCast', async () => {
    const winName = 'test1';
    const channel = 'test_broad_cast_channel';
    const msg = 'this is msg of broadcast';
    const window = await testDriver?.call(getOpenWindowConfig(winName));
    await testDriver?.whenReady(winName);
    const result = await new Promise(resolve => {
      // listen to msg
      testDriver
        ?.call({
          funcName: 'listenMessage',
          winName,
          args: [channel],
        })
        .then(resolve);

      sleep(1).then(() =>
        testDriver?.call({
          funcName: 'winService.broadCast',
          winName: 'main',
          args: [channel, msg],
        }),
      );
    });

    expect(result).toBe(msg);

    await testDriver?.call({
      funcName: 'winService.closeWindowById',
      args: [window._id],
    });
  });

  it('test winService.callBrowserWindow', async () => {
    const winName = 'testCall';
    const window = await testDriver?.call(getOpenWindowConfig(winName));
    await testDriver?.whenReady(winName);
    const res = await testDriver?.call({
      funcName: 'winService.callBrowserWindow',
      winName: 'main',
      args: ['main', 'getCurrentWindowId'],
    });
    // main window id will always be 1
    expect(res).toEqual(1);

    await testDriver?.call({
      funcName: 'winService.closeWindowById',
      args: [window._id],
    });
  });
});

describe('test winService.registerWillClose', () => {
  let myDriver: TestDriver | null;
  const winName = 'main';
  beforeAll(async () => {
    await sleep(2);
    myDriver = new TestDriver({
      cwd: process.cwd(),
      envs: {
        TEST_FOLDER: 'registerWillClose',
      },
    });
    await myDriver.whenReady(winName);
  });

  afterAll(() => {
    if (myDriver?.isRunning()) {
      myDriver?.stop();
    }
  });

  it('onWillClose will be triggered', async () => {
    const data = 'this is a test for listenWillClose';
    const result = await new Promise(resolve => {
      myDriver
        ?.call({
          funcName: 'listenWillClose',
          winName,
          args: [data],
        })
        .then(res => {
          console.log('ress::', res);
          return resolve(res);
        });
      sleep(1).then(() => {
        myDriver?.call({
          funcName: 'winService.closeWindowByName',
          args: [winName],
        });
      });
    });
    expect(result).toBe(data);
  });
});
