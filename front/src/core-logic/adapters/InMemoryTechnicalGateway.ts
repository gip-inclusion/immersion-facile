import { Subject } from "rxjs";
import { AbsoluteUrl } from "shared/src/AbsoluteUrl";
import { TechnicalGateway } from "src/core-logic/ports/TechnicalGateway";
import { FeatureFlags } from "shared/src/featureFlags";

export class InMemoryTechnicalGateway implements TechnicalGateway {
  private _featureFlags$ = new Subject<FeatureFlags>();

  getAllFeatureFlags = () => this._featureFlags$;

  uploadFile = async (file: File): Promise<AbsoluteUrl> => {
    // eslint-disable-next-line no-console
    console.log("file uploaded : ", file);
    return `http://${file.name}-url`;
  };

  // test purposes only
  get featureFlags$() {
    return this._featureFlags$;
  }
}
