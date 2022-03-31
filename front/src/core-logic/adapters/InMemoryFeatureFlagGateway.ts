import { FeatureFlagsGateway } from "src/core-logic/ports/FeatureFlagsGateway";
import { FeatureFlags } from "src/shared/featureFlags";

export class InMemoryFeatureFlagGateway implements FeatureFlagsGateway {
  private _featureFlags: FeatureFlags = {
    enableAdminUi: true,
    enableByPassInseeApi: false,
    enablePeConnectApi: true,
  };

  getAll = async () => this._featureFlags;
}
