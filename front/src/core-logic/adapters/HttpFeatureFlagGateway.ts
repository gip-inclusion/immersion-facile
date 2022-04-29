import { ajax } from "rxjs/ajax";
import { FeatureFlagsGateway } from "src/core-logic/ports/FeatureFlagsGateway";
import { FeatureFlags } from "shared/src/featureFlags";
import { getFeatureFlags } from "shared/src/routes";

const prefix = "/api";

export class HttpFeatureFlagGateway implements FeatureFlagsGateway {
  getAll = () => ajax.getJSON<FeatureFlags>(`${prefix}/${getFeatureFlags}`);
}
