import { isThenable } from '../../../core/base/common/async';
// Shared veto handling across main and renderer
export function handleVetos(
  vetos: (boolean | Promise<boolean>)[],
  onError: (error: Error) => void,
): Promise<boolean /* veto */> {
  if (vetos.length === 0) {
    return Promise.resolve(false);
  }

  const promises: Promise<void>[] = [];
  let lazyValue = false;

  for (const valueOrPromise of vetos) {
    // veto, done
    if (valueOrPromise === true) {
      return Promise.resolve(true);
    }

    if (isThenable(valueOrPromise)) {
      promises.push(
        valueOrPromise.then(
          value => {
            if (value) {
              lazyValue = true; // veto, done
            }
          },
          err => {
            onError(err); // error, treated like a veto, done
            lazyValue = true;
          },
        ),
      );
    }
  }

  return Promise.all(promises).then(() => lazyValue);
}
