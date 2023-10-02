import { AxiosInstance } from "axios";
import { from, map, Observable } from "rxjs";
import {
  AbsoluteUrl,
  ConventionSupportedJwt,
  FeatureFlags,
  TechnicalRoutes,
  uploadFileRoute,
} from "shared";
import { HttpClient } from "shared-routes";
import { TechnicalGateway } from "src/core-logic/ports/TechnicalGateway";

export class HttpTechnicalGateway implements TechnicalGateway {
  public getAllFeatureFlags$ = (): Observable<FeatureFlags> =>
    from(this.httpClient.featureFlags()).pipe(map((response) => response.body));

  constructor(
    private readonly httpClient: HttpClient<TechnicalRoutes>,
    private readonly axiosClient: AxiosInstance,
  ) {}

  public async htmlToPdf(
    htmlContent: string,
    jwt: ConventionSupportedJwt,
  ): Promise<string> {
    const { body } = await this.httpClient.htmlToPdf({
      body: { htmlContent },
      headers: { authorization: jwt },
    });
    return body;
  }

  public async uploadLogo(file: File): Promise<AbsoluteUrl> {
    const formData = new FormData();
    formData.append(uploadFileRoute, file);
    const { data } = await this.axiosClient.post(
      `/${uploadFileRoute}`,
      formData,
    );
    return data;
  }
}
