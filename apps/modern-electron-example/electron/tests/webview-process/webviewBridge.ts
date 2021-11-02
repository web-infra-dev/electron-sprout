import TestDriver, { sleep } from '@modern-js/electron-test';

let testBridgeDriver: TestDriver | null = null;

const webviewId1 = 'webview1';
const webviewId2 = 'webview2';

beforeAll(async () => {
  await sleep(2);
  testBridgeDriver = new TestDriver({
    cwd: process.cwd(),
    envs: {
      TEST_FOLDER: 'webviewBridge',
    },
  });
  await Promise.all(
    [webviewId1, webviewId2].map(async x => {
      await testBridgeDriver?.whenReady('main', {
        webviewId: x,
      });
      await testBridgeDriver?.call({
        funcName: 'webviewService.addWebview',
        winName: 'main',
        args: [x, true],
      });
    }),
  );
});

describe('test webview bridge', () => {
  // afterAll(() => {
  //   testBridgeDriver?.stop();
  // });
  it('test webview registerServices again', async () => {
    const msg1 = 'this is msg from webview';
    const msg2 = 'this is msg2 from webview';
    await testBridgeDriver?.call({
      funcName: 'webviewService.callWebview',
      winName: 'main',
      args: [webviewId1, 'registerServicesTwice', msg1, msg2],
    });

    const execFunc1Res = await testBridgeDriver?.call({
      funcName: 'webviewService.callWebview',
      winName: 'main',
      args: [webviewId1, 'func1'],
    });

    expect(execFunc1Res).toBe(msg1);

    const execFunc2Res = await testBridgeDriver?.call({
      funcName: 'webviewService.callWebview',
      winName: 'main',
      args: [webviewId1, 'func2'],
    });

    expect(execFunc2Res).toBe(msg2);
  });
});
