import TestDriver from '@modern-js/electron-test';
// import TestDriver from '@modern-js/runtime/electron-test';
import { getOpenWindowConfig, sleep } from '../utils';

let testDriver: TestDriver | null = null;

jest.setTimeout(100000);

beforeAll(async () => {
  testDriver = (global as any).testDriver;
  await testDriver?.whenReady('main');
});

describe('test main process winService api', () => {
  describe('test winService.createWindow and close', () => {
    const winName = 'test_create_window';
    const href = 'https://www.baidu.com';

    it('test winService.createWindow', async () => {
      await testDriver?.call(getOpenWindowConfig(winName));
      const windows = await testDriver?.call({
        funcName: 'winService.getWindows',
      });
      expect(windows.length).toEqual(2);
    });
    it('test after open, should have loaded correct url', async () => {
      await testDriver?.whenReady(winName);
      const res = await testDriver?.call({
        funcName: 'getPageLocation',
        winName,
      });
      expect(res).toMatch(href);
    });
    it('test winService.close', async () => {
      await testDriver?.call({
        funcName: 'winService.closeWindowByName',
        args: [winName],
      });
      await sleep(1);
      const windows = await testDriver?.call({
        funcName: 'winService.getWindows',
      });

      expect(windows.length).toEqual(1);
    });
  });

  it('test winService.createWindow and combine windowConfig', async () => {
    const winName = 'test_create_window_with_config';
    await testDriver?.call(getOpenWindowConfig(winName));
    await testDriver?.whenReady(winName);
    const winConfig = await testDriver?.call({
      funcName: 'winService.getWindowConfig',
      args: [winName],
    });
    expect(winConfig.options.width).toBe(400);
    expect(winConfig.options.webPreferences.enableRemoteModule).toBe(true);
    await testDriver?.call({
      funcName: 'winService.closeWindowByName',
      args: [winName],
    });
  });

  it('test winService.getWindowById', async () => {
    const currentWindowId = await testDriver?.call({
      funcName: 'getCurrentWindowId',
      winName: 'main',
    });
    const window = await testDriver?.call({
      funcName: 'winService.getWindowById',
      args: [currentWindowId],
    });
    expect(window._name).toBe('main');
  });

  it('test winService.getWindows', async () => {
    const windows = await testDriver?.call({
      funcName: 'winService.getWindows',
    });
    expect(windows.length).toBe(1);
  });

  it('test winService.sendTo by name', async () => {
    const data = 'sendTo';
    const channel = 'send_to_channel';
    // await sleep(3);
    const result = await new Promise(resolve => {
      testDriver
        ?.call({
          funcName: 'listenMessage',
          winName: 'main',
          args: [channel],
        })
        .then(result => resolve(result));

      sleep(1).then(() => {
        testDriver?.call({
          funcName: 'winService.sendTo',
          args: ['main', channel, data],
        });
      });
    });

    expect(result).toEqual(data);
  });

  it('test winService.sendTo by id', async () => {
    const data = 'sendTo';
    const channel = 'send_to_channel';
    const currentWindowId = await testDriver?.call({
      funcName: 'getCurrentWindowId',
      winName: 'main',
    });
    // await sleep(3);
    const result = await new Promise(resolve => {
      testDriver
        ?.call({
          funcName: 'listenMessage',
          winName: 'main',
          args: [channel],
        })
        .then(result => resolve(result));

      sleep(1).then(() => {
        testDriver?.call({
          funcName: 'winService.sendTo',
          args: [currentWindowId, channel, data],
        });
      });
    });

    expect(result).toEqual(data);
  });
  it('test winService.getWindows', async () => {
    const windows = await testDriver?.call({
      funcName: 'winService.getWindows',
    });
    expect(windows.length).toBe(1);
  });

  it('test winService.closeWindowById', async () => {
    const winName = 'test_close_by_id';

    const window = await testDriver?.call(getOpenWindowConfig(winName));

    // after opened, count will be 2
    const windows = await testDriver?.call({
      funcName: 'winService.getWindows',
    });
    expect(windows.length).toEqual(2);
    await testDriver?.call({
      funcName: 'winService.closeWindowById',
      args: [window._id],
    });
    const curWins = await testDriver?.call({
      funcName: 'winService.getWindows',
    });
    expect(curWins.length).toEqual(1);
  });
  it('test winService.closeWindowByName', async () => {
    const winName = 'test_close_by_name';

    await testDriver?.call(getOpenWindowConfig(winName));

    // after opened, count will be 2
    const windows = await testDriver?.call({
      funcName: 'winService.getWindows',
    });
    expect(windows.length).toEqual(2);

    await testDriver?.call({
      funcName: 'winService.closeWindowByName',
      args: [winName],
    });
    const curWindows = await testDriver?.call({
      funcName: 'winService.getWindows',
    });
    expect(curWindows.length).toEqual(1);
  });
  it('test winService.disposeWebviewConnection', async () => {
    console.log('this will be tested in webviewBridge');
  });
});
