export const pluginConfig = {
  type: 'object',
  properties: {
    dev: {
      type: 'object',
      properties: {
        assetPrefix: {
          type: 'boolean',
        },
      },
    },
    builder: {
      type: 'object',
      required: ['baseConfig'],
      properties: {
        baseConfig: {
          type: 'object',
        },
        macConfig: {
          type: 'object',
        },
        winConfig: {
          type: 'object',
        },
        win64Config: {
          type: 'object',
        },
      },
    },
  },
};
