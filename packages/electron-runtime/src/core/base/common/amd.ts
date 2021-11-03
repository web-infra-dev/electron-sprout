/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { URI } from './uri';

export function getPathFromAmdModule(
  requirefn: typeof require,
  relativePath: string,
): string {
  // TODO: pikun
  return URI.parse((requirefn as any).toUrl(relativePath)).fsPath;
}

/**
 * Reference a resource that might be inlined.
 * Do not rename this method unless you adopt the build scripts.
 *
 * @example
 */
export function registerAndGetAmdImageURL(absolutePath: string): string {
  // TODO: pikun
  return (require as any).toUrl(absolutePath);
}
