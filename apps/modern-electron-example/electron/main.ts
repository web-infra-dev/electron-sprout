import { app } from 'electron';
import Runtime, {
  winService,
  updateService,
  lifecycleService,
} from '@modern-js/runtime/electron-main';
import { testServices } from '@modern-js/runtime/electron-test/main';
import { windowsConfig } from './windowsConfig';
import * as services from './services';
import { MENU_TEMPLATE } from './menu';

testServices({
  ...services,
  winService,
  updateService,
  lifecycleService,
});

const runtime = new Runtime({
  windowsConfig,
  mainServices: services,
  menuTemplate: MENU_TEMPLATE,
});

app.whenReady().then(async () => {
  await runtime.init();
  winService.createWindow({
    name: 'main',
    addBeforeCloseListener: true,
  });
});
