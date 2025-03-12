import type { AxiosInstance } from "axios";
import { type Observable, from, map } from "rxjs";
import {
  type AbsoluteUrl,
  type ConnectedUserJwt,
  type ConventionSupportedJwt,
  type Email,
  type FeatureFlags,
  type HtmlToPdfRequest,
  type TechnicalRoutes,
  type ValidateEmailFeedback,
  uploadFileRoute,
} from "shared";
import type { HttpClient } from "shared-routes";
import {
  otherwiseThrow,
  throwBadRequestWithExplicitMessage,
} from "src/core-logic/adapters/otherwiseThrow";
import type { TechnicalGateway } from "src/core-logic/ports/TechnicalGateway";
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

  public async uploadFile(
    file: File,
    jwt: ConnectedUserJwt,
  ): Promise<AbsoluteUrl> {
    const formData = new FormData();
    formData.append(uploadFileRoute, file);
    const { data, status } = await this.axiosInstance.post(
      `/${uploadFileRoute}`,
      formData,
      { headers: { authorization: jwt } },
    );
    if (status !== 200) throw new Error(data.message);
    return data;
  }
}
