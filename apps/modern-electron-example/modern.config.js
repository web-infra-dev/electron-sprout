/** @type {import('@modern-tools/app-tools').UserConfig} */
module.exports = {
  output: {
    assetPrefix: '../..',
  },
  server: {
    ssrByEntries: {
      ssr: true,
      main: false,
      demo: false,
    },
  },
  runtime: {
    state: true,
    router: {
      supportHtml5History: process.env.NODE_ENV === 'development',
    },
  },
  electron: {
    babel: defaultConfig => {
      defaultConfig.plugins.push([
        require.resolve('babel-plugin-module-resolver'),
        {
          root: ['./'],
          alias: {
            '@shared': './shared',
          },
        },
      ]);
      return defaultConfig;
    },
    builder: {
      baseConfig: {
        appId: 'com.bytedance.demo',
        artifactName: 'demo_${env.VERSION}.${ext}',
        files: [
          { from: '../assets', to: 'assets' },
          {
            from: '.',
            to: '.',
            filter: ['!**/*.map', '!**/*.d.ts', '!*.log', '!*.lock'],
          },
        ],

        directories: {
          app: 'dist',
          buildResources: 'config/electron',
        },
      },
    },
  },
};
