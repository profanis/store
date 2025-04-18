import { inject, Injectable } from '@angular/core';
import { InitState, UpdateState, getActionTypeFromInstance } from '@ngxs/store/plugins';

import { ActionType } from '../actions/symbols';
import { NGXS_DEVELOPMENT_OPTIONS } from './symbols';

@Injectable()
export class NgxsUnhandledActionsLogger {
  /**
   * These actions should be ignored by default; the user can increase this
   * list in the future via the `ignoreActions` method.
   */
  private _ignoredActions = new Set<string>([InitState.type, UpdateState.type]);

  constructor() {
    const options = inject(NGXS_DEVELOPMENT_OPTIONS);
    if (typeof options.warnOnUnhandledActions === 'object') {
      this.ignoreActions(...options.warnOnUnhandledActions.ignore);
    }
  }

  /**
   * Adds actions to the internal list of actions that should be ignored.
   */
  ignoreActions(...actions: ActionType[]): void {
    for (const action of actions) {
      this._ignoredActions.add(action.type);
    }
  }

  /** @internal */
  warn(action: any): void {
    const actionShouldBeIgnored = Array.from(this._ignoredActions).some(
      type => type === getActionTypeFromInstance(action)
    );

    if (actionShouldBeIgnored) {
      return;
    }

    action =
      action.constructor && action.constructor.name !== 'Object'
        ? action.constructor.name
        : action.type;

    console.warn(
      `The ${action} action has been dispatched but hasn't been handled. This may happen if the state with an action handler for this action is not registered.`
    );
  }
}
