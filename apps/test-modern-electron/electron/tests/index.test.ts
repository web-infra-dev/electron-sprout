/**
 * @jest-environment @modern-js/plugin-electron/node_modules/@modern-js/electron-test/dist/js/node/testEnvironment.js
 */

import './render-process/call';
import './main-process/winService';
import './main-process/lifecycleService';
import './render-process/winService';
import './render-process/webviewService';
import './webview-process/webviewBridge';

jest.setTimeout(100000);
