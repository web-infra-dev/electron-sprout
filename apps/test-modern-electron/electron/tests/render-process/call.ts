import TestDriver from '@modern-js/electron-test';
// import TestDriver from '@modern-js/runtime/electron-test';

let testDriver: TestDriver | null = null;

beforeAll(async () => {
  testDriver = (global as any).testDriver;
  await testDriver?.whenReady('main');
});

describe('test call api', () => {
  it('test call func by getWindowCount', async () => {
    const result = await testDriver?.call({
      funcName: 'getWindowCount',
      winName: 'main',
      args: [],
    });
    expect(result).toEqual(1);
  });
});
