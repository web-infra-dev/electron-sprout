/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { SyncDescriptor0, SyncDescriptor1 } from './descriptors';
import { ServiceCollection } from './serviceCollection';

export interface ServiceIdentifier<T> {
  (...args: any[]): void;
  type: T;
}

export namespace serviceIdManager {
  export const serviceIds = new Map<string, ServiceIdentifier<any>>();

  export const DI_TARGET = '$di$target';
  export const DI_DEPENDENCIES = '$di$dependencies';

  export function getServiceDependencies(
    ctor: any,
  ): Array<{ id: ServiceIdentifier<any>; index: number; optional: boolean }> {
    return ctor[DI_DEPENDENCIES] || [];
  }
}

function storeServiceDependency(
  id: Function,
  target: Function, // 被注入服务的那个对象本身
  index: number, // 被注入服务的服务序号，一般会在constructor里注入，指的就是给constructor传参的参数index，比如：constructor(service: service1) 则service的index=0
  optional: boolean,
): void {
  if ((target as any)[serviceIdManager.DI_TARGET] === target) {
    (target as any)[serviceIdManager.DI_DEPENDENCIES].push({
      id,
      index,
      optional,
    });
  } else {
    (target as any)[serviceIdManager.DI_DEPENDENCIES] = [
      { id, index, optional },
    ];
    (target as any)[serviceIdManager.DI_TARGET] = target;
  }
}

export function createDecorator<T>(serviceId: string): ServiceIdentifier<T> {
  if (serviceIdManager.serviceIds.has(serviceId)) {
    return serviceIdManager.serviceIds.get(serviceId)!;
  }

  const id = <any>function (target: Function, _: string, index: number): any {
    if (arguments.length !== 3) {
      throw new Error(
        '@IServiceName-decorator can only be used to decorate a parameter',
      );
    }
    storeServiceDependency(id, target, index, false);
  };
  id.toString = () => serviceId;
  serviceIdManager.serviceIds.set(serviceId, id);
  return id;
}

export interface ServicesAccessor {
  get: <T>(id: ServiceIdentifier<T>) => T;
}

export const IInstantiationService = createDecorator<IInstantiationService>(
  'instantiationService',
);

type GetLeadingNonServiceArgs<Args> = Args extends [...BrandedService[]]
  ? []
  : Args extends [infer A1, ...BrandedService[]]
  ? [A1]
  : Args extends [infer A1, infer A2, ...BrandedService[]]
  ? [A1, A2]
  : Args extends [infer A1, infer A2, infer A3, ...BrandedService[]]
  ? [A1, A2, A3]
  : Args extends [infer A1, infer A2, infer A3, infer A4, ...BrandedService[]]
  ? [A1, A2, A3, A4]
  : Args extends [
      infer A1,
      infer A2,
      infer A3,
      infer A4,
      infer A5,
      ...BrandedService[]
    ]
  ? [A1, A2, A3, A4, A5]
  : Args extends [
      infer A1,
      infer A2,
      infer A3,
      infer A4,
      infer A5,
      infer A6,
      ...BrandedService[]
    ]
  ? [A1, A2, A3, A4, A5, A6]
  : Args extends [
      infer A1,
      infer A2,
      infer A3,
      infer A4,
      infer A5,
      infer A6,
      infer A7,
      ...BrandedService[]
    ]
  ? [A1, A2, A3, A4, A5, A6, A7]
  : Args extends [
      infer A1,
      infer A2,
      infer A3,
      infer A4,
      infer A5,
      infer A6,
      infer A7,
      infer A8,
      ...BrandedService[]
    ]
  ? [A1, A2, A3, A4, A5, A6, A7, A8]
  : never;

/**
 * 实例化服务类型
 */
