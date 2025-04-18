import { inject, EnvironmentProviders, provideEnvironmentInitializer } from '@angular/core';
import { StorageKey, ɵALL_STATES_PERSISTED } from '@ngxs/storage-plugin/internals';

import { ɵNgxsStoragePluginKeysManager } from './keys-manager';

declare const ngDevMode: boolean;

export function withStorageFeature(storageKeys: StorageKey[]): EnvironmentProviders {
  return provideEnvironmentInitializer(() => {
    const allStatesPersisted = inject(ɵALL_STATES_PERSISTED);

    if (allStatesPersisted) {
      if (typeof ngDevMode !== 'undefined' && ngDevMode) {
        const message =
          'The NGXS storage plugin is currently persisting all states because the `keys` ' +
          'option was explicitly set to `*` at the root level. To selectively persist states, ' +
          'consider explicitly specifying them, allowing for addition at the feature level.';

        console.error(message);
      }

      // We should prevent the addition of any feature states to persistence
      // if the `keys` property is set to `*`, as this could disrupt the algorithm
      // used in the storage plugin. Instead, we should log an error in development
      // mode. In production, it should continue to function, but act as a no-op.
      return;
    }

    inject(ɵNgxsStoragePluginKeysManager).addKeys(storageKeys);
  });
}
