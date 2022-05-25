const { join } = require('path');
const fs = require('fs-extra');

const libPath = join(__dirname, '..', 'src', 'common', 'libs');
const targetLibPath = join(
  __dirname,
  '..',
  'dist',
  'js',
  'node',
  'common',
  'libs',
);

fs.copySync(libPath, targetLibPath);
