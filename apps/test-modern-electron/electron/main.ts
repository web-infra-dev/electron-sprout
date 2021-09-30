import { app } from 'electron';
import Runtime, {
  winService,
  updateService,
  lifecycleService,
} from '@modern-js/runtime/electron-main';
import { testServices } from '@modern-js/electron-test/main';
import { windowsConfig } from './windowsConfig';
import * as services from './services';

testServices({
  ...services,
  winService,
  updateService,
  lifecycleService,
});

const runtime = new Runtime({
  windowsConfig,
  mainServices: services,
});

app.whenReady().then(async () => {
  await runtime.init();
  winService.createWindow({
    name: 'main',
    addBeforeCloseListener: true,
  });
});
