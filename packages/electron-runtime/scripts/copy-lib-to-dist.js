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

// copy .sh
const shPath = join(__dirname, '..', 'src', 'core', 'base', 'node');

const targetShPath = join(
  __dirname,
  '..',
  'dist',
  'js',
  'node',
  'core',
  'base',
  'node',
);

fs.copySync(join(shPath, 'cpuUsage.sh'), join(targetShPath, 'cpuUsage.sh'));
fs.copySync(join(shPath, 'ps.sh'), join(targetShPath, 'ps.sh'));
fs.copySync(
  join(shPath, 'terminateProcess.sh'),
  join(targetShPath, 'terminateProcess.sh'),
);
