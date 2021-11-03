export const sleep = (sec: number) =>
  new Promise(resolve => {
    setTimeout(() => resolve(true), sec * 1000);
  });
