declare global {
  namespace NodeJS {
    interface Global {
      testDriver: import('./index').ElectronTestDriverType;
    }
  }
}

export {};
