import NodeEnvironment from 'jest-environment-node';
import TestDriver from './testDriver';

class TestEnvironment extends NodeEnvironment {
  async setup() {
    await super.setup();
    this.global.testDriver = new TestDriver({
      cwd: process.cwd(),
    });
  }

  async teardown() {
    await super.teardown();
    if (process.env.DEBUG) {
      // when DEBUG， won't stop app after test.
      return;
    }
    if (this.global.testDriver) {
      (this.global as any).testDriver.stop();
    }
  }
}
export default TestEnvironment;
