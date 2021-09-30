/**
 * for render service
 */
export function injectServices<T>(services: any, instance: any): T {
  const bindServices = (_services: any, curInstance: any) => {
    Object.keys(_services).forEach(serviceName => {
      curInstance[serviceName] = _services[serviceName];
    });
  };

  bindServices(services, instance.__proto__);
  return <T>instance;
}
