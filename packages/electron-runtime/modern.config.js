/** @type {import('@modern-js/module-tools').UserConfig} */
module.exports = {
  output: {
    packageFields: {
      main: 'CJS+ES6',
    },
  },

  tools: {
    babel(opts) {
      opts.plugins.push(['@vjpr/babel-plugin-parameter-decorator', {}]);
      opts.presets.pop();
      opts.presets.push([
        require.resolve('@babel/preset-typescript'),
        {
          allowDeclareFields: true,
          allowNamespaces: true,
          onlyRemoveTypeImports: true,
        },
      ]);
    },
  },
};
