import axios from "axios";
import { FeatureFlagsGateway } from "src/core-logic/ports/FeatureFlagsGateway";
import { getFeatureFlags } from "src/shared/routes";

const prefix = "/api";

export class HttpFeatureFlagGateway implements FeatureFlagsGateway {
  getAll = async () => {
    const response = await axios.get(`${prefix}/${getFeatureFlags}`);
    return response.data;
  };
}
