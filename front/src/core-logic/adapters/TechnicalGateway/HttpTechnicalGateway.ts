import { AxiosInstance } from "axios";
import { Observable, from, map } from "rxjs";
import {
  AbsoluteUrl,
  ConventionSupportedJwt,
  Email,
  FeatureFlags,
  HtmlToPdfRequest,
  TechnicalRoutes,
  ValidateEmailFeedback,
  uploadFileRoute,
} from "shared";
import { HttpClient } from "shared-routes";
import {
  otherwiseThrow,
  throwBadRequestWithExplicitMessage,
} from "src/core-logic/adapters/otherwiseThrow";
import { TechnicalGateway } from "src/core-logic/ports/TechnicalGateway";
import { match } from "ts-pattern";

export class HttpTechnicalGateway implements TechnicalGateway {
  public getAllFeatureFlags$ = (): Observable<FeatureFlags> =>
    from(this.httpClient.featureFlags()).pipe(map((response) => response.body));

  constructor(
    private readonly httpClient: HttpClient<TechnicalRoutes>,
    private readonly axiosInstance: AxiosInstance,
  ) {}

  public getEmailStatus(email: Email): Promise<ValidateEmailFeedback> {
    return this.httpClient
      .validateEmail({
        queryParams: {
          email,
        },
      })
      .then((response) =>
        match(response)
          .with({ status: 200 }, ({ body }) => body)
          .with({ status: 400 }, throwBadRequestWithExplicitMessage)
          .otherwise(otherwiseThrow),
      );
  }

  public htmlToPdf(
    params: HtmlToPdfRequest,
    jwt: ConventionSupportedJwt,
  ): Promise<string> {
    return this.httpClient
      .htmlToPdf({
        body: params,
        headers: { authorization: jwt },
      })
      .then((response) =>
        match(response)
          .with({ status: 200 }, ({ body }) => body)
          .otherwise(otherwiseThrow),
      );
  }

  public async uploadFile(file: File): Promise<AbsoluteUrl> {
    const formData = new FormData();
    formData.append(uploadFileRoute, file);
    const { data } = await this.axiosInstance.post(
      `/${uploadFileRoute}`,
      formData,
    );
    return data;
  }
}
