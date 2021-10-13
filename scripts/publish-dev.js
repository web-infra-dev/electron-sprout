// 用于本地发布测试包使用
const path = require('path');
const { spawnSync } = require('child_process');
const json5 = require('json5');
const fs = require('fs-extra');

// 存储改变前版本号
const tmpJson = path.join(__dirname, 'tmp.json');

const readJson = jsonPath => {
  if (!fs.existsSync(jsonPath)) {
    return {};
  }
  const jsonStr = fs.readFileSync(jsonPath, {
    encoding: 'utf8',
  });
  try {
    return json5.parse(jsonStr);
  } catch (error) {
    throw Error(`read JSON fail, pleace check JSON: ${jsonPath}`);
  }
};

const pkgsToPublish = [
  'electron-bridge',
  'electron-runtime',
  'electron-tools',
  'electron-plugin',
  'electron-log',
  'electron-test',
];

const dependencies = [
  '@modern-js/electron-bridge',
  '@modern-js/electron-runtime',
  '@modern-js/electron-tools',
  '@modern-js/electron-plugin',
  '@modern-js/electron-log',
  '@modern-js/electron-test',
];

const originVersions = {};

// 修改前，保存版本号到文件
const saveTmpVersion = () => {
  fs.writeJsonSync(tmpJson, originVersions, { encoding: 'utf8', spaces: 2 });
};

const changePkgVersion = (pkgName, pkgVersion) => {
  const pkgPath = path.join(
    __dirname,
    '..',
    'packages',
    pkgName,
    'package.json',
  );
  const pkg = readJson(pkgPath);

  // 存储自身与其依赖版本号
  originVersions[pkgName] = {
    version: pkg.version,
    dependencies: {},
  };

  // 修改自身版本号
  pkg.version = pkgVersion;

  dependencies.forEach(x => {
    if (pkg.dependencies[x]) {
      originVersions[pkgName].dependencies[x] = pkg.dependencies[x];
      pkg.dependencies[x] = pkgVersion;
    }
  });

  fs.writeJsonSync(pkgPath, pkg, { encoding: 'utf8', spaces: 2 });
};

const changeVersion = (pkgs, version) => {
  pkgs.forEach(each => {
    changePkgVersion(each, version);
  });
};

const doPublish = pkgs => {
  pkgs.forEach(pkgName => {
    const pkgPath = path.join(__dirname, '..', 'packages', pkgName);
    spawnSync('npm', ['publish', '--tag=alpha'], {
      stdio: 'inherit',
      cwd: pkgPath,
    });
  });
};

const recoverPkgVersion = () => {
  const tmpVersions = readJson(tmpJson);
  const keys = Object.keys(tmpVersions);
  keys.forEach(each => {
    const pkgPath = path.join(
      __dirname,
      '..',
      'packages',
      each,
      'package.json',
    );
    const pkg = readJson(pkgPath);
    pkg.version = tmpVersions[each].version;
    dependencies.forEach(x => {
      if (pkg.dependencies[x]) {
        pkg.dependencies[x] = tmpVersions[each].dependencies[x];
      }
    });
    fs.writeJsonSync(pkgPath, pkg, { encoding: 'utf8', spaces: 2 });
  });
};

const publishDev = version => {
  changeVersion(pkgsToPublish, version);
  saveTmpVersion();
  doPublish(pkgsToPublish);
};

if (process.env.ACTION === 'publish') {
  const version = process.env.VERSION;
  if (version) {
    publishDev(version);
  } else {
    console.warn('请用环境变量 VERSION 指定要修改的版本');
  }
} else {
  recoverPkgVersion();
}

module.exports = {
  recoverPkgVersion,
  pkgsToPublish,
  changeVersion,
  saveTmpVersion,
};