export interface IInstantiationService {
  _serviceBrand: any;
  invokeFunction: <R, TS extends any[] = []>(
    fn: (accessor: ServicesAccessor, ...args: TS) => R,
    ...args: TS
  ) => R;
  createInstance: (<T>(descriptor: SyncDescriptor0<T>) => T) &
    (<A1, T>(descriptor: SyncDescriptor1<A1, T>, a1: A1) => T) &
    (<A1, T>(ctor: IConstructorSignature1<A1, T>, first: A1) => T) &
    (<A1, A2, T>(
      ctor: IConstructorSignature2<A1, A2, T>,
      first: A1,
      second: A2,
    ) => T) &
    (<A1, A2, A3, T>(
      ctor: IConstructorSignature3<A1, A2, A3, T>,
      first: A1,
      second: A2,
      third: A3,
    ) => T) &
    (<A1, A2, A3, A4, T>(
      ctor: IConstructorSignature4<A1, A2, A3, A4, T>,
      first: A1,
      second: A2,
      third: A3,
      fourth: A4,
    ) => T) &
    (<A1, A2, A3, A4, A5, T>(
      ctor: IConstructorSignature5<A1, A2, A3, A4, A5, T>,
      first: A1,
      second: A2,
      third: A3,
      fourth: A4,
      fifth: A5,
    ) => T) &
    (<A1, A2, A3, A4, A5, A6, T>(
      ctor: IConstructorSignature6<A1, A2, A3, A4, A5, A6, T>,
      first: A1,
      second: A2,
      third: A3,
      fourth: A4,
      fifth: A5,
      sixth: A6,
    ) => T) &
    (<A1, A2, A3, A4, A5, A6, A7, T>(
      ctor: IConstructorSignature7<A1, A2, A3, A4, A5, A6, A7, T>,
      first: A1,
      second: A2,
      third: A3,
      fourth: A4,
      fifth: A5,
      sixth: A6,
      seventh: A7,
    ) => T) &
    (<A1, A2, A3, A4, A5, A6, A7, A8, T>(
      ctor: IConstructorSignature8<A1, A2, A3, A4, A5, A6, A7, A8, T>,
      first: A1,
      second: A2,
      third: A3,
      fourth: A4,
      fifth: A5,
      sixth: A6,
      seventh: A7,
      eigth: A8,
    ) => T) &
    (<Ctor extends new (...args: any[]) => any, R extends InstanceType<Ctor>>(
      t: Ctor,
      ...args: GetLeadingNonServiceArgs<ConstructorParameters<Ctor>>
    ) => R) &
    (<
      Services extends BrandedService[],
      Ctor extends new (...services: Services) => any,
      R extends InstanceType<Ctor>,
    >(
      t: Ctor,
    ) => R);

  createChild: (services: ServiceCollection) => IInstantiationService;
}

export type BrandedService = { _serviceBrand: undefined };

export type IConstructorSignature0<T> = new (
  ...services: Array<{ _serviceBrand: undefined }>
) => T;

export type IConstructorSignature1<A1, T> = new (
  first: A1,
  ...services: Array<{ _serviceBrand: undefined }>
) => T;

export type IConstructorSignature2<A1, A2, T> = new (
  first: A1,
  second: A2,
  ...services: Array<{ _serviceBrand: undefined }>
) => T;

export type IConstructorSignature3<A1, A2, A3, T> = new (
  first: A1,
  second: A2,
  third: A3,
  ...services: Array<{ _serviceBrand: undefined }>
) => T;

export type IConstructorSignature4<A1, A2, A3, A4, T> = new (
  first: A1,
  second: A2,
  third: A3,
  fourth: A4,
  ...services: Array<{ _serviceBrand: undefined }>
) => T;

export type IConstructorSignature5<A1, A2, A3, A4, A5, T> = new (
  first: A1,
  second: A2,
  third: A3,
  fourth: A4,
  fifth: A5,
  ...services: Array<{ _serviceBrand: undefined }>
) => T;

export type IConstructorSignature6<A1, A2, A3, A4, A5, A6, T> = new (
  first: A1,
  second: A2,
  third: A3,
  fourth: A4,
  fifth: A5,
  sixth: A6,
  ...services: Array<{ _serviceBrand: undefined }>
) => T;

export type IConstructorSignature7<A1, A2, A3, A4, A5, A6, A7, T> = new (
  first: A1,
  second: A2,
  third: A3,
  fourth: A4,
  fifth: A5,
  sixth: A6,
  seventh: A7,
  ...services: Array<{ _serviceBrand: undefined }>
) => T;

export type IConstructorSignature8<A1, A2, A3, A4, A5, A6, A7, A8, T> = new (
  first: A1,
  second: A2,
  third: A3,
  fourth: A4,
  fifth: A5,
  sixth: A6,
  seventh: A7,
  eigth: A8,
  ...services: Array<{ _serviceBrand: undefined }>
) => T;
