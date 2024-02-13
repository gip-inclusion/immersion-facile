import { Observable } from "rxjs";
import { ConventionJwt } from "shared";

export interface EstablishmentLeadGateway {
  rejectEstablishmentLeadRegistration$(jwt: ConventionJwt): Observable<void>;
}
