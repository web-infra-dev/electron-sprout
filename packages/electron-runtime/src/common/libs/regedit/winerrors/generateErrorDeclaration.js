const { mainLog } = require('@modern-js/electron-log');
const parsed = require('./parsed.json');

for (let i = 0; i < parsed.length; i++) {
  const entry = parsed[i];
  mainLog.info("var e%d = new Error('%s')", i, entry.error);
  mainLog.info("e%d.description = '%s'", i, entry.description);
  mainLog.info('e%d.code = %d', i, entry.code);
  mainLog.info('errors[%d] = e%d', entry.code, i);
}
