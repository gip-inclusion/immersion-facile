import axios from "axios";
import { ajax } from "rxjs/ajax";
import { AbsoluteUrl } from "shared/src/AbsoluteUrl";
import { TechnicalGateway } from "src/core-logic/ports/TechnicalGateway";
import {
  FeatureFlags,
  featureFlagsResponseSchema,
} from "shared/src/featureFlags";
import { getFeatureFlags, uploadFileRoute } from "shared/src/routes";
import { map, Observable } from "rxjs";
import { validateDataFromSchema } from "src/../../shared/src/zodUtils";

const prefix = "api";

export class HttpTechnicalGateway implements TechnicalGateway {
  async uploadFile(file: File): Promise<AbsoluteUrl> {
    const formData = new FormData();
    formData.append(uploadFileRoute, file);
    const { data } = await axios.post(
      `/${prefix}/${uploadFileRoute}`,
      formData,
    );
    return data;
  }

  getAllFeatureFlags = (): Observable<FeatureFlags> =>
    ajax.getJSON<unknown>(`/${prefix}/${getFeatureFlags}`).pipe(
      map((result) => {
        const featureFlags = validateDataFromSchema(
          featureFlagsResponseSchema,
          result,
        );
        if (featureFlags instanceof Error) throw featureFlags;
        return featureFlags.data;
      }),
    );
}
