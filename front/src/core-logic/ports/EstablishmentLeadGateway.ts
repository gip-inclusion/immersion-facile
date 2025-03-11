import type { Observable } from "rxjs";
import type { ConventionJwt } from "shared";

export interface EstablishmentLeadGateway {
  rejectEstablishmentLeadRegistration$(jwt: ConventionJwt): Observable<void>;
}
