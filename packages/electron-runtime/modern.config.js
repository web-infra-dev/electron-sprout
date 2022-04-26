const path = require('path');

/** @type {import('@modern-js/module-tools').UserConfig} */
module.exports = {
  output: {
    packageFields: {
      main: 'CJS+ES6',
    },
  },

  tools: {
    babel(opts) {
      opts.plugins = opts.plugins.slice(1, opts.plugins.length);
      opts.plugins.push(['@vjpr/babel-plugin-parameter-decorator', {}]);
      const preset = opts.presets.filter(p =>
        p[0].includes(path.normalize('@babel/preset-typescript')),
      )[0];
      preset[1].onlyRemoveTypeImports = true;
      preset[1].isTSX = false;
    },
  },
};
