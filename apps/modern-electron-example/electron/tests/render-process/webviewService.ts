import TestDriver, { sleep } from '@modern-js/electron-test';

let testDriver: TestDriver | null = null;
const webviewId1 = 'webview1';
const webviewId2 = 'webview2';
beforeAll(() => {
  testDriver = (global as any).testDriver;
  return Promise.all(
    [webviewId1, webviewId2].map(async x => {
      await testDriver?.whenReady('main', {
        webviewId: x,
      });
      await testDriver?.call({
        funcName: 'webviewService.addWebview',
        winName: 'main',
        args: [x, true],
      });
    }),
  );
});

describe('test webviewService', () => {
  it('test webviewService.sendToWebview and webviewBridge[onMessage、registerServices]', async () => {
    const channel = 'webview_msg_channel';
    const msg = 'this is msg from window';
    const result = await new Promise(resolve => {
      testDriver
        ?.call({
          funcName: 'webviewService.callWebview',
          winName: 'main',
          args: [webviewId1, 'listenMessage', channel],
        })
        .then(resolve);

      sleep(1).then(() => {
        testDriver?.call({
          funcName: 'webviewService.sendToWebview',
          winName: 'main',
          args: [webviewId1, channel, msg],
        });
      });
    });
    expect(result).toBe(msg);
  });
  it('test webviewService.broadcast  and webviewBridge[onMessage、registerServices]', async () => {
    const channel = 'webview_msg_channel';
    const msg = 'this is msg from window';
    const result = await new Promise(resolve => {
      const results: string[] = [];
      const handler = (res: any) => {
        results.push(res);
        if (results.length === 2) {
          resolve(results);
        }
      };
      testDriver
        ?.call({
          funcName: 'webviewService.callWebview',
          winName: 'main',
          args: [webviewId1, 'listenMessage', channel],
        })
        .then(handler);
      testDriver
        ?.call({
          funcName: 'webviewService.callWebview',
          winName: 'main',
          args: [webviewId2, 'listenMessage', channel],
        })
        .then(handler);

      sleep(1).then(() => {
        testDriver?.call({
          funcName: 'webviewService.broadCast',
          winName: 'main',
          args: [channel, msg],
        });
      });
    });
    expect(result).toEqual([msg, msg]);
  });
  it('test webviewService.registerServices and callBrowserWindow', async () => {
    const msg = 'this is msg for test registerServices';
    await testDriver?.call({
      funcName: 'registWebviewServices',
      winName: 'main',
      args: [msg],
    });
    // browserWindow let webview1 to use callBrowserWindow function.
    const result = await testDriver?.call({
      funcName: 'webviewService.callWebview',
      winName: 'main',
      args: [webviewId1, 'callBrowserWindow', 'func1', msg],
    });

    expect(result).toBe(msg);
  });

  it('test send and webviewService.onMessage', async () => {
    const msg = 'this is msg for test send';
    const channel = 'test_webview_send_channel';
    const result = await new Promise(resolve => {
      testDriver
        ?.call({
          funcName: 'listenWebviewMsg',
          winName: 'main',
          args: [webviewId1, channel],
        })
        .then(res => {
          resolve(res);
        });
      sleep(1).then(() => {
        testDriver?.call({
          funcName: 'webviewService.callWebview',
          winName: 'main',
          args: [webviewId1, 'send', channel, msg],
        });
      });
    });
    expect(result).toBe(msg);
  });
});
