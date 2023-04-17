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

  public getCurrentUser$(token: string): Observable<InclusionConnectedUser> {
    return from(this.getCurrentUser(token)).pipe(
      map(({ responseBody }) =>
        inclusionConnectedUserSchema.parse(responseBody),
      ),
    );
  }

  public registerAgenciesToCurrentUser$(
    token: string,
    agencyIds: AgencyId[],
  ): Observable<InclusionConnectedUser> {
    return from(this.registerAgenciesToCurrentUser(token, agencyIds)).pipe(
      map(({ responseBody }) =>
        inclusionConnectedUserSchema.parse(responseBody),
      ),
    );
  }

  private getCurrentUser(token: string) {
    return this.httpClient.getInclusionConnectedUser({
      headers: { authorization: token },
    });
  }
  private registerAgenciesToCurrentUser(token: string, agencyIds: AgencyId[]) {
    return this.httpClient.registerAgenciesToUser({
      headers: { authorization: token },
      body: agencyIds,
    });
  }
}
