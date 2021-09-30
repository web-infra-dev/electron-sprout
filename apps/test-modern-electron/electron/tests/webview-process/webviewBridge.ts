import TestDriver from '@modern-js/electron-test';
// import TestDriver from '@modern-js/runtime/electron-test';

let testDriver: TestDriver | null = null;

const webviewId1 = 'webview1';
const webviewId2 = 'webview2';

beforeAll(() => {
  testDriver = new TestDriver({
    cwd: process.cwd(),
    envs: {
      TEST_FOLDER: 'webviewBridge',
    },
  });
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

describe('test webview bridge', () => {
  it('test webview registerServices again', async () => {
    const msg1 = 'this is msg from webview';
    const msg2 = 'this is msg2 from webview';
    await testDriver?.call({
      funcName: 'webviewService.callWebview',
      winName: 'main',
      args: [webviewId1, 'registerServicesTwice', msg1, msg2],
    });

    const execFunc1Res = await testDriver?.call({
      funcName: 'webviewService.callWebview',
      winName: 'main',
      args: [webviewId1, 'func1'],
    });

    expect(execFunc1Res).toBe(msg1);

    const execFunc2Res = await testDriver?.call({
      funcName: 'webviewService.callWebview',
      winName: 'main',
      args: [webviewId1, 'func2'],
    });

    expect(execFunc2Res).toBe(msg2);
  });
});
