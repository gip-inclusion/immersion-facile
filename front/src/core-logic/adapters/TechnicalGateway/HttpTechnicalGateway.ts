import { AxiosInstance } from "axios";
import { from, map, Observable } from "rxjs";
import {
  AbsoluteUrl,
  FeatureFlags,
  featureFlagsRoute,
  featureFlagsSchema,
  uploadFileRoute,
} from "shared";
import { TechnicalGateway } from "src/core-logic/ports/TechnicalGateway";

export class HttpTechnicalGateway implements TechnicalGateway {
  public getAllFeatureFlags$ = (): Observable<FeatureFlags> =>
    from(this.httpClient.get<unknown>(`/${featureFlagsRoute}`)).pipe(
      map((response) => featureFlagsSchema.parse(response.data)),
    );

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
