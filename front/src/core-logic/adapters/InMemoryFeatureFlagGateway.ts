import { Subject } from "rxjs";
import { FeatureFlagsGateway } from "src/core-logic/ports/FeatureFlagsGateway";
import { FeatureFlags } from "src/shared/featureFlags";

export class InMemoryFeatureFlagGateway implements FeatureFlagsGateway {
  private _featureFlags$ = new Subject<FeatureFlags>();

  getAll = () => this._featureFlags$;

  // test purposes only
  get featureFlags$() {
    return this._featureFlags$;
  }
}
