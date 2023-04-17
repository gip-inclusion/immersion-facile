import { Observable } from "rxjs";
import { AgencyId, InclusionConnectedUser } from "shared";

export interface InclusionConnectedGateway {
  getCurrentUser$(token: string): Observable<InclusionConnectedUser>;
  registerAgenciesToCurrentUser$(
    token: string,
    agencyIds: AgencyId[],
  ): Observable<InclusionConnectedUser>;
}
