import { AxiosInstance, AxiosResponse } from "axios";
import { AbsoluteUrl } from "shared/src/AbsoluteUrl";
import { AdminToken } from "shared/src/admin/admin.dto";
import { TechnicalGateway } from "src/core-logic/ports/TechnicalGateway";
import {
  FeatureFlags,
  featureFlagsSchema,
  SetFeatureFlagParams,
} from "shared/src/featureFlags";
import { featureFlagsRoute, uploadFileRoute } from "shared/src/routes";
import { from, map, Observable } from "rxjs";
export class HttpTechnicalGateway implements TechnicalGateway {
  constructor(private readonly httpClient: AxiosInstance) {}

  async uploadLogo(file: File): Promise<AbsoluteUrl> {
    const formData = new FormData();
    formData.append(uploadFileRoute, file);
    const { data } = await this.httpClient.post(
      `/${uploadFileRoute}`,
      formData,
    );
    return data;
  }

  getAllFeatureFlags = (): Observable<FeatureFlags> =>
    from(this.httpClient.get<unknown>(`/${featureFlagsRoute}`)).pipe(
      map(validateFeatureFlags),
    );

  setFeatureFlag = (
    params: SetFeatureFlagParams,
    token: AdminToken,
  ): Observable<void> =>
    from(
      this.httpClient.post(`/admin/${featureFlagsRoute}`, params, {
        headers: { authorization: token },
      }),
    ).pipe(map(() => undefined));
}
const validateFeatureFlags = ({ data }: AxiosResponse<unknown>): FeatureFlags =>
  featureFlagsSchema.parse(data);
