import { SyncDescriptor } from './descriptors';
import { ServiceIdentifier, IConstructorSignature0 } from './instantiation';

const _registry: Array<[ServiceIdentifier<any>, SyncDescriptor<any>]> = [];

export function registerSingleton<T>(
  id: ServiceIdentifier<T>,
  ctor: IConstructorSignature0<T>,
  supportsDelayedInstantiation?: boolean,
): void {
  _registry.push([
    id,
    new SyncDescriptor<T>(ctor, [], supportsDelayedInstantiation),
  ]);
}

export function getSingletonServiceDescriptors(): Array<
  [ServiceIdentifier<any>, SyncDescriptor<any>]
> {
  return _registry;
}
