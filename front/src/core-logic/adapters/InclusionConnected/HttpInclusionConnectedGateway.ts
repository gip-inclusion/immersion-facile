import { from, map, Observable } from "rxjs";
import {
  AbsoluteUrl,
  absoluteUrlSchema,
  InclusionConnectedAllowedTargets,
} from "shared";
import { HttpClient } from "http-client";
import { InclusionConnectedGateway } from "src/core-logic/ports/InclusionConnectedGateway";

export class HttpInclusionConnectedGateway
  implements InclusionConnectedGateway
{
  constructor(
    private readonly httpClient: HttpClient<InclusionConnectedAllowedTargets>,
  ) {}

  public getMyAgencyDashboardUrl$(token: string): Observable<AbsoluteUrl> {
    return from(this.getMyAgencyDashboardUrl(token)).pipe(
      map(({ responseBody }) => absoluteUrlSchema.parse(responseBody)),
    );
  }

  private getMyAgencyDashboardUrl(token: string) {
    return this.httpClient.getAgencyDashboard({
      headers: { authorization: token },
    });
  }
}
