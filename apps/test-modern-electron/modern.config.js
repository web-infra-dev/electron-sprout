/** @type {import('@modern-js/app-tools').UserConfig} */
module.exports = {
  plugins: [
    {
      cli: '@modern-js/plugin-electron',
    },
  ],
  testing: {
    jest: {
      testMatch: [
        '**/tests/**/*.test.[jt]s?(x)',
        '**/?(*.)+(spec|test).[jt]s?(x)',
      ],
    },
  },
  output: {
    assetPrefix: '../..',
  },
  runtime: {
    router: {
      supportHtml5History: process.env.NODE_ENV === 'development',
    },
  },
  electron: {
    builder: {
      baseConfig: {
        // beforeBuild: async context => {
        //   const userProjectPath = dirname(context.appDir);
        //   await installDep(userProjectPath, 'pnpm');
        //   await compileDep(userProjectPath);
        //   return false;
        // },
        extraMetadata: {
          name: 'Demo',
        },
        appId: 'com.bytedance.demo',
        artifactName: 'demo_${env.VERSION}.${ext}',
        files: [
          { from: '../assets', to: 'assets' },
          {
            from: '.',
            to: '.',
            filter: [
              '!**/*.map',
              '!**/*.d.ts',
              '!*.log',
              '!*.lock',
              '!node_modules',
            ],
          },
        ],
        // extraResources: [
        //   { from: './node_modules', to: 'node_modules', filter: [] },
        // ],
        directories: {
          app: 'dist',
        },
      },
    },
  },
};
