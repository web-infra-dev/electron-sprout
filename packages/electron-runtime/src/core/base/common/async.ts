import { CancellationToken, CancellationTokenSource } from './cancellation';
import * as errors from './errors';
import { Emitter, Event } from './event';
import { IDisposable, toDisposable } from './lifecycle';
import { URI } from './uri';

export function isThenable<T>(obj: any): obj is Promise<T> {
  return obj && typeof (<Promise<any>>obj).then === 'function';
}

export interface CancelablePromise<T> extends Promise<T> {
  cancel: () => void;
}

export function createCancelablePromise<T>(
  callback: (token: CancellationToken) => Promise<T>,
): CancelablePromise<T> {
  const source = new CancellationTokenSource();

  const thenable = callback(source.token);
  const promise = new Promise<T>((resolve, reject) => {
    source.token.onCancellationRequested(() => {
      reject(errors.canceled());
    });
    Promise.resolve(thenable).then(
      value => {
        source.dispose();
        resolve(value);
      },
      err => {
        source.dispose();
        reject(err);
      },
    );
  });
  return <CancelablePromise<T>>new (class {
    cancel() {
      source.cancel();
    }

    then<
      TResult1 = T,
      TResult2 = never,
    >(resolve?: ((value: T) => TResult1 | Promise<TResult1>) | undefined | null, reject?: ((reason: any) => TResult2 | Promise<TResult2>) | undefined | null): Promise<TResult1 | TResult2> {
      return promise.then(resolve, reject);
    }

    catch<
      TResult = never,
    >(reject?: ((reason: any) => TResult | Promise<TResult>) | undefined | null): Promise<T | TResult> {
      return this.then(undefined, reject);
    }

    finally(onfinally?: (() => void) | undefined | null): Promise<T> {
      return promise.finally(onfinally);
    }
  })();
}

export function raceCancellation<T>(
  promise: Promise<T>,
  token: CancellationToken,
): Promise<T | undefined>;
export function raceCancellation<T>(
  promise: Promise<T>,
  token: CancellationToken,
  defaultValue: T,
): Promise<T>;
export function raceCancellation<T>(
  promise: Promise<T>,
  token: CancellationToken,
  defaultValue?: T,
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>(resolve =>
      token.onCancellationRequested(() => resolve(defaultValue as any)),
    ),
  ]);
}

// TODO: pikun | Thenable<T>
export function asPromise<T>(callback: () => T): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const item = callback();
    if (isThenable<T>(item)) {
      item.then(resolve, reject);
    } else {
      resolve(item);
    }
  });
}

export type ITask<T> = () => T;

/**
 * A helper to prevent accumulation of sequential async tasks.
 *
 * Imagine a mail man with the sole task of delivering letters. As soon as
 * a letter submitted for delivery, he drives to the destination, delivers it
 * and returns to his base. Imagine that during the trip, N more letters were submitted.
 * When the mail man returns, he picks those N letters and delivers them all in a
 * single trip. Even though N+1 submissions occurred, only 2 deliveries were made.
 *
 * The throttler implements this via the queue() method, by providing it a task
 * factory. Following the example:
 *
 *    const throttler = new Throttler();
 *    const letters = [];
 *
 *    function deliver() {
 *       const lettersToDeliver = letters;
 *       letters = [];
 *       return makeTheTrip(lettersToDeliver);
 *    }
 *
 *    function onLetterReceived(l) {
 *       letters.push(l);
 *       throttler.queue(deliver);
 *    }
 */
export class Throttler {
  private activePromise: Promise<any> | null;

  private queuedPromise: Promise<any> | null;

  private queuedPromiseFactory: ITask<Promise<any>> | null;

  constructor() {
    this.activePromise = null;
    this.queuedPromise = null;
    this.queuedPromiseFactory = null;
  }

