import { ajax } from "rxjs/ajax";
import { TechnicalGateway } from "src/core-logic/ports/TechnicalGateway";
import { FeatureFlags } from "shared/src/featureFlags";
import { getFeatureFlags } from "shared/src/routes";

const prefix = "/api";

export class HttpTechnicalGateway implements TechnicalGateway {
  getAllFeatureFlags = () =>
    ajax.getJSON<FeatureFlags>(`${prefix}/${getFeatureFlags}`);
}
