// used in render
export const testServices = <T>(services: T) => {
  if (process.env.APP_TEST_DRIVER) {
    (services as any).winService.registerServices({
      ...services,
      whenWebviewReady: (webviewId: string) => {
        const webview = (services as any).webviewService.getWebviewById(
          webviewId,
        );
        return new Promise(resolve => {
          const handler = () => {
            webview.removeEventListener('dom-ready', handler);
            console.log(`webview: ${webviewId} is ready`);
            resolve(true);
          };
          webview.addEventListener('dom-ready', handler);
        });
      },
    });
  }
  return services;
};