  queue<T>(promiseFactory: ITask<Promise<T>>): Promise<T> {
    if (this.activePromise) {
      this.queuedPromiseFactory = promiseFactory;

      if (!this.queuedPromise) {
        const onComplete = () => {
          this.queuedPromise = null;

          const result = this.queue(this.queuedPromiseFactory!);
          this.queuedPromiseFactory = null;

          return result;
        };

        this.queuedPromise = new Promise(c => {
          this.activePromise!.then(onComplete, onComplete).then(c);
        });
      }

      return new Promise((c, e) => {
        this.queuedPromise!.then(c, e);
      });
    }

    this.activePromise = promiseFactory();

    return new Promise((c, e) => {
      this.activePromise!.then(
        (result: any) => {
          this.activePromise = null;
          c(result);
        },
        (err: any) => {
          this.activePromise = null;
          e(err);
        },
      );
    });
  }
}

export class Sequencer {
  private current: Promise<any> = Promise.resolve(null);

  queue<T>(promiseTask: ITask<Promise<T>>): Promise<T> {
    return (this.current = this.current.then(() => promiseTask()));
  }
}

/**
 * A helper to delay execution of a task that is being requested often.
 *
 * Following the throttler, now imagine the mail man wants to optimize the number of
 * trips proactively. The trip itself can be long, so he decides not to make the trip
 * as soon as a letter is submitted. Instead he waits a while, in case more
 * letters are submitted. After said waiting period, if no letters were submitted, he
 * decides to make the trip. Imagine that N more letters were submitted after the first
 * one, all within a short period of time between each other. Even though N+1
 * submissions occurred, only 1 delivery was made.
 *
 * The delayer offers this behavior via the trigger() method, into which both the task
 * to be executed and the waiting period (delay) must be passed in as arguments. Following
 * the example:
 *
 *    const delayer = new Delayer(WAITING_PERIOD);
 *    const letters = [];
 *
 *    function letterReceived(l) {
 *      letters.push(l);
 *      delayer.trigger(() => { return makeTheTrip(); });
 *    }
 */
export class Delayer<T> implements IDisposable {
  private timeout: any;

  private completionPromise: Promise<any> | null;

  private doResolve: ((value?: any | Promise<any>) => void) | null;

  private doReject?: (err: any) => void;

  private task: ITask<T | Promise<T>> | null;

  constructor(public defaultDelay: number) {
    this.timeout = null;
    this.completionPromise = null;
    this.doResolve = null;
    this.task = null;
  }

  dispose(): void {
    this.cancelTimeout();
  }

  trigger(
    task: ITask<T | Promise<T>>,
    delay: number = this.defaultDelay,
  ): Promise<T> {
    this.task = task;
    this.cancelTimeout();

    if (!this.completionPromise) {
      this.completionPromise = new Promise((c, e) => {
        this.doResolve = c;
        this.doReject = e;
      }).then(() => {
        this.completionPromise = null;
        this.doResolve = null;
        const _task = this.task!;
        this.task = null;

        return _task();
      });
    }

    this.timeout = setTimeout(() => {
      this.timeout = null;
      this.doResolve!(null);
    }, delay);

    return this.completionPromise;
  }

  isTriggered(): boolean {
    return this.timeout !== null;
  }

  cancel(): void {
    this.cancelTimeout();

    if (this.completionPromise) {
      this.doReject!(errors.canceled());
      this.completionPromise = null;
    }
  }

  private cancelTimeout(): void {
    if (this.timeout !== null) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }
  }
}

/**
 * A helper to delay execution of a task that is being requested often, while
 * preventing accumulation of consecutive executions, while the task runs.
 *
 * The mail man is clever and waits for a certain amount of time, before going
 * out to deliver letters. While the mail man is going out, more letters arrive
 * and can only be delivered once he is back. Once he is back the mail man will
 * do one more trip to deliver the letters that have accumulated while he was out.
 */
export class ThrottledDelayer<T> {
  private readonly delayer: Delayer<Promise<T>>;

  private readonly throttler: Throttler;

  constructor(defaultDelay: number) {
    this.delayer = new Delayer(defaultDelay);
    this.throttler = new Throttler();
  }

