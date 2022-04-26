/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { SyncDescriptor } from './descriptors';
import { IConstructorSignature0 } from './instantiation';
import { ServiceIdentifier } from './serviceCollection';

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
