import { Subject } from "rxjs";
import { TechnicalGateway } from "src/core-logic/ports/TechnicalGateway";
import { FeatureFlags } from "shared/src/featureFlags";

export class InMemoryTechnicalGateway implements TechnicalGateway {
  private _featureFlags$ = new Subject<FeatureFlags>();

  getAllFeatureFlags = () => this._featureFlags$;

  // test purposes only
  get featureFlags$() {
    return this._featureFlags$;
  }
}