  trigger(promiseFactory: ITask<Promise<T>>, delay?: number): Promise<T> {
    return this.delayer.trigger(
      () => this.throttler.queue(promiseFactory),
      delay,
    ) as any as Promise<T>;
  }

  isTriggered(): boolean {
    return this.delayer.isTriggered();
  }

  cancel(): void {
    this.delayer.cancel();
  }

  dispose(): void {
    this.delayer.dispose();
  }
}

/**
 * A barrier that is initially closed and then becomes opened permanently.
 */
export class Barrier {
  private _isOpen: boolean;

  private readonly _promise: Promise<boolean>;

  private _completePromise!: (v: boolean) => void;

  constructor() {
    this._isOpen = false;
    this._promise = new Promise<boolean>(c => {
      this._completePromise = c;
    });
  }

  isOpen(): boolean {
    return this._isOpen;
  }

  open(): void {
    this._isOpen = true;
    this._completePromise(true);
  }

  wait(): Promise<boolean> {
    return this._promise;
  }
}

export function timeout(millis: number): CancelablePromise<void>;
export function timeout(
  millis: number,
  token: CancellationToken,
): Promise<void>;
export function timeout(
  millis: number,
  token?: CancellationToken,
): CancelablePromise<void> | Promise<void> {
  if (!token) {
    return createCancelablePromise(_token => timeout(millis, _token));
  }

  return new Promise((resolve, reject) => {
    const handle = setTimeout(resolve, millis);
    token.onCancellationRequested(() => {
      clearTimeout(handle);
      reject(errors.canceled());
    });
  });
}

export function disposableTimeout(
  handler: () => void,
  _timeout = 0,
): IDisposable {
  const timer = setTimeout(handler, _timeout);
  return toDisposable(() => clearTimeout(timer));
}

export function ignoreErrors<T>(promise: Promise<T>): Promise<T | undefined> {
  return promise.then(undefined);
}

/**
 * Runs the provided list of promise factories in sequential order. The returned
 * promise will complete to an array of results from each promise.
 */

export function sequence<T>(
  promiseFactories: Array<ITask<Promise<T>>>,
): Promise<T[]> {
  const results: T[] = [];
  let index = 0;
  const len = promiseFactories.length;

  function next(): Promise<T> | null {
    return index < len ? promiseFactories[index++]() : null;
  }

  function thenHandler(result: any): Promise<any> {
    if (result !== undefined && result !== null) {
      results.push(result);
    }

    const n = next();
    if (n) {
      return n.then(thenHandler);
    }

    return Promise.resolve(results);
  }

  return Promise.resolve(null).then(thenHandler);
}

export function first<T>(
  promiseFactories: Array<ITask<Promise<T>>>,
  shouldStop: (t: T) => boolean = t => Boolean(t),
  defaultValue: T | null = null,
): Promise<T | null> {
  let index = 0;
  const len = promiseFactories.length;

  const loop: () => Promise<T | null> = () => {
    if (index >= len) {
      return Promise.resolve(defaultValue);
    }

    const factory = promiseFactories[index++];
    const promise = Promise.resolve(factory());

    return promise.then(result => {
      if (shouldStop(result)) {
        return result;
      }

      return loop();
    });
  };

  return loop();
}

interface ILimitedTaskFactory<T> {
  factory: ITask<Promise<T>>;
  c: (value?: T | Promise<T>) => void;
  e: (error?: any) => void;
}

/**
 * A helper to queue N promises and run them all with a max degree of parallelism. The helper
 * ensures that at any time no more than M promises are running at the same time.
 */
export class Limiter<T> {
  private _size: number = 0;

  private runningPromises: number;

  private readonly maxDegreeOfParalellism: number;

  private readonly outstandingPromises: Array<ILimitedTaskFactory<T>>;

  private readonly _onFinished: Emitter<void>;

