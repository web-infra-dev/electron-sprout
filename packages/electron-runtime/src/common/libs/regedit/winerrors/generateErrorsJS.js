const fs = require('fs');
const { mainLog } = require('@modern-js/electron-log');

const START_MARKER = '// *** generated errors ***//';
const END_MARKER = '// *** end generated errors ***//';

const generatedErrorObjects = fs.readFileSync(
  './generatedErrorObjects.js',
  'utf8',
);
let errorsJs = fs.readFileSync('../errors.js', 'utf8');

const start = errorsJs.indexOf(START_MARKER);
const end = errorsJs.indexOf(END_MARKER, start);

if (start === -1) {
  throw new Error('missing injection start marker');
}

if (end === -1) {
  throw new Error('missing injection end marker');
}

errorsJs = `${errorsJs.substring(
  0,
  start + START_MARKER.length,
)}\n${generatedErrorObjects}\n${errorsJs.substring(end)}`;

mainLog.info(errorsJs);
