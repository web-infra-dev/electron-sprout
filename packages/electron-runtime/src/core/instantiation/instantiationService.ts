/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { mainLog } from '@modern-js/electron-log';
import { IdleValue } from '../base/common/async';
import { Graph } from './graph';
import {
  IInstantiationService,
  ServicesAccessor,
  ServiceIdentifier,
  serviceIdManager,
} from './instantiation';
import { SyncDescriptor } from './descriptors';
import { ServiceCollection } from './serviceCollection';

class CyclicDependencyError extends Error {
  constructor(graph: Graph<any>) {
    super('cyclic dependency between services');
    this.message = graph.toString();
  }
}

export class InstantiationService implements IInstantiationService {
  _serviceBrand: any;

  private readonly _services: ServiceCollection;

  private readonly _strict: boolean;

  private readonly _parent?: InstantiationService;

  constructor(
    services: ServiceCollection = new ServiceCollection(),
    strict = false,
    parent?: InstantiationService,
  ) {
    this._services = services;
    this._strict = strict;
    this._parent = parent;

    this._services.set(IInstantiationService, this);
  }

  createChild(services: ServiceCollection): IInstantiationService {
    return new InstantiationService(services, this._strict, this);
  }

  invokeFunction<R, TS extends any[] = []>(
    fn: (accessor: ServicesAccessor, ...args: TS) => R,
    ...args: TS
  ): R {
    let _done = false;
    try {
      const accessor: ServicesAccessor = {
        get: <T>(id: ServiceIdentifier<T>) => {
          if (_done) {
            throw Error(
              'service accessor is only valid during the invocation of its target method',
            );
          }
          const result = this._getOrCreateServiceInstance(id);
          if (!result) {
            throw new Error(`[invokeFunction] unknown service '${id || ''}'`);
          }
          return result;
        },
      };
      return fn.apply(undefined, [accessor, ...args]);
    } finally {
      _done = true;
    }
  }

  private _getOrCreateServiceInstance<T>(id: ServiceIdentifier<T>): T {
    const service = this._getServiceInstanceOrDescriptor(id);
    return service instanceof SyncDescriptor
      ? this._createAndCacheServiceInstance(id, service)
      : service;
  }

  private _getServiceInstanceOrDescriptor<T>(
    id: ServiceIdentifier<T>,
  ): T | SyncDescriptor<T> {
    const instanceOrDesc = this._services.get(id);
    if (!instanceOrDesc && this._parent) {
      return this._parent._getServiceInstanceOrDescriptor(id);
    } else {
      return instanceOrDesc;
    }
  }

  private _createAndCacheServiceInstance<T>(
    id: ServiceIdentifier<T>,
    desc: SyncDescriptor<T>,
  ): T {
    // service 信息描述结构：id与对应装饰器
    type ServiceInfo = {
      id: ServiceIdentifier<any>;
      desc: SyncDescriptor<any>;
    };
    // 构建依赖关系有向图
    const graph = new Graph<ServiceInfo>(data => data.id.toString());
    let cycleCount = 0;
    const stack = [{ id, desc }];
    while (stack.length) {
      const item = stack.pop() as ServiceInfo;
      graph.lookupOrInsertNode(item);

      if (cycleCount++ > 100) {
        mainLog.info('cycleCount > 100');
        throw new CyclicDependencyError(graph);
      }
      for (const dependency of serviceIdManager.getServiceDependencies(
        item.desc.ctor,
      )) {
        const instanceOrDesc = this._getServiceInstanceOrDescriptor(
          dependency.id,
        );

        if (!instanceOrDesc && !dependency.optional) {
          mainLog.warn(
            `[createInstance] ${id} depends on ${dependency.id} which is NOT registered.`,
          );
        }
        if (instanceOrDesc instanceof SyncDescriptor) {
          const d = { id: dependency.id, desc: instanceOrDesc };
          graph.insertEdge(item, d);
          stack.push(d);
        }
      }
    }

    while (true) {
      const roots = graph.roots();
      if (roots.length === 0) {
        if (!graph.isEmpty()) {
          mainLog.info('when will this happen:', graph);
          throw new CyclicDependencyError(graph);
        }
        break;
      }
      for (const { data } of roots) {
        const instance = this._createServiceInstanceWithOwner(
          data.id,
          data.desc.ctor,
          data.desc.staticArguments,
          data.desc.supportsDelayedInstantiation,
        );
        this._setServiceInstance(data.id, instance);
        graph.removeNode(data);
      }
    }
    return this._services.get(id) as T;
  }