  constructor(maxDegreeOfParalellism: number) {
    this.maxDegreeOfParalellism = maxDegreeOfParalellism;
    this.outstandingPromises = [];
    this.runningPromises = 0;
    this._onFinished = new Emitter<void>();
  }

  dispose(): void {
    this._onFinished.dispose();
  }

  get onFinished(): Event<void> {
    return this._onFinished.event;
  }

  get size(): number {
    return this._size;
    // return this.runningPromises + this.outstandingPromises.length;
  }

  queue(factory: ITask<Promise<T>>): Promise<T> {
    this._size++;

    return new Promise<T>((c, e) => {
      this.outstandingPromises.push({ factory, c: c as any, e });
      this.consume();
    });
  }

  private consume(): void {
    while (
      this.outstandingPromises.length &&
      this.runningPromises < this.maxDegreeOfParalellism
    ) {
      const iLimitedTask = this.outstandingPromises.shift()!;
      this.runningPromises++;

      const promise = iLimitedTask.factory();
      promise.then(iLimitedTask.c, iLimitedTask.e);
      promise.then(
        () => this.consumed(),
        () => this.consumed(),
      );
    }
  }

  private consumed(): void {
    this._size--;
    this.runningPromises--;

    if (this.outstandingPromises.length > 0) {
      this.consume();
    } else {
      this._onFinished.fire();
    }
  }
}

/**
 * A queue is handles one promise at a time and guarantees that at any time only one promise is executing.
 */
export class Queue<T> extends Limiter<T> {
  constructor() {
    super(1);
  }
}

/**
 * A helper to organize queues per resource. The ResourceQueue makes sure to manage queues per resource
 * by disposing them once the queue is empty.
 */
export class ResourceQueue {
  private readonly queues: Map<string, Queue<void>> = new Map();

  queueFor(resource: URI): Queue<void> {
    const key = resource.toString();
    if (!this.queues.has(key)) {
      const queue = new Queue<void>();
      queue.onFinished(() => {
        queue.dispose();
        this.queues.delete(key);
      });

      this.queues.set(key, queue);
    }

    return this.queues.get(key)!;
  }
}

export class TimeoutTimer implements IDisposable {
  private _token: any;

  constructor();

  constructor(runner: () => void, timeout: number);

  constructor(runner?: () => void, _timeout?: number) {
    this._token = -1;

    if (typeof runner === 'function' && typeof timeout === 'number') {
      this.setIfNotSet(runner, _timeout as number);
    }
  }

  dispose(): void {
    this.cancel();
  }

  cancel(): void {
    if (this._token !== -1) {
      clearTimeout(this._token);
      this._token = -1;
    }
  }

  cancelAndSet(runner: () => void, _timeout: number): void {
    this.cancel();
    this._token = setTimeout(() => {
      this._token = -1;
      runner();
    }, _timeout);
  }

  setIfNotSet(runner: () => void, _timeout: number): void {
    if (this._token !== -1) {
      // timer is already set
      return;
    }
    this._token = setTimeout(() => {
      this._token = -1;
      runner();
    }, _timeout);
  }
}

export class IntervalTimer implements IDisposable {
  private _token: any;

  constructor() {
    this._token = -1;
  }

  dispose(): void {
    this.cancel();
  }

  cancel(): void {
    if (this._token !== -1) {
      clearInterval(this._token);
      this._token = -1;
    }
  }

  cancelAndSet(runner: () => void, interval: number): void {
    this.cancel();
    this._token = setInterval(() => {
      runner();
    }, interval);
  }
}

export class RunOnceScheduler {
  protected runner: ((...args: any[]) => void) | null;

  private timeoutToken: any;

  private readonly timeout: number;

  private readonly timeoutHandler: () => void;

  constructor(runner: (...args: any[]) => void, _timeout: number) {
    this.timeoutToken = -1;
    this.runner = runner;
    this.timeout = _timeout;
    this.timeoutHandler = this.onTimeout.bind(this);
  }

  /**
   * Dispose RunOnceScheduler
   */
  dispose(): void {
    this.cancel();
    this.runner = null;
  }

