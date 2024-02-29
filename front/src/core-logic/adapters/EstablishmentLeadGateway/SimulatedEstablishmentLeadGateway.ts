import { Observable, delay, of, throwError } from "rxjs";
import { ConventionJwt } from "shared";
import { EstablishmentLeadGateway } from "src/core-logic/ports/EstablishmentLeadGateway";

const failedJwt: ConventionJwt = "failedJwt";

export class SimulatedEstablishmentLeadGateway
  implements EstablishmentLeadGateway
{
  constructor(private delay = 250) {}

  public rejectEstablishmentLeadRegistration$(
    jwt: ConventionJwt,
  ): Observable<void> {
    return jwt === failedJwt
      ? throwError(new Error("Failed Jwt"))
      : of(undefined).pipe(delay(this.delay));
  }
}
