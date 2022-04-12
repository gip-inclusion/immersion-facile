import { ajax } from "rxjs/ajax";
import { FeatureFlagsGateway } from "src/core-logic/ports/FeatureFlagsGateway";
import { FeatureFlags } from "src/shared/featureFlags";
import { getFeatureFlags } from "src/shared/routes";

const prefix = "/api";

export class HttpFeatureFlagGateway implements FeatureFlagsGateway {
  getAll = () => ajax.getJSON<FeatureFlags>(`${prefix}/${getFeatureFlags}`);
}
