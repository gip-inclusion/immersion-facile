import { Observable } from "rxjs";
import { AgencyId, InclusionConnectedUser } from "shared";

export interface InclusionConnectedGateway {
  getCurrentUser$(token: string): Observable<InclusionConnectedUser>;
  registerAgenciesToCurrentUser$(
    agencyIds: AgencyId[],
    token: string,
  ): Observable<void>;
}
