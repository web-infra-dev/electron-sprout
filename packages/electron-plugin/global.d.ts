declare module '@modern-js/runtime/electron-render' {
  export * from '@modern-js/electron-runtime/render';
}

declare module '@modern-js/runtime/electron-main' {
  export * from '@modern-js/electron-runtime';
  export { default } from '@modern-js/electron-runtime';
}

declare module '@modern-js/runtime/electron-webview' {
  export * from '@modern-js/electron-runtime/webview';
  export { default } from '@modern-js/electron-runtime/webview';
}

declare module '@modern-js/runtime/electron-bridge' {
  export * from '@modern-js/electron-bridge';
  export { default } from '@modern-js/electron-bridge';
}

declare module '@modern-js/runtime/electron-tools' {
  export * from '@modern-js/electron-tools';
}

declare module '@modern-js/runtime/electron-test' {
  export * from '@modern-js/electron-test';
  export { default } from '@modern-js/electron-test';
}

declare module '@modern-js/runtime/electron-test/render' {
  export * from '@modern-js/electron-test/render';
}

declare module '@modern-js/runtime/electron-test/main' {
  export * from '@modern-js/electron-test/main';
}

declare module '@modern-js/runtime/electron-test/webview' {
  export * from '@modern-js/electron-test/webview';
}
