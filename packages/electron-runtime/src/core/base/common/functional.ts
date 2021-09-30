export function once<T extends Function>(this: any, fn: T): T {
  const _this = this;
  let didCall = false;
  let result: any;

  return function () {
    if (didCall) {
      return result;
    }

    didCall = true;
    result = fn.apply(_this, arguments);

    return result;
  } as any as T;
}
