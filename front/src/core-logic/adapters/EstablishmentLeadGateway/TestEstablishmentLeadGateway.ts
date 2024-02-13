import { Observable, Subject } from "rxjs";
import { ConventionJwt } from "shared";
import { EstablishmentLeadGateway } from "src/core-logic/ports/EstablishmentLeadGateway";

export class TestEstablishmentLeadGateway implements EstablishmentLeadGateway {
  public unregisterEstablishmentLeadResponse$ = new Subject<void>();

  public rejectEstablishmentLeadRegistration$(
    _jwt: ConventionJwt,
  ): Observable<void> {
    return this.unregisterEstablishmentLeadResponse$;
  }
}
