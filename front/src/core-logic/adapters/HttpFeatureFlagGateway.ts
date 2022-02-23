import axios from "axios";
import { FeatureFlagsGateway } from "src/core-logic/ports/FeatureFlagsGateway";

const prefix = "/api";

export class HttpFeatureFlagGateway implements FeatureFlagsGateway {
  getAll = async () => {
    const response = await axios.get(`${prefix}/feature-flags`);
    return response.data;
  };
}