  /**
   * Cancel current scheduled runner (if any).
   */
  cancel(): void {
    if (this.isScheduled()) {
      clearTimeout(this.timeoutToken);
      this.timeoutToken = -1;
    }
  }

  /**
   * Cancel previous runner (if any) & schedule a new runner.
   */
  schedule(delay = this.timeout): void {
    this.cancel();
    this.timeoutToken = setTimeout(this.timeoutHandler, delay);
  }

  /**
   * Returns true if scheduled.
   */
  isScheduled(): boolean {
    return this.timeoutToken !== -1;
  }

  protected doRun(): void {
    if (this.runner) {
      this.runner();
    }
  }

  private onTimeout() {
    this.timeoutToken = -1;
    if (this.runner) {
      this.doRun();
    }
  }
}

export class RunOnceWorker<T> extends RunOnceScheduler {
  private units: T[] = [];

  work(unit: T): void {
    this.units.push(unit);

    if (!this.isScheduled()) {
      this.schedule();
    }
  }

  dispose(): void {
    this.units = [];

    super.dispose();
  }

  protected doRun(): void {
    const { units } = this;
    this.units = [];

    if (this.runner) {
      this.runner(units);
    }
  }
}

// #region -- run on idle tricks ------------

export interface IdleDeadline {
  readonly didTimeout: boolean;
  timeRemaining: () => DOMHighResTimeStamp;
}
/**
 * Execute the callback the next time the browser is idle
 */
export let runWhenIdle: (
  callback: (idle: IdleDeadline) => void,
  timeout?: number,
) => IDisposable;

declare function requestIdleCallback(
  callback: (args: IdleDeadline) => void,
  options?: { timeout: number },
): number;
declare function cancelIdleCallback(handle: number): void;

(function () {
  if (
    typeof requestIdleCallback !== 'function' ||
    typeof cancelIdleCallback !== 'function'
  ) {
    const dummyIdle: IdleDeadline = Object.freeze({
      didTimeout: true,
      timeRemaining() {
        return 15;
      },
    });
    runWhenIdle = runner => {
      const handle = setTimeout(() => runner(dummyIdle));
      let disposed = false;
      return {
        dispose() {
          if (disposed) {
            return;
          }
          disposed = true;
          clearTimeout(handle);
        },
      };
    };
  } else {
    runWhenIdle = (runner, _timeout?) => {
      const handle: number = requestIdleCallback(
        runner,
        typeof timeout === 'number'
          ? { timeout: _timeout as number }
          : undefined,
      );
      let disposed = false;
      return {
        dispose() {
          if (disposed) {
            return;
          }
          disposed = true;
          cancelIdleCallback(handle);
        },
      };
    };
  }
})();

/**
 * An implementation of the "idle-until-urgent"-strategy as introduced
 * here: https://philipwalton.com/articles/idle-until-urgent/
 */
export class IdleValue<T> {
  private readonly _executor: () => void;

  private readonly _handle: IDisposable;

  private _didRun: boolean = false;

  private _value?: T;

  private _error: any;

  constructor(executor: () => T) {
    this._executor = () => {
      try {
        this._value = executor();
      } catch (err) {
        this._error = err;
      } finally {
        this._didRun = true;
      }
    };
    this._handle = runWhenIdle(() => this._executor());
  }

  dispose(): void {
    this._handle.dispose();
  }

  getValue(): T {
    if (!this._didRun) {
      this._handle.dispose();
      this._executor();
    }
    if (this._error) {
      throw this._error;
    }
    return this._value!;
  }
}

// #endregion

export async function retry<T>(
  task: ITask<Promise<T>>,
  delay: number,
  retries: number,
): Promise<T> {
  let lastError: Error | undefined;

  for (let i = 0; i < retries; i++) {
    try {
      return await task();
    } catch (error: any) {
      lastError = error;

      await timeout(delay);
    }
  }

  return Promise.reject(lastError);
}
