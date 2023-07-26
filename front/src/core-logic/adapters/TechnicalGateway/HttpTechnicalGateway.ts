import { AxiosInstance, AxiosResponse } from "axios";
import { from, map, Observable } from "rxjs";
import {
  AbsoluteUrl,
  BackOfficeJwt,
  FeatureFlags,
  featureFlagsRoute,
  featureFlagsSchema,
  SetFeatureFlagParam,
  uploadFileRoute,
} from "shared";
import { TechnicalGateway } from "src/core-logic/ports/TechnicalGateway";

export class HttpTechnicalGateway implements TechnicalGateway {
  getAllFeatureFlags = (): Observable<FeatureFlags> =>
    from(this.httpClient.get<unknown>(`/${featureFlagsRoute}`)).pipe(
      map(validateFeatureFlags),
    );

  setFeatureFlag = (
    params: SetFeatureFlagParam,
    token: BackOfficeJwt,
  ): Observable<void> =>
    from(
      this.httpClient.post(`/admin/${featureFlagsRoute}`, params, {
        headers: { authorization: token },
      }),
    ).pipe(map(() => undefined));

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
}
const validateFeatureFlags = ({ data }: AxiosResponse<unknown>): FeatureFlags =>
  featureFlagsSchema.parse(data);
