import { contextBridge } from 'electron';

export const exposeInMainWorld = (
  key: string,
  apis: Record<string, unknown>,
) => {
  try {
    contextBridge.exposeInMainWorld(key, apis);
  } catch (error) {
    // when contextIsolation is false, we can add by window.
    (window as any)[key] = apis;
  }
};
