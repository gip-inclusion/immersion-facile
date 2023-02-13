import { HttpClient } from "http-client";
import { from, Observable } from "rxjs";
import {
  AbsoluteUrl,
  absoluteUrlSchema,
  InclusionConnectedAllowedTargets,
} from "shared";
import { InclusionConnectedGateway } from "src/core-logic/ports/InclusionConnectedGateway";

export class HttpInclusionConnectedGateway
  implements InclusionConnectedGateway
{
  constructor(
    private readonly httpClient: HttpClient<InclusionConnectedAllowedTargets>,
  ) {}

  public getMyAgencyDashboardUrl$(token: string): Observable<AbsoluteUrl> {
    return from(this.getMyAgencyDashboardUrl(token));
  }

  private getMyAgencyDashboardUrl(token: string) {
    return this.httpClient
      .getAgencyDashboard({
        headers: { authorization: token },
      })
      .then(({ responseBody }) => absoluteUrlSchema.parse(responseBody));
  }
}
