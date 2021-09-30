// used in preload
export const testServices = <T>(services: T) => {
  if (process.env.APP_TEST_DRIVER) {
    (services as any).registerServices(services);
  }
  return services;
};
