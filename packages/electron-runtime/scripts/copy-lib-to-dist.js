const { join } = require('path');
const fs = require('fs-extra');

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
