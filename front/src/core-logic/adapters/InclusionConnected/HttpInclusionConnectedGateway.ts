import { from, map, Observable } from "rxjs";
import {
  AgencyId,
  InclusionConnectedAllowedTargets,
  InclusionConnectedUser,
  inclusionConnectedUserSchema,
} from "shared";
import { HttpClient } from "http-client";
import { InclusionConnectedGateway } from "src/core-logic/ports/InclusionConnectedGateway";

export class HttpInclusionConnectedGateway
  implements InclusionConnectedGateway
{
  constructor(
    private readonly httpClient: HttpClient<InclusionConnectedAllowedTargets>,
  ) {}

  private getCurrentUser(token: string) {
    return this.httpClient.getInclusionConnectedUser({
      headers: { authorization: token },
    });
  }

  public getCurrentUser$(token: string): Observable<InclusionConnectedUser> {
    return from(this.getCurrentUser(token)).pipe(
      map(({ responseBody }) =>
        inclusionConnectedUserSchema.parse(responseBody),
      ),
    );
  }

  private registerAgenciesToCurrentUser(agencyIds: AgencyId[], token: string) {
    return this.httpClient.registerAgenciesToUser({
      headers: { authorization: token },
      body: agencyIds,
    });
  }

  public registerAgenciesToCurrentUser$(
    agencyIds: AgencyId[],
    token: string,
  ): Observable<void> {
    return from(
      this.registerAgenciesToCurrentUser(agencyIds, token).then(
        (responseBody) => {
          responseBody;
        },
      ),
    );
  }
}
