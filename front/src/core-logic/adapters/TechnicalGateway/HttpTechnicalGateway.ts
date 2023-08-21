import { AxiosInstance } from "axios";
import { from, map, Observable } from "rxjs";
import {
  AbsoluteUrl,
  adminTargets,
  BackOfficeJwt,
  FeatureFlags,
  featureFlagsRoute,
  featureFlagsSchema,
  SetFeatureFlagParam,
  uploadFileRoute,
} from "shared";
import { TechnicalGateway } from "src/core-logic/ports/TechnicalGateway";

export class HttpTechnicalGateway implements TechnicalGateway {
  public getAllFeatureFlags = (): Observable<FeatureFlags> =>
    from(this.httpClient.get<unknown>(`/${featureFlagsRoute}`)).pipe(
      map((response) => featureFlagsSchema.parse(response.data)),
    );

  public setFeatureFlag = (
    params: SetFeatureFlagParam,
    token: BackOfficeJwt,
  ): Observable<void> =>
    from(
      this.httpClient.post(adminTargets.featureFlags.url, params, {
        headers: { authorization: token },
      }),
    ).pipe(map(() => undefined));

  constructor(private readonly httpClient: AxiosInstance) {}

  public async uploadLogo(file: File): Promise<AbsoluteUrl> {
    const formData = new FormData();
    formData.append(uploadFileRoute, file);
    const { data } = await this.httpClient.post(
      `/${uploadFileRoute}`,
      formData,
    );
    return data;
  }
}
