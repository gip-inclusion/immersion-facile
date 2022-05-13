import axios from "axios";
import { ajax } from "rxjs/ajax";
import { TechnicalGateway } from "src/core-logic/ports/TechnicalGateway";
import { FeatureFlags } from "shared/src/featureFlags";
import { getFeatureFlags, uploadFileRoute } from "shared/src/routes";

const prefix = "api";

export class HttpTechnicalGateway implements TechnicalGateway {
  async uploadFile(file: File): Promise<void> {
    const formData = new FormData();
    formData.append(uploadFileRoute, file);
    await axios.post(`/${prefix}/${uploadFileRoute}`, formData);
  }

  getAllFeatureFlags = () =>
    ajax.getJSON<FeatureFlags>(`/${prefix}/${getFeatureFlags}`);
}