  createInstance(
    ctorOrDescriptor: any | SyncDescriptor<any>,
    ...rest: any[]
  ): any {
    let result: any;
    if (ctorOrDescriptor instanceof SyncDescriptor) {
      result = this._createInstance(
        ctorOrDescriptor.ctor,
        ctorOrDescriptor.staticArguments.concat(rest),
      );
    } else {
      result = this._createInstance(ctorOrDescriptor, rest);
    }
    return result;
  }

  // 存放至相应的instance池里。
  private _setServiceInstance<T>(id: ServiceIdentifier<T>, instance: T): void {
    if (this._services.get(id) instanceof SyncDescriptor) {
      this._services.set(id, instance);
    } else if (this._parent) {
      this._parent._setServiceInstance(id, instance);
    } else {
      throw new Error('illegalState - setting UNKNOWN service instance');
    }
  }

  private _createServiceInstanceWithOwner<T>(
    id: ServiceIdentifier<T>,
    ctor: any,
    args: any[] = [],
    supportsDelayedInstantiation: boolean,
  ): T {
    if (this._services.get(id) instanceof SyncDescriptor) {
      return this._createServiceInstance(
        ctor,
        args,
        supportsDelayedInstantiation,
      );
    } else if (this._parent) {
      return this._parent._createServiceInstanceWithOwner(
        id,
        ctor,
        args,
        supportsDelayedInstantiation,
      );
    } else {
      throw new Error('illegalState - creating UNKNOWN service instance');
    }
  }

  private _createServiceInstance<T>(
    ctor: any,
    args: any[] = [],
    _supportsDelayedInstantiation: boolean,
  ): T {
    if (!_supportsDelayedInstantiation) {
      // eager instantiation or no support JS proxies (e.g. IE11)
      return this._createInstance(ctor, args);
    } else {
      // Return a proxy object that's backed by an idle value. That
      // strategy is to instantiate services in our idle time or when actually
      // needed but not when injected into a consumer
      const idle = new IdleValue(() => this._createInstance<T>(ctor, args));
      return new Proxy(Object.create(null), {
        get(_target: T, prop: PropertyKey): any {
          return (idle.getValue() as any)[prop];
        },
        set(_target: T, p: PropertyKey, value: any): boolean {
          (idle.getValue() as any)[p] = value;
          return true;
        },
      });
    }
  }

  private _createInstance<T>(ctor: any, args: any[] = []): T {
    const serviceDependencies = serviceIdManager
      .getServiceDependencies(ctor)
      .sort((a, b) => a.index - b.index);
    const serviceArgs: any[] = [];
    for (const dependency of serviceDependencies) {
      const service = this._getOrCreateServiceInstance(dependency.id);
      if (!service && this._strict && !dependency.optional) {
        throw new Error(
          `[createInstance] ${ctor.name} depends on UNKNOWN service ${dependency.id}.`,
        );
      }
      serviceArgs.push(service);
    }
    // 标记第一注入服务是在参数中的位置
    const firstServiceArgPos =
      serviceDependencies.length > 0
        ? serviceDependencies[0].index
        : args.length;
    if (args.length !== firstServiceArgPos) {
      mainLog.error(
        `[createInstance] First service dependency of ${
          ctor.name
        } at position ${firstServiceArgPos + 1} conflicts with ${
          args.length
        } static arguments, we only support 'normal params' before 'injected params'`,
      );
    }
    const instance = new ctor(...[...args, ...serviceArgs]);
    return instance;
  }
}
