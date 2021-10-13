const path = require('path');
const { spawnSync } = require('child_process');
const {
  pkgsToPublish,
  saveTmpVersion,
  recoverPkgVersion,
} = require('./publish-dev');

const doUnPublish = (pkgs, version) => {
  pkgs.forEach(pkgName => {
    const pkgPath = path.join(__dirname, '..', 'packages', pkgName);
    console.log('unpublish:', `@modern-js/${pkgName}@${version}`, pkgPath);
    spawnSync(
      'npm',
      ['deprecate', `@modern-js/${pkgName}@${version}`, 'this is test package'],
      {
        stdio: 'inherit',
        cwd: pkgPath,
      },
    );
  });
};

const unpublishDev = version => {
  saveTmpVersion();
  recoverPkgVersion();
  doUnPublish(pkgsToPublish, version);
};

const version = process.env.VERSION;

if (version) {
  unpublishDev(version);
} else {
  console.warn('请用环境变量 VERSION 指定要修改的版本');
}
