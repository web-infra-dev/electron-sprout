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
    },
  },
};
